#!/usr/bin/env node
/*
 * Gera a versão publicável do site em dist/:
 *  - copia site/ tal como está (a página PT é o index.html original);
 *  - gera dist/en/index.html e dist/es/index.html a partir do i18n.js, já traduzidas, para o
 *    Google indexar cada língua no seu URL (com canonical, hreflang e og:locale próprios);
 *  - gera sitemap.xml e robots.txt para o domínio de produção;
 *  - fora do domínio de produção (ex.: nossafarmaciait.github.io), marca tudo como noindex,
 *    para o Google não indexar a cópia de testes.
 *
 * Uso:  npm run build                 (produção: SITE_URL)
 *       DEPLOY_URL=https://… npm run build   (o endereço onde vai ser publicado, se for outro)
 *       npm run build:report          (lista também os textos sem tradução)
 */
import { JSDOM } from 'jsdom';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://grupo.nossafarmacia.pt/'; // domínio de produção (também no <head> do index.html)
const slash = u => (u.endsWith('/') ? u : u + '/');
const DEPLOY_URL = slash(process.env.DEPLOY_URL || SITE_URL);
const PRODUCTION = DEPLOY_URL === SITE_URL;
const REPORT = process.argv.includes('--report');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'site');
const OUT = path.join(ROOT, 'dist');

const LANGS = {
  pt: { html: 'pt-PT', og: 'pt_PT', dir: '' },
  en: { html: 'en', og: 'en_GB', dir: 'en/' },
  es: { html: 'es', og: 'es_ES', dir: 'es/' },
};

/* ---------- dicionário (o mesmo ficheiro que a página carrega) ---------- */
const sandbox = { window: {} };
vm.runInNewContext(await fs.readFile(path.join(SRC, 'i18n.js'), 'utf8'), sandbox);
const DICT = sandbox.window.GNF_I18N;
const norm = v => v.replace(/\s+/g, ' ').trim();

/* ---------- tradução: a mesma regra do translate() do index.html ---------- */
function translate(doc, lang, missing) {
  const t = v => {
    const k = norm(v);
    const out = DICT[k]?.[lang];
    if (!out && k && /\p{L}/u.test(k)) missing.add(k);
    return out || v;
  };
  const NF = doc.defaultView.NodeFilter;
  const skip = 'script,style,svg,[data-i18n]';
  const w = doc.createTreeWalker(doc.body, NF.SHOW_TEXT, {
    acceptNode: n => (n.parentElement.closest(skip) ? NF.FILTER_REJECT : NF.FILTER_ACCEPT),
  });
  for (let n; (n = w.nextNode()); ) {
    const src = n.nodeValue, k = norm(src);
    if (!k) continue;
    const out = t(k);
    if (out !== k) n.nodeValue = src.match(/^\s*/)[0] + out + src.match(/\s*$/)[0];
  }
  const sel = 'optgroup[label],[alt],[aria-label],[placeholder],[title],meta[name="description"],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"]';
  for (const el of doc.querySelectorAll(sel)) {
    for (const a of ['alt', 'aria-label', 'placeholder', 'title', 'content', 'label']) {
      if (el.hasAttribute(a) && el.getAttribute(a)) el.setAttribute(a, t(el.getAttribute(a)));
    }
  }
  doc.title = t(doc.title);
  return t;
}

/* ---------- caminhos relativos: a página EN/ES fica um nível abaixo ---------- */
const isRelative = u => u && !/^(#|\/|[a-z][a-z0-9+.-]*:)/i.test(u.trim());
const up = (u, prefix) => (isRelative(u) ? prefix + u.trim() : u);
function rebase(doc, prefix) {
  for (const a of ['src', 'href', 'data-src', 'data-poster', 'poster']) {
    for (const el of doc.querySelectorAll(`[${a}]`)) {
      if (el.tagName === 'A' && a === 'href' && el.getAttribute('href').startsWith('#')) continue;
      if (a === 'href' && el.hasAttribute('data-local')) continue; // link para outra página do site, na mesma língua
      el.setAttribute(a, up(el.getAttribute(a), prefix));
    }
  }
  for (const a of ['srcset', 'imagesrcset']) {
    for (const el of doc.querySelectorAll(`[${a}]`)) {
      el.setAttribute(a, el.getAttribute(a).split(',').map(part => {
        const [u, ...rest] = part.trim().split(/\s+/);
        return [up(u, prefix), ...rest].join(' ');
      }).join(', '));
    }
  }
  for (const st of doc.querySelectorAll('style')) {
    st.textContent = st.textContent.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => (isRelative(u) && !u.startsWith('data:') ? `url(${q}${prefix}${u}${q})` : m));
  }
}

