# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel (Framework: **Other**).

## Editar conteúdo
Tudo em `config.js`: link de suporte (`discord`), planos, trajes, prints e avaliações.
Prints: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Pagamento (EvoPay)
O checkout chama as funções da própria Vercel em `/api`, que falam com a EvoPay (`https://pix.evopay.cash/v1`).
O token **nunca** vai para o navegador.

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
| Nome | Obrigatória | Valor |
|---|---|---|
| `EVOPAY_TOKEN` | sim | Token da EvoPay (app.evopay.cash → Configurações → Token) |
| `DOWNLOADS` | sim | JSON com o link do arquivo de cada pacote (ver abaixo) |
| `DISCORD_WEBHOOK_URL` | não | Webhook de um canal do Discord para avisar cada venda (pacote, valor, plataforma, nick) |

Exemplo de `DOWNLOADS` (uma linha só):
```
{"iniciante":"https://...","basico":"https://...","executivo":"https://...","mafioso":"https://...","elite":"https://...","trajes-5":"https://...","trajes-10":"https://...","trajes-20":"https://..."}
```
Se um pacote não tiver link, o cliente vê "Pagamento recebido! Chame o suporte no Discord".
Depois de mudar variáveis, faça **Redeploy**.

### Como funciona
- `POST /api/pagamento` → valida pacote/plataforma/nick/aceite, cria o Pix na EvoPay com o **preço do config.js** (lido no servidor) e devolve QR Code + copia e cola.
- `GET /api/pagamento?id=&produto=` → consulta a EvoPay; quando `COMPLETED` e o valor bate com o pacote, libera o link de download.
- `POST /api/webhook` → callback da EvoPay. Como o callback não é assinado, o status é reconfirmado na API antes de avisar no Discord.

### Testar a tela sem gateway
Abra o site localmente com `?demo` (ex.: `index.html?demo`). Gera um Pix fictício e "confirma" após ~8 s.
O modo demo só funciona em `localhost`/arquivo local.
