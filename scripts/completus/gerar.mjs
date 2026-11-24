#!/usr/bin/env node
/*
 * Gera a página Completus a partir de scripts/completus/produtos.json:
 *  - site/completus/index.html           a gama (um cartão por produto)
 *  - site/completus/<slug>/index.html    a página de cada produto, com a embalagem para rodar
 *  - o bloco "Completus" do site/i18n.js  (traduções EN/ES dos textos destas páginas)
 *
 * O menu e o rodapé vêm de site/emprego/index.html, para ficarem iguais aos das outras páginas.
 * As imagens (site/img/completus/<slug>/) são feitas por scripts/completus/imagens.py.
 *
 * Uso: npm run completus   (depois: npm run build, como sempre)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = path.join(RAIZ, 'site');
const SITE_URL = 'https://grupo.nossafarmacia.pt/';
const { produtos: P } = JSON.parse(fs.readFileSync(path.join(RAIZ, 'scripts/completus/produtos.json'), 'utf8'));
// tamanho de cada recorte (para o width/height do <img>), lido do cabeçalho do WebP
for (const p of P) {
  const b = fs.readFileSync(path.join(RAIZ, 'site/img/completus', p.slug, 'recorte.webp'));
  const vp8x = b.toString('ascii', 12, 16) === 'VP8X';
  p.recorte = vp8x ? [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)] : [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}
const LOJA = 'https://www.nossafarmacia.pt/completus?_q=completus&map=ft';
const FARMACIAS = 'https://portal.nossafarmacia.pt/NossasFarmacias/';

/* ---------- textos das páginas (PT → EN, ES) ---------- */
const T = {
  tituloGama: ['Completus® · Grupo Nossa Farmácia', 'Completus® · Grupo Nossa Farmácia', 'Completus® · Grupo Nossa Farmácia'],
  descGama: ['Completus®, a marca própria do Grupo Nossa Farmácia: suplementos alimentares para a imunidade, o sono, as articulações, o intestino e muito mais. Conheça a gama.',
    'Completus®, Grupo Nossa Farmácia’s own brand: food supplements for immunity, sleep, joints, gut health and more. Discover the range.',
    'Completus®, la marca propia del Grupo Nossa Farmácia: complementos alimenticios para la inmunidad, el sueño, las articulaciones, el intestino y mucho más. Conozca la gama.'],
  h1b: ['a marca própria do Grupo.', 'the Group’s own brand.', 'la marca propia del Grupo.'],
  verGama: ['Ver a gama', 'See the range', 'Ver la gama'],
  comprar: ['Comprar na Farmácia Online', 'Buy at the Online Pharmacy', 'Comprar en la Farmacia Online'],
  gama: ['A gama', 'The range', 'La gama'],
  h2a: ['Suplementos alimentares', 'Food supplements', 'Complementos alimenticios'],
  h2b: ['para o dia a dia.', 'for every day.', 'para el día a día.'],
  leadGama: ['Escolha um produto para ver o que contém, como se toma e a embalagem de todos os ângulos.',
    'Choose a product to see what it contains, how to take it and the pack from every angle.',
    'Elija un producto para ver qué contiene, cómo se toma y el envase desde todos los ángulos.'],
  altGama: ['As 12 embalagens da gama Completus®, lado a lado.', 'The 12 packs of the Completus® range, side by side.', 'Los 12 envases de la gama Completus®, uno al lado del otro.'],
  verProduto: ['Ver produto', 'View product', 'Ver producto'],
  ctaA: ['Disponível nas farmácias', 'Available in the Group’s', 'Disponible en las farmacias'],
  ctaB: ['do Grupo.', 'pharmacies.', 'del Grupo.'],
  ctaP: ['Peça a Completus® na farmácia do Grupo mais perto de si ou compre na Farmácia Online.',
    'Ask for Completus® at your nearest Group pharmacy or buy it at the Online Pharmacy.',
    'Pida Completus® en la farmacia del Grupo más cercana o cómprelo en la Farmacia Online.'],
  irLoja: ['Ir para a Farmácia Online', 'Go to the Online Pharmacy', 'Ir a la Farmacia Online'],
  encontrar: ['Encontrar uma farmácia', 'Find a pharmacy', 'Encontrar una farmacia'],
  suplemento: ['Suplemento alimentar', 'Food supplement', 'Complemento alimenticio'],
  verTodos: ['Ver toda a gama', 'See the whole range', 'Ver toda la gama'],
  sobre: ['Sobre o produto', 'About the product', 'Sobre el producto'],
  composicao: ['Composição', 'Ingredients', 'Composición'],
  modo: ['Modo de utilização', 'How to use', 'Modo de empleo'],
  precaucoes: ['Precauções', 'Precautions', 'Precauciones'],
  aviso: ['Os suplementos alimentares não devem ser utilizados como substitutos de um regime alimentar variado e de um modo de vida saudável.',
    'Food supplements should not be used as a substitute for a varied diet and a healthy lifestyle.',
    'Los complementos alimenticios no deben utilizarse como sustitutos de una dieta variada y de un estilo de vida saludable.'],
  outros: ['Outros produtos', 'Other products', 'Otros productos'],
  maisGama: ['Mais da gama', 'More from the range', 'Más de la gama'],
  rodar: ['Rodar a embalagem', 'Rotate the pack', 'Girar el envase'],
  arraste: ['Arraste para rodar', 'Drag to rotate', 'Arrastre para girar'],
  anterior: ['Rodar para a esquerda', 'Rotate left', 'Girar a la izquierda'],
  seguinte: ['Rodar para a direita', 'Rotate right', 'Girar a la derecha'],
  ampliar: ['Ampliar imagem', 'Enlarge image', 'Ampliar imagen'],
  fechar: ['Fechar', 'Close', 'Cerrar'],
  vistaDe: ['Vista %i de %n', 'View %i of %n', 'Vista %i de %n'],
};
const pt = k => T[k][0];
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const parte = nome => nome.replace(/^Completus\s+/, ''); // "Completus Vitamina D 4000 UI" → "Vitamina D 4000 UI"
const altDe = p => `Embalagem de ${p.nome}.`;
const maiuscula = s => s.charAt(0).toLocaleUpperCase('pt') + s.slice(1);
function ingredientes(p, l) {
  const partes = p.composicao[l].replace(/\.\s*$/, '').split(/;\s*/);
  const [ultimo, ...resto] = partes.pop().split(/\.\s+/);
  return { itens: [...partes, ultimo].map(maiuscula), nota: resto.length ? resto.join('. ') + '.' : '' };
}