/* ---------- metadados por língua ---------- */
function setMeta(doc, lang, t, page = '') {
  const L = LANGS[lang], url = SITE_URL + L.dir + page;
  const $ = s => doc.querySelector(s);
  doc.documentElement.lang = L.html;
  $('link[rel="canonical"]').href = url;
  // Open Graph: fora de produção aponta para o endereço publicado (o domínio de produção ainda serve o site antigo,
  // e as redes sociais seguem o og:url e descarregam o og:image daí)
  const shareBase = PRODUCTION ? SITE_URL : DEPLOY_URL;
  $('meta[property="og:url"]').content = shareBase + L.dir + page;
  const ogImg = $('meta[property="og:image"]');
  if (ogImg) ogImg.content = ogImg.content.replace(SITE_URL, shareBase);
  $('meta[property="og:locale"]').content = L.og;
  const alts = [...doc.querySelectorAll('meta[property="og:locale:alternate"]')];
  Object.entries(LANGS).filter(([k]) => k !== lang).forEach(([, o], i) => { if (alts[i]) alts[i].content = o.og; });
  for (const o of doc.querySelectorAll('#lang option')) o.selected = o.value === lang;

  const ld = $('script[type="application/ld+json"]');
  const data = JSON.parse(ld.textContent);
  for (const node of data['@graph']) {
    if (node['@type'] === 'WebPage') {
      Object.assign(node, {
        '@id': url + '#pagina', url, name: doc.title, inLanguage: L.html,
        description: $('meta[name="description"]').content,
      });
    } else if (node['@type'] === 'BreadcrumbList') {
      for (const it of node.itemListElement) {
        if (t) it.name = t(it.name);
        it.item = it.item.replace(SITE_URL, SITE_URL + L.dir);
      }
    } else {
      if (node.description && t) node.description = t(node.description);
      if (node['@type'] === 'Service' && t) node.name = t(node.name);
    }
  }
  ld.textContent = '\n' + JSON.stringify(data, null, 2) + '\n';
}

/* ---------- build ---------- */
await fs.rm(OUT, { recursive: true, force: true });
await fs.cp(SRC, OUT, { recursive: true, filter: s => !s.endsWith('.DS_Store') });

/* páginas: a principal (''), as dos serviços (site/servicos/<nome>/index.html → 'servicos/<nome>/'),
   o emprego e a Completus (a página da secção, emprego/ e completus/, e uma pasta por vaga ou produto) */
const exists = p => fs.access(path.join(SRC, p)).then(() => true, () => false);
const PAGES = [''];
for (const dir of ['servicos', 'emprego', 'completus']) {
  if (await exists(`${dir}/index.html`)) PAGES.push(`${dir}/`);
  for (const d of await fs.readdir(path.join(SRC, dir), { withFileTypes: true }).catch(() => [])) {
    if (d.isDirectory() && await exists(`${dir}/${d.name}/index.html`)) PAGES.push(`${dir}/${d.name}/`);
  }
}

const robotsMeta = PRODUCTION ? null : 'noindex, nofollow';
const missingAll = new Map(Object.keys(LANGS).filter(l => l !== 'pt').map(l => [l, new Set()]));

for (const page of PAGES) {
  const source = await fs.readFile(path.join(SRC, page, 'index.html'), 'utf8');
  for (const [lang, L] of Object.entries(LANGS)) {
    let html;
    if (lang === 'pt') {
      html = source; // a página PT publica-se como está no repositório
      if (robotsMeta) html = html.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${robotsMeta}">`);
      if (!PRODUCTION) html = html.replace(/(<meta property="og:(?:url|image)" content=")([^"]*)(">)/g, (m, a, u, b) => a + u.replace(SITE_URL, DEPLOY_URL) + b);
    } else {
      const dom = new JSDOM(source);
      const doc = dom.window.document;
      const t = translate(doc, lang, missingAll.get(lang));
      rebase(doc, '../'); // a página EN/ES fica um nível abaixo da PT
      doc.documentElement.dataset.lang = lang;
      doc.documentElement.dataset.root = '../' + (doc.documentElement.dataset.root || '');
      setMeta(doc, lang, t, page);
      if (robotsMeta) doc.querySelector('meta[name="robots"]').content = robotsMeta;
      html = dom.serialize();
    }
    await fs.mkdir(path.join(OUT, L.dir, page), { recursive: true });
    await fs.writeFile(path.join(OUT, L.dir, page, 'index.html'), html);
  }
}

/* 404: links e ícone relativos à raiz onde o site está publicado */
const p404 = path.join(OUT, '404.html');
const base = new URL(DEPLOY_URL).pathname;
await fs.writeFile(p404, (await fs.readFile(p404, 'utf8')).replace('<head>', `<head>\n<base href="${base}">`));

/* sitemap.xml */
let lastmod = new Date().toISOString().slice(0, 10);
try { lastmod = execSync('git log -1 --format=%cs -- site', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || lastmod; } catch {}
const urls = PAGES.map(page => {
  const alternates = Object.values(LANGS).map(o => `    <xhtml:link rel="alternate" hreflang="${o.html}" href="${SITE_URL + o.dir + page}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL + page}"/>`;
  return Object.values(LANGS).map(o => `  <url>\n    <loc>${SITE_URL + o.dir + page}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`).join('\n');
}).join('\n');
await fs.writeFile(path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);

/* robots.txt (só tem efeito na raiz de um domínio) */
await fs.writeFile(path.join(OUT, 'robots.txt'), PRODUCTION
  ? `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');

/* resumo */
console.log(`Build em dist/ para ${DEPLOY_URL}${PRODUCTION ? ' (produção, indexável)' : ' (não é produção: noindex)'}`);
console.log(`  ${PAGES.length} página(s) × ${Object.keys(LANGS).length} línguas: ${PAGES.map(p => '/' + p).join(', ')}`);
for (const [lang, missing] of missingAll) {
  console.log(`  ${lang}: ${missing.size} texto(s) sem tradução${missing.size && !REPORT ? ' (npm run build:report para os ver)' : ''}`);
  if (REPORT) for (const k of missing) console.log(`    - ${k}`);
}
