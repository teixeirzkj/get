// GET /api/download?id=<transação> — entrega o arquivo do pacote somente se o Pix estiver pago.
const fs = require("fs");
const { produtos, cashinpay, produtoDoId, arquivoDoProduto, pago, mesmoValor, valorDe } = require("./_lib");

const TIPOS = { zip: "application/zip", rar: "application/vnd.rar", "7z": "application/x-7z-compressed", pdf: "application/pdf", txt: "text/plain; charset=utf-8", json: "application/json", xml: "application/xml" };

const erro = (res, status, msg) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Download</title><body style="background:#08080d;color:#f1f1f5;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;text-align:center"><div><h1 style="font-size:22px">${msg}</h1><p style="color:#8e8ea3">Se você já pagou, chame o suporte no Discord.</p><a href="/" style="color:#39ff88">Voltar ao site</a></div>`);
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") return erro(res, 405, "Método não permitido");

  const id = String((req.query || {}).id || "");
  const produto = produtoDoId(id);
  const item = produto && produtos()[produto];
  if (!item) return erro(res, 400, "Link de download inválido.");

  let tx;
  try { tx = await cashinpay("GET", `/transactions/${encodeURIComponent(id)}`); }
  catch (e) { console.error("[download]", e.message); return erro(res, 502, "Não foi possível verificar o pagamento agora."); }

  if (!pago(tx.status) || !mesmoValor(valorDe(tx.amount), item.preco)) return erro(res, 403, "Pagamento não confirmado.");

  const arq = arquivoDoProduto(produto);
  if (!arq) return erro(res, 404, "Arquivo indisponível no momento.");

  const ext = arq.nome.split(".").pop().toLowerCase();
  const stat = fs.statSync(arq.caminho);
  res.statusCode = 200;
  res.setHeader("Content-Type", TIPOS[ext] || "application/octet-stream");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Content-Disposition", `attachment; filename="TeixeiraMods-${produto}.${ext}"`);
  fs.createReadStream(arq.caminho).pipe(res);
};
