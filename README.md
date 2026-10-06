# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel (Framework: **Other**).

## Editar conteúdo
Tudo em `config.js`: link de suporte (`discord`), planos, trajes, prints e avaliações.
Prints: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Pedido / pagamento
Por enquanto o botão do pacote abre o Discord de suporte (`discord` no `config.js`) e copia a mensagem do pedido
(pacote, valor, plataforma, nick e aceite dos termos) para o cliente colar.
Quando o gateway for escolhido, a troca é feita no bloco "PEDIDO (Discord)" do `script.js`.
