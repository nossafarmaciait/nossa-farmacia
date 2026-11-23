# Landing page — Grupo Nossa Farmácia

Página estática (HTML, CSS e JS embutidos, sem backend). Domínio de produção: **<https://grupo.nossafarmacia.pt/>**.

O código-fonte está em `site/`. Um build curto (`npm run build`) gera em `dist/` a versão a publicar: a página PT tal como está, as páginas EN e ES já traduzidas, o `sitemap.xml` e o `robots.txt`.

## Publicação

- **GitHub Pages (automático):** cada push na `main` que mexa em `site/`, `scripts/` ou `package*.json` corre o workflow `.github/workflows/pages.yml`, que faz o build e publica o `dist/`. Também se pode correr à mão em Actions → "Publicar site no GitHub Pages" → Run workflow.
- **Outro servidor:** `npm ci && npm run build` (Node 20 ou mais recente) e copiar o conteúdo de `dist/` para a raiz de `grupo.nossafarmacia.pt`. Configurem a página de erro 404 para `404.html`.
- **Fora do domínio de produção** (ex.: `nossafarmaciait.github.io/nossa-farmacia/`), o build marca todas as páginas como `noindex`, para o Google não indexar a cópia de testes. Para testar localmente: `DEPLOY_URL=http://localhost:8765/ npm run build` e `python3 -m http.server 8765 -d dist`.
- **Para mudar o domínio:** troquem `https://grupo.nossafarmacia.pt/` no `<head>` do `site/index.html` (canonical, hreflang, Open Graph e dados estruturados) e na constante `SITE_URL` de `scripts/build.mjs`.

### Pôr o domínio no ar no GitHub Pages

1. **DNS** (no fornecedor do domínio `nossafarmacia.pt`): registo `CNAME` de `grupo` para `nossafarmaciait.github.io`. Hoje `grupo.nossafarmacia.pt` ainda serve o site antigo; as páginas dele já existem em `portal.nossafarmacia.pt`.
2. **GitHub** (conta com acesso de administração): Settings → Pages → Custom domain → `grupo.nossafarmacia.pt` → Save, e ativar **Enforce HTTPS** quando ficar disponível.
3. Correr o workflow outra vez. O build passa a reconhecer o domínio de produção e retira o `noindex`.

## SEO

- **Por página:** título e descrição próprios por língua, `canonical`, `hreflang` (pt-PT, en, es e x-default), Open Graph e Twitter com imagem 1200×630 (`media/og-1200x630.jpg`), e `robots` com `max-image-preview:large`.
- **Dados estruturados (JSON-LD no `<head>`):** `Organization` (nome legal Addo Pharm, S.A., contactos, redes sociais e prémios IAPMEI), `WebSite`, `WebPage` e `VideoObject` do vídeo institucional. Ao mudar contactos, redes sociais ou prémios no rodapé, atualizem também este bloco.
- **Idiomas:** `/`, `/en/` e `/es/` são páginas estáticas, cada uma no seu URL, e entram no `sitemap.xml`. Os links antigos com `?lang=en` ou `?lang=es` redirecionam para `/en/` e `/es/`.
- **404 e URLs antigos:** em `grupo.nossafarmacia.pt`, os caminhos do site antigo (começam por maiúscula: `/Portal`, `/NossasFarmacias/`, …) seguem para o mesmo caminho em `portal.nossafarmacia.pt`. Os outros mostram a página 404 (ver Comportamento).
- **Ícones:** `favicon.ico` (48 px), `favicon.svg`, `apple-touch-icon.png` (180 px) e `site.webmanifest` com ícones 192/512 em `img/icons/`.
- **Depois de o domínio estar no ar (Google Search Console):**
  1. Adicionar a propriedade do domínio `nossafarmacia.pt` (verificação por registo TXT no DNS) ou o prefixo `https://grupo.nossafarmacia.pt/`.
  2. Em Sitemaps, submeter `https://grupo.nossafarmacia.pt/sitemap.xml`.
  3. Em Inspeção de URL, pedir a indexação de `/`, `/en/` e `/es/`.
  4. Validar os dados estruturados em <https://search.google.com/test/rich-results>.
  5. Se o site antigo estava indexado com outras páginas em `grupo.nossafarmacia.pt`, acompanhar em Páginas → "Não encontradas (404)" e "Página com redirecionamento".

## Estrutura

```text
site/             código-fonte do site (o que é publicado, mais as páginas EN/ES geradas)
scripts/build.mjs gera dist/: páginas EN/ES traduzidas a partir do i18n.js, sitemap.xml, robots.txt e noindex fora de produção
dist/             resultado do build (não vai para o git)
higgsfield/       originais e scripts de produção dos vídeos e imagens (só local, não vai para o git)
```