/* ---------- menu e rodapé (de site/emprego/index.html, com a raiz e o Completus® certos) ---------- */
const base = fs.readFileSync(path.join(SITE, 'emprego/index.html'), 'utf8');
const bloco = (a, b) => { const i = base.indexOf(a), j = base.indexOf(b, i); if (i < 0 || j < 0) throw new Error('bloco não encontrado: ' + a); return base.slice(i, j + b.length); };
const SPRITE = bloco('<svg width="0" height="0"', '</svg>').replace('</svg>', `  <symbol id="i-rotate" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></symbol>
  <symbol id="i-zoom" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v6M8 11h6"/></symbol>
  <symbol id="i-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
  <symbol id="i-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
</svg>`);
const raiz = (html, R) => html
  .replace(/(href|src)="\.\.\/(?!\.)/g, `$1="${R}`)
  .replace(' aria-current="page"', '')
  .replace('href="https://portal.nossafarmacia.pt/MarcasProprias/" rel="noopener">Completus®', `href="${R}completus/" data-local>Completus®`);
// no menu, a Completus® fica marcada como a página atual
const HEADER = R => raiz(bloco('<header class="nav" id="nav">', '</header>'), R).replaceAll(`href="${R}completus/" data-local>Completus®`, `href="${R}completus/" data-local aria-current="page">Completus®`);
const FOOTER = R => raiz(bloco('<footer class="footer"', '</footer>'), R);

/* ---------- partes comuns ---------- */
function head({ R, page, title, desc, ld, preload = '' }) {
  const url = SITE_URL + page;
  return `<!doctype html>
<html lang="pt-PT" data-root="${R}" data-page="${page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<!-- Gerado por scripts/completus/gerar.mjs a partir de produtos.json: não editar à mão. As versões /en/ e /es/ são geradas no build. -->
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="pt-PT" href="${url}">
<link rel="alternate" hreflang="en" href="${SITE_URL}en/${page}">
<link rel="alternate" hreflang="es" href="${SITE_URL}es/${page}">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta name="theme-color" content="#0B2720">
<link rel="icon" href="${R}favicon.ico" sizes="48x48">
<link rel="icon" href="${R}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${R}apple-touch-icon.png">
<link rel="manifest" href="${R}site.webmanifest">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Grupo Nossa Farmácia">
<meta property="og:locale" content="pt_PT">
<meta property="og:locale:alternate" content="en_GB">
<meta property="og:locale:alternate" content="es_ES">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE_URL}media/og-1200x630.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logótipo do Grupo Nossa Farmácia e a frase “Cerca de 400 farmácias, os mesmos valores.” sobre o balcão de uma farmácia do Grupo.">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${R}fonts/hanken-grotesk-var.woff2" as="font" type="font/woff2" crossorigin>
${preload}<link rel="stylesheet" href="${R}servicos/servico.css">
<link rel="stylesheet" href="${R}completus/completus.css">
<script>document.documentElement.classList.add('js')</script>
<script type="application/ld+json">
${JSON.stringify({ '@context': 'https://schema.org', '@graph': ld }, null, 2)}
</script>
</head>
<body>
<a class="skip" href="#conteudo">Saltar para o conteúdo</a>

