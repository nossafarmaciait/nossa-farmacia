# Landing page — Grupo Nossa Farmácia

Página estática (HTML, CSS e JS embutidos, sem backend). Domínio de produção: **<https://grupo.nossafarmacia.pt/>**.

O código-fonte está em `site/`. Um build curto (`npm run build`) gera em `dist/` a versão a publicar: a página PT tal como está, as páginas EN e ES já traduzidas, o `sitemap.xml` e o `robots.txt`.

## Publicação

- **GitHub Pages (automático):** cada push na `main` que mexa em `site/`, `scripts/` ou `package*.json` corre o workflow `.github/workflows/pages.yml`, que faz o build e publica o `dist/`. Também se pode correr à mão em Actions → "Publicar site no GitHub Pages" → Run workflow.
- **Outro servidor:** `npm ci && npm run build` (Node 20 ou mais recente) e copiar o conteúdo de `dist/` para a raiz de `grupo.nossafarmacia.pt`. Configurem a página de erro 404 para `404.html`.
- **Fora do domínio de produção** (ex.: `nossafarmaciait.github.io/nossa-farmacia/`), o build marca todas as páginas como `noindex`, para o Google não indexar a cópia de testes. Nesse caso o `og:url` e o `og:image` passam a apontar para o endereço publicado, para a pré-visualização dos links funcionar enquanto `grupo.nossafarmacia.pt` ainda serve o site antigo. Para testar localmente: `DEPLOY_URL=http://localhost:8765/ npm run build` e `python3 -m http.server 8765 -d dist`.
- **Para mudar o domínio:** troquem `https://grupo.nossafarmacia.pt/` no `<head>` do `site/index.html` (canonical, hreflang, Open Graph e dados estruturados) e na constante `SITE_URL` de `scripts/build.mjs`.

### Pôr o domínio no ar no GitHub Pages

1. **DNS** (no fornecedor do domínio `nossafarmacia.pt`): registo `CNAME` de `grupo` para `nossafarmaciait.github.io`. Hoje `grupo.nossafarmacia.pt` ainda serve o site antigo; as páginas dele já existem em `portal.nossafarmacia.pt`.
2. **GitHub** (conta com acesso de administração): Settings → Pages → Custom domain → `grupo.nossafarmacia.pt` → Save, e ativar **Enforce HTTPS** quando ficar disponível.
3. Correr o workflow outra vez. O build passa a reconhecer o domínio de produção e retira o `noindex`.

## SEO

- **Por página:** título e descrição próprios por língua, `canonical`, `hreflang` (pt-PT, en, es e x-default), Open Graph e Twitter com imagem 1200×630 (`media/og-1200x630.jpg`), e `robots` com `max-image-preview:large`.
- **Dados estruturados (JSON-LD no `<head>`):** `Organization` (nome legal Addo Pharm, S.A., contactos, redes sociais e prémios IAPMEI), `WebSite`, `WebPage` e `VideoObject` do vídeo institucional. Ao mudar contactos, redes sociais ou prémios no rodapé, atualizem também este bloco.
- **Idiomas:** `/`, `/en/` e `/es/` são páginas estáticas, cada uma no seu URL, e entram no `sitemap.xml`; o mesmo para cada página de serviço (`/servicos/<nome>/`, `/en/servicos/<nome>/`, `/es/servicos/<nome>/`), de emprego (`/emprego/`, `/emprego/<vaga>/`), da Completus (`/completus/`, `/completus/<produto>/`) e das farmácias (`/farmacias/`). Os links antigos com `?lang=en` ou `?lang=es` redirecionam para `/en/` e `/es/`.
- **404 e URLs antigos:** em `grupo.nossafarmacia.pt`, os caminhos do site antigo (começam por maiúscula: `/Portal`, `/NossasFarmacias/`, …) seguem para o mesmo caminho em `portal.nossafarmacia.pt`, exceto a antiga Completus: `/MarcasProprias/` vai para `/completus/` e `/MarcasProprias/<CNP>` para a página do produto. Os outros mostram a página 404 (ver Comportamento).
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
scripts/completus/ dados dos produtos Completus (produtos.json), gerador das páginas (gerar.mjs) e das imagens (imagens.py)
scripts/farmacias/ gerador dos dados de exemplo do mapa das farmácias (gerar-exemplo.mjs)
dist/             resultado do build (não vai para o git)
higgsfield/       originais e scripts de produção dos vídeos e imagens (só local, não vai para o git)
assets/           renders originais das embalagens Completus, uma pasta 3D_<produto>/ por produto (só local, não vai para o git)
```

Dentro de `site/`:

```text
index.html        página principal (CSS e JS inline), com o texto em português
servicos/         uma página por serviço (consultoria, analytics, marketing, academia, nutricao), em <nome>/index.html,
                  com servico.css e servico.js partilhados
