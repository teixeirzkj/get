(() => {
  const L = window.LOJA;
  const Pay = window.Pagamento;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  $$(".js-discord").forEach((a) => (a.href = L.discord));
  $("#year").textContent = new Date().getFullYear();

  /* =========================================================
     PRODUTOS (planos + trajes) num formato único
     ========================================================= */
  const produtos = {};
  L.planos.forEach((p) => {
    produtos[p.id] = {
      id: p.id, cor: p.cor, preco: p.preco, destaque: p.destaque, desc: p.desc,
      tier: p.nome, titulo: p.nome,
      grande: p.meta, unidade: "MI · META",
      sub: p.sub,
      itens: p.itens,
    };
  });
  L.trajes.forEach((t) => {
    produtos[t.id] = {
      id: t.id, cor: "green", preco: t.preco, destaque: t.destaque, desc: t.desc,
      tier: "Guia de trajes", titulo: `Guia ${t.qtd} Trajes`,
      grande: String(t.qtd), unidade: "TRAJES",
      sub: "Guia em PDF com checklist",
      itens: [`Passo a passo para ${t.qtd} trajes`, "Visuais masculinos e femininos", "Checklist para cada traje", "Download do PDF na hora"],
    };
  });

  const tile = (p, i) => `
    <button class="tile tile--${p.cor} reveal${p.destaque ? " is-featured" : ""}" style="--d:${(i % 3) * 0.06}s" data-produto="${p.id}" aria-label="Ver ${esc(p.titulo)}">
      <span class="tile__main">
        <span class="tile__tier">${esc(p.tier)}${p.destaque ? `<em>${esc(p.destaque)}</em>` : ""}</span>
        <span class="tile__big">${esc(p.grande)}<small>${p.unidade}</small></span>
        <span class="tile__sub">${esc(p.sub)}</span>
        <span class="tile__price">${p.preco != null ? brl(p.preco) : "Consultar"}</span>
      </span>
      <span class="tile__detail">
        <span class="tile__list">${p.itens.slice(0, 5).map((it) => `<span>${esc(it)}</span>`).join("")}${p.itens.length > 5 ? `<span class="more">+${p.itens.length - 5} ${p.itens.length - 5 > 1 ? "itens" : "item"}</span>` : ""}</span>
        <span class="tile__cta">Ver guia <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span>
      </span>
    </button>`;

  $("#plans").innerHTML = L.planos.map((p, i) => tile(produtos[p.id], i)).join("") + `
    <a class="tile tile--custom reveal js-discord" style="--d:.12s" href="${esc(L.discord)}" target="_blank" rel="noopener">
      <span class="tile__main">
        <span class="tile__tier">Suporte</span>
        <span class="tile__big tile__big--txt">Ficou<br/>em dúvida?</span>
        <span class="tile__sub">Ajudamos você a escolher o guia certo</span>
      </span>
      <span class="tile__detail">
        <span class="tile__list"><span>Qual guia combina com sua conta</span><span>Dúvidas sobre pagamento e download</span></span>
        <span class="tile__cta">Falar no Discord <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span>
      </span>
    </a>`;
  $("#outfits").innerHTML = L.trajes.map((t, i) => tile(produtos[t.id], i)).join("");

  /* =========================================================
     CAMADAS (modal)
     ========================================================= */
  let lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.add("is-open"); el.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
    setTimeout(() => (el.querySelector("[data-close]") || el).focus({ preventScroll: true }), 60);
  }
  function closeLayer(el) {
    el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("is-locked");
    lastFocus && lastFocus.focus({ preventScroll: true });
    if (el === modal) pararStatus();
  }

  /* =========================================================
     CHECKOUT
     ========================================================= */
  const modal = $("#orderModal");
  const form = $("#orderForm");
  let atual = null;     // produto aberto
  let cobranca = null;  // pagamento gerado
  let poll = null, timer = null;

  const pane = (name) => $$(".pane", modal).forEach((p) => p.classList.toggle("is-active", p.dataset.pane === name));

  function abrirProduto(id) {
    const p = produtos[id]; if (!p) return;
    atual = p;
    modal.dataset.cor = p.cor;
    $("#orderTier").textContent = p.tier;
    $("#orderTitle").textContent = p.titulo;
    $("#orderPrice").textContent = p.preco != null ? brl(p.preco) : "Valor sob consulta";
    $("#orderDesc").textContent = p.desc || "";
    $("#orderItems").innerHTML = p.itens.map((i) => `<li>${esc(i)}</li>`).join("");
    $("#formError").textContent = "";
    $("#orderAccept").checked = false;
    $("#orderSend").disabled = true;
    $("#orderSend").textContent = "Gerar pagamento";
    termsBox.hidden = true; panel.classList.remove("has-terms");
    pane("form");
    openLayer(modal);
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target.closest("[data-produto]"); if (t) abrirProduto(t.dataset.produto);
  });
  modal.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]")) closeLayer(modal); });

  /* termos: link dentro do texto de aceite abre o painel */
  const termsBox = $("#termsBox");
  const panel = $(".modal__panel", modal);
  const abrirTermos = () => { panel.scrollTop = 0; panel.classList.add("has-terms"); termsBox.hidden = false; $(".terms__body", termsBox).scrollTop = 0; $("#closeTerms").focus(); };
  const fecharTermos = () => { termsBox.hidden = true; panel.classList.remove("has-terms"); $("#openTerms").focus(); };
  $("#openTerms").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); abrirTermos(); });
  $("#closeTerms").addEventListener("click", fecharTermos);
  $("#backTerms").addEventListener("click", fecharTermos);
  $("#acceptTerms").addEventListener("click", () => {
    const c = $("#orderAccept"); c.checked = true; c.dispatchEvent(new Event("change"));
    fecharTermos();
  });

  $("#orderAccept").addEventListener("change", (e) => ($("#orderSend").disabled = !e.target.checked));

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const plataforma = $("#orderPlatform").value;
    const nick = $("#orderNick").value.trim();
    const err = $("#formError");
    if (!plataforma) { err.textContent = "Selecione a sua plataforma."; $("#orderPlatform").focus(); return; }
    if (nick.length < 2) { err.textContent = "Informe o seu nick."; $("#orderNick").focus(); return; }
    const nome = $("#orderName").value.trim().replace(/\s+/g, " ");
    const email = $("#orderEmail").value.trim();
    const telefone = $("#orderPhone").value.replace(/\D/g, "");
    const cpf = $("#orderCpf").value.replace(/\D/g, "");
    if (nome.split(" ").length < 2) { err.textContent = "Informe nome e sobrenome."; $("#orderName").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Informe um e-mail válido."; $("#orderEmail").focus(); return; }
    if (telefone.length < 10 || telefone.length > 11) { err.textContent = "Informe o WhatsApp com DDD."; $("#orderPhone").focus(); return; }
    if (!cpfValido(cpf)) { err.textContent = "Informe um CPF válido."; $("#orderCpf").focus(); return; }
    if (!$("#orderAccept").checked) { err.textContent = "Aceite os termos para continuar."; return; }
    err.textContent = "";

    const btn = $("#orderSend");
    btn.disabled = true; btn.textContent = "Gerando Pix…";
    try {
      cobranca = await Pay.criar({ produto: atual.id, plataforma, nick, nome, email, telefone, cpf, aceiteTermos: true });
      await mostrarPix(cobranca);
      pane("pix");
      iniciarStatus();
    } catch (e) {
      if (e.status === 400) { err.textContent = e.message; return; }
      mostrarErro("Não foi possível gerar o pagamento", e.message && !/^HTTP/.test(e.message) ? e.message : "O pagamento está indisponível no momento. Tente novamente em instantes.");
    } finally {
      btn.disabled = !$("#orderAccept").checked; btn.textContent = "Gerar pagamento";
    }
  });

  function cpfValido(c) {
    if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
    for (let t = 9; t < 11; t++) {
      let soma = 0;
      for (let i = 0; i < t; i++) soma += +c[i] * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  }
  const mascara = (el, fmt) => el.addEventListener("input", () => { el.value = fmt(el.value.replace(/\D/g, "")); });
  mascara($("#orderCpf"), (d) => d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"));
  mascara($("#orderPhone"), (d) => {
    d = d.slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  });

  async function mostrarPix(c) {
    $("#pixAmount").textContent = brl(c.valor != null ? c.valor : atual.preco);
    $("#pixCode").value = c.copiaECola || "";
    const box = $("#pixQr");
    if (c.qrCodeBase64) {
      const src = c.qrCodeBase64.startsWith("data:") ? c.qrCodeBase64 : `data:image/png;base64,${c.qrCodeBase64}`;
      box.innerHTML = `<img src="${src}" alt="QR Code Pix" />`;
    } else if (c.copiaECola) {
      box.innerHTML = "";
      try { await loadQrLib(); new window.QRCode(box, { text: c.copiaECola, width: 200, height: 200, correctLevel: window.QRCode.CorrectLevel.M }); }
      catch (_) { box.innerHTML = `<span class="pix__noqr">Use o código copia e cola</span>`; }
    }
    clearInterval(timer);
    const fim = c.expiraEm ? new Date(c.expiraEm).getTime() : null;
    const tick = () => {
      if (!fim) { $("#pixTimer").textContent = ""; return; }
      const s = Math.max(0, Math.round((fim - Date.now()) / 1000));
      $("#pixTimer").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      if (s === 0) { pararStatus(); mostrarErro("Pix expirado", "O tempo para pagamento acabou. Gere um novo Pix."); }
    };
    tick(); timer = setInterval(tick, 1000);
  }

  let qrLib;
  function loadQrLib() {
    if (window.QRCode) return Promise.resolve();
    return (qrLib ||= new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = ok; s.onerror = fail; document.head.appendChild(s);
    }));
  }

  function iniciarStatus() {
    pararStatus(false);
    poll = setInterval(async () => {
      try {
        const r = await Pay.status(cobranca.id, atual.id);
        if (r.status === "paid") {
          pararStatus();
          const a = $("#downloadBtn");
          if (r.downloadUrl) {
            a.href = r.downloadUrl; a.hidden = false;
            $(".paid__text", modal).textContent = "Seu guia em PDF está pronto para download.";
          } else {
            a.hidden = true;
            $(".paid__text", modal).textContent = "Pagamento recebido! Chame o suporte no Discord para receber seu guia.";
          }
          pane("paid");
        } else if (r.status === "expired") {
          pararStatus();
          mostrarErro("Pix expirado", "O tempo para pagamento acabou. Gere um novo Pix.");
        }
      } catch (_) { /* tenta de novo no próximo ciclo */ }
    }, Pay.intervalo);
  }
  function pararStatus(limparTimer = true) {
    clearInterval(poll); poll = null;
    if (limparTimer) clearInterval(timer);
  }
  function mostrarErro(t, m) { $("#errorTitle").textContent = t; $("#errorText").textContent = m; pane("error"); }
  $("#retryBtn").addEventListener("click", () => pane("form"));

  $("#pixCopy").addEventListener("click", async () => {
    const v = $("#pixCode").value; if (!v) return;
    try { await navigator.clipboard.writeText(v); } catch (_) { $("#pixCode").select(); document.execCommand("copy"); }
    $("#pixCopy").textContent = "Copiado";
    setTimeout(() => ($("#pixCopy").textContent = "Copiar"), 2000);
    toast("Código Pix copiado");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !termsBox.hidden) { fecharTermos(); return; }
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeLayer(modal);
  });

  let toastT;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("is-show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("is-show"), 2600); }

  /* =========================================================
     NAV + SCROLL
     ========================================================= */
  const nav = $("#nav");
  const burger = $(".nav__burger");
  burger.addEventListener("click", () => { const o = nav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", o); });
  $$(".nav__links a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false); }));

  const sections = $$("main section[id]");
  const links = $$(".nav__links a");
  const heroImg = $(".hero__bg img");
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 20);
    if (!reduce && heroImg && y < window.innerHeight) heroImg.style.transform = `scale(1.08) translateY(${y * 0.15}px)`;
    let id = "";
    sections.forEach((s) => { if (s.offsetTop - 140 <= y) id = s.id; });
    links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* reveal + contadores */
  const countUp = (el) => {
    const to = +el.dataset.to; const plain = el.dataset.fmt === "plain";
    const fmt = (n) => (plain ? String(n) : n.toLocaleString("pt-BR"));
    if (reduce) { el.textContent = fmt(to); return; }
    const dur = 1400; const t0 = performance.now();
    const f = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      $$(".count", en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
  $$(".reveal, .step").forEach((el) => io.observe(el));

  if (Pay.demo) toast("Modo demonstração de pagamento ativo");
})();
