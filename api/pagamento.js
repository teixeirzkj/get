// POST /api/pagamento        → cria a cobrança Pix na EvoPay
// GET  /api/pagamento?id=&produto= → consulta o status (e libera o download quando pago)
const { produtos, evopay, linkDownload, mesmoValor, origem } = require("./_lib");

const PLATAFORMAS = ["Steam", "Epic Games", "Rockstar Launcher", "Xbox App (PC)", "Xbox Series / One", "PS5"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") return await criar(req, res);
    if (req.method === "GET") return await consultar(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "Método não permitido" });
  } catch (e) {
    console.error("[pagamento]", e.message);
    const status = e.status && e.status < 500 ? 400 : 502;
    return res.status(status).json({ erro: "Não foi possível processar o pagamento agora. Tente novamente." });
  }
};

async function criar(req, res) {
  const { produto, plataforma, nick, aceiteTermos } = req.body || {};
  const item = produtos()[produto];
  const nickLimpo = String(nick || "").trim().slice(0, 40);

  if (!item) return res.status(400).json({ erro: "Produto inválido." });
  if (!PLATAFORMAS.includes(plataforma)) return res.status(400).json({ erro: "Selecione uma plataforma válida." });
  if (nickLimpo.length < 2) return res.status(400).json({ erro: "Informe o seu nick." });
  if (aceiteTermos !== true) return res.status(400).json({ erro: "É preciso aceitar os termos." });

  // dados do pedido vão na própria URL de callback (o site não tem banco de dados)
  const cb = new URL("/api/webhook", origem(req));
  cb.searchParams.set("p", produto);
  cb.searchParams.set("plat", plataforma);
  cb.searchParams.set("nick", nickLimpo);

  const tx = await evopay("POST", "/pix", {
    amount: item.preco, // preço sempre do servidor
    callbackUrl: cb.toString(),
    externalReference: `${produto}-${Date.now()}`,
  });

  return res.status(200).json({
    id: tx.id,
    copiaECola: tx.qrCodeText,
    qrCodeBase64: tx.qrCodeBase64 || null,
    valor: tx.amount,
  });
}

async function consultar(req, res) {
  const { id, produto } = req.query || {};
  const item = produtos()[produto];
  if (!id || !/^[a-z0-9]{10,64}$/.test(id) || !item) return res.status(400).json({ erro: "Consulta inválida." });

  const tx = await evopay("GET", `/pix?id=${encodeURIComponent(id)}`);
  if (tx.type && tx.type !== "DEPOSIT") return res.status(404).json({ erro: "Cobrança não encontrada." });

  if (tx.status === "COMPLETED") {
    // confere se o valor pago é o do produto pedido
    if (!mesmoValor(tx.amount, item.preco)) return res.status(403).json({ erro: "Pagamento não corresponde ao produto." });
    return res.status(200).json({ status: "paid", downloadUrl: linkDownload(produto) });
  }
  if (["EXPIRED", "CANCELED", "REFUNDED", "WAITING_FOR_REFUND"].includes(tx.status)) {
    return res.status(200).json({ status: "expired" });
  }
  return res.status(200).json({ status: "pending" });
}
