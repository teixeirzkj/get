# Teixeira Mods — site

Site estático (HTML/CSS/JS), sem build. Deploy direto na Vercel.

## Editar conteúdo
Tudo fica em `config.js`:
- `discord` — link de convite do servidor (**troque antes de publicar**)
- `planos` — preços (`preco: null` mostra "Consultar")
- `trajes`, `entregas`, `avaliacoes`, `faq`

Prints das entregas: `assets/entregas/eN.webp` (+ `eN-thumb.webp`).

## Deploy
Vercel → Add New Project → importar este repositório → Framework: **Other** → Deploy.
