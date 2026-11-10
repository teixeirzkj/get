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
  adicional = L.adicional || null;
  return catalogo;
}
let adicional;
function precoAdicional() { produtos(); return adicional ? adicional.preco : null; }

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

// ID da transação gerado por nós: tx_<produto>_[sup_]<carimbo>. O produto e o adicional saem do
// próprio ID, então o servidor sabe o que foi comprado (e o valor certo) sem banco de dados.
function novoId(produto, comAdicional) {
  const rand = require("crypto").randomBytes(5).toString("hex");
  return `tx_${produto}_${comAdicional ? "sup_" : ""}${Date.now().toString(36)}${rand}`;
}
// Pacote personalizado: produto no ID = p<centavos>-<arquivo> (arquivo = id de um pacote ou "suporte").
// Esse ID só é criado pelo servidor depois de conferir o link assinado pelo admin.
function pedidoDoId(id) {
  const m = /^tx_([a-z0-9-]+)_(sup_)?[a-z0-9]{8,30}$/.exec(String(id || ""));
  if (!m) return null;
  let item, arquivo;
  const pers = /^p(\d{1,7})-([a-z0-9-]+)$/.exec(m[1]);
  if (pers) {
    if (pers[2] !== "suporte" && !produtos()[pers[2]]) return null;
    item = { nome: "Pacote personalizado", preco: Number(pers[1]) / 100 };
    arquivo = pers[2] === "suporte" ? null : pers[2];
  } else {
    item = produtos()[m[1]];
    arquivo = m[1];
  }
  if (!item) return null;
  const extra = m[2] ? precoAdicional() : 0;
  if (extra == null) return null;
  return { produto: m[1], arquivo, item, adicional: !!m[2], valor: Math.round((item.preco + extra) * 100) / 100 };
}

// ---------- links de pacote personalizado (assinados, sem banco de dados) ----------
// token = base64url(JSON) + "." + HMAC-SHA256. Quem não tem o segredo não consegue mudar o preço.
const crypto = require("crypto");
function segredo() {
  const s = process.env.PEDIDO_SECRET || process.env.ADMIN_SENHA;
  if (!s) throw Object.assign(new Error("ADMIN_SENHA não configurada"), { status: 503, code: "nao_configurado" });
  return s;
}
const b64 = (buf) => Buffer.from(buf).toString("base64url");
function assinar(dados) {
  const corpo = b64(JSON.stringify(dados));
  return corpo + "." + b64(crypto.createHmac("sha256", segredo()).update(corpo).digest());
}
function lerToken(token) {
  const [corpo, sig] = String(token || "").split(".");
  if (!corpo || !sig) return null;
  const esperado = crypto.createHmac("sha256", segredo()).update(corpo).digest();
  const recebido = Buffer.from(sig, "base64url");
  if (recebido.length !== esperado.length || !crypto.timingSafeEqual(recebido, esperado)) return null;
  try {
    const d = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    if (d.e && Date.now() > d.e) return null; // expirado
    return d;
  } catch (_) { return null; }
}
function senhaAdminOk(senha) {
  const certa = process.env.ADMIN_SENHA;
  if (!certa) throw Object.assign(new Error("ADMIN_SENHA não configurada"), { status: 503, code: "nao_configurado" });
  const h = (v) => crypto.createHash("sha256").update(String(v || "")).digest();
  return crypto.timingSafeEqual(h(senha), h(certa));
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

// Link que o cliente recebe depois do pagamento (arquivo null = entrega pelo suporte)
function linkDownload(arquivo, txId) {
  if (!arquivo) return null;
  if (arquivoDoProduto(arquivo)) return `/api/download?id=${encodeURIComponent(txId)}`;
  return linkExterno(arquivo);
}

// status que a CashinPay pode usar para "pago"
const pago = (s) => ["paid", "approved", "completed", "confirmed"].includes(String(s || "").toLowerCase());
const mesmoValor = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;
const valorDe = (amount) => (amount && typeof amount === "object" ? amount.value : amount);

module.exports = { produtos, precoAdicional, cashinpay, novoId, pedidoDoId, assinar, lerToken, senhaAdminOk, arquivoDoProduto, linkDownload, pago, mesmoValor, valorDe };