<!-- Icon sprite -->
${SPRITE}

${HEADER(R)}
`;
}
const foot = R => `
${FOOTER(R)}

<script src="${R}servicos/servico.js" defer></script>
<script src="${R}completus/completus.js" defer></script>
</body>
</html>
`;
const webPage = (page, title, desc, crumbs, extra = {}) => [
  { '@type': 'WebPage', '@id': SITE_URL + page + '#pagina', url: SITE_URL + page, name: title, inLanguage: 'pt-PT', description: desc,
    isPartOf: { '@id': SITE_URL + '#website' }, breadcrumb: { '@id': SITE_URL + page + '#migalhas' }, ...extra },
  { '@type': 'BreadcrumbList', '@id': SITE_URL + page + '#migalhas',
    itemListElement: crumbs.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + p })) },
];
const imgCapa = (R, p, sizes, lazy = true) =>
  `<img src="${R}img/completus/${p.slug}/capa-640.webp" srcset="${R}img/completus/${p.slug}/capa-640.webp 640w, ${R}img/completus/${p.slug}/capa-1200.webp 1200w" sizes="${sizes}" width="640" height="640" alt="${esc(altDe(p))}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
const cartao = (R, href, p, i) => `      <li class="cp rv" style="--d:${(i % 4) * 0.05}s">
        <a href="${href}" data-local>
          <figure>${imgCapa(R, p, '(max-width:600px) 92vw, (max-width:1000px) 46vw, 290px')}</figure>
          <div class="cp-body"><h3><small>Completus</small> ${esc(parte(p.nome))}</h3><p>${esc(p.resumo.pt)}</p><span class="cp-meta">${esc(p.embalagem.pt)}</span><span class="more">${pt('verProduto')} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span></div>
        </a>
      </li>`;

