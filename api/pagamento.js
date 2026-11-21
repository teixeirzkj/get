// POST /api/pagamento     → cria a cobrança Pix na PagueZy
// GET  /api/pagamento?id= → consulta o status (e libera o download quando pago)
const { produtos, precoAdicional, paguezy, juntarId, consultarPagamento, novoId, lerToken, aplicarCupom, linkDownload } = require("./_lib");

const PLATAFORMAS = ["Steam", "Epic Games", "Rockstar Launcher", "Xbox App (PC)", "Xbox Series / One", "PS4", "PS5"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") return await criar(req, res);
    if (req.method === "GET") return await consultar(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "Método não permitido" });
  } catch (e) {
    console.error("[pagamento]", e.status, e.code, e.message);
    if (e.code === "nao_configurado") return res.status(503).json({ erro: "Pagamento indisponível no momento. Chame o suporte no Discord.", code: e.code });
    // erros de validação do gateway (4xx) podem ser mostrados ao cliente
    if (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403) return res.status(400).json({ erro: e.message });
    return res.status(502).json({ erro: "Não foi possível processar o pagamento agora. Tente novamente." });
  }
};

const soDigitos = (v) => String(v || "").replace(/\D/g, "");

function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +cpf[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +cpf[t]) return false;
  }
  return true;
}

async function criar(req, res) {
  const b = req.body || {};
  let item = produtos()[b.produto];
  let idProduto = b.produto;
  if (b.produto === "personalizado") {
    // preço e conteúdo vêm do link assinado pelo admin, nunca do navegador
    const pers = lerToken(b.token);
    if (!pers) return res.status(400).json({ erro: "Este link de pedido é inválido ou expirou. Chame o suporte no Discord." });
    item = { nome: `Personalizado: ${pers.t}`, preco: pers.p / 100 };
    idProduto = `p${pers.p}-${pers.a}`;
  }
  const nick = String(b.nick || "").trim().slice(0, 40);
  const nome = String(b.nome || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  const telefone = soDigitos(b.telefone);
  const cpf = soDigitos(b.cpf);

  if (!item) return res.status(400).json({ erro: "Produto inválido." });
  if (!PLATAFORMAS.includes(b.plataforma)) return res.status(400).json({ erro: "Selecione uma plataforma válida." });
  if (nick.length < 2) return res.status(400).json({ erro: "Informe o seu nick." });
  if (nome.split(" ").length < 2) return res.status(400).json({ erro: "Informe nome e sobrenome." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
  if (telefone.length < 10 || telefone.length > 13) return res.status(400).json({ erro: "Informe um telefone válido com DDD." });
  if (!cpfValido(cpf)) return res.status(400).json({ erro: "Informe um CPF válido." });
  if (b.aceiteTermos !== true) return res.status(400).json({ erro: "É preciso aceitar os termos." });

  const extra = b.adicional === true ? precoAdicional() : 0;
  if (extra == null) return res.status(400).json({ erro: "Adicional indisponível." });
  let desconto = 0, cupom = "";
  if (b.cupom) {
    const c = aplicarCupom(b.cupom, b.produto === "personalizado" ? "personalizado" : b.produto, item.preco);
    if (c.erro) return res.status(400).json({ erro: c.erro });
    desconto = c.desconto; cupom = c.codigo;
  }
  const valor = Math.round((item.preco - desconto + extra) * 100) / 100; // preço sempre do servidor
  const id = novoId(idProduto, extra > 0, Math.round(desconto * 100));
  const d = await paguezy("POST", "/payments", {
    amount: Math.round(valor * 100), // centavos
    payment_method: "pix",
    external_reference: id,
    customer: { name: nome, email, document: cpf, phone: telefone },
  });
  const pid = d.id || d.transaction_id || d.trx_uuid;
  const copiaECola = d.pix_copy_paste || (d.pix && (d.pix.copy_paste || d.pix.qrcode)) || d.pix_code;
  if (!pid || !(copiaECola || d.payment_url)) throw Object.assign(new Error("Resposta da PagueZy sem id/Pix"), { status: 502 });
  console.log("[pagamento] criado", id, pid, `${b.plataforma} | ${nick}${cupom ? ` | cupom ${cupom}` : ""}`);

  return res.status(200).json({
    id: juntarId(id, pid),
    copiaECola,
    pagamentoUrl: d.payment_url ? new URL(d.payment_url, "https://paguezy.com").href : undefined,
    valor,
  });
}

async function consultar(req, res) {
  const id = String((req.query || {}).id || "");
  const r = await consultarPagamento(id);
  if (!r) return res.status(400).json({ erro: "Consulta inválida." });
  if (r.status === "paid") return res.status(200).json({ status: "paid", downloadUrl: linkDownload(r.pedido.arquivo, id) });
  if (r.status === "invalido") return res.status(403).json({ erro: "Pagamento não corresponde ao produto." });
  if (r.status === "expired" || r.status === "estornado") return res.status(200).json({ status: "expired" });
  return res.status(200).json({ status: "pending" });
}
