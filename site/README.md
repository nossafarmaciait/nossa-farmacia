# Landing page — Grupo Nossa Farmácia

Página estática (HTML, CSS e JS embutidos, sem build nem backend). Basta copiar o conteúdo desta pasta para a raiz do domínio ou de um subdomínio.

## Estrutura

```
index.html        página única (CSS e JS inline), com o texto em português
i18n.js           traduções EN e ES (só é carregado quando o visitante escolhe EN ou ES)
favicon.svg
fonts/            Hanken Grotesk (variável) e Instrument Serif itálico, woff2, alojadas localmente
img/              logótipos GNF (SVG), foto de O Grupo (AVIF/WebP), serviços (WebP 760/1200), eDeliveries e parceiros (WebP)
                  premios/: selos PME Líder 2020, 2022-2025 e PME Excelência 2023 e 2025 (WebP transparente)
media/            vídeo da hero (MP4 H.264 + WebM VP9, desktop 16:9 e mobile 4:5) e posters (AVIF/WebP)
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
  - `index.html`: `no-cache` ou um `max-age` curto.

## Comportamento

- **Vídeo da hero:** não reproduz sozinho. Carrega depois do evento `load` e avança ou recua conforme o scroll.
  - Em desktop a hero fica fixa durante o scroll da secção, e o texto aparece aos 70% do vídeo.
  - Em mobile (≤ 767 px) usa a versão 4:5, com o MP4 em primeiro lugar. A hero não fica fixa e o texto está sempre visível.
  - Os vídeos têm um keyframe a cada 6 frames, para o recuo ser fluido. Se forem substituídos, devem ser recodificados da mesma forma.
  - Com `prefers-reduced-motion`, ou se o vídeo falhar, mostra apenas o poster.
  - O letreiro "FARMÁCIA" (fonte Hanken Grotesk) e a cruz branca do logótipo na parede verde foram aplicados por composição, seguindo o movimento da câmara frame a frame; o resto do vídeo não foi alterado. Scripts e elementos em `../higgsfield/hero-letreiro/`; o master editado é `../higgsfield/video/final_1080p_master-letreiro.mp4` e a versão anterior está em `../higgsfield/deliverables/sem-letreiro/`.
- **Clips da Proposta de valor:** só o clip do separador aberto é carregado e reproduzido, e apenas enquanto a secção está no ecrã. Com `prefers-reduced-motion` mostra só o poster.
  - **Nossa AI:** o separador descreve o assistente para o público (sem detalhes técnicos internos). O ecrã do tablet no clip é abstrato, sem texto. O número do painel (piloto em mais de 100 farmácias) deve ser atualizado no `index.html` e no `i18n.js` quando mudarem.
  - Foram gerados no Higgsfield. Os originais e os prompts estão em `../higgsfield/proposta/`.
  - Para o loop não ter salto, os últimos 0,75 s de cada clip fazem um crossfade para o início.
  - **COMPLETUS:** rotação 3D da caixa Completus Imunidade (12 s em loop, abranda na frente). Não é IA: as faces foram recortadas das 5 fotos da caixa (em `../higgsfield/completus-3d/fotos/`) e a caixa é renderizada em 3D, por isso o texto da embalagem fica fiel. Texturas e script em `../higgsfield/completus-3d/`; para gerar de novo: `python render.py <pasta das texturas> video completus.mp4` (precisa de numpy e opencv). O clip anterior (Própolis) está em `../higgsfield/proposta/completus-propolis-kenburns.mp4`.
- **Vídeo dos passos de adesão:** avança e recua com o scroll pela timeline, com uma cena por passo. Fica fixo ao lado dos passos em desktop e, em mobile, numa faixa baixa no topo. Cada cena coincide com o passo destacado. Só carrega quando a secção se aproxima. Com `prefers-reduced-motion` mostra só o poster.
  - Os originais (4 imagens e 4 clips) estão em `../higgsfield/adesao/`. Se o vídeo for substituído, deve manter um keyframe a cada 6 frames (`-g 6`) para recuar sem solavancos.
- **Fundo do cartão Emprego:** só é carregado e reproduzido quando o cartão está no ecrã. Com `prefers-reduced-motion` mostra só o poster.
- **Imagens geradas com IA:** as fotos dos Serviços, o fundo do Emprego, os clips da Proposta e o vídeo da adesão foram gerados no Higgsfield. Os originais e os prompts estão em `../higgsfield/servicos/`, `../higgsfield/proposta/` e `../higgsfield/adesao/`. As pessoas são geradas e servem só de ambiente; não devem ser apresentadas como colaboradores ou clientes reais.
- **Prémios (IAPMEI):** a faixa no fim de O Grupo mostra os selos em vigor (PME Líder 2025 e PME Excelência 2025) e os anos de distinção: PME Líder em 2020, 2022, 2023, 2024 e 2025 (em 2021 não houve), com PME Excelência em 2023 e 2025. O rodapé mostra os 7 selos. Os diplomas estão em `../premios/`, em nome da Addo Pharm, S.A., a denominação oficial do Grupo.
  - Os selos foram recortados dos diplomas. Não havia diploma da PME Excelência 2025, por isso esse selo foi feito a partir do de 2023, trocando o "3" por um "5" retirado do selo PME Líder '25 (a mesma fonte). Deve ser substituído pelo selo oficial quando o tiverem.
  - **Cada novo ano:** juntem o ano à lista `aw-years`, troquem os selos da faixa e acrescentem um selo ao `f-awards` do rodapé, no `index.html`, com a dica (`f-tip`) do novo selo, e a mesma frase no `i18n.js`.
- **Vídeo institucional:** o YouTube (`youtube-nocookie.com`) só é carregado quando o visitante carrega em reproduzir.
- **Formulário de adesão:** não envia dados para nenhum servidor. Ao submeter, abre o programa de email do utilizador com o pedido preenchido para `grupo@nossafarmacia.pt`. Para trocar por um endpoint próprio, alterem o handler `submit` no fim de `index.html`.
- **Idiomas (PT, EN, ES):** o seletor fica no menu. O português está no `index.html`; o `i18n.js` tem as traduções, com o texto em PT como chave.
  - A escolha fica guardada no browser e pode ser forçada pelo URL com `?lang=en` ou `?lang=es`. Sem nada disso, o site abre em PT.
  - **Para alterar um texto:** mudem-no no `index.html` e atualizem a mesma chave no `i18n.js`. Se a chave deixar de coincidir, esse texto fica em PT nas outras línguas.
  - **Para acrescentar um texto:** escrevam-no em PT no `index.html` e acrescentem uma entrada no `i18n.js` com `en` e `es`.
  - Os títulos com uma parte em itálico (`<em class="s">`) são traduzidos por partes: cada lado do `<em>` tem a sua entrada.
- **Links externos:** Farmácia Online, Portal, Nossas Farmácias, COMPLETUS e Emprego apontam para as páginas atuais de `grupo.nossafarmacia.pt` e `www.nossafarmacia.pt`.

## Testes

Os testes de 19/11/2026 (Lighthouse e Chrome headless) foram feitos antes do vídeo controlado pelo scroll e das secções Serviços, Vídeo institucional e eDeliveries. É preciso repeti-los.