Dentro de `site/`:

```text
index.html        página única (CSS e JS inline), com o texto em português
i18n.js           traduções EN e ES: o build gera as páginas com elas, e a página EN/ES carrega-o para os textos criados em JS
404.html          página de erro, com o redirecionamento dos URLs antigos para portal.nossafarmacia.pt
favicon.svg, favicon.ico, apple-touch-icon.png, site.webmanifest
fonts/            Hanken Grotesk (variável) e Instrument Serif itálico, woff2, alojadas localmente
img/              logótipos GNF (SVG), foto de O Grupo (AVIF/WebP), serviços (WebP 760/1200), eDeliveries e parceiros (WebP)
                  premios/: selos PME Líder 2020, 2022-2025 e PME Excelência 2023 e 2025 (WebP transparente)
                  icons/: ícones 192/512 (e versão maskable) do site.webmanifest
media/            vídeo da hero (MP4 H.264 + WebM VP9, desktop 16:9 e mobile 4:5) e posters (AVIF/WebP)
                  og-1200x630.jpg: imagem de partilha (Open Graph), recortada do poster da hero
                  proposta/: 9 clips em loop da Proposta de valor (MP4 H.264, 960×720, ~4 s) e posters (WebP)
                  emprego.mp4/.webp: fundo em loop do cartão Emprego (1280×720) e poster
                  adesao.mp4/.webp: vídeo dos 4 passos de adesão (720×960, ~12 s, keyframe a cada 6 frames) e poster
```

## Requisitos do servidor

- **HTTPS.**
- **Tipos MIME:** `.avif` → `image/avif`, `.webm` → `video/webm`, `.mp4` → `video/mp4`, `.woff2` → `font/woff2`, `.svg` → `image/svg+xml`. Sem estes tipos, os browsers podem ignorar as imagens ou o vídeo.
- **Range requests** (`Accept-Ranges: bytes`) para os vídeos. Os servidores habituais (Nginx, Apache, IIS e CDNs) já o fazem por defeito.
- **Compressão gzip/brotli** para `index.html` e `.svg`.
- **Cache:**
  - `fonts/`, `img/` e `media/`: `Cache-Control: public, max-age=31536000, immutable`. Se substituírem um ficheiro, mudem-lhe o nome.
  - `index.html`, `en/`, `es/`, `sitemap.xml` e `robots.txt`: `no-cache` ou um `max-age` curto.
  - No GitHub Pages a cache é fixa (10 minutos) e não se pode mudar. É o único ponto que o Lighthouse ainda assinala; para cache longa nas imagens e vídeos é preciso um CDN à frente (ex.: Cloudflare) ou outro servidor.

## Comportamento

- **Vídeo da hero:** não reproduz sozinho. Carrega depois do evento `load` e avança ou recua conforme o scroll.
  - Em desktop a hero fica fixa durante o scroll da secção, e o texto aparece aos 70% do vídeo.
  - Em mobile (≤ 767 px) usa a versão 4:5, com o MP4 em primeiro lugar. A hero não fica fixa e o texto está sempre visível.
  - Os vídeos têm um keyframe a cada 6 frames, para o recuo ser fluido. Se forem substituídos, devem ser recodificados da mesma forma.
  - Com `prefers-reduced-motion`, ou se o vídeo falhar, mostra apenas o poster.
  - O letreiro "FARMÁCIA" (fonte Hanken Grotesk) e a cruz branca do logótipo na parede verde foram aplicados por composição, seguindo o movimento da câmara frame a frame; o resto do vídeo não foi alterado. Scripts e elementos em `higgsfield/hero-letreiro/`; o master editado é `higgsfield/video/final_1080p_master-letreiro.mp4` e a versão anterior está em `higgsfield/deliverables/sem-letreiro/`.
- **Clips da Proposta de valor:** só o clip do separador aberto é carregado e reproduzido, e apenas enquanto a secção está no ecrã. Com `prefers-reduced-motion` mostra só o poster.
  - **Nossa AI:** o separador descreve o assistente para o público (sem detalhes técnicos internos). O ecrã do tablet no clip é abstrato, sem texto. O número do painel (piloto em mais de 100 farmácias) deve ser atualizado no `index.html` e no `i18n.js` quando mudarem.
  - Foram gerados no Higgsfield. Os originais e os prompts estão em `higgsfield/proposta/`.
  - Para o loop não ter salto, os últimos 0,75 s de cada clip fazem um crossfade para o início.
  - **COMPLETUS:** rotação 3D da caixa Completus Imunidade (12 s em loop, abranda na frente). Não é IA: as faces foram recortadas das 5 fotos da caixa (em `higgsfield/completus-3d/fotos/`) e a caixa é renderizada em 3D, por isso o texto da embalagem fica fiel. Texturas e script em `higgsfield/completus-3d/`; para gerar de novo: `python render.py <pasta das texturas> video completus.mp4` (precisa de numpy e opencv).
