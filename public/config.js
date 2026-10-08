// =====================================================================
//  CONFIGURAÇÃO DA LOJA — edite aqui preços, links e conteúdos.
//  preco: null  → o card mostra "Consultar".
// =====================================================================
window.LOJA = {
  nome: "Teixeira Mods",
  discord: "https://discord.gg/CtW7Us5WNz", // suporte

  // Pagamento Pix via CashinPay (código em /api; ver README.md)
  pagamento: {
    endpoint: "/api/pagamento", // POST cria o Pix · GET ?id= consulta o status
    intervaloStatus: 4000,      // ms entre cada consulta de status
  },

  // Pacotes (conteúdo em PDF, ver termos). "meta" e "sub" são metas de progressão mostradas no card (não itens entregues).
  planos: [
    {
      id: "iniciante", nome: "Pacote Iniciante", cor: "green", preco: 24.9, meta: "30", sub: "Meta: 30 mi e Level 90",
      desc: "Para quem está começando: a rota para os primeiros milhões e os primeiros levels usando as atividades do jogo.",
      itens: ["Rota para juntar 30 milhões", "Rota para chegar ao Level 90", "Como montar 5 carros personalizados", "Como montar 5 trajes", "Como criar sua corrida", "Checklist de progresso"],
    },
    {
      id: "basico", nome: "Pacote Básico", cor: "blue", preco: 34.9, meta: "100", sub: "Meta: 100 mi e Level 150",
      desc: "Para expandir os ganhos: rota financeira com negócios, evolução de level e primeiro apartamento de luxo.",
      itens: ["Rota para juntar 100 milhões", "Rota para chegar ao Level 150", "Como comprar um apartamento de luxo", "Como montar 8 carros personalizados", "Como montar 8 trajes", "Como criar sua corrida", "Checklist de progresso"],
    },
    {
      id: "executivo", nome: "Pacote Executivo", cor: "orange", preco: 49.9, meta: "200", sub: "Meta: 200 mi e Level 250", destaque: "Mais vendido",
      desc: "Para acelerar: construção de capital com empresas, reinvestimento e evolução até o Level 250.",
      itens: ["Rota para juntar 200 milhões", "Rota para chegar ao Level 250", "Apartamentos e empresas principais", "Como montar 12 carros personalizados", "Como montar 12 trajes", "Como criar sua corrida", "Checklist de progresso"],
    },
    {
      id: "mafioso", nome: "Pacote Mafioso", cor: "red", preco: 64.9, meta: "350", sub: "Meta: 350 mi e Level 400",
      desc: "Para montar um império: estratégia de patrimônio com todas as empresas e grande parte das propriedades.",
      itens: ["Rota para juntar 350 milhões", "Rota para chegar ao Level 400", "Estratégia para todas as empresas", "Como adquirir grande parte das propriedades", "Como montar 16 carros personalizados", "Como montar 16 trajes", "Desbloqueios e corrida", "Checklist de progresso"],
    },
    {
      id: "elite", nome: "Pacote Elite", cor: "purple", preco: 79.9, meta: "500", sub: "Meta: 500 mi e todas as propriedades", destaque: "Completo",
      desc: "O plano de longo prazo mais completo: patrimônio, propriedades, desbloqueios, coleção de carros e trajes.",
      itens: ["Rota de longo prazo para 500 milhões", "Como adquirir todas as propriedades", "Level e desbloqueios", "Como montar 20 carros personalizados", "Como montar 20 trajes", "Como criar sua corrida", "Conferência e checklist final"],
    },
  ],

  trajes: [
    { id: "trajes-5", qtd: 5, preco: 10.9, destaque: null,
      desc: "Passo a passo para montar e salvar 5 visuais com as peças da sua conta. Ideal para renovar o personagem." },
    { id: "trajes-10", qtd: 10, preco: 17.9, destaque: null,
      desc: "Metodologia para montar 10 visuais diferentes, um para cada ocasião, com checklist de cada traje." },
    { id: "trajes-20", qtd: 20, preco: 24.9, destaque: "Melhor custo",
      desc: "O pacote mais completo: 20 visuais em estilos diferentes, do casual ao temático, com checklist." },
  ],
};