/* ---------- a gama ---------- */
{
  const R = '../', page = 'completus/';
  const title = pt('tituloGama'), desc = pt('descGama');
  const html = head({ R, page, title, desc,
    preload: `<link rel="preload" as="image" href="${R}img/completus/gama-1000.webp" imagesrcset="${R}img/completus/gama-1000.webp 1000w, ${R}img/completus/gama-2000.webp 2000w" imagesizes="(max-width:900px) 94vw, 780px">\n`,
    ld: webPage(page, title, desc, [['Início', ''], ['Completus®', page]], { about: { '@type': 'Brand', name: 'Completus' } }) })
  + `
<main id="conteudo">
<section class="s-hero g-hero" id="topo" aria-labelledby="s-title">
  <div class="wrap s-hero-in">
    <div class="s-hero-copy">
      <nav class="crumbs" aria-label="Localização"><a href="../" data-local>Início</a><span aria-hidden="true">/</span><span aria-current="page">Completus®</span></nav>
      <h1 id="s-title">Completus® <em class="s">${pt('h1b')}</em></h1>
      <p class="lead">Acreditamos que ao criarmos produtos de marca própria, com foco na qualidade, diferenciação e inovação, estamos a conferir prestígio ao aconselhamento farmacêutico, fidelizando e atraindo novos utentes. Naturalmente, marcamos pela diferença!</p>
      <div class="s-ctas">
        <a class="btn btn-light" href="#gama">${pt('verGama')} <svg class="icon" aria-hidden="true"><use href="#i-down"/></svg></a>
        <a class="btn btn-ghost-dark" href="${LOJA}" rel="noopener">${pt('comprar')} <svg class="icon" aria-hidden="true"><use href="#i-ext"/></svg></a>
      </div>
    </div>
    <figure class="gama-shot"><img src="${R}img/completus/gama-1000.webp" srcset="${R}img/completus/gama-1000.webp 1000w, ${R}img/completus/gama-2000.webp 2000w" sizes="(max-width:900px) 94vw, 780px" width="1000" height="622" alt="${pt('altGama')}" fetchpriority="high" decoding="async"></figure>
  </div>
</section>

<section class="section" id="gama" aria-labelledby="gama-title">
  <div class="wrap">
    <div class="g-head">
      <div>
        <p class="eyebrow rv">${pt('gama')}</p>
        <h2 class="h2 rv" id="gama-title" style="--d:.05s">${pt('h2a')} <em class="s">${pt('h2b')}</em></h2>
      </div>
      <p class="lead rv" style="--d:.1s">${pt('leadGama')}</p>
    </div>
    <ul class="cp-list">
${P.map((p, i) => cartao(R, `${p.slug}/`, p, i)).join('\n')}
    </ul>
  </div>
</section>

<section class="section s-cta" aria-labelledby="cta-title" style="padding-block:0 clamp(80px,10vw,128px)">
  <div class="wrap">
    <div class="cta-card rv">
      <div>
        <h2 class="h2" id="cta-title">${pt('ctaA')} <em class="s">${pt('ctaB')}</em></h2>
        <p>${pt('ctaP')}</p>
      </div>
      <div class="cta-actions">
        <a class="btn btn-light" href="${LOJA}" rel="noopener">${pt('irLoja')} <svg class="icon" aria-hidden="true"><use href="#i-ext"/></svg></a>
        <a class="link-arrow on-dark" href="${FARMACIAS}" rel="noopener">${pt('encontrar')}</a>
      </div>
    </div>
  </div>
</section>
</main>
` + foot(R);
  fs.mkdirSync(path.join(SITE, page), { recursive: true });
  fs.writeFileSync(path.join(SITE, page, 'index.html'), html);
}

