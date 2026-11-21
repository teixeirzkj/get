// Utilitários compartilhados pelas funções /api (não vira rota: começa com "_")
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Gateway Pix: PagueZy (https://paguezy.com/docs/guia). Chaves pk_test_/sk_test_ = sandbox no mesmo host.
const PAGUEZY = process.env.PAGUEZY_URL || "https://paguezy.com/api/v1";

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

async function paguezy(metodo, rota, body) {
  const key = process.env.PAGUEZY_API_KEY, secret = process.env.PAGUEZY_API_SECRET;
  if (!key || !secret) throw Object.assign(new Error("PAGUEZY_API_KEY / PAGUEZY_API_SECRET não configuradas"), { status: 503, code: "nao_configurado" });
  const r = await fetch(PAGUEZY + rota, {
    method: metodo,
    headers: { "X-Api-Key": key, "X-Api-Secret": secret, Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.success === false) {
    const msg = j.message || (j.error && (j.error.message || (typeof j.error === "string" && j.error))) || j.erro;
    throw Object.assign(new Error(msg || `PagueZy HTTP ${r.status}`), { status: r.status, code: j.error && j.error.code });
  }
  return j.data || j.payment || j;
}

// O ID da cobrança é da PagueZy; o nosso (tx_..., com produto/valor) vai como external_reference.
// O navegador recebe os dois juntos: "<nosso id>.<id PagueZy>".
const juntarId = (tx, pid) => `${tx}.${pid}`;
function separarId(s) {
  const i = String(s || "").indexOf(".");
  if (i < 0) return null;
  const tx = s.slice(0, i), pid = s.slice(i + 1);
  return /^[A-Za-z0-9_-]{4,100}$/.test(pid) ? { tx, pid } : null;
}

// Consulta na PagueZy e confere referência e valor. status: paid | pending | expired | estornado | invalido
async function consultarPagamento(idComposto) {
  const partes = separarId(idComposto);
  const pedido = partes && pedidoDoId(partes.tx);
  if (!pedido) return null;
  const d = await paguezy("GET", `/payments/${encodeURIComponent(partes.pid)}`);
  const ref = d.external_reference ?? d.externalReference;
  if (ref != null && ref !== partes.tx) return { pedido, status: "invalido" };
  const st = String(d.status || "").toLowerCase();
  if (st === "paid") {
    const amt = Number(d.amount ?? d.value);
    const ok = amt === Math.round(pedido.valor * 100) || mesmoValor(amt, pedido.valor); // centavos (doc) ou reais
    return { pedido, status: ok ? "paid" : "invalido" };
  }
  if (["failed", "canceled", "cancelled", "expired"].includes(st)) return { pedido, status: "expired" };
  if (["refunded", "chargeback"].includes(st)) return { pedido, status: "estornado" };
  return { pedido, status: "pending" };
}

// ID da transação gerado por nós: tx_<produto>_[sup_]<carimbo>. O produto e o adicional saem do
// próprio ID, então o servidor sabe o que foi comprado (e o valor certo) sem banco de dados.
// Com cupom, o desconto (em centavos) também vai no ID: tx_<produto>_[sup_][c<centavos>_]<carimbo>.
function novoId(produto, comAdicional, descontoCentavos) {
  const rand = require("crypto").randomBytes(5).toString("hex");
  const cup = descontoCentavos > 0 ? `c${descontoCentavos}_` : "";
  return `tx_${produto}_${comAdicional ? "sup_" : ""}${cup}${Date.now().toString(36)}${rand}`;
}
// Pacote personalizado: produto no ID = p<centavos>-<arquivo> (arquivo = id de um pacote ou "suporte").
// Esse ID só é criado pelo servidor depois de conferir o link assinado pelo admin.
function pedidoDoId(id) {
  const m = /^tx_([a-z0-9-]+)_(sup_)?(?:c(\d{1,7})_)?[a-z0-9]{8,30}$/.exec(String(id || ""));
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
  const desconto = m[3] ? Number(m[3]) / 100 : 0;
  return { produto: m[1], arquivo, item, adicional: !!m[2], desconto, valor: Math.round((item.preco - desconto + extra) * 100) / 100 };
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
// ---------- cupons de desconto ----------
// Lista em cupons.json (raiz do projeto, não é pública). Editada pelo /admin → Cupons.
// { codigo, tipo: "percentual"|"valor", valor, ativo, validade: "AAAA-MM-DD"|"", pacotes: [] (vazio = todos) }
const PRECO_MINIMO = 5; // o Pix nunca fica abaixo disso, mesmo com cupom (margem segura para o gateway)
const normCodigo = (c) => String(c || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
function lerCupons() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "cupons.json"), "utf8")).cupons || []; }
  catch (_) { return []; }
}
const hojeBR = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD
// chave = id do pacote ou "personalizado"; base = preço do pacote (o adicional não tem desconto)
function aplicarCupom(codigo, chave, base) {
  const cod = normCodigo(codigo);
  const c = cod && lerCupons().find((x) => normCodigo(x.codigo) === cod);
  if (!c || !c.ativo) return { erro: "Cupom inválido." };
  if (c.validade && hojeBR() > c.validade) return { erro: "Este cupom expirou." };
  if (Array.isArray(c.pacotes) && c.pacotes.length && !c.pacotes.includes(chave)) return { erro: "Este cupom não vale para este pacote." };
  let desconto = c.tipo === "valor" ? Number(c.valor) : (base * Number(c.valor)) / 100;
  desconto = Math.min(Math.round(desconto * 100) / 100, Math.round((base - PRECO_MINIMO) * 100) / 100);
  if (!(desconto > 0)) return { erro: "Este cupom não se aplica a este valor." };
  const rotulo = c.tipo === "valor" ? `R$ ${Number(c.valor).toFixed(2).replace(".", ",")} de desconto` : `${Number(c.valor)}% de desconto`;
  return { codigo: cod, desconto, rotulo };
}

// ---------- GitHub (painel salva arquivos do repositório; a Vercel publica sozinha) ----------
async function github(metodo, rota, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw Object.assign(new Error("GITHUB_TOKEN não configurado"), { status: 503, code: "sem_github" });
  const repo = process.env.GITHUB_REPO || "teixeirzkj/get";
  const r = await fetch(`https://api.github.com/repos/${repo}${rota}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "teixeiramods-admin", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`GitHub ${r.status}: ${j.message || ""}`), { status: r.status, code: "github" });
  return j;
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

const mesmoValor = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

module.exports = { produtos, precoAdicional, paguezy, juntarId, consultarPagamento, novoId, pedidoDoId, assinar, lerToken, senhaAdminOk, aplicarCupom, normCodigo, github, arquivoDoProduto, linkDownload, mesmoValor };
