(() => {
  const L = window.LOJA;
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
    const lvl = p.itens.find((i) => /^level/i.test(i));
    produtos[p.id] = {
      id: p.id, cor: p.cor, preco: p.preco, destaque: p.destaque, desc: p.desc,
      tier: p.nome.replace("Plano ", ""), titulo: p.nome,
      grande: p.itens[0].replace(/\s*Milh(õ|o)es/i, ""), unidade: "MI",
      sub: lvl || p.itens[1],
      itens: p.itens,
    };
  });
  L.trajes.forEach((t) => {
    produtos[t.id] = {
      id: t.id, cor: "green", preco: t.preco, destaque: t.destaque, desc: t.desc,
      tier: "Trajes", titulo: `Pacote ${t.qtd} Trajes`,
      grande: String(t.qtd), unidade: "TRAJES",
      sub: `${brl(t.preco / t.qtd)} por traje`,
      itens: [`${t.qtd} Trajes Modded`, "Masculinos e femininos", "Download na hora"],
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
        <span class="tile__cta">Ver pacote <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span>
      </span>
    </button>`;

  $("#plans").innerHTML = L.planos.map((p, i) => tile(produtos[p.id], i)).join("") + `
    <a class="tile tile--custom reveal js-discord" style="--d:.12s" href="${esc(L.discord)}" target="_blank" rel="noopener">
      <span class="tile__main">
        <span class="tile__tier">Personalizado</span>
        <span class="tile__big tile__big--txt">Monte<br/>o seu</span>
        <span class="tile__sub">Dinheiro, level, carros e trajes na medida</span>
      </span>
      <span class="tile__detail">
        <span class="tile__list"><span>Escolha cada item</span><span>Orçamento pelo suporte</span></span>
        <span class="tile__cta">Falar no Discord <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2"/></svg></span>
      </span>
    </a>`;
  $("#outfits").innerHTML = L.trajes.map((t, i) => tile(produtos[t.id], i)).join("");

  /* =========================================================
     RESULTADOS (galeria)
     ========================================================= */
  const tags = (e) => [
    `<span class="tag tag--plat">${esc(e.plataforma)}</span>`,
    e.dinheiro ? `<span class="tag tag--money">$ ${esc(e.dinheiro)}</span>` : "",
    e.nivel ? `<span class="tag">LVL ${e.nivel}</span>` : "",
  ].join("");

  $("#gallery").innerHTML = L.entregas.map((e, i) => `
    <button class="shot" data-i="${i}" data-plat="${esc(e.plataforma)}" aria-label="Ampliar: ${esc(e.pacote)} — ${esc(e.plataforma)}">
      <img src="assets/entregas/e${e.img}-thumb.webp" alt="${esc(e.pacote)} na ${esc(e.plataforma)}" loading="lazy" decoding="async" />
      <span class="shot__info"><span class="shot__title">${esc(e.pacote)}</span><span class="shot__tags">${tags(e)}</span></span>
    </button>`).join("");

  const plats = ["Todas", ...new Set(L.entregas.map((e) => e.plataforma))];
  $("#filters").innerHTML = plats.map((p, i) => {
    const n = p === "Todas" ? L.entregas.length : L.entregas.filter((e) => e.plataforma === p).length;
    return `<button class="chip" role="tab" aria-selected="${i === 0}" data-f="${esc(p)}">${esc(p)} <small>${n}</small></button>`;
  }).join("");
  $("#filters").addEventListener("click", (ev) => {
    const b = ev.target.closest(".chip"); if (!b) return;
    $$(".chip").forEach((c) => c.setAttribute("aria-selected", c === b));
    $$(".shot").forEach((s) => s.classList.toggle("is-hidden", !(b.dataset.f === "Todas" || s.dataset.plat === b.dataset.f)));
  });

  /* lightbox */
  const lb = $("#lightbox");
  let cur = 0;
  const visible = () => $$(".shot:not(.is-hidden)").map((s) => +s.dataset.i);
  const showLb = (i) => {
    cur = i; const e = L.entregas[i];
    $("#lbImg").src = `assets/entregas/e${e.img}.webp`;
    $("#lbImg").alt = `${e.pacote} — ${e.plataforma}`;
    $("#lbCap").innerHTML = `<span class="tag">${esc(e.pacote)}</span>${tags(e)}${e.data ? `<span class="tag">${esc(e.data)}</span>` : ""}`;
  };
  const step = (d) => { const v = visible(); showLb(v[(v.indexOf(cur) + d + v.length) % v.length]); };
  $("#gallery").addEventListener("click", (ev) => { const s = ev.target.closest(".shot"); if (s) { showLb(+s.dataset.i); openLayer(lb); } });
  lb.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-lb-prev]")) step(-1);
    else if (ev.target.closest("[data-lb-next]")) step(1);
    else if (ev.target.closest("[data-lb-close]") || ev.target === lb || ev.target.tagName === "FIGURE") closeLayer(lb);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

  /* =========================================================
     AVALIAÇÕES
     ========================================================= */
  $("#reviews").innerHTML = L.avaliacoes.map((r) => `
    <article class="review reveal">
      <div class="review__top"><span class="stars" aria-label="5 de 5 estrelas">★★★★★</span><span class="review__date">${esc(r.data || "")}</span></div>
      <p class="review__text${r.texto ? "" : " is-empty"}">${r.texto ? esc(r.texto) : "Avaliou a compra em 5 estrelas."}</p>
      <div class="review__foot"><span class="review__user">@${esc(r.user)}</span>${r.produto ? `<span class="review__prod">${esc(r.produto)}</span>` : ""}</div>
    </article>`).join("");

  /* =========================================================
     CAMADAS (modal / lightbox)
     ========================================================= */
  let lastFocus = null;
  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.add("is-open"); el.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("is-locked");
    setTimeout(() => (el.querySelector("[data-close], [data-lb-close]") || el).focus({ preventScroll: true }), 60);
  }
  function closeLayer(el) {
    el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("is-locked");
    lastFocus && lastFocus.focus({ preventScroll: true });
  }

  /* =========================================================
     PEDIDO (Discord) — trocar pelo gateway quando o pagamento for configurado
     ========================================================= */
  const modal = $("#orderModal");
  const form = $("#orderForm");
  let atual = null; // produto aberto

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
    $("#orderSend").textContent = "Chamar no Discord";
    termsBox.hidden = true; panel.classList.remove("has-terms");
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
    if (!$("#orderAccept").checked) { err.textContent = "Aceite os termos para continuar."; return; }

    err.textContent = "";

    const msg = [
      "🚀 Novo pedido — Teixeira Mods",
      `📦 Pacote: ${atual.titulo}`,
      `💵 Valor: ${atual.preco != null ? brl(atual.preco) : "a consultar"}`,
      `🎮 Plataforma: ${plataforma}`,
      `👤 Nick: ${nick}`,
      "📄 Termos de compra aceitos",
    ].join("\n");

    // copia primeiro (a aba nova tira o foco e bloquearia a área de transferência)
    let copiado = false;
    try { await navigator.clipboard.writeText(msg); copiado = true; } catch (_) {}
    const aba = window.open(L.discord, "_blank");
    if (aba) aba.opener = null; else window.location.href = L.discord;
    toast(copiado ? "Pedido copiado! Cole no Discord." : "Abra o Discord e informe seu pedido.");
    closeLayer(modal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !termsBox.hidden) { fecharTermos(); return; }
    if (e.key === "Escape") { if (lb.classList.contains("is-open")) closeLayer(lb); else if (modal.classList.contains("is-open")) closeLayer(modal); }
    if (lb.classList.contains("is-open")) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); }
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

})();