/* ---------- um produto ---------- */
function viewer(R, p) {
  const dir = `${R}img/completus/${p.slug}/`, n = p.imagens.angulos > 1 ? p.imagens.angulos : 0;
  if (!n) return `    <figure class="pv" data-frames="1">
      <div class="pv-stage"><img class="pv-f on" src="${dir}capa-1200.webp" width="1200" height="1200" alt="${esc(altDe(p))}" fetchpriority="high"></div>
      <button class="pv-zoom" type="button" aria-label="${pt('ampliar')}"><svg class="icon" aria-hidden="true"><use href="#i-zoom"/></svg></button>
    </figure>`;
  const s = p.imagens.inicio || 0;
  const imgs = Array.from({ length: n }, (_, i) => i === s
    ? `<img class="pv-f on" src="${dir}angulo-${i + 1}.webp" width="1200" height="1200" alt="${esc(altDe(p))}" fetchpriority="high">`
    : `<img class="pv-f" data-src="${dir}angulo-${i + 1}.webp" width="1200" height="1200" alt="">`).join('\n        ');
  return `    <figure class="pv" data-frames="${n}" data-start="${s}" data-loop="${p.imagens.loop ? 1 : 0}">
      <div class="pv-stage" role="slider" tabindex="0" aria-label="${pt('rodar')}" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${s + 1}">
        ${imgs}
      </div>
      <button class="pv-zoom" type="button" aria-label="${pt('ampliar')}"><svg class="icon" aria-hidden="true"><use href="#i-zoom"/></svg></button>
      <div class="pv-ui">
        <button class="pv-prev" type="button" aria-label="${pt('anterior')}"><svg class="icon" aria-hidden="true"><use href="#i-left"/></svg></button>
        <span class="pv-hint"><svg class="icon" aria-hidden="true"><use href="#i-rotate"/></svg>${pt('arraste')}</span>
        <button class="pv-next" type="button" aria-label="${pt('seguinte')}"><svg class="icon" aria-hidden="true"><use href="#i-right"/></svg></button>
      </div>
      <span class="pv-msg" hidden>${pt('vistaDe')}</span>
    </figure>`;
}
for (const [idx, p] of P.entries()) {
  const R = '../../', page = `completus/${p.slug}/`;
  const title = `${p.nome} · Completus® · Grupo Nossa Farmácia`;
  const desc = p.descricao[0].pt;
  const outros = [1, 2, 3, 4].map(k => P[(idx + k) % P.length]);
  const n = p.imagens.angulos > 1 ? p.imagens.angulos : 0, s = p.imagens.inicio || 0;
  const lcp = n ? `img/completus/${p.slug}/angulo-${s + 1}.webp` : `img/completus/${p.slug}/capa-1200.webp`;
  const ld = webPage(page, title, desc, [['Início', ''], ['Completus®', 'completus/'], [p.nome, page]], { mainEntity: { '@id': SITE_URL + page + '#produto' } });
  ld.push({ '@type': 'Product', '@id': SITE_URL + page + '#produto', name: p.nome, description: desc, sku: p.cnp,
    brand: { '@type': 'Brand', name: 'Completus' }, manufacturer: { '@id': SITE_URL + '#organizacao' },
    image: `${SITE_URL}img/completus/${p.slug}/capa-1200.webp`, category: pt('suplemento') });
  const html = head({ R, page, title, desc, ld,
    preload: `<link rel="preload" as="image" href="${R}${lcp}">\n` })
  + `
<main id="conteudo">
<section class="s-hero p-hero" id="topo" aria-labelledby="s-title">
  <div class="wrap s-hero-in">
    <div class="s-hero-copy">
      <nav class="crumbs" aria-label="Localização"><a href="../../" data-local>Início</a><span aria-hidden="true">/</span><a href="../" data-local>Completus®</a></nav>
      <h1 id="s-title">Completus <em class="s">${esc(parte(p.nome))}</em></h1>
      <p class="lead">${esc(p.resumo.pt)}</p>
      <ul class="p-facts">
        <li>${esc(p.embalagem.pt)}</li>
        <li>${pt('suplemento')}</li>
        <li>CNP ${p.cnp}</li>
      </ul>
      <div class="s-ctas">
        <a class="btn btn-light" href="${p.comprar}" rel="noopener">${pt('comprar')} <svg class="icon" aria-hidden="true"><use href="#i-ext"/></svg></a>
        <a class="btn btn-ghost-dark" href="../" data-local>${pt('verTodos')}</a>
      </div>
    </div>
${viewer(R, p)}
  </div>
</section>

<section class="section p-info" aria-labelledby="sobre-title">
  <div class="wrap p-info-in">
    <div class="p-side">
      <h2 class="h2 rv" id="sobre-title">${pt('sobre')}</h2>
      <img class="p-pack rv" src="${R}img/completus/${p.slug}/recorte.webp" width="${p.recorte[0]}" height="${p.recorte[1]}" alt="" loading="lazy" decoding="async" style="--d:.08s">
    </div>
    <div class="p-main">
      <div class="p-desc rv">
${p.descricao.map(d => `        <p>${esc(d.pt)}</p>`).join('\n')}
      </div>
      <dl class="p-spec">
        <div class="p-row rv"><dt><span>01</span>${pt('modo')}</dt><dd class="p-modo">
${p.modo.map(m => `          <p>${esc(m.pt)}</p>`).join('\n')}
        </dd></div>
        <div class="p-row rv"><dt><span>02</span>${pt('composicao')}</dt><dd>
          <ul class="p-ingr">
${ingredientes(p, 'pt').itens.map(i => `            <li>${esc(i)}</li>`).join('\n')}
          </ul>${ingredientes(p, 'pt').nota ? `
          <p class="p-ingr-nota">${esc(ingredientes(p, 'pt').nota)}</p>` : ''}
        </dd></div>
${p.precaucoes.length ? `        <div class="p-row rv"><dt><span>03</span>${pt('precaucoes')}</dt><dd>
          <ul class="p-prec">
${p.precaucoes.map(c => `            <li>${esc(c.pt)}</li>`).join('\n')}
          </ul>
        </dd></div>
` : ''}      </dl>
      <p class="p-note rv">${pt('aviso')}</p>
    </div>
  </div>
</section>

<section class="section p-more" aria-labelledby="mais-title">
  <div class="wrap">
    <p class="eyebrow rv">${pt('maisGama')}</p>
    <h2 class="h2 rv" id="mais-title" style="--d:.05s">${pt('outros')} <em class="s">Completus®</em></h2>
    <ul class="cp-list cp-4">
${outros.map((o, i) => cartao(R, `../${o.slug}/`, o, i)).join('\n')}
    </ul>
  </div>
</section>
</main>

<dialog class="pv-dialog" aria-label="${esc(p.nome)}">
  <form method="dialog"><button class="pv-close" type="submit" aria-label="${pt('fechar')}"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button></form>
</dialog>
` + foot(R);
  fs.mkdirSync(path.join(SITE, page), { recursive: true });
  fs.writeFileSync(path.join(SITE, page, 'index.html'), html);
}

