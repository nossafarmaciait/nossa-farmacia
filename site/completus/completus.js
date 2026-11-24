/* Páginas Completus: rodar a embalagem e ampliar a imagem.
   O menu, a língua, o reveal e o ano são do servicos/servico.js, que estas páginas também carregam.
   A embalagem só roda quando a pessoa a arrasta (rato ou dedo), usa as setas do teclado ou os botões:
   não há rotação automática. */
(() => {
  const dialog = document.querySelector('.pv-dialog');
  if (dialog) dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); }); // clicar fora fecha

  document.querySelectorAll('.pv').forEach(fig => {
    const stage = fig.querySelector('.pv-stage'), frames = [...fig.querySelectorAll('.pv-f')], n = frames.length;
    let cur = Math.max(0, frames.findIndex(f => f.classList.contains('on')));

    fig.querySelector('.pv-zoom')?.addEventListener('click', () => {
      if (!dialog) return;
      let img = dialog.querySelector('img'); // criada aqui para a página não ter um <img> sem imagem
      if (!img) { img = new Image(1200, 1200); dialog.prepend(img); }
      img.alt = frames.find(f => f.alt)?.alt || '';
      img.src = frames[cur].currentSrc || frames[cur].src;
      dialog.showModal();
    });
    if (n < 2) return;

    const loop = fig.dataset.loop === '1';
    const msg = fig.querySelector('.pv-msg')?.textContent.trim() || '%i / %n';
    const prev = fig.querySelector('.pv-prev'), next = fig.querySelector('.pv-next');
    frames.forEach(f => f.addEventListener('dragstart', e => e.preventDefault()));

    // as outras vistas só descarregam quando a pessoa se aproxima da imagem
    let loaded = false;
    const load = () => { if (loaded) return; loaded = true; frames.forEach(f => { if (f.dataset.src) { f.src = f.dataset.src; f.removeAttribute('data-src'); } }); };
    ['pointerenter', 'pointerdown', 'focusin', 'touchstart'].forEach(e => fig.addEventListener(e, load, { once: true, passive: true }));

    const label = () => {
      stage.setAttribute('aria-valuenow', cur + 1);
      stage.setAttribute('aria-valuetext', msg.replace('%i', cur + 1).replace('%n', n));
      if (!loop) { prev.disabled = cur === 0; next.disabled = cur === n - 1; }
    };
    const show = i => {
      i = loop ? ((i % n) + n) % n : Math.max(0, Math.min(n - 1, i));
      if (i === cur) return;
      load();
      frames[cur].classList.remove('on'); frames[i].classList.add('on'); cur = i; label();
    };
    label();

    // arrastar: para a esquerda mostra o lado direito da embalagem (como se a rodássemos com a mão)
    let x0 = 0, c0 = 0, drag = null;
    stage.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      drag = e.pointerId; x0 = e.clientX; c0 = cur;
      stage.setPointerCapture(e.pointerId); stage.classList.add('dragging');
    });
    stage.addEventListener('pointermove', e => {
      if (e.pointerId !== drag) return;
      const step = Math.max(24, stage.clientWidth * .8 / (loop ? n : n + 1)); // uma volta inteira em ~80% da largura
      show(c0 - Math.round((e.clientX - x0) / step));
    });
    const end = e => { if (e.pointerId !== drag) return; drag = null; stage.classList.remove('dragging'); };
    stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

    stage.addEventListener('keydown', e => {
      const k = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (k) { e.preventDefault(); show(cur + k); }
      else if (e.key === 'Home') { e.preventDefault(); show(0); }
      else if (e.key === 'End') { e.preventDefault(); show(n - 1); }
    });
    prev.addEventListener('click', () => show(cur - 1));
    next.addEventListener('click', () => show(cur + 1));
  });
})();
