// POST /api/cupons → (admin) lista ou salva os cupons.
// body: { senha, acao: "listar" } | { senha, acao: "salvar", cupons: [...] }
// Salvar faz commit de cupons.json no GitHub; a Vercel publica em ~1 min.
const { produtos, senhaAdminOk, normCodigo, github } = require("./_lib");
const fs = require("fs");
const path = require("path");

const ARQUIVO = "cupons.json";

function validar(lista) {
  if (!Array.isArray(lista) || lista.length > 100) throw erro("Lista de cupons inválida (máximo 100).");
  const ids = new Set([...Object.keys(produtos()), "personalizado"]);
  const vistos = new Set();
  return lista.map((c, i) => {
    const codigo = normCodigo(c.codigo);
    const n = `Cupom ${i + 1}${codigo ? ` (${codigo})` : ""}`;
    if (codigo.length < 3) throw erro(`${n}: código com pelo menos 3 letras ou números.`);
    if (vistos.has(codigo)) throw erro(`${n}: código repetido.`);
    vistos.add(codigo);
    const tipo = c.tipo === "valor" ? "valor" : "percentual";
    const valor = Math.round(Number(c.valor) * 100) / 100;
    if (tipo === "percentual" && !(valor >= 1 && valor <= 100)) throw erro(`${n}: porcentagem entre 1 e 100.`);
    if (tipo === "valor" && !(valor >= 0.01 && valor <= 9999)) throw erro(`${n}: valor de desconto inválido.`);
    const validade = String(c.validade || "");
    if (validade && !/^\d{4}-\d{2}-\d{2}$/.test(validade)) throw erro(`${n}: data de validade inválida.`);
    const pacotes = (Array.isArray(c.pacotes) ? c.pacotes : []).filter((p) => ids.has(p));
    return { codigo, tipo, valor, ativo: c.ativo !== false, validade, pacotes };
  });
}
function erro(msg) { return Object.assign(new Error(msg), { status: 400 }); }

async function lerDoGitHub(branch) {
  try {
    const arq = await github("GET", `/contents/${ARQUIVO}?ref=${branch}`);
    return { sha: arq.sha, cupons: JSON.parse(Buffer.from(arq.content, "base64").toString("utf8")).cupons || [] };
  } catch (e) {
    if (e.status === 404) return { sha: undefined, cupons: [] };
    throw e;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ erro: "Método não permitido" }); }
  try {
    const b = req.body || {};
    if (!senhaAdminOk(b.senha)) return res.status(401).json({ erro: "Senha incorreta." });
    const branch = process.env.GITHUB_BRANCH || "main";

    if (b.acao === "listar") {
      // versão mais nova (GitHub); sem token, a que está publicada
      if (!process.env.GITHUB_TOKEN) {
        let cupons = [];
        try { cupons = JSON.parse(fs.readFileSync(path.join(process.cwd(), ARQUIVO), "utf8")).cupons || []; } catch (_) {}
        return res.status(200).json({ cupons, somenteLeitura: true });
      }
      return res.status(200).json({ cupons: (await lerDoGitHub(branch)).cupons });
    }

    if (b.acao === "salvar") {
      const cupons = validar(b.cupons);
      const atual = await lerDoGitHub(branch);
      await github("PUT", `/contents/${ARQUIVO}`, {
        message: "Admin: atualiza cupons",
        content: Buffer.from(JSON.stringify({ cupons }, null, 2) + "\n", "utf8").toString("base64"),
        sha: atual.sha,
        branch,
      });
      return res.status(200).json({ ok: true, cupons });
    }
    return res.status(400).json({ erro: "Ação inválida." });
  } catch (e) {
    console.error("[cupons]", e.status, e.message);
    if (e.status === 400) return res.status(400).json({ erro: e.message });
    if (e.code === "nao_configurado") return res.status(503).json({ erro: "Configure a variável ADMIN_SENHA na Vercel e faça Redeploy." });
    if (e.code === "sem_github") return res.status(503).json({ erro: "Configure a variável GITHUB_TOKEN na Vercel (ver README) e faça Redeploy." });
    if (e.code === "github") return res.status(502).json({ erro: `Não foi possível salvar no GitHub (${e.message}).` });
    return res.status(500).json({ erro: "Não foi possível processar os cupons." });
  }
};