emprego/          lista de vagas (index.html) e uma pasta por vaga (candidatura-espontanea/, …), com emprego.css e
                  emprego.js; usa também o servico.css e o servico.js
completus/        a gama Completus® (index.html) e uma página por produto (<produto>/index.html), geradas por
                  scripts/completus/gerar.mjs, com completus.css e completus.js; usa também o servico.css e o servico.js
farmacias/        mapa das farmácias do Grupo (index.html), com farmacias.css, farmacias.js e os dados de exemplo
                  (farmacias-exemplo.json); usa também o servico.css e o servico.js
vendor/markerclusterer/ @googlemaps/markerclusterer 2.5.3 (licença Apache 2.0, ao lado): agrupa os marcadores do mapa
i18n.js           traduções EN e ES: o build gera as páginas com elas, e a página EN/ES carrega-o para os textos criados em JS
404.html          página de erro animada (PT/EN/ES pelo caminho), com o redirecionamento dos URLs antigos para portal.nossafarmacia.pt
favicon.svg, favicon.ico, apple-touch-icon.png, site.webmanifest
fonts/            Hanken Grotesk (variável) e Instrument Serif itálico, woff2, alojadas localmente
img/              logótipos GNF (SVG), foto de O Grupo (AVIF/WebP), serviços (WebP 760/1200), eDeliveries e parceiros (WebP)
                  premios/: selos PME Líder 2020, 2022-2025 e PME Excelência 2023 e 2025 (WebP transparente)
                  icons/: ícones 192/512 (e versão maskable) do site.webmanifest
media/            vídeo da hero (MP4 H.264 + WebM VP9, desktop 16:9 e mobile 4:5) e posters (AVIF/WebP)
                  og-1200x630.jpg: imagem de partilha (Open Graph): poster da hero com o logótipo e a frase do Grupo. O modelo está em `higgsfield/og/og-imagem.html` (abrir no Chrome a 1200×630 e capturar); se a imagem mudar, troquem também o `og:image:alt` no `index.html` e no `i18n.js`
                  404.mp4/.webm/.webp: prateleira em loop da página 404 (1280×720, 12 s) e poster
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
- **Páginas dos serviços:** o botão "Saiba mais" de cada cartão dos Serviços abre `servicos/<nome>/`, com o texto do serviço (vindo da antiga página "Nossos Serviços"), o que inclui, um convite para aderir e os outros serviços.
  - O texto PT edita-se em `site/servicos/<nome>/index.html` e a tradução no `i18n.js`, como na página principal. O build encontra sozinho as pastas novas dentro de `servicos/`.
  - O menu, o rodapé, os ícones e o CSS base foram copiados do `index.html`: se mudarem lá, é preciso atualizar também as páginas de serviço e o `servicos/servico.css`.
  - Os links entre páginas do site levam `data-local`: o build não os altera, e assim ficam na mesma língua. Os caminhos de imagens, CSS e JS partem sempre da raiz do site (`../../img/…`, `../../servicos/servico.css`).
  - O antigo vídeo da Academia (youtu.be/FTXSur6-Tx8) não foi incluído porque tem a marca JUMP.
- **Páginas de emprego:** o botão "Ver ofertas de emprego" e o link Emprego do rodapé abrem `emprego/`, a lista de vagas. Enquanto não houver vagas, a lista tem só a candidatura espontânea e uma nota a dizer que não há vagas abertas.
  - `emprego/candidatura-espontanea/` tem informação sobre o Grupo e o formulário: nome, email, telemóvel, distrito, área de interesse, LinkedIn e apresentação (opcionais), CV (PDF, DOC ou DOCX, até 5 MB) e consentimento para o tratamento de dados. A validação é feita no browser, com as mensagens na língua da página.
  - **Envio:** o site não tem servidor, por isso o destino das candidaturas configura-se no atributo `data-endpoint` do `<form id="cv-form">`: o URL que recebe um POST `multipart/form-data`, com o CV no campo `cv` e a vaga no campo `vaga` (serve um serviço de formulários como Formspree ou Basin, um endpoint do Odoo ou uma API própria; deve responder 2xx e aceitar pedidos de `grupo.nossafarmacia.pt` (CORS)). Com o endpoint vazio, que é o estado atual, o botão abre o email do candidato com os dados preenchidos para o endereço em `data-email` (`grupo@nossafarmacia.pt`), e o candidato anexa o CV à mão: os browsers não deixam anexar ficheiros a um `mailto`.
  - O texto do consentimento e da nota sobre os dados deve ser validado por quem trata da proteção de dados do Grupo.
  - **Publicar uma vaga:** copiar `emprego/candidatura-espontanea/` para `emprego/<nome-da-vaga>/`, mudar o texto, o `value` do campo escondido `vaga`, o `<title>`, a descrição, o canonical, o hreflang e os dados estruturados (para o Google Jobs, acrescentar um `JobPosting`, que não se usa na candidatura espontânea), e acrescentar um cartão `<li class="vaga">` em `emprego/index.html`, antes da candidatura espontânea. A nota "não temos vagas" desaparece sozinha, o build encontra a pasta nova, e os textos novos vão para o `i18n.js`.
