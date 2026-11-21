/*
 * Grava os vídeos de demonstração do site (desktop e mobile) com Playwright + Google Chrome.
 *
 * Uso (a partir da pasta do projeto):
 *   npm i --no-save playwright        # ou NODE_PATH=<pasta com node_modules>
 *   node demo/gravar-demo.cjs          # grava desktop e mobile
 *   node demo/gravar-demo.cjs mobile   # só uma das versões
 *
 * Gera demo/gnf-demo-desktop.mp4 e demo/gnf-demo-mobile.mp4 (precisa do ffmpeg no PATH).
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'site', 'index.html');
const OUT = __dirname;
const wait = ms => new Promise(r => setTimeout(r, ms));

// Visible cursor (desktop) and tap ripple (mobile): Playwright's recordings show neither by default.
const pointerOverlay = () => {
  addEventListener('DOMContentLoaded', () => {
    const st = document.createElement('style');
    st.textContent = `
      #pw-cursor{position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
        background:rgba(255,255,255,.9);border:2px solid #0B2720;box-shadow:0 2px 10px rgba(0,0,0,.35);
        z-index:2147483647;pointer-events:none;transition:transform .15s;opacity:0}
      #pw-cursor.down{transform:scale(.7)}
      .pw-tap{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;
        background:rgba(0,98,74,.35);border:2px solid rgba(255,255,255,.9);z-index:2147483647;pointer-events:none;
        animation:pwtap .6s ease-out forwards}
      @keyframes pwtap{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}`;
    document.head.append(st);
    const c = document.createElement('div'); c.id = 'pw-cursor';
    if (!matchMedia('(pointer: coarse)').matches) document.body.append(c); // touch devices only get the tap ripple
    addEventListener('mousemove', e => { c.style.opacity = 1; c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }, true);
    addEventListener('mousedown', () => c.classList.add('down'), true);
    addEventListener('mouseup', () => c.classList.remove('down'), true);
    addEventListener('touchstart', e => {
      const t = e.touches[0]; const r = document.createElement('div'); r.className = 'pw-tap';
      r.style.left = t.clientX + 'px'; r.style.top = t.clientY + 'px'; document.body.append(r); setTimeout(() => r.remove(), 700);
    }, true);
  });
};

// Eased scroll to an absolute Y, or to an element's top (minus the fixed nav).
const scrollTo = (page, target, ms = 1800) => page.evaluate(([target, ms]) => new Promise(done => {
  const y0 = scrollY;
  let y1 = typeof target === 'number' ? target : document.querySelector(target).getBoundingClientRect().top + scrollY - 76;
  y1 = Math.max(0, Math.min(y1, document.documentElement.scrollHeight - innerHeight));
  const t0 = performance.now(), ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const step = now => {
    const k = Math.min(1, (now - t0) / ms);
    window.scrollTo({ top: y0 + (y1 - y0) * ease(k), behavior: 'instant' });
    k < 1 ? requestAnimationFrame(step) : done();
  };
  requestAnimationFrame(step);
}), [target, ms]);

const by = (page, dy, ms) => page.evaluate(() => scrollY).then(y => scrollTo(page, y + dy, ms));

const pickLang = async (page, value, { mobile } = {}) => {
  if (mobile) await page.locator('#lang').tap();
  else {
    const box = await page.locator('#lang').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
    await wait(350);
  }
  await page.selectOption('#lang', value);
};

async function desktop(page) {
  await page.mouse.move(980, 520);
  await wait(1600);
  // Hero: the video advances with the scroll.
  const span = await page.evaluate(() => document.querySelector('.hero-scroll').offsetHeight - innerHeight);
  await scrollTo(page, span, 7000);
  await wait(1800);
  await page.mouse.move(420, 610, { steps: 30 });
  await wait(900);

  await scrollTo(page, '#grupo', 1800); await wait(2400);
  await by(page, 520, 2200); await wait(1200);

  await scrollTo(page, '.filme', 1800); await wait(500);
  const play = await page.locator('.film .play').boundingBox();
  await page.mouse.move(play.x + play.width / 2, play.y + play.height / 2, { steps: 30 });
  await wait(1600);

  await scrollTo(page, '#servicos', 1800); await wait(1800);
  await by(page, 560, 2400); await wait(1800);

  await scrollTo(page, '#proposta', 1800); await wait(1200);
  await by(page, 180, 900);
  for (const id of ['#t-2', '#t-6', '#t-7']) {
    const sel = id;
    const b = await page.locator(sel).boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 25 });
    await wait(250); await page.click(sel); await wait(2300);
  }

  // Language switcher: EN, ES, back to PT.
  await pickLang(page, 'en'); await wait(2600);
  await pickLang(page, 'es'); await wait(2600);
  await pickLang(page, 'pt'); await wait(1200);

  await scrollTo(page, '#aderir', 1800); await wait(600);
  await by(page, 620, 3400); await wait(800);
  await scrollTo(page, '#pedido', 1800); await wait(800);
  for (const [sel, text] of [['#f-farmacia', 'Farmácia Central'], ['#f-local', 'Lisboa']]) {
    const b = await page.locator(sel).boundingBox();
    await page.mouse.move(b.x + 40, b.y + b.height / 2, { steps: 25 });
    await page.click(sel); await page.keyboard.type(text, { delay: 70 }); await wait(400);
  }
  await wait(1200);

  await scrollTo(page, '#parceiros', 2000); await wait(4200);
  await scrollTo(page, '#emprego', 1600); await wait(1600);
  await scrollTo(page, 999999, 1600); await wait(2200);
}

async function mobile(page) {
  await wait(1400);
  // Hero: on mobile the video advances as it scrolls out of view.
  const span = await page.evaluate(() => document.querySelector('.hero-media').offsetHeight * .85);
  await scrollTo(page, span, 5000); await wait(1400);

  // Menu → Serviços
  await page.locator('.menu-btn').tap(); await wait(1500);
  await page.locator('#sheet a[href="#servicos"]').tap(); await wait(2200);
  await by(page, 900, 3600); await wait(1200);

  await scrollTo(page, '#proposta', 1800); await wait(900);
  await by(page, 230, 900);
  for (const id of ['#t-2', '#t-6']) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await page.locator(id).tap(); await wait(2400);
  }
  await by(page, 520, 1800); await wait(1600);

  await pickLang(page, 'en', { mobile: true }); await wait(2400);
  await pickLang(page, 'es', { mobile: true }); await wait(2400);
  await pickLang(page, 'pt', { mobile: true }); await wait(1000);

  await scrollTo(page, '#aderir', 1800); await wait(500);
  await by(page, 900, 3800); await wait(800);
  await scrollTo(page, '#pedido', 1600); await wait(800);
  await page.locator('#f-farmacia').tap(); await page.keyboard.type('Farmácia Central', { delay: 70 }); await wait(1000);

  await scrollTo(page, '#parceiros', 1800); await wait(3800);
  await scrollTo(page, 999999, 1800); await wait(2000);
}

async function record(name, contextOpts, run) {
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gnf-demo-'));
  const browser = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
  const size = { width: contextOpts.viewport.width * (contextOpts.deviceScaleFactor || 1), height: contextOpts.viewport.height * (contextOpts.deviceScaleFactor || 1) };
  const context = await browser.newContext({ ...contextOpts, locale: 'pt-PT', recordVideo: { dir: tmp, size } });
  await context.addInitScript(pointerOverlay);
  const page = await context.newPage();
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForSelector('#hero-video.playing', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await wait(400);
  const trim = (Date.now() - t0) / 1000;
  await run(page);
  const video = page.video();
  await context.close(); await browser.close();
  const webm = await video.path();
  const out = path.join(OUT, `gnf-demo-${name}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', trim.toFixed(2), '-i', webm,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', out]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('✓', out);
}

(async () => {
  const only = process.argv[2];
  if (!only || only === 'desktop')
    await record('desktop', { viewport: { width: 1440, height: 900 } }, desktop);
  if (!only || only === 'mobile')
    await record('mobile', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }, mobile);
})().catch(e => { console.error(e); process.exit(1); });
