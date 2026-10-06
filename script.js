(() => {
  const L = window.LOJA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- links ---------- */
  $$(".js-discord").forEach((a) => (a.href = L.discord));
  $("#year").textContent = new Date().getFullYear();

  /* ---------- planos ---------- */
  $("#plans").innerHTML = L.planos.map((p, i) => {
    const [valor, unidade] = p.itens[0].split(" ");
    return `
    <article class="plan plan--${p.cor} reveal${p.destaque ? " is-featured" : ""}" style="--d:${i * 0.07}s" data-tilt>
      ${p.destaque ? `<span class="plan__badge">${esc(p.destaque)}</span>` : ""}
      <div class="plan__tier"><i></i>${esc(p.nome.replace("Plano ", ""))}</div>
      <div class="plan__money">${esc(valor)}<small>${esc(unidade || "")}</small></div>
      <p class="plan__desc">${esc(p.desc)}</p>
      <ul class="plan__list">${p.itens.slice(1).map((it) => `<li>${esc(it)}</li>`).join("")}</ul>
      <div class="plan__price">${p.preco != null ? `<b>${brl(p.preco)}</b><span>via Pix</span>` : `<b>Consultar</b><span>no Discord</span>`}</div>
      <button class="btn" data-order="plano:${p.id}">Quero esse</button>
    </article>`;
  }).join("");

  /* ---------- trajes ---------- */
  $("#outfits").innerHTML = L.trajes.map((t, i) => `
    <article class="outfit reveal${t.destaque ? " is-featured" : ""}" style="--d:${i * 0.08}s">
      ${t.destaque ? `<span class="plan__badge">${esc(t.destaque)}</span>` : ""}
      <div class="outfit__icon" aria-hidden="true">${t.icone}</div>
      <div class="outfit__qty">${t.qtd}<small>trajes</small></div>
      <span class="outfit__unit">${brl(t.preco / t.qtd)} por traje</span>
      <p>${esc(t.desc)}</p>
      <div class="outfit__foot"><b>${brl(t.preco)}</b><button class="btn btn--primary btn--sm" data-order="traje:${t.id}">Comprar</button></div>
    </article>`).join("");

  /* ---------- entregas ---------- */
  const shotTags = (e) => [
    `<span class="tag tag--plat">${esc(e.plataforma)}</span>`,
    e.dinheiro ? `<span class="tag tag--money">💰 ${esc(e.dinheiro)}</span>` : "",
    e.nivel ? `<span class="tag">⭐ Lvl ${e.nivel}</span>` : "",
  ].join("");

  $("#gallery").innerHTML = L.entregas.map((e, i) => `
    <button class="shot reveal" data-i="${i}" data-plat="${esc(e.plataforma)}" style="--d:${(i % 3) * 0.06}s" aria-label="Ampliar entrega ${esc(e.pacote)} — ${esc(e.plataforma)}">
      <img src="assets/entregas/e${e.img}-thumb.webp" alt="Entrega ${esc(e.pacote)} na ${esc(e.plataforma)}" loading="lazy" decoding="async" />
      <span class="shot__info"><span class="shot__title">${esc(e.pacote)}</span>${shotTags(e)}</span>
    </button>`).join("");

  const plats = ["Todas", ...new Set(L.entregas.map((e) => e.plataforma))];
  $("#filters").innerHTML = plats.map((p, i) => {
    const n = p === "Todas" ? L.entregas.length : L.entregas.filter((e) => e.plataforma === p).length;
    return `<button class="chip" role="tab" aria-selected="${i === 0}" data-f="${esc(p)}">${esc(p)}<small>${n}</small></button>`;
  }).join("");
  $("#filters").addEventListener("click", (ev) => {
    const b = ev.target.closest(".chip"); if (!b) return;
    $$(".chip").forEach((c) => c.setAttribute("aria-selected", c === b));
    const f = b.dataset.f;
    $$(".shot").forEach((s) => {
      const show = f === "Todas" || s.dataset.plat === f;
      s.classList.toggle("is-hidden", !show);
      if (show) s.classList.add("is-in");
    });
  });

  /* ---------- lightbox ---------- */
  const lb = $("#lightbox");
  let cur = 0;
  const visible = () => $$(".shot:not(.is-hidden)").map((s) => +s.dataset.i);
  const showLb = (i) => {
    cur = i; const e = L.entregas[i];
    $("#lbImg").src = `assets/entregas/e${e.img}.webp`;
    $("#lbImg").alt = `Entrega ${e.pacote} — ${e.plataforma}`;
    $("#lbCap").innerHTML = `<span class="tag">${esc(e.pacote)}</span>${shotTags(e)}${e.data ? `<span class="tag">📅 ${esc(e.data)}</span>` : ""}`;
  };
  const step = (d) => { const v = visible(); const k = v.indexOf(cur); showLb(v[(k + d + v.length) % v.length]); };
  $("#gallery").addEventListener("click", (ev) => {
    const s = ev.target.closest(".shot"); if (!s) return;
    showLb(+s.dataset.i); openLayer(lb);
  });
  lb.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-lb-prev]")) step(-1);
    else if (ev.target.closest("[data-lb-next]")) step(1);
    else if (ev.target.closest("[data-lb-close]") || ev.target === lb) closeLayer(lb);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); tx = null; });

  /* ---------- avaliações ---------- */
  const palette = ["#39ff88", "#3ba8ff", "#ff9f2e", "#b26bff", "#ff4d5e", "#ffc93c"];
  const reviewHTML = (r, i, clone) => `
    <article class="review"${clone ? ' data-clone aria-hidden="true"' : ""}>
      <div class="review__head">
        <span class="review__avatar" style="background:${palette[i % palette.length]}">${esc(r.user[0].toUpperCase())}</span>
        <div><div class="review__user">${esc(r.user)}</div><div class="review__date">${esc(r.data || "")}</div></div>
      </div>
      <div class="stars" aria-label="5 de 5 estrelas">★★★★★</div>
      <p class="review__text${r.texto ? "" : " review__text--empty"}">${r.texto ? `“${esc(r.texto)}”` : "Avaliou a compra em 5 estrelas"}</p>
      ${r.produto ? `<div class="review__prod">Produto: <b>${esc(r.produto)}</b></div>` : ""}
    </article>`;
  $("#reviews").innerHTML = L.avaliacoes.map((r, i) => reviewHTML(r, i)).join("") + L.avaliacoes.map((r, i) => reviewHTML(r, i, true)).join("");

  /* ---------- faq ---------- */
  $("#faqList").innerHTML = L.faq.map((f, i) => `
    <details class="reveal" style="--d:${i * 0.05}s"><summary>${esc(f.q)}</summary><div class="faq__a"><p>${esc(f.a)}</p></div></details>`).join("");
  $("#faqList").addEventListener("toggle", (e) => {
    if (!e.target.open) return;
    $$("#faqList details").forEach((d) => d !== e.target && (d.open = false));
  }, true);

  /* ---------- modal / pedido ---------- */
  const modal = $("#orderModal");
  let pedido = null;
  let lastFocus = null;

  function openLayer(el) {
    lastFocus = document.activeElement;
    el.classList.add("is-open"); el.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => (el.querySelector("select, [data-close], [data-lb-close]") || el).focus(), 50);
  }
  function closeLayer(el) {
    el.classList.remove("is-open"); el.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus && lastFocus.focus();
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-order]"); if (!b) return;
    const [tipo, id] = b.dataset.order.split(":");
    if (tipo === "plano") {
      const p = L.planos.find((x) => x.id === id);
      pedido = { nome: p.nome, preco: p.preco, itens: p.itens };
    } else {
      const t = L.trajes.find((x) => x.id === id);
      pedido = { nome: `Pacote ${t.qtd} Trajes`, preco: t.preco, itens: [`${t.qtd} Trajes Modded`, "Masculino ou feminino"] };
    }
    $("#orderTitle").textContent = pedido.nome;
    $("#orderPrice").textContent = pedido.preco != null ? `${brl(pedido.preco)} · Pix` : "Valor sob consulta";
    $("#orderItems").innerHTML = pedido.itens.map((i) => `<li>${esc(i)}</li>`).join("");
    openLayer(modal);
  });
  modal.addEventListener("click", (ev) => { if (ev.target.closest("[data-close]")) closeLayer(modal); });

  $("#orderSend").addEventListener("click", async () => {
    const plat = $("#orderPlatform").value;
    const nick = $("#orderNick").value.trim();
    const msg = [
      "🚀 Novo pedido — Teixeira Mods",
      `📦 Pacote: ${pedido.nome}`,
      `💵 Valor: ${pedido.preco != null ? brl(pedido.preco) : "a consultar"}`,
      `🎮 Plataforma: ${plat}`,
      nick ? `👤 Discord: ${nick}` : null,
      `✅ Itens: ${pedido.itens.join(", ")}`,
    ].filter(Boolean).join("\n");
    let copied = false;
    try { await navigator.clipboard.writeText(msg); copied = true; } catch (_) {}
    toast(copied ? "Pedido copiado! Cole no ticket do Discord." : "Abra um ticket no Discord e informe seu pedido.");
    window.open(L.discord, "_blank", "noopener");
    closeLayer(modal);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { modal.classList.contains("is-open") && closeLayer(modal); lb.classList.contains("is-open") && closeLayer(lb); }
    if (lb.classList.contains("is-open")) { if (e.key === "ArrowRight") step(1); if (e.key === "ArrowLeft") step(-1); }
  });

  let toastT;
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("is-show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("is-show"), 3200); }

  /* ---------- nav ---------- */
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
    nav.classList.toggle("is-scrolled", y > 30);
    if (!reduce && heroImg && y < window.innerHeight) heroImg.style.transform = `scale(1.12) translateY(${y * 0.18}px)`;
    let id = "";
    sections.forEach((s) => { if (s.offsetTop - 140 <= y) id = s.id; });
    links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    ticking = false;
  };
  window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- reveal + contadores ---------- */
  const countUp = (el) => {
    const to = +el.dataset.to; const plain = el.dataset.fmt === "plain";
    const fmt = (n) => (plain ? String(n) : n.toLocaleString("pt-BR"));
    if (reduce) { el.textContent = fmt(to); return; }
    const dur = 1600; const t0 = performance.now();
    const tick = (t) => { const p = Math.min(1, (t - t0) / dur); const e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      $$(".count", en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal, .step").forEach((el) => io.observe(el));

  /* ---------- tilt + spotlight nos planos ---------- */
  if (!reduce && window.matchMedia("(hover: hover)").matches) {
    $$("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", `${x * 100}%`); card.style.setProperty("--my", `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateY(-6px)`;
      });
      card.addEventListener("pointerleave", () => (card.style.transform = ""));
    });
    const glow = $(".cursor-glow");
    window.addEventListener("pointermove", (e) => (glow.style.transform = `translate(${e.clientX - 260}px, ${e.clientY - 260}px)`), { passive: true });
  }
})();
