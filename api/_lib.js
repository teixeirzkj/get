// Utilitários compartilhados pelas funções /api (não vira rota: começa com "_")
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const CASHINPAY = "https://api.cashinpaybr.com/api/v1";

// Lê o catálogo do mesmo config.js usado pelo site (fonte única de preços)
let catalogo;
function produtos() {
  if (catalogo) return catalogo;
  const src = fs.readFileSync(path.join(process.cwd(), "public", "config.js"), "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx);
  const L = ctx.window.LOJA;
  catalogo = {};
  L.planos.forEach((p) => p.preco != null && (catalogo[p.id] = { nome: p.nome, preco: p.preco }));
  L.trajes.forEach((t) => (catalogo[t.id] = { nome: `Pacote ${t.qtd} Trajes`, preco: t.preco }));
  return catalogo;
}

async function cashinpay(metodo, rota, body) {
  const key = process.env.CASHINPAY_API_KEY;
  if (!key) throw Object.assign(new Error("CASHINPAY_API_KEY não configurada"), { status: 503, code: "nao_configurado" });
  const r = await fetch(CASHINPAY + rota, {
    method: metodo,
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.success === false) {
    const err = json.error || {};
    throw Object.assign(new Error(err.message || `CashinPay HTTP ${r.status}`), { status: r.status, code: err.code });
  }
  return json.data || {};
}

// ID da transação gerado por nós: tx_<produto>_<carimbo>. O produto sai do próprio ID,
// então o servidor sabe o que foi comprado sem banco de dados.
function novoId(produto) {
  const rand = require("crypto").randomBytes(5).toString("hex");
  return `tx_${produto}_${Date.now().toString(36)}${rand}`;
}
function produtoDoId(id) {
  const m = /^tx_([a-z0-9-]+)_[a-z0-9]{8,30}$/.exec(String(id || ""));
  return m ? m[1] : null;
}

// Arquivos privados: pasta /arquivos na raiz (fora de /public, então o site não os serve).
// Nome do arquivo = id do pacote + extensão. Ex.: arquivos/executivo.zip
const PASTA = path.join(process.cwd(), "arquivos");
function arquivoDoProduto(id) {
  try {
    const nome = fs.readdirSync(PASTA).find((f) => f.toLowerCase().startsWith(id + "."));
    return nome ? { nome, caminho: path.join(PASTA, nome) } : null;
  } catch (_) { return null; }
}

// Opcional, para arquivos grandes: variável DOWNLOADS = {"iniciante":"https://...", ...}
function linkExterno(id) {
  try { return JSON.parse(process.env.DOWNLOADS || "{}")[id] || null; } catch (_) { return null; }
}

// Link que o cliente recebe depois do pagamento
function linkDownload(produto, txId) {
  if (arquivoDoProduto(produto)) return `/api/download?id=${encodeURIComponent(txId)}`;
  return linkExterno(produto);
}

const mesmoValor = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;
const valorDe = (amount) => (amount && typeof amount === "object" ? amount.value : amount);

module.exports = { produtos, cashinpay, novoId, produtoDoId, arquivoDoProduto, linkDownload, mesmoValor, valorDe };
