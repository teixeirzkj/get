# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel (Framework: **Other**).

## Editar conteúdo
Tudo em `config.js`: link de suporte (`discord`), planos, trajes, prints e avaliações.
Prints: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Pagamento (CashinPay)
O checkout gera o Pix na própria tela usando as funções da Vercel em `/api`, que falam com a CashinPay
(`https://api.cashinpaybr.com/api/v1`). A chave **nunca** vai para o navegador.

### Variáveis de ambiente (Vercel → Settings → Environment Variables)
| Nome | Obrigatória | Valor |
|---|---|---|
| `CASHINPAY_API_KEY` | sim | Chave `sk_live_...` (CashinPay → Integrações/API REST → Gerar chave) |
| `DOWNLOADS` | sim | JSON com o link do arquivo de cada pacote (ver abaixo) |
| `CASHINPAY_WEBHOOK_SECRET` | para o aviso no Discord | Segredo do webhook (CashinPay → API REST → Webhooks) |
| `DISCORD_WEBHOOK_URL` | não | Webhook de um canal do Discord para avisar cada venda |

Exemplo de `DOWNLOADS` (uma linha só):
```
{"iniciante":"https://...","basico":"https://...","executivo":"https://...","mafioso":"https://...","elite":"https://...","trajes-5":"https://...","trajes-10":"https://...","trajes-20":"https://..."}
```
Webhook na CashinPay: URL `https://SEU-DOMINIO/api/webhook`, evento `transaction.paid`.
Depois de mudar variáveis, faça **Redeploy**.

### Como funciona
- `POST /api/pagamento` → valida pacote, plataforma, nick, nome, e-mail, WhatsApp, CPF e aceite; cria o Pix com o
  **preço do config.js** (lido no servidor) e `transaction_id` = `tx_<pacote>_<código>`.
- `GET /api/pagamento?id=` → consulta a CashinPay; quando `paid` e o valor bate com o pacote, libera o download.
- `POST /api/webhook` → confere a assinatura HMAC-SHA256, reconfirma na API e avisa no Discord.
- Sem `CASHINPAY_API_KEY`, o site mostra "pagamento indisponível" com botão para o Discord.

### Testar a tela sem gateway
Abra o site localmente com `?demo` (ex.: `index.html?demo`). Gera um Pix fictício e "confirma" após ~8 s.
