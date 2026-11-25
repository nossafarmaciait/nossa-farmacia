/* Páginas de emprego: formulário de candidatura.
   O menu, a língua, o reveal, o ano e o vídeo do topo são do servicos/servico.js, que estas páginas também carregam.
   Os textos que o JS mostra estão no HTML (#msgs), para o build os traduzir com o resto da página. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- formulário de candidatura ---------- */
  const form = $('#cv-form');
  if (!form) return;
  const msg = k => $(`#msgs [data-m="${k}"]`)?.textContent.trim() || '';
  const status = $('#fstatus'), submit = $('button[type="submit"]', form);
  // Para onde vai a candidatura: o URL que recebe o formulário (Formspree, Basin, Odoo, API…).
  // Vazio = ainda não há envio online, e o botão abre o email com os dados (o CV anexa-se à mão).
  const endpoint = (form.dataset.endpoint || '').trim();
  const mailTo = form.dataset.email;
  $$('[data-when]', form).forEach(el => { el.hidden = el.dataset.when !== (endpoint ? 'online' : 'email'); });

  const MAX_MB = 5, EXT = /\.(pdf|docx?)$/i;
  const cv = $('#f-cv'), drop = cv.closest('.drop');
  const fmtSize = b => (b < 1024 * 1024 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB');

  const errorOf = el => {
    const v = el.validity;
    if (el === cv) {
      const f = cv.files[0];
      if (!f) return msg('cv');
      if (!EXT.test(f.name)) return msg('cv-type');
      if (f.size > MAX_MB * 1024 * 1024) return msg('cv-size');
      return '';
    }
    if (el.type === 'checkbox') return v.valueMissing ? msg('consent') : '';
    if (v.valueMissing) return msg('required');
    if (v.typeMismatch) return msg('email');
    if (v.patternMismatch) return msg('tel');
    return '';
  };
  const check = el => {
    const f = el.closest('.field'), err = f && $('.err', f);
    if (!err) return true;
    const m = errorOf(el);
    f.classList.toggle('invalid', !!m); err.textContent = m;
    el.setAttribute('aria-invalid', m ? 'true' : 'false');
    return !m;
  };
  const fields = () => $$('.field input,.field select,.field textarea', form); // os que têm .err são validados em check()
  fields().forEach(el => {
    const ev = el.type === 'checkbox' || el.type === 'file' || el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(ev, () => { if (el.value || el.checked || el.getAttribute('aria-invalid')) check(el); });
  });

  /* CV: mostra o ficheiro escolhido, permite removê-lo e realça a zona ao arrastar */
  const showFile = () => {
    const f = cv.files[0];
    drop.classList.toggle('has', !!f);
    if (f) { $('.drop-file .name', drop).textContent = f.name; $('.drop-file .size', drop).textContent = fmtSize(f.size); }
  };
  cv.addEventListener('change', showFile);
  $('.drop-x', drop).addEventListener('click', () => {
    cv.value = ''; showFile(); cv.focus();
    if (cv.getAttribute('aria-invalid') === 'true') check(cv);
  });
  ['dragenter', 'dragover'].forEach(e => cv.addEventListener(e, () => drop.classList.add('over')));
  ['dragleave', 'drop'].forEach(e => cv.addEventListener(e, () => drop.classList.remove('over')));

  const say = (text, bad) => { status.textContent = text; status.classList.toggle('bad', !!bad); };
  const labelOf = el => ($(`label[for="${el.id}"]`)?.textContent || el.name).replace(/\*/g, '').trim();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form._gotcha?.value) return; // robô
    const bad = fields().filter(el => !check(el));
    if (bad.length) { bad[0].focus(); say(msg('review'), true); return; }

    if (!endpoint) {
      // sem envio online: email pré-preenchido (os browsers não deixam anexar ficheiros a um mailto)
      const rows = $$('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([name="_gotcha"]),select,textarea', form)
        .map(el => `${labelOf(el)}: ${el.value.trim() || '—'}`);
      const body = [...rows, '', `${labelOf(cv)}: ${msg('attach')} (${cv.files[0].name})`].join('\n');
      const subject = `${form.vaga.value} — ${form.nome.value.trim()}`;
      location.href = `mailto:${mailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      say(msg('email-opened'));
      return;
    }

    const label = submit.firstChild.textContent;
    submit.disabled = true; submit.firstChild.textContent = msg('sending') + ' '; say('');
    try {
      const data = new FormData(form);
      data.set('_subject', `${form.vaga.value} — ${form.nome.value.trim()}`);
      const r = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      form.hidden = true;
      const done = $('#f-done');
      $('[data-name]', done).textContent = form.nome.value.trim().split(/\s+/)[0];
      done.hidden = false; done.focus();
    } catch {
      say(msg('error'), true);
    } finally {
      submit.disabled = false; submit.firstChild.textContent = label;
    }
  });
})();
