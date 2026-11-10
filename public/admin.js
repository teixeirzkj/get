(() => {
  const L = window.LOJA;
  const $ = (s) => document.querySelector(s);
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // senha lembrada só nesta aba
  try { $("#senha").value = sessionStorage.getItem("tm_admin") || ""; } catch (_) {}

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
      try { sessionStorage.setItem("tm_admin", $("#senha").value); } catch (_) {}
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

  $("#copiar").addEventListener("click", async () => {
    const v = $("#link").value;
    try { await navigator.clipboard.writeText(v); } catch (_) { $("#link").select(); document.execCommand("copy"); }
    $("#copiar").textContent = "Copiado";
    setTimeout(() => ($("#copiar").textContent = "Copiar"), 2000);
  });
})();
