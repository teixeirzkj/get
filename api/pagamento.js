// POST /api/pagamento     → cria a cobrança Pix na CashinPay
// GET  /api/pagamento?id= → consulta o status (e libera o download quando pago)
const { produtos, cashinpay, novoId, produtoDoId, linkDownload, mesmoValor, valorDe } = require("./_lib");

const PLATAFORMAS = ["Steam", "Epic Games", "Rockstar Launcher", "Xbox App (PC)", "Xbox Series / One", "PS5"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "POST") return await criar(req, res);
    if (req.method === "GET") return await consultar(req, res);
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "Método não permitido" });
  } catch (e) {
    console.error("[pagamento]", e.status, e.code, e.message);
    if (e.code === "nao_configurado") return res.status(503).json({ erro: "Pagamento indisponível no momento. Chame o suporte no Discord.", code: e.code });
    // erros de validação da CashinPay (4xx) podem ser mostrados ao cliente
    if (e.status >= 400 && e.status < 500 && e.status !== 401 && e.status !== 403) return res.status(400).json({ erro: e.message });
    return res.status(502).json({ erro: "Não foi possível processar o pagamento agora. Tente novamente." });
  }
};

const soDigitos = (v) => String(v || "").replace(/\D/g, "");

function cpfValido(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +cpf[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +cpf[t]) return false;
  }
  return true;
}

async function criar(req, res) {
  const b = req.body || {};
  const item = produtos()[b.produto];
  const nick = String(b.nick || "").trim().slice(0, 40);
  const nome = String(b.nome || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 120);
  const telefone = soDigitos(b.telefone);
  const cpf = soDigitos(b.cpf);

  if (!item) return res.status(400).json({ erro: "Produto inválido." });
  if (!PLATAFORMAS.includes(b.plataforma)) return res.status(400).json({ erro: "Selecione uma plataforma válida." });
  if (nick.length < 2) return res.status(400).json({ erro: "Informe o seu nick." });
  if (nome.split(" ").length < 2) return res.status(400).json({ erro: "Informe nome e sobrenome." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ erro: "Informe um e-mail válido." });
  if (telefone.length < 10 || telefone.length > 13) return res.status(400).json({ erro: "Informe um telefone válido com DDD." });
  if (!cpfValido(cpf)) return res.status(400).json({ erro: "Informe um CPF válido." });
  if (b.aceiteTermos !== true) return res.status(400).json({ erro: "É preciso aceitar os termos." });

  const id = novoId(b.produto);
  const tx = await cashinpay("POST", "/transactions", {
    amount: item.preco, // preço sempre do servidor
    transaction_id: id,
    description: `Teixeira Mods | ${item.nome} | ${b.plataforma} | ${nick}`.slice(0, 140),
    customer: { name: nome, email, phone: telefone, document: cpf },
  });

  const pix = tx.pix || {};
  return res.status(200).json({
    id, // consultas usam o nosso transaction_id
    copiaECola: pix.copy_paste || pix.qrcode,
    valor: valorDe(tx.amount) ?? item.preco,
  });
}

async function consultar(req, res) {
  const id = String((req.query || {}).id || "");
  const produto = produtoDoId(id);
  const item = produto && produtos()[produto];
  if (!item) return res.status(400).json({ erro: "Consulta inválida." });

  const tx = await cashinpay("GET", `/transactions/${encodeURIComponent(id)}`);

  if (tx.status === "paid") {
    // confere se o valor pago é o do produto
    if (!mesmoValor(valorDe(tx.amount), item.preco)) return res.status(403).json({ erro: "Pagamento não corresponde ao produto." });
    return res.status(200).json({ status: "paid", downloadUrl: linkDownload(produto) });
  }
  if (tx.status === "expired" || tx.status === "cancelled") return res.status(200).json({ status: "expired" });
  return res.status(200).json({ status: "pending" });
}