- **Completus®:** a página `completus/` mostra a gama (12 produtos) e cada produto tem a sua página, com a descrição, o modo de utilização, a composição, as precauções, o CNP e o link para comprar na Farmácia Online.
  - **Dados:** em `scripts/completus/produtos.json`, em PT, EN e ES. Vieram de `grupo.nossafarmacia.pt/MarcasProprias` (o serviço `GetAllMarcasPropriasPublico` do site antigo), com as gralhas evidentes corrigidas. O Microbiota é o antigo Acidophilus Plus (a embalagem nova tem a mesma fórmula: 7 estirpes e betaglucanos) e usa os dados e o CNP dele. O Articulações não existia no site antigo: os dados vieram da Farmácia Online. Detox Burn e Detox Depur ficaram de fora por não terem imagem nova. Algumas embalagens são de fórmulas novas (o Colesterol diz "Nova fórmula"): os textos devem ser confirmados com os rótulos atuais.
  - **Para mudar um produto:** editar `produtos.json` e correr `npm run completus`, que reescreve as páginas em `site/completus/` e as traduções no bloco "Completus" do `i18n.js`. As páginas geradas não se editam à mão. O menu e o rodapé vêm de `site/emprego/index.html`.
  - **Imagens:** `python3 scripts/completus/imagens.py` (precisa do Pillow) lê os renders de `assets/3D_<produto>/` e escreve em `site/img/completus/<produto>/` a capa (quadrada, 640 e 1200 px) e as vistas para rodar (1200 px), todas com a embalagem à mesma altura. Em `scripts/completus/angulos.json` escolhe-se a imagem da capa (a frente da embalagem: `Frente_Pack*` quando existe) e as vistas, pela ordem em que a embalagem roda.
  - **Topo da gama:** a fotografia de família das 12 embalagens sem fundo (`assets/familia.png`, só local), cortada à volta das embalagens e convertida em `img/completus/gama-1000.webp` e `gama-2000.webp` pelo `imagens.py`. Para mudar a imagem, substitui `assets/familia.png` e corre o script (se a proporção mudar, acerta o `height` da imagem em `gerar.mjs`). Na página de cada produto, ao lado da ficha "Sobre o produto", aparece a embalagem sem fundo (`recorte.webp`). Os recortes do Magnésio, do Sono e da Vitamina C são os PNG transparentes dos assets; os outros 9 foram recortados no Higgsfield (Image Background Remover, 1 crédito cada) e estão em `higgsfield/completus/recortes/` (só local).
  - **Rodar a embalagem:** nos produtos com várias vistas, arrasta-se a imagem com o rato ou com o dedo (ou usam-se as setas do teclado e os botões) para ver a embalagem de outros ângulos. Não roda sozinha. As outras vistas só descarregam quando a pessoa chega à imagem. O Própolis e o Colesterol não têm vista do verso e rodam só entre os lados; Magnésio, Sono, Trânsito Intestinal e Vitamina C têm uma só vista. Todas as imagens se podem ampliar.
  - Não é um modelo 3D: são os renders reais da embalagem, para o texto se ler sempre bem. Um modelo 3D gerado no Higgsfield foi testado e posto de parte porque inventava o texto da embalagem. Uma caixa 3D verdadeira precisa da arte plana das faces de cada embalagem.
