# Teixeira Mods — site

Loja de guias em PDF de progressão para GTA Online. Site estático em `public/` + funções da Vercel em `api/` (pagamento Pix CashinPay e download protegido).

> Os guias são produtos educativos: o site não promete nem entrega dinheiro, level ou itens na conta. Mantenha os textos de `public/config.js` coerentes com o conteúdo real dos PDFs (CDC arts. 30, 31 e 37).
Deploy na Vercel (Framework: **Other**; o `vercel.json` já define `public` como pasta do site).

## Editar conteúdo
Tudo em `public/config.js`: link de suporte (`discord`), guias, preços e trajes.

## Arquivos dos pacotes
Coloque o guia (PDF) de cada pacote na pasta **`arquivos/`** (na raiz, fora de `public/`), com o nome igual ao id do pacote:

```
arquivos/iniciante.pdf   arquivos/basico.pdf   arquivos/executivo.pdf   arquivos/mafioso.pdf
arquivos/elite.pdf       arquivos/trajes-5.pdf arquivos/trajes-10.pdf   arquivos/trajes-20.pdf
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
