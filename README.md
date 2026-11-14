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
| `ADMIN_SENHA` | para o admin | Senha da página `/admin`. Também assina os links de pacote personalizado: trocar a senha invalida os links já enviados (ou defina `PEDIDO_SECRET` à parte para isso). |
| `GITHUB_TOKEN` | para editar a loja | Token do GitHub (fine-grained) só do repositório `teixeirzkj/get`, permissão **Contents: Read and write**. Usado pela aba "Editar loja" do `/admin` para salvar `public/config.js`. |

Depois de mudar variáveis, faça **Redeploy**.

## Como funciona o pagamento
- `POST /api/pagamento` → valida pacote, plataforma, nick, nome, e-mail, WhatsApp, CPF e aceite; cria o Pix com o
  **preço do config.js** (lido no servidor) e `transaction_id` = `tx_<pacote>_<código>`.
- `GET /api/pagamento?id=` → consulta a CashinPay; quando `paid` e o valor bate, devolve o link de download.
- `GET /api/download?id=` → reconfirma o pagamento e entrega o arquivo.
- Sem `CASHINPAY_API_KEY`, o site mostra "pagamento indisponível" com botão para o Discord.

## Editar preços e textos (`/admin` → Editar loja)
- Muda nome, preço, destaque, metas, textos e itens dos pacotes, trajes, adicional, link do Discord e base de preço.
- Ao salvar, o painel faz um commit de `public/config.js` no GitHub e a Vercel publica em ~1 minuto.
- Os ids dos pacotes não mudam (são os nomes dos PDFs em `arquivos/`).
- Quem editar o código localmente deve dar `git pull` antes, para pegar as alterações feitas pelo painel.

## Pacotes personalizados (`/admin`)
- Abra `/admin`, digite a senha (`ADMIN_SENHA`), monte o pacote (título, itens, preço, arquivo entregue) e gere o link.
- O link (`/pedido?c=...`) é assinado: o cliente não consegue mudar preço nem itens. Vale pelos dias escolhidos.
- "Base de preço" interpola os preços dos pacotes atuais de `config.js` (só referência).
- Arquivo "Guia sob medida": o pagamento é confirmado e o cliente é orientado a chamar o suporte no Discord para receber.

## Testar a tela sem gateway
Abra `public/index.html?demo` localmente. Gera um Pix fictício e "confirma" após ~8 s.
