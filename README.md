# Teixeira Mods — site

Site estático em `public/` + funções da Vercel em `api/` (pagamento Pix CashinPay e download protegido).
Deploy na Vercel (Framework: **Other**; o `vercel.json` já define `public` como pasta do site).

## Editar conteúdo
Tudo em `public/config.js`: link de suporte (`discord`), planos e preços, trajes, prints e avaliações.
Prints: `public/assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Arquivos dos pacotes
Coloque o arquivo de cada pacote na pasta **`arquivos/`** (na raiz, fora de `public/`), com o nome igual ao id do pacote:

```
arquivos/iniciante.zip   arquivos/basico.zip   arquivos/executivo.zip   arquivos/mafioso.zip
arquivos/elite.zip       arquivos/trajes-5.zip arquivos/trajes-10.zip   arquivos/trajes-20.zip
```

- A pasta **não é pública**: o arquivo só sai por `/api/download?id=...`, que confere na CashinPay se o Pix foi pago e se o valor é o do pacote.
- Limite de **4 MB por arquivo** (limite de resposta das funções da Vercel). Para arquivos maiores, use a variável `DOWNLOADS` com links externos.

## Variáveis de ambiente (Vercel → Settings → Environment Variables)
| Nome | Obrigatória | Valor |
|---|---|---|
| `CASHINPAY_API_KEY` | sim | Chave `sk_live_...` (CashinPay → API REST → Gerar chave) |
| `DOWNLOADS` | não | Só para arquivos grandes: `{"elite":"https://..."}` (usado quando o pacote não tem arquivo em `arquivos/`) |

Depois de mudar variáveis, faça **Redeploy**.

## Como funciona o pagamento
- `POST /api/pagamento` → valida pacote, plataforma, nick, nome, e-mail, WhatsApp, CPF e aceite; cria o Pix com o
  **preço do config.js** (lido no servidor) e `transaction_id` = `tx_<pacote>_<código>`.
- `GET /api/pagamento?id=` → consulta a CashinPay; quando `paid` e o valor bate, devolve o link de download.
- `GET /api/download?id=` → reconfirma o pagamento e entrega o arquivo.
- Sem `CASHINPAY_API_KEY`, o site mostra "pagamento indisponível" com botão para o Discord.

## Testar a tela sem gateway
Abra `public/index.html?demo` localmente. Gera um Pix fictício e "confirma" após ~8 s.
