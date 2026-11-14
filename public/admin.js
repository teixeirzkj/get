(() => {
  const L = window.LOJA;
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // senha lembrada só nesta aba do navegador
  try { $("#senha").value = sessionStorage.getItem("tm_admin") || ""; } catch (_) {}
  const lembrarSenha = () => { try { sessionStorage.setItem("tm_admin", $("#senha").value); } catch (_) {} };

  /* abas */
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => { t.classList.toggle("is-on", t === b); t.setAttribute("aria-selected", t === b); });
    document.querySelectorAll(".aba").forEach((a) => (a.hidden = a.dataset.aba !== b.dataset.aba));
  }));

  /* arquivo entregue: PDF de um pacote existente ou guia sob medida pelo suporte */
  $("#arquivo").innerHTML =
    `<option value="suporte">Guia sob medida (envio pelo Discord)</option>` +
    L.planos.map((p) => `<option value="${p.id}">PDF do ${esc(p.nome)}</option>`).join("") +
    L.trajes.map((t) => `<option value="${t.id}">PDF de ${t.qtd} Trajes</option>`).join("");

  /* tabela de referência */
  $("#ref").innerHTML =
    L.planos.map((p) => `<tr><td>${esc(p.nome)}</td><td>${p.meta} mi${p.level ? ` · Lv ${p.level}` : ""} · ${p.carros}c/${p.trajes}t</td><td>${brl(p.preco)}</td></tr>`).join("") +
    L.trajes.map((t) => `<tr><td>${t.qtd} Trajes</td><td>${t.qtd} trajes</td><td>${brl(t.preco)}</td></tr>`).join("");

  /* base de preço: cada parte vale uma fração (config basePreco) do preço do pacote equivalente,
     achado por interpolação linear entre os pacotes atuais */
  const interp = (pts, x) => {
    if (!(x > 0)) return 0;
    pts = [...pts].sort((a, b) => a[0] - b[0]);
    let i = pts.findIndex((p) => p[0] >= x);
    if (i === -1) i = pts.length - 1;       // acima do maior: segue a última inclinação
    if (i === 0) i = 1;                      // abaixo do menor: segue a primeira inclinação
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return Math.max(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0), 0);
  };
  const pesos = L.basePreco || { dinheiro: 0.4, level: 0.2, carros: 0.15, trajes: 0.15, extras: 0.1 };
  const pontos = (campo) => L.planos.filter((p) => p[campo] != null).map((p) => [Number(p[campo]), p.preco]);
  const ptsMi = pontos("meta"), ptsLevel = pontos("level"), ptsCarros = pontos("carros"), ptsTrajes = pontos("trajes");
  const num = (sel) => Math.max(parseFloat($(sel).value) || 0, 0);
  let sugestao = 0;
  function calcular() {
    const mi = num("#cMi"), level = num("#cLevel"), carros = num("#cCarros"), trajes = num("#cTrajes");
    const partes = [
      ["Dinheiro", interp(ptsMi, mi) * pesos.dinheiro],
      ["Level", interp(ptsLevel, level) * pesos.level],
      ["Carros", interp(ptsCarros, carros) * pesos.carros],
      ["Trajes", interp(ptsTrajes, trajes) * pesos.trajes],
      ["Empresas/propriedades/corrida", $("#cExtras").checked ? interp(ptsMi, mi || Number(L.planos[0].meta)) * pesos.extras : 0],
    ].filter(([, v]) => v > 0);
    sugestao = Math.round(partes.reduce((s, [, v]) => s + v, 0) * 100) / 100;
    $("#cParts").innerHTML = partes.map(([n, v]) => `<tr><td>${n}</td><td>${brl(v)}</td></tr>`).join("");
    $("#cTotal").textContent = brl(sugestao);
  }
  ["#cMi", "#cLevel", "#cCarros", "#cTrajes", "#cExtras"].forEach((s) => $(s).addEventListener("input", calcular));
  $("#usar").addEventListener("click", () => {
    if (!sugestao) return;
    $("#preco").value = Math.max(Math.ceil(sugestao) - 0.1, 5).toFixed(2); // arredonda para ,90
    previa();
  });
  calcular();

  /* prévia do que o cliente vai ver */
  const itens = () => $("#itens").value.split("\n").map((s) => s.trim()).filter(Boolean);
  function previa() {
    $("#pvTitulo").textContent = $("#titulo").value.trim() || "—";
    $("#pvItens").innerHTML = itens().map((i) => `<li>${esc(i)}</li>`).join("");
    const p = parseFloat($("#preco").value);
    $("#pvPreco").textContent = p > 0 ? brl(p) : "";
  }
  ["#titulo", "#itens", "#preco"].forEach((s) => $(s).addEventListener("input", previa));

  /* gerar link */
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#err"), btn = $("#gerar");
    err.textContent = "";
    $("#out").hidden = true;
    btn.disabled = true; btn.textContent = "Gerando…";
    try {
      const r = await fetch("/api/personalizado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senha: $("#senha").value,
          titulo: $("#titulo").value,
          descricao: $("#descricao").value,
          itens: itens(),
          preco: parseFloat($("#preco").value),
          arquivo: $("#arquivo").value,
          validadeDias: parseInt($("#validade").value, 10),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || `Erro ${r.status}`);
      lembrarSenha();
      const url = location.origin + j.url;
      $("#link").value = url;
      $("#abrir").href = url;
      $("#out").hidden = false;
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false; btn.textContent = "Gerar link do cliente";
    }
  });

  /* =========================================================
     EDITAR LOJA: monta o formulário a partir do config.js atual
     ========================================================= */
  const v = (x) => (x == null ? "" : esc(x));
  const pesoNomes = { dinheiro: "Dinheiro", level: "Level", carros: "Carros", trajes: "Trajes", extras: "Extras" };
  $("#eDiscord").value = L.discord || "";
  $("#eAdNome").value = (L.adicional && L.adicional.nome) || "";
  $("#eAdPreco").value = (L.adicional && L.adicional.preco) || "";
  $("#ePesos").innerHTML = Object.keys(pesoNomes).map((k) =>
    `<label class="field"><span>${pesoNomes[k]} %</span><input type="number" min="0" max="100" step="1" data-peso="${k}" value="${Math.round(((L.basePreco || {})[k] || 0) * 100)}" inputmode="numeric" /></label>`).join("");

  $("#ePlanos").innerHTML = L.planos.map((p) => `
    <section class="box" data-plano="${p.id}">
      <h2>${esc(p.nome)}</h2>
      <div class="ed__grid ed__grid--2">
        <label class="field"><span>Nome</span><input data-k="nome" type="text" maxlength="40" value="${v(p.nome)}" /></label>
        <label class="field"><span>Preço (R$)</span><input data-k="preco" type="number" min="1" step="0.01" value="${v(p.preco)}" inputmode="decimal" /></label>
        <label class="field"><span>Destaque</span><input data-k="destaque" type="text" maxlength="20" placeholder="ex.: Mais vendido" value="${v(p.destaque)}" /></label>
      </div>
      <div class="ed__grid">
        <label class="field"><span>Meta (mi)</span><input data-k="meta" type="number" min="0" value="${v(p.meta)}" inputmode="numeric" /></label>
        <label class="field"><span>Level</span><input data-k="level" type="number" min="0" placeholder="sem level" value="${v(p.level)}" inputmode="numeric" /></label>
        <label class="field"><span>Carros</span><input data-k="carros" type="number" min="0" value="${v(p.carros)}" inputmode="numeric" /></label>
        <label class="field"><span>Trajes</span><input data-k="trajes" type="number" min="0" value="${v(p.trajes)}" inputmode="numeric" /></label>
      </div>
      <label class="field"><span>Texto do card <small>(abaixo do número)</small></span><input data-k="sub" type="text" maxlength="80" value="${v(p.sub)}" /></label>
      <label class="field"><span>Descrição</span><input data-k="desc" type="text" maxlength="300" value="${v(p.desc)}" /></label>
      <label class="field"><span>Itens <small>(um por linha)</small></span><textarea data-k="itens">${esc((p.itens || []).join("\n"))}</textarea></label>
    </section>`).join("");

  $("#eTrajes").innerHTML = `<section class="box"><h2>Trajes</h2>` + L.trajes.map((t) => `
      <div data-traje="${t.id}">
        <div class="ed__grid">
          <label class="field"><span>Quantidade</span><input data-k="qtd" type="number" min="1" value="${v(t.qtd)}" inputmode="numeric" /></label>
          <label class="field"><span>Preço (R$)</span><input data-k="preco" type="number" min="1" step="0.01" value="${v(t.preco)}" inputmode="decimal" /></label>
          <label class="field" style="grid-column: span 2"><span>Destaque</span><input data-k="destaque" type="text" maxlength="20" value="${v(t.destaque)}" /></label>
        </div>
        <label class="field"><span>Descrição</span><input data-k="desc" type="text" maxlength="300" value="${v(t.desc)}" /></label>
      </div>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:8px 0 18px" />') + "</section>";

  const campo = (el, k) => el.querySelector(`[data-k="${k}"]`).value;
  $("#loja").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#eErr"), ok = $("#eOk"), btn = $("#salvar");
    err.textContent = ""; ok.textContent = "";
    const basePreco = {};
    document.querySelectorAll("[data-peso]").forEach((i) => (basePreco[i.dataset.peso] = (parseFloat(i.value) || 0) / 100));
    const somaPesos = Math.round(Object.values(basePreco).reduce((s, x) => s + x, 0) * 100);
    if (somaPesos !== 100) { err.textContent = `Base de preço soma ${somaPesos}%, precisa somar 100%.`; return; }
    const dados = {
      discord: $("#eDiscord").value,
      adicional: { nome: $("#eAdNome").value, preco: parseFloat($("#eAdPreco").value) },
      basePreco,
      planos: [...document.querySelectorAll("[data-plano]")].map((el) => ({
        id: el.dataset.plano,
        nome: campo(el, "nome"), preco: campo(el, "preco"), destaque: campo(el, "destaque"),
        meta: campo(el, "meta"), level: campo(el, "level"), carros: campo(el, "carros"), trajes: campo(el, "trajes"),
        sub: campo(el, "sub"), desc: campo(el, "desc"),
        itens: campo(el, "itens").split("\n").map((s) => s.trim()).filter(Boolean),
      })),
      trajes: [...document.querySelectorAll("[data-traje]")].map((el) => ({
        id: el.dataset.traje, qtd: campo(el, "qtd"), preco: campo(el, "preco"), destaque: campo(el, "destaque"), desc: campo(el, "desc"),
      })),
    };
    btn.disabled = true; btn.textContent = "Salvando…";
    try {
      const r = await fetch("/api/loja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senha: $("#senha").value, dados }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || `Erro ${r.status}`);
      lembrarSenha();
      ok.textContent = j.semMudanca ? "Nada mudou." : "Salvo! O site atualiza em cerca de 1 minuto.";
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      btn.disabled = false; btn.textContent = "Salvar alterações";
    }
  });

  $("#copiar").addEventListener("click", async () => {
    const v = $("#link").value;
    try { await navigator.clipboard.writeText(v); } catch (_) { $("#link").select(); document.execCommand("copy"); }
    $("#copiar").textContent = "Copiado";
    setTimeout(() => ($("#copiar").textContent = "Copiar"), 2000);
  });
})();
