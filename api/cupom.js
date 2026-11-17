// POST /api/cupom → confere um cupom para um pacote. body: { codigo, produto, token? }
// Só informa o desconto; o valor final é recalculado em /api/pagamento.
const { produtos, lerToken, aplicarCupom } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ erro: "Método não permitido" }); }
  try {
    const b = req.body || {};
    let base = produtos()[b.produto] && produtos()[b.produto].preco;
    if (b.produto === "personalizado") { const p = lerToken(b.token); base = p && p.p / 100; }
    if (!(base > 0)) return res.status(400).json({ erro: "Pacote inválido." });
    const c = aplicarCupom(b.codigo, b.produto, base);
    if (c.erro) return res.status(400).json({ erro: c.erro });
    return res.status(200).json(c);
  } catch (e) {
    console.error("[cupom]", e.message);
    return res.status(500).json({ erro: "Não foi possível conferir o cupom agora." });
  }
};