/* ---------- traduções: bloco Completus do i18n.js ---------- */
const i18nPath = path.join(SITE, 'i18n.js');
let i18n = fs.readFileSync(i18nPath, 'utf8');
const INI = '  /* ---------- Completus (gerado por scripts/completus/gerar.mjs a partir de produtos.json: não editar à mão) ---------- */\n';
const FIM = '  /* ---------- fim Completus ---------- */\n';
if (i18n.includes(INI)) i18n = i18n.slice(0, i18n.indexOf(INI)) + i18n.slice(i18n.indexOf(FIM) + FIM.length);
const fora = new Set([...i18n.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*\{/gm)].map(m => JSON.parse(`"${m[1]}"`)));
const pares = new Map();
const add = (ptx, en, es) => { if (!fora.has(ptx) && !pares.has(ptx) && (en !== ptx || es !== ptx)) pares.set(ptx, { en, es }); };
for (const v of Object.values(T)) add(...v);
for (const p of P) {
  add(altDe(p), `${p.nome} pack.`, `Envase de ${p.nome}.`);
  add(`${p.nome} · Completus® · Grupo Nossa Farmácia`, `${p.nome} · Completus® · Grupo Nossa Farmácia`, `${p.nome} · Completus® · Grupo Nossa Farmácia`);
  for (const f of ['embalagem', 'resumo']) add(p[f].pt, p[f].en, p[f].es);
  const [ip, ie, is] = ['pt', 'en', 'es'].map(l => ingredientes(p, l));
  if (ip.itens.length !== ie.itens.length || ip.itens.length !== is.itens.length) throw new Error(`${p.slug}: a composição não tem o mesmo número de itens (separados por ";") em PT, EN e ES`);
  ip.itens.forEach((x, i) => add(x, ie.itens[i], is.itens[i]));
  if (ip.nota) add(ip.nota, ie.nota, is.nota);
  for (const f of ['descricao', 'modo', 'precaucoes']) for (const x of p[f]) add(x.pt, x.en, x.es);
}
const linhas = [...pares].map(([k, v]) => `  ${JSON.stringify(k)}: { en: ${JSON.stringify(v.en)}, es: ${JSON.stringify(v.es)} },`).join('\n');
const MARCA = '  /* ---------- Rodapé ---------- */';
if (!i18n.includes(MARCA)) throw new Error('i18n.js: não encontrei o bloco do Rodapé');
i18n = i18n.replace(MARCA, INI + linhas + '\n' + FIM + MARCA);
fs.writeFileSync(i18nPath, i18n);

console.log(`Completus: ${P.length} produtos, ${pares.size} traduções no i18n.js`);
