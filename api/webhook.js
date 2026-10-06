// POST /api/webhook — chamado pela EvoPay quando o status da cobrança muda.
// O callback da EvoPay não é assinado, então o status é sempre reconfirmado na API
// antes de qualquer ação. Se DISCORD_WEBHOOK_URL estiver configurada, avisa a venda no Discord.
const { produtos, evopay, mesmoValor } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const evento = req.body || {};
  const { p, plat, nick } = req.query || {};

  try {
    if (evento.type !== "DEPOSIT" || evento.status !== "COMPLETED" || !evento.id) return res.status(200).json({ ok: true });

    const tx = await evopay("GET", `/pix?id=${encodeURIComponent(evento.id)}`);
    const item = produtos()[p];
    if (tx.status !== "COMPLETED" || !item || !mesmoValor(tx.amount, item.preco)) return res.status(200).json({ ok: true });

    const hook = process.env.DISCORD_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Teixeira Payments",
          embeds: [{
            title: "💰 Nova venda confirmada",
            color: 0x39ff88,
            fields: [
              { name: "Pacote", value: item.nome, inline: true },
              { name: "Valor", value: `R$ ${Number(tx.amount).toFixed(2).replace(".", ",")}`, inline: true },
              { name: "Plataforma", value: String(plat || "—").slice(0, 40), inline: true },
              { name: "Nick", value: String(nick || "—").slice(0, 40), inline: true },
              { name: "Transação", value: tx.id, inline: false },
            ],
            timestamp: new Date().toISOString(),
          }],
          allowed_mentions: { parse: [] },
        }),
      }).catch((e) => console.error("[webhook] discord", e.message));
    }
  } catch (e) {
    console.error("[webhook]", e.message);
  }
  return res.status(200).json({ ok: true });
};
