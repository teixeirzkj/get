# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel (Framework: **Other**).

## Editar conteúdo
Tudo em `config.js`: link de suporte (`discord`), planos, trajes, prints e avaliações.
Prints: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Pagamento (Kiwify)
O pagamento e a entrega do arquivo são feitos pela **Kiwify**:

1. Na Kiwify, crie um produto para cada pacote (mesmo preço do `config.js`) e anexe o arquivo do upgrade como conteúdo/entregável.
2. Copie o **link de checkout** de cada produto (Produtos → ⋯ → Ver links).
3. Cole cada link no bloco `kiwify` do `config.js` (ids: iniciante, basico, executivo, mafioso, elite, trajes-5, trajes-10, trajes-20).

No site, o cliente escolhe o pacote, informa plataforma e nick, aceita os termos e é levado ao checkout da Kiwify.
Plataforma e nick vão no parâmetro `src` do link (aparece nos dados de rastreio da venda na Kiwify).
Pacote sem link mostra "o pagamento deste pacote ainda não está disponível".
