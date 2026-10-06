// Utilitários compartilhados pelas funções /api (não vira rota: começa com "_")
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const EVOPAY = "https://pix.evopay.cash/v1";

// Lê o catálogo do mesmo config.js usado pelo site (fonte única de preços)
let catalogo;
function produtos() {
  if (catalogo) return catalogo;
  const src = fs.readFileSync(path.join(process.cwd(), "config.js"), "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(src, ctx);
  const L = ctx.window.LOJA;
  catalogo = {};
  L.planos.forEach((p) => p.preco != null && (catalogo[p.id] = { nome: p.nome, preco: p.preco }));
  L.trajes.forEach((t) => (catalogo[t.id] = { nome: `Pacote ${t.qtd} Trajes`, preco: t.preco }));
  return catalogo;
}

async function evopay(metodo, rota, body) {
  const token = process.env.EVOPAY_TOKEN;
  if (!token) throw Object.assign(new Error("EVOPAY_TOKEN não configurado"), { status: 500 });
  const r = await fetch(EVOPAY + rota, {
    method: metodo,
    headers: { "API-Key": token, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || `EvoPay HTTP ${r.status}`), { status: r.status });
  return data;
}

// Links de download por produto: variável DOWNLOADS = {"iniciante":"https://...", ...}
function linkDownload(id) {
  try { return JSON.parse(process.env.DOWNLOADS || "{}")[id] || null; } catch (_) { return null; }
}

const mesmoValor = (a, b) => Math.abs(Number(a) - Number(b)) < 0.005;

function origem(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}`;
}

module.exports = { produtos, evopay, linkDownload, mesmoValor, origem };
