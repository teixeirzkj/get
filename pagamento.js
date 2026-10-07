// =====================================================================
//  CLIENTE DE PAGAMENTO (Pix via gateway)
//
//  Gateway: CashinPay (implementado em /api). O site conversa só com a SUA API (LOJA.pagamento.endpoint). A API é
//  quem fala com o gateway, guarda a chave secreta e decide o preço pelo
//  id do produto. Contrato esperado:
//
//  POST /api/pagamento
//    body: { produto, plataforma, nick, nome, email, telefone, cpf, aceiteTermos: true }
//    200 → { id, copiaECola, qrCodeBase64?, valor?, expiraEm? (ISO) }
//
//  GET /api/pagamento?id=<id>&produto=<produto>
//    200 → { status: "pending" | "paid" | "expired", downloadUrl? }
//    (downloadUrl só deve vir quando status === "paid")
//
//  Modo demonstração (só local): abra index.html?demo
// =====================================================================
window.Pagamento = (() => {
  const cfg = (window.LOJA && window.LOJA.pagamento) || {};
  const local = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname);
  const demo = local && new URLSearchParams(location.search).has("demo");

  async function req(url, opts) {
    const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
    if (!r.ok) {
      let msg = "";
      try { msg = (await r.json()).erro || ""; } catch (_) {}
      const e = new Error(msg || `HTTP ${r.status}`); e.status = r.status; throw e;
    }
    return r.json();
  }

  // ----- demo -----
  const demoStore = {};
  const demoApi = {
    async criar(p) {
      await new Promise((r) => setTimeout(r, 900));
      const id = "demo_" + Date.now();
      demoStore[id] = Date.now();
      return { id, copiaECola: "00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-SEM-VALOR5204000053039865802BR5925TEIXEIRA MODS6009SAO PAULO62070503***6304ABCD", expiraEm: new Date(Date.now() + 15 * 60e3).toISOString(), produto: p.produto };
    },
    async status(id) {
      const pago = Date.now() - demoStore[id] > 8000;
      return pago ? { status: "paid", downloadUrl: "#demo" } : { status: "pending" };
    },
  };

  const api = {
    criar: (payload) => req(cfg.endpoint, { method: "POST", body: JSON.stringify(payload) }),
    status: (id, produto) => req(`${cfg.endpoint}?id=${encodeURIComponent(id)}&produto=${encodeURIComponent(produto)}`, { method: "GET" }),
  };

  return { demo, ...(demo ? demoApi : api), intervalo: cfg.intervaloStatus || 4000 };
})();
