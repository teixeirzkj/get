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

  // Base de preço do /admin: quanto de cada pacote vale cada parte (soma = 1).
  // Ex.: 200 mi sozinhos = 40% do preço do pacote de 200 mi. Montar igual a um pacote dá o preço dele.
  basePreco: { dinheiro: 0.40, level: 0.20, carros: 0.15, trajes: 0.15, extras: 0.10 },

  // Opcional no checkout, somado ao pacote. O que inclui está nos termos (item "Adicional de suporte").
  adicional: { nome: "Adicional de suporte", preco: 15 },

  // Pacotes (conteúdo em PDF, ver termos). "meta" e "sub" são metas de progressão mostradas no card (não itens entregues).
  planos: [
    {
      id: "iniciante", nome: "Pacote Iniciante", cor: "green", preco: 24.9, meta: "30", level: 90, carros: 5, trajes: 5, sub: "Meta: 30 mi e Level 90",
      desc: "Para quem está começando: os primeiros milhões e os primeiros levels usando as atividades do jogo.",
      itens: ["30 milhões", "Level 90", "5 carros personalizados", "5 trajes", "Corrida personalizada", "Checklist de progresso"],
    },
    {
      id: "basico", nome: "Pacote Básico", cor: "blue", preco: 34.9, meta: "100", level: 150, carros: 8, trajes: 8, sub: "Meta: 100 mi e Level 150",
      desc: "Para expandir os ganhos: negócios, evolução de level e primeiro apartamento de luxo.",
      itens: ["100 milhões", "Level 150", "Apartamento de luxo", "8 carros personalizados", "8 trajes", "Corrida personalizada", "Checklist de progresso"],
    },
    {
      id: "executivo", nome: "Pacote Executivo", cor: "orange", preco: 49.9, meta: "200", level: 250, carros: 12, trajes: 12, sub: "Meta: 200 mi e Level 250", destaque: "Mais vendido",
      desc: "Para acelerar: construção de capital com empresas, reinvestimento e evolução até o Level 250.",
      itens: ["200 milhões", "Level 250", "Apartamentos e empresas principais", "12 carros personalizados", "12 trajes", "Corrida personalizada", "Checklist de progresso"],
    },
    {
      id: "mafioso", nome: "Pacote Mafioso", cor: "red", preco: 64.9, meta: "350", level: 400, carros: 16, trajes: 16, sub: "Meta: 350 mi e Level 400",
      desc: "Para montar um império: patrimônio com todas as empresas e grande parte das propriedades.",
      itens: ["350 milhões", "Level 400", "Todas as empresas", "Grande parte das propriedades", "16 carros personalizados", "16 trajes", "Desbloqueios e corrida", "Checklist de progresso"],
    },
    {
      id: "elite", nome: "Pacote Elite", cor: "purple", preco: 79.9, meta: "500", level: null, carros: 20, trajes: 20, sub: "Meta: 500 mi e todas as propriedades", destaque: "Completo",
      desc: "O pacote mais completo: patrimônio, propriedades, desbloqueios, coleção de carros e trajes.",
      itens: ["500 milhões", "Todas as propriedades", "Level e desbloqueios", "20 carros personalizados", "20 trajes", "Corrida personalizada", "Checklist final"],
    },
  ],

  trajes: [
    { id: "trajes-5", qtd: 5, preco: 10.9, destaque: null,
      desc: "5 visuais com as peças da sua conta. Ideal para renovar o personagem." },
    { id: "trajes-10", qtd: 10, preco: 17.9, destaque: null,
      desc: "10 visuais diferentes, um para cada ocasião, com checklist de cada traje." },
    { id: "trajes-20", qtd: 20, preco: 24.9, destaque: "Melhor custo",
      desc: "O pacote mais completo: 20 visuais em estilos diferentes, do casual ao temático, com checklist." },
  ],
};
