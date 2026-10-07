// POST /api/webhook — eventos da CashinPay (configure esta URL no painel → Webhooks).
// Valida a assinatura HMAC-SHA256 (X-CashinPay-Signature) com CASHINPAY_WEBHOOK_SECRET,
// reconfirma o pagamento na API e, se DISCORD_WEBHOOK_URL existir, avisa a venda no Discord.
const crypto = require("crypto");
const { produtos, cashinpay, produtoDoId, mesmoValor, valorDe } = require("./_lib");

// corpo cru é necessário para conferir a assinatura (ler antes de tocar em req.body)
async function corpoCru(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  const partes = [];
  for await (const p of req) partes.push(p);
  return Buffer.concat(partes).toString("utf8");
}

function assinaturaOk(payload, recebida, segredo) {
  if (!segredo || !recebida) return false;
  const esperada = crypto.createHmac("sha256", segredo).update(payload).digest("hex");
  const a = Buffer.from(esperada), b = Buffer.from(String(recebida).replace(/^sha256=/, ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  let raw;
  try { raw = await corpoCru(req); } catch (_) { return res.status(400).end(); }
  if (!assinaturaOk(raw, req.headers["x-cashinpay-signature"], process.env.CASHINPAY_WEBHOOK_SECRET)) {
    return res.status(401).json({ received: false });
  }

  let evento;
  try { evento = JSON.parse(raw); } catch (_) { return res.status(400).end(); }

  try {
    if (evento.event === "transaction.paid") {
      const id = evento.data && evento.data.id;
      const produto = produtoDoId(id);
      const item = produto && produtos()[produto];
      if (item) {
        const tx = await cashinpay("GET", `/transactions/${encodeURIComponent(id)}`);
        if (tx.status === "paid" && mesmoValor(valorDe(tx.amount), item.preco)) await avisarDiscord(item, tx);
      }
    }
  } catch (e) {
    console.error("[webhook]", e.message);
  }
  return res.status(200).json({ received: true });
};

async function avisarDiscord(item, tx) {
  const hook = process.env.DISCORD_WEBHOOK_URL;
  if (!hook) return;
  const c = tx.customer || {};
  const campos = [
    { name: "Pacote", value: item.nome, inline: true },
    { name: "Valor", value: `R$ ${Number(valorDe(tx.amount)).toFixed(2).replace(".", ",")}`, inline: true },
  ];
  if (c.name) campos.push({ name: "Cliente", value: String(c.name).slice(0, 80), inline: true });
  if (tx.description) campos.push({ name: "Pedido", value: String(tx.description).slice(0, 200), inline: false });
  campos.push({ name: "Transação", value: tx.id, inline: false });
  await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Teixeira Payments",
      embeds: [{ title: "💰 Nova venda confirmada", color: 0x39ff88, fields: campos, timestamp: new Date().toISOString() }],
      allowed_mentions: { parse: [] },
    }),
  }).catch((e) => console.error("[webhook] discord", e.message));
}
