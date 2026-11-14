// =====================================================================
//  CONFIGURAÇÃO DA LOJA — editável pelo painel /admin (aba "Editar loja"),
//  que salva este arquivo no GitHub. Para editar à mão, mantenha o bloco
//  entre /*DADOS*/ e /*FIM*/ em JSON válido (aspas duplas, sem vírgula sobrando).
//
//  Campos:
//  discord ............ link de suporte
//  pagamento .......... endpoint e intervalo (ms) da consulta de status do Pix
//  basePreco .......... base de preço do /admin: fração do pacote que cada parte vale (soma = 1)
//  adicional .......... opcional no checkout, somado ao pacote (descrito nos termos, item 12)
//  planos[] ........... pacotes. id = nome do PDF em arquivos/ (não mude). preco null = "Consultar".
//                       meta/level/carros/trajes: metas mostradas no card e usadas na base de preço.
//  trajes[] ........... pacotes de trajes (id = nome do PDF em arquivos/)
// =====================================================================
window.LOJA = /*DADOS*/{
  "nome": "Teixeira Mods",
  "discord": "https://discord.gg/CtW7Us5WNz",
  "pagamento": {
    "endpoint": "/api/pagamento",
    "intervaloStatus": 4000
  },
  "basePreco": {
    "dinheiro": 0.4,
    "level": 0.2,
    "carros": 0.15,
    "trajes": 0.15,
    "extras": 0.1
  },
  "adicional": {
    "nome": "Adicional de suporte",
    "preco": 15
  },
  "planos": [
    {
      "id": "iniciante",
      "nome": "Pacote Iniciante",
      "cor": "green",
      "preco": 24.9,
      "meta": "30",
      "level": 90,
      "carros": 5,
      "trajes": 5,
      "sub": "Meta: 30 mi e Level 90",
      "desc": "Para quem está começando: os primeiros milhões e os primeiros levels usando as atividades do jogo.",
      "itens": [
        "30 milhões",
        "Level 90",
        "5 carros personalizados",
        "5 trajes",
        "Corrida personalizada",
        "Checklist de progresso"
      ]
    },
    {
      "id": "basico",
      "nome": "Pacote Básico",
      "cor": "blue",
      "preco": 34.9,
      "meta": "100",
      "level": 150,
      "carros": 8,
      "trajes": 8,
      "sub": "Meta: 100 mi e Level 150",
      "desc": "Para expandir os ganhos: negócios, evolução de level e primeiro apartamento de luxo.",
      "itens": [
        "100 milhões",
        "Level 150",
        "Apartamento de luxo",
        "8 carros personalizados",
        "8 trajes",
        "Corrida personalizada",
        "Checklist de progresso"
      ]
    },
    {
      "id": "executivo",
      "nome": "Pacote Executivo",
      "cor": "orange",
      "preco": 49.9,
      "meta": "200",
      "level": 250,
      "carros": 12,
      "trajes": 12,
      "sub": "Meta: 200 mi e Level 250",
      "destaque": "Mais vendido",
      "desc": "Para acelerar: construção de capital com empresas, reinvestimento e evolução até o Level 250.",
      "itens": [
        "200 milhões",
        "Level 250",
        "Apartamentos e empresas principais",
        "12 carros personalizados",
        "12 trajes",
        "Corrida personalizada",
        "Checklist de progresso"
      ]
    },
    {
      "id": "mafioso",
      "nome": "Pacote Mafioso",
      "cor": "red",
      "preco": 64.9,
      "meta": "350",
      "level": 400,
      "carros": 16,
      "trajes": 16,
      "sub": "Meta: 350 mi e Level 400",
      "desc": "Para montar um império: patrimônio com todas as empresas e grande parte das propriedades.",
      "itens": [
        "350 milhões",
        "Level 400",
        "Todas as empresas",
        "Grande parte das propriedades",
        "16 carros personalizados",
        "16 trajes",
        "Desbloqueios e corrida",
        "Checklist de progresso"
      ]
    },
    {
      "id": "elite",
      "nome": "Pacote Elite",
      "cor": "purple",
      "preco": 79.9,
      "meta": "500",
      "level": null,
      "carros": 20,
      "trajes": 20,
      "sub": "Meta: 500 mi e todas as propriedades",
      "destaque": "Completo",
      "desc": "O pacote mais completo: patrimônio, propriedades, desbloqueios, coleção de carros e trajes.",
      "itens": [
        "500 milhões",
        "Todas as propriedades",
        "Level e desbloqueios",
        "20 carros personalizados",
        "20 trajes",
        "Corrida personalizada",
        "Checklist final"
      ]
    }
  ],
  "trajes": [
    {
      "id": "trajes-5",
      "qtd": 5,
      "preco": 10.9,
      "destaque": null,
      "desc": "5 visuais com as peças da sua conta. Ideal para renovar o personagem."
    },
    {
      "id": "trajes-10",
      "qtd": 10,
      "preco": 17.9,
      "destaque": null,
      "desc": "10 visuais diferentes, um para cada ocasião, com checklist de cada traje."
    },
    {
      "id": "trajes-20",
      "qtd": 20,
      "preco": 24.9,
      "destaque": "Melhor custo",
      "desc": "O pacote mais completo: 20 visuais em estilos diferentes, do casual ao temático, com checklist."
    }
  ]
}/*FIM*/;