- **Farmácias (mapa):** a página `farmacias/` (link "Nossas Farmácias" no menu e no rodapé, e "Encontrar uma farmácia" na Completus) mostra todas as farmácias do Grupo num mapa. Pesquisa-se pela localidade, código postal, nome, morada ou distrito (sem ligar a acentos); "Perto de mim" usa a localização do browser (só em HTTPS); Continente, Madeira e Açores levam o mapa a cada região. As farmácias próximas umas das outras juntam-se num círculo com o número, que se abre ao aproximar.
  - **Ao escolher uma farmácia** (no mapa ou na lista ao lado, que mostra as farmácias da zona visível do mapa), abrem-se por baixo do mapa o nome, a morada, o telefone, o email, a distância (com "Perto de mim"), o horário e os botões "Como chegar" (Google Maps) e "Ligar". O URL fica com `?farmacia=<id>`, para se partilhar o link de uma farmácia. Tudo funciona com o teclado: Tab chega aos marcadores e à lista, Enter ou Espaço abre.
  - **Dados de exemplo (hoje):** com o atributo `data-api` do `#f-map` vazio, a página lê `farmacias/farmacias-exemplo.json`: 412 farmácias fictícias em 89 localidades reais (telefones `+351 200 …`, emails em `@exemplo.nossafarmacia.pt`), geradas por `npm run farmacias:exemplo`. A página mostra um aviso amarelo a dizer que os dados são de exemplo.
  - **Ligar à API do Portal:** ponham o URL da API no `data-api` do `#f-map` em `site/farmacias/index.html`. A página faz `GET` a esse URL e espera JSON: uma lista de farmácias ou `{ "farmacias": [...] }`, cada uma com `id`, `nome`, `latitude`, `longitude`, `morada`, `codigoPostal`, `localidade`, `distrito`, `telefone`, `email` e `horario` (só as coordenadas são obrigatórias; o que faltar não aparece). Se a API usar outros nomes de campos, acrescentem-nos na função `normaliza()` do `farmacias.js`.
  - **Horário:** o campo `horario` tem um campo por dia (`seg`, `ter`, `qua`, `qui`, `sex`, `sab`, `dom`) com os períodos em que a farmácia está aberta, ex. `"seg": ["09:00-13:00", "14:30-19:30"]`; `[]` = encerrada nesse dia, `"00:00-24:00"` = 24 horas, dia em falta = sem informação ("—"). Nos detalhes aparece cada dia da semana, com o intervalo em que fecha entre os períodos ("09:00 – 13:00 · Fechada 13:00 – 14:30 · 14:30 – 19:30"), o dia de hoje em destaque e, por cima, se está aberta agora ("Aberta agora · fecha às 19:30" / "Fechada agora · abre amanhã às 09:00"), na hora local da farmácia (os Açores têm menos uma hora). A página também aceita os dias em inglês (`mon`…`sun`) e cada período como `["09:00", "13:00"]` ou `{ "abre": "09:00", "fecha": "13:00" }`. Períodos que passam da meia-noite (ex. 22:00–02:00) não são suportados: dividam-nos pelos dois dias. A API tem de responder com CORS para `grupo.nossafarmacia.pt` (`Access-Control-Allow-Origin`). Com a API ligada, o aviso de exemplo desaparece sozinho e o `farmacias-exemplo.json` pode ser apagado.
  - **Mapa (Google Maps):** a página usa a Maps JavaScript API. A chave e o Map ID **não estão no código**: em `site/farmacias/index.html` os atributos `data-google-key` e `data-google-map-id` ficam vazios e o build preenche-os com as variáveis `GOOGLE_API_KEY` e `GOOGLE_MAP_ID`:
    - **em local**, do ficheiro `.env` na raiz (fora do git): `GOOGLE_API_KEY=AIza…` e `GOOGLE_MAP_ID=…`;
    - **no GitHub Pages**, do secret `GOOGLE_API_KEY` e da variável `GOOGLE_MAP_ID` (Settings → Secrets and variables → Actions). Para copiar do `.env`: `gh secret set GOOGLE_API_KEY` e `gh variable set GOOGLE_MAP_ID`.
    - A chave fica visível no HTML publicado (é sempre assim no Google Maps). Protegem-na as restrições na consola da Google (projeto do Grupo no Google Cloud): só os sites `grupo.nossafarmacia.pt`, `nossafarmaciait.github.io/nossa-farmacia` e `localhost:8765`, e só a Maps JavaScript API. Um domínio novo tem de ser acrescentado lá.
    - O **Map ID** (Google Maps Platform → Map Management) dá o estilo do mapa (Map Styles; "Silver", em cinzento, combina com o site) e é obrigatório para os marcadores personalizados. Sem ele o build avisa e o mapa usa o `DEMO_MAP_ID` da Google, só para testes.
    - **Sem chave**, ou se a Google a recusar (domínio não autorizado, faturação parada), a página mostra um aviso no lugar do mapa e a pesquisa, a lista e os detalhes continuam a funcionar.
    - **Custo:** o Google Maps tem uma quota mensal gratuita de carregamentos do mapa; acima dela é pago. Convém um limite diário na consola (Quotas) e um alerta de orçamento (Billing).