- **Vídeo dos passos de adesão:** avança e recua com o scroll pela timeline, com uma cena por passo. Fica fixo ao lado dos passos em desktop e, em mobile, numa faixa baixa no topo. Cada cena coincide com o passo destacado. Só carrega quando a secção se aproxima. Com `prefers-reduced-motion` mostra só o poster.
  - Os originais (4 imagens e 4 clips) estão em `higgsfield/adesao/`. Se o vídeo for substituído, deve manter um keyframe a cada 6 frames (`-g 6`) para recuar sem solavancos.
- **Fundo do cartão Emprego:** só é carregado e reproduzido quando o cartão está no ecrã. Com `prefers-reduced-motion` mostra só o poster.
- **Imagens geradas com IA:** as fotos dos Serviços, o fundo do Emprego, os clips da Proposta e o vídeo da adesão foram gerados no Higgsfield. Os originais e os prompts estão em `higgsfield/servicos/`, `higgsfield/proposta/` e `higgsfield/adesao/`. As pessoas são geradas e servem só de ambiente; não devem ser apresentadas como colaboradores ou clientes reais.
- **Prémios (IAPMEI):** a faixa no fim de O Grupo mostra os selos em vigor (PME Líder 2025 e PME Excelência 2025) e os anos de distinção: PME Líder em 2020, 2022, 2023, 2024 e 2025 (em 2021 não houve), com PME Excelência em 2023 e 2025. O rodapé mostra os 7 selos. Os diplomas estão em `../premios/`, em nome da Addo Pharm, S.A., a denominação oficial do Grupo.
  - Os selos foram recortados dos diplomas. Não havia diploma da PME Excelência 2025, por isso esse selo foi feito a partir do de 2023, trocando o "3" por um "5" retirado do selo PME Líder '25 (a mesma fonte). Deve ser substituído pelo selo oficial quando o tiverem.
  - **Cada novo ano:** juntem o ano à lista `aw-years`, troquem os selos da faixa e acrescentem um selo ao `f-awards` do rodapé, no `index.html`, com a dica (`f-tip`) do novo selo, e a mesma frase no `i18n.js`.
- **Vídeo institucional:** o YouTube (`youtube-nocookie.com`) só é carregado quando o visitante carrega em reproduzir.
- **Formulário de adesão:** não envia dados para nenhum servidor. Ao submeter, abre o programa de email do utilizador com o pedido preenchido para `grupo@nossafarmacia.pt`. Para trocar por um endpoint próprio, alterem o handler `submit` no fim de `index.html`.
- **Idiomas (PT, EN, ES):** o seletor fica no menu e navega entre `/`, `/en/` e `/es/`. O português está no `index.html`; o `i18n.js` tem as traduções, com o texto em PT como chave. As páginas EN e ES são geradas pelo build e não se editam à mão.
  - **Para alterar um texto:** mudem-no no `index.html` e atualizem a mesma chave no `i18n.js`. Se a chave deixar de coincidir, esse texto fica em PT nas outras línguas. `npm run build:report` lista os textos sem tradução (hoje só nomes de marcas, emails e PT/EN/ES).
  - O título, a descrição e o texto alternativo da imagem de partilha (`og:image:alt`) também se traduzem pelo `i18n.js`.
  - **Para acrescentar um texto:** escrevam-no em PT no `index.html` e acrescentem uma entrada no `i18n.js` com `en` e `es`.
  - Os títulos com uma parte em itálico (`<em class="s">`) são traduzidos por partes: cada lado do `<em>` tem a sua entrada.
- **Links externos:** Farmácia Online, Portal, Nossas Farmácias, COMPLETUS e Emprego apontam para as páginas atuais de `portal.nossafarmacia.pt` e `www.nossafarmacia.pt`.

## Testes

Lighthouse 12.6 de 23/11/2026, no site publicado no GitHub Pages:

- Mobile: desempenho 99 (LCP 1,8 s, CLS 0), acessibilidade 97, boas práticas 100, SEO 100.
- Desktop: desempenho 100, acessibilidade 97, boas práticas 100, SEO 100.
- As páginas `/en/` e `/es/` geradas foram testadas localmente: sem pedidos falhados nem erros na consola, desempenho 96–98.
- Pontos que ficam: a cache curta do GitHub Pages (ver Requisitos do servidor) e o contraste dos passos de adesão ainda não ativos (texto esbatido até o scroll chegar a cada passo).
