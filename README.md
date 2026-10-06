# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel (Framework: **Other**).

## Editar conteúdo
Tudo em `config.js`: link de suporte (`discord`), planos, trajes, prints e avaliações.
Prints: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Pagamento (a fazer)
O checkout chama a API do próprio site (`/api/pagamento`), que fala com o gateway.
A chave do gateway fica só no servidor (variável de ambiente na Vercel), nunca no front.

**POST `/api/pagamento`**
```json
// body
{ "produto": "executivo", "plataforma": "Steam", "nick": "Anny_Rose", "aceiteTermos": true }
// resposta 200
{ "id": "abc123", "copiaECola": "000201...", "qrCodeBase64": "iVBOR...", "valor": 49.9, "expiraEm": "2026-10-06T21:15:00Z" }
```
- O **preço é definido no servidor** pelo id do produto (não confie no valor vindo do navegador).
- `qrCodeBase64` é opcional — sem ele o site gera o QR a partir do `copiaECola`.
- Em caso de erro, responda `{ "erro": "mensagem" }` com status 4xx/5xx.

**GET `/api/pagamento?id=abc123`**
```json
{ "status": "pending" }              // aguardando
{ "status": "paid", "downloadUrl": "https://..." }   // pago → aparece o botão de download
{ "status": "expired" }              // expirado
```
- `downloadUrl` só deve ser devolvido quando o status for `paid` (de preferência um link temporário/assinado).
- O ideal é confirmar o pagamento pelo **webhook** do gateway e o GET só ler o status salvo.

### Testar a tela sem gateway
Abra o site localmente com `?demo` (ex.: `index.html?demo`). Gera um Pix fictício e "confirma" após ~8 s.
O modo demo só funciona em `localhost`/arquivo local, nunca no domínio publicado.
