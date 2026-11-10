// POST /api/personalizado → (admin) gera o link assinado de um pacote personalizado
// body: { senha, titulo, descricao, itens: [..], preco, arquivo, validadeDias }
const { produtos, assinar, senhaAdminOk } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ erro: "Método não permitido" }); }
  try {
    const b = req.body || {};
    if (!senhaAdminOk(b.senha)) return res.status(401).json({ erro: "Senha incorreta." });

    const titulo = String(b.titulo || "").trim().slice(0, 60);
    const descricao = String(b.descricao || "").trim().slice(0, 300);
    const itens = (Array.isArray(b.itens) ? b.itens : []).map((i) => String(i).trim().slice(0, 80)).filter(Boolean).slice(0, 20);
    const centavos = Math.round(Number(b.preco) * 100);
    const arquivo = String(b.arquivo || "");
    const dias = Math.min(Math.max(parseInt(b.validadeDias, 10) || 30, 1), 365);

    if (titulo.length < 2) return res.status(400).json({ erro: "Informe o título do pacote." });
    if (!itens.length) return res.status(400).json({ erro: "Informe pelo menos um item." });
    if (!(centavos >= 500 && centavos <= 999999)) return res.status(400).json({ erro: "Preço deve ficar entre R$ 5,00 e R$ 9.999,99." });
    if (arquivo !== "suporte" && !produtos()[arquivo]) return res.status(400).json({ erro: "Escolha o arquivo que será entregue." });

    const token = assinar({ t: titulo, d: descricao, i: itens, p: centavos, a: arquivo, e: Date.now() + dias * 864e5 });
    return res.status(200).json({ token, url: `/pedido?c=${token}` });
  } catch (e) {
    console.error("[personalizado]", e.message);
    if (e.code === "nao_configurado") return res.status(503).json({ erro: "Configure a variável ADMIN_SENHA na Vercel e faça Redeploy." });
    return res.status(500).json({ erro: "Não foi possível gerar o link." });
  }
};
