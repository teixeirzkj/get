// =====================================================================
//  CONFIGURAÇÃO DA LOJA — edite aqui preços, links e conteúdos.
//  preco: null  → o card mostra "Consultar".
// =====================================================================
window.LOJA = {
  nome: "Teixeira Mods",
  discord: "https://discord.gg/CtW7Us5WNz", // suporte

  planos: [
    {
      id: "iniciante", nome: "Plano Iniciante", cor: "green", preco: 24.9,
      desc: "Ideal para quem está começando e quer dar os primeiros passos com mais recursos e praticidade.",
      itens: ["30 Milhões", "Level 90", "5 Trajes Modded", "5 Carros Modded", "Corrida Modded"],
    },
    {
      id: "basico", nome: "Plano Básico", cor: "blue", preco: 34.9,
      desc: "Uma opção equilibrada para jogadores que desejam expandir seus ganhos e desbloquear novas possibilidades.",
      itens: ["100 Milhões", "Level 150", "8 Trajes Modded", "8 Carros Modded", "Corrida Modded", "Apartamento de Luxo"],
    },
    {
      id: "executivo", nome: "Plano Executivo", cor: "orange", preco: 49.9, destaque: "Mais vendido",
      desc: "Pensado para quem busca uma evolução mais rápida, com benefícios superiores e maior poder de investimento.",
      itens: ["200 Milhões", "Level 250", "12 Trajes Modded", "12 Carros Modded", "Corrida Modded", "Apartamentos e Empresas Principais", "Recursos Exclusivos"],
    },
    {
      id: "mafioso", nome: "Plano Mafioso", cor: "red", preco: 64.9,
      desc: "Para quem quer dominar as ruas de Los Santos com recursos avançados e uma estrutura muito mais completa.",
      itens: ["350 Milhões", "Level 400", "16 Trajes Modded", "16 Carros Modded", "Corrida Modded", "Todas as Empresas", "Grande Parte das Propriedades", "Recursos Exclusivos", "Unlocks Avançados"],
    },
    {
      id: "elite", nome: "Plano Elite", cor: "purple", preco: 79.9, destaque: "Completo",
      desc: "A experiência definitiva. O plano mais completo para alcançar o mais alto nível de progresso.",
      itens: ["500 Milhões", "Todas as Propriedades", "Level Opcional", "Unlock All", "Recursos Exclusivos", "20 Trajes Modded", "20 Carros Modded", "Corrida Modded"],
    },
  ],

  trajes: [
    { id: "trajes-5", qtd: 5, preco: 10.9, icone: "👔",
      desc: "O ponto de entrada perfeito pra quem quer renovar o visual sem gastar muito. Variedade suficiente pra parar de aparecer sempre igual em Los Santos." },
    { id: "trajes-10", qtd: 10, preco: 17.9, icone: "🧥",
      desc: "O equilíbrio certo entre variedade e preço. Um visual para cada missão, cada roleplay, cada ocasião — mais barato por traje." },
    { id: "trajes-20", qtd: 20, preco: 24.9, icone: "👑", destaque: "Melhor custo",
      desc: "Para quem leva o visual a sério. O maior pacote, o menor custo por traje e a variedade máxima disponível." },
  ],

  // Prints de entregas (assets/entregas/eN.webp)
  entregas: [
    { img: 23, plataforma: "Rockstar", pacote: "Mafioso + 500 Milhões", nivel: 2000, dinheiro: "50 Mi (+950 Mi)", data: "09/01/2026" },
    { img: 25, plataforma: "PS5", pacote: "Executivo", nivel: 311, dinheiro: "104 Mi", data: "14/01/2026" },
    { img: 14, plataforma: "PS5", pacote: "Pacote Completo", nivel: 297, dinheiro: "106 Mi", data: "05/01/2026" },
    { img: 13, plataforma: "Steam", pacote: "Dinheiro + Level", nivel: 157, dinheiro: "150 Mi", data: "04/01/2026" },
    { img: 27, plataforma: "Xbox", pacote: "Iniciante", nivel: 100, dinheiro: "90 Mi", data: "18/01/2026" },
    { img: 11, plataforma: "Epic", pacote: "10 Carros + 1 Traje", nivel: 92, dinheiro: "120 Mi", data: "03/01/2026" },
    { img: 24, plataforma: "Xbox", pacote: "Executivo", nivel: 306, dinheiro: "70 Mi", data: "09/01/2026" },
    { img: 15, plataforma: "Epic", pacote: "Pacote Completo", nivel: 141, dinheiro: "105 Mi", data: "05/01/2026" },
    { img: 16, plataforma: "Steam", pacote: "Roupas e Carros", nivel: 778, dinheiro: null, data: "05/01/2026" },
    { img: 9, plataforma: "Steam", pacote: "Carros + Roupas Modded", nivel: 287, dinheiro: "106 Mi", data: "31/12/2025" },
    { img: 22, plataforma: "Epic", pacote: "Executivo", nivel: 293, dinheiro: "50 Mi", data: "09/01/2026" },
    { img: 21, plataforma: "Xbox", pacote: "Executivo", nivel: 301, dinheiro: "50 Mi", data: "08/01/2026" },
    { img: 18, plataforma: "PS5", pacote: "Executivo", nivel: 301, dinheiro: "25 Mi", data: "07/01/2026" },
    { img: 10, plataforma: "Epic", pacote: "3 Trajes + Corrida", nivel: 254, dinheiro: "106 Mi", data: "02/01/2026" },
    { img: 17, plataforma: "Steam", pacote: "Dinheiro", nivel: 802, dinheiro: "56 Mi", data: "05/01/2026" },
    { img: 7, plataforma: "Epic", pacote: "Carros Modded", nivel: 2000, dinheiro: "60 Mi", data: null },
    { img: 8, plataforma: "Epic", pacote: "Carros Modded", nivel: 177, dinheiro: "103 Mi", data: null },
    { img: 6, plataforma: "Steam", pacote: "Carros Modded", nivel: 219, dinheiro: "33 Mi", data: null },
    { img: 26, plataforma: "Xbox", pacote: "Dinheiro PC", nivel: null, dinheiro: "50 Mi", data: "16/01/2026" },
    { img: 12, plataforma: "Steam", pacote: "Dinheiro + Level", nivel: 38, dinheiro: "51 Mi", data: "03/01/2026" },
  ],

  // Avaliações reais do canal do Discord
  avaliacoes: [
    { user: "ghostpp0031", texto: "OTIMOOO, me atendeu super bem, e já deu tudo certo", produto: "Pacote Completo", data: "01/01/2026" },
    { user: "errixotinha", texto: "Atencioso, chegou ligeiro", produto: "Level + 100 Milhões", data: "01/01/2026" },
    { user: "scobdo7", texto: "Um trampo foda 100%", produto: "100 Milhões", data: "31/12/2025" },
    { user: "scobdo7", texto: "Feedback 100% trampo foda 👊🏻", produto: "Level + 100 Milhões", data: "31/12/2025" },
    { user: "gaara07083", texto: "Muito bom", produto: "Executivo", data: "14/08/2026" },
    { user: "brok0669_25224", texto: null, produto: "100 Milhões", data: "31/12/2025" },
    { user: "michz7278", texto: null, produto: null, data: "31/12/2025" },
  ],

};
