/* Páginas de serviço: menu, língua, reveal e ano. O texto já chega traduzido (o build gera /en/ e /es/). */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const d = document.documentElement;
  const ROOT = d.dataset.root || '', PAGE = d.dataset.page || '';
  const file = location.protocol === 'file:' ? 'index.html' : '';

  // a abrir do disco (file://) as pastas não abrem o index.html sozinhas
  if (file) $$('a[data-local]').forEach(a => {
    const h = a.getAttribute('href'), [p, hash] = h.split('#');
    if (!p || p.endsWith('/')) a.setAttribute('href', p + 'index.html' + (hash !== undefined ? '#' + hash : ''));
  });

  /* Nav: transparente sobre o topo escuro, sólida depois */
  const nav = $('#nav'), hero = $('.s-hero');
  const setNav = () => nav.classList.toggle('solid', scrollY > hero.offsetHeight - 90 || document.body.classList.contains('menu-open'));
  setNav(); addEventListener('scroll', setNav, { passive: true }); addEventListener('resize', setNav);
  const menuBtn = $('.menu-btn');
  const CLOSE = { pt: 'Fechar menu', en: 'Close menu', es: 'Cerrar menú' };
  const labels = [menuBtn.getAttribute('aria-label'), CLOSE[d.dataset.lang] || CLOSE.pt];
  const closeMenu = () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', labels[0]); setNav(); };
  menuBtn.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', labels[open ? 1 : 0]); setNav();
    if (open) $('#sheet a')?.focus();
  });
  $$('#sheet a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('menu-open')) { closeMenu(); menuBtn.focus(); }
    $$('.f-seal:hover,.f-seal:focus').forEach(el => { // Esc esconde a dica dos selos
      el.classList.add('tip-off');
      const on = () => { el.classList.remove('tip-off'); el.removeEventListener('mouseleave', on); el.removeEventListener('blur', on); };
      el.addEventListener('mouseleave', on); el.addEventListener('blur', on);
    });
  });

  /* Língua: cada língua é uma página estática; o seletor leva à mesma página na outra língua */
  const langSel = $('#lang');
  langSel.value = d.dataset.lang || 'pt';
  langSel.addEventListener('change', () => {
    const l = langSel.value;
    location.href = (ROOT || './') + (l === 'pt' ? '' : l + '/') + PAGE + file;
  });

  /* Reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.rv').forEach(el => reduce ? el.classList.add('in') : io.observe(el));

  $('#year').textContent = new Date().getFullYear();
})();