- **Imagens geradas com IA:** as fotos dos Serviços, o fundo do Emprego, os clips da Proposta e o vídeo da adesão foram gerados no Higgsfield. Os originais e os prompts estão em `higgsfield/servicos/`, `higgsfield/proposta/` e `higgsfield/adesao/`. As pessoas são geradas e servem só de ambiente; não devem ser apresentadas como colaboradores ou clientes reais.
- **Prémios (IAPMEI):** a faixa no fim de O Grupo mostra os selos em vigor (PME Líder 2025 e PME Excelência 2025) e os anos de distinção: PME Líder em 2020, 2022, 2023, 2024 e 2025 (em 2021 não houve), com PME Excelência em 2023 e 2025. O rodapé mostra os 7 selos. Os diplomas estão em `../premios/`, em nome da Addo Pharm, S.A., a denominação oficial do Grupo.
  - Os selos foram recortados dos diplomas. Não havia diploma da PME Excelência 2025, por isso esse selo foi feito a partir do de 2023, trocando o "3" por um "5" retirado do selo PME Líder '25 (a mesma fonte). Deve ser substituído pelo selo oficial quando o tiverem.
  - **Cada novo ano:** juntem o ano à lista `aw-years`, troquem os selos da faixa e acrescentem um selo ao `f-awards` do rodapé, no `index.html`, com a dica (`f-tip`) do novo selo, e a mesma frase no `i18n.js`.
- **Página 404:** "Esta página não está na prateleira." Por trás, uma prateleira da farmácia com um espaço vazio iluminado, em loop. No lugar do zero de "404" está a cruz do logótipo, que roda 90° a cada 3,2 s (é simétrica, por isso encaixa sempre).
  - A língua sai do caminho: `/en/…` e `/es/…` mostram a página em inglês e espanhol, e os botões levam à página dessa língua. Os textos estão no próprio `404.html`.
  - O vídeo só carrega depois do `load`. Até lá, e com `prefers-reduced-motion`, fica o poster e a cruz não roda. Em mobile a prateleira fica numa faixa no topo.
  - Gerado no Higgsfield: imagem com GPT Image 2.6 a partir da imagem de partilha (mesma farmácia e mesma luz) e animação com Seedance 2.5. O loop toca para a frente e para trás, por isso o foco de luz acende e apaga devagar. Originais e frames em `higgsfield/404/`.
- **Vídeo institucional:** o YouTube (`youtube-nocookie.com`) só é carregado quando o visitante carrega em reproduzir.
- **Formulário de adesão:** não envia dados para nenhum servidor. Ao submeter, abre o programa de email do utilizador com o pedido preenchido para `grupo@nossafarmacia.pt`. Para trocar por um endpoint próprio, alterem o handler `submit` no fim de `index.html`.
- **Idiomas (PT, EN, ES):** o seletor fica no menu e navega entre `/`, `/en/` e `/es/`. O português está no `index.html`; o `i18n.js` tem as traduções, com o texto em PT como chave. As páginas EN e ES são geradas pelo build e não se editam à mão.
  - **Para alterar um texto:** mudem-no no `index.html` e atualizem a mesma chave no `i18n.js`. Se a chave deixar de coincidir, esse texto fica em PT nas outras línguas. `npm run build:report` lista os textos sem tradução (hoje só nomes de marcas, emails e PT/EN/ES).
  - O título, a descrição e o texto alternativo da imagem de partilha (`og:image:alt`) também se traduzem pelo `i18n.js`.
  - **Para acrescentar um texto:** escrevam-no em PT no `index.html` e acrescentem uma entrada no `i18n.js` com `en` e `es`.
  - Os títulos com uma parte em itálico (`<em class="s">`) são traduzidos por partes: cada lado do `<em>` tem a sua entrada.
- **Links externos:** Farmácia Online e Portal apontam para as páginas atuais de `www.nossafarmacia.pt` e `portal.nossafarmacia.pt`. Nossas Farmácias (menu e rodapé) aponta para o mapa do próprio site (`farmacias/`).

## Testes

Lighthouse 12.6 de 23/11/2026, no site publicado no GitHub Pages:

- Mobile: desempenho 99 (LCP 1,8 s, CLS 0), acessibilidade 97, boas práticas 100, SEO 100.
- Desktop: desempenho 100, acessibilidade 97, boas práticas 100, SEO 100.
- As páginas `/en/` e `/es/` geradas foram testadas localmente: sem pedidos falhados nem erros na consola, desempenho 96–98.
- Pontos que ficam: a cache curta do GitHub Pages (ver Requisitos do servidor) e o contraste dos passos de adesão ainda não ativos (texto esbatido até o scroll chegar a cada passo).
