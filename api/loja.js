// POST /api/loja → (admin) salva preços e textos da loja em public/config.js, direto no GitHub.
// A Vercel publica o novo commit sozinha (~1 min). body: { senha, dados }
// Só campos conhecidos são aceitos; ids dos pacotes não mudam (são os nomes dos PDFs em arquivos/).
const { senhaAdminOk } = require("./_lib");

const ARQUIVO = "public/config.js";
const MARCA = /window\.LOJA = \/\*DADOS\*\/([\s\S]*)\/\*FIM\*\//;

const txt = (v, max, campo) => {
  const s = String(v ?? "").trim();
  if (s.length > max) throw erro(`${campo}: máximo de ${max} caracteres.`);
  return s;
};
const numero = (v, min, max, campo, { inteiro = false, nulo = false } = {}) => {
  if (nulo && (v === null || v === "" || v === undefined)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max || (inteiro && !Number.isInteger(n))) throw erro(`${campo}: valor inválido.`);
  return inteiro ? n : Math.round(n * 100) / 100;
};
const lista = (v, campo) => {
  const arr = (Array.isArray(v) ? v : []).map((i) => txt(i, 80, campo)).filter(Boolean);
  if (!arr.length || arr.length > 15) throw erro(`${campo}: de 1 a 15 itens.`);
  return arr;
};
function erro(msg) { return Object.assign(new Error(msg), { status: 400 }); }

// aplica só o que o painel pode mudar, em cima do config atual
function mesclar(atual, d) {
  const novo = JSON.parse(JSON.stringify(atual));
  const discord = txt(d.discord, 200, "Link do Discord");
  if (!/^https:\/\//.test(discord)) throw erro("Link do Discord deve começar com https://");
  novo.discord = discord;

  novo.adicional = {
    nome: txt(d.adicional?.nome, 40, "Nome do adicional") || "Adicional",
    preco: numero(d.adicional?.preco, 1, 999, "Preço do adicional"),
  };

  const b = d.basePreco || {};
  const base = {};
  for (const k of ["dinheiro", "level", "carros", "trajes", "extras"]) base[k] = numero(b[k], 0, 1, `Base de preço (${k})`);
  const soma = Object.values(base).reduce((s, v) => s + v, 0);
  if (Math.abs(soma - 1) > 0.011) throw erro(`Base de preço: os pesos somam ${Math.round(soma * 100)}%, precisam somar 100%.`);
  novo.basePreco = base;

  novo.planos = atual.planos.map((p) => {
    const e = (d.planos || []).find((x) => x && x.id === p.id);
    if (!e) return p;
    const n = txt(e.nome, 40, `${p.id}: nome`) || p.nome;
    return {
      ...p,
      nome: n,
      preco: numero(e.preco, 1, 9999, `${n}: preço`, { nulo: true }),
      meta: String(numero(e.meta, 0, 99999, `${n}: meta (mi)`, { inteiro: true })),
      level: numero(e.level, 0, 8000, `${n}: level`, { inteiro: true, nulo: true }),
      carros: numero(e.carros, 0, 999, `${n}: carros`, { inteiro: true }),
      trajes: numero(e.trajes, 0, 999, `${n}: trajes`, { inteiro: true }),
      sub: txt(e.sub, 80, `${n}: texto do card`),
      destaque: txt(e.destaque, 20, `${n}: destaque`) || undefined,
      desc: txt(e.desc, 300, `${n}: descrição`),
      itens: lista(e.itens, `${n}: itens`),
    };
  });

  novo.trajes = atual.trajes.map((t) => {
    const e = (d.trajes || []).find((x) => x && x.id === t.id);
    if (!e) return t;
    return {
      ...t,
      qtd: numero(e.qtd, 1, 999, `${t.id}: quantidade`, { inteiro: true }),
      preco: numero(e.preco, 1, 9999, `${t.id}: preço`),
      destaque: txt(e.destaque, 20, `${t.id}: destaque`) || null,
      desc: txt(e.desc, 300, `${t.id}: descrição`),
    };
  });
  return novo;
}

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

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ erro: "Método não permitido" }); }
  try {
    const b = req.body || {};
    if (!senhaAdminOk(b.senha)) return res.status(401).json({ erro: "Senha incorreta." });

    const branch = process.env.GITHUB_BRANCH || "main";
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const arq = await github("GET", `/contents/${ARQUIVO}?ref=${branch}`);
      const fonte = Buffer.from(arq.content, "base64").toString("utf8");
      const m = MARCA.exec(fonte);
      if (!m) return res.status(500).json({ erro: "config.js fora do formato esperado (marcas /*DADOS*/ e /*FIM*/)." });
      const novo = mesclar(JSON.parse(m[1]), b.dados || {});
      const conteudo = fonte.replace(MARCA, `window.LOJA = /*DADOS*/${JSON.stringify(novo, null, 2)}/*FIM*/`);
      if (conteudo === fonte) return res.status(200).json({ ok: true, semMudanca: true });
      try {
        await github("PUT", `/contents/${ARQUIVO}`, {
          message: "Admin: atualiza preços e textos da loja",
          content: Buffer.from(conteudo, "utf8").toString("base64"),
          sha: arq.sha,
          branch,
        });
        return res.status(200).json({ ok: true });
      } catch (e) {
        if (e.status === 409 && tentativa === 0) continue; // alguém salvou junto: relê e tenta de novo
        throw e;
      }
    }
  } catch (e) {
    console.error("[loja]", e.status, e.message);
    if (e.status === 400) return res.status(400).json({ erro: e.message });
    if (e.code === "nao_configurado") return res.status(503).json({ erro: "Configure a variável ADMIN_SENHA na Vercel e faça Redeploy." });
    if (e.code === "sem_github") return res.status(503).json({ erro: "Configure a variável GITHUB_TOKEN na Vercel (ver README) e faça Redeploy." });
    if (e.code === "github") return res.status(502).json({ erro: `Não foi possível salvar no GitHub (${e.message}). Confira o GITHUB_TOKEN.` });
    return res.status(500).json({ erro: "Não foi possível salvar." });
  }
};
