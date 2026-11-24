/* Página das farmácias: o mapa (Google Maps, com o agrupador oficial @googlemaps/markerclusterer em
   vendor/markerclusterer/), a pesquisa, "Perto de mim", a lista das farmácias na zona do mapa e os detalhes
   da farmácia escolhida, por baixo do mapa.
   O menu, a língua, o reveal e o ano são do servicos/servico.js, que esta página também carrega.
   Os textos que o JS mostra estão no HTML (#msgs), para o build os traduzir com o resto da página.

   GOOGLE MAPS
   - A chave (data-google-key) e o Map ID (data-google-map-id) do #f-map ficam vazios no código: o build
     preenche-os com GOOGLE_API_KEY e GOOGLE_MAP_ID (do .env em local, dos secrets do GitHub na publicação).
   - Sem chave, ou se a Google recusar a chave, a página mostra um aviso no lugar do mapa e a lista, a pesquisa
     e os detalhes continuam a funcionar.

   DE ONDE VÊM AS FARMÁCIAS
   - data-api do #f-map vazio: o ficheiro de exemplo farmacias/farmacias-exemplo.json (dados fictícios), e a página
     mostra o aviso "dados de exemplo".
   - data-api com um URL (a API do Portal): a página pede esse URL (GET, JSON) e o aviso desaparece.
   A resposta pode ser uma lista de farmácias ou { "farmacias": [...] }. Cada farmácia precisa de coordenadas;
   os outros campos são opcionais (o que faltar não aparece). Os nomes dos campos são os do ficheiro de exemplo;
   se a API usar outros, acrescentem-nos em normaliza(). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const box = $('#f-map');
  if (!box) return;
  const d = document.documentElement;
  const ROOT = d.dataset.root || '', LANG = d.dataset.lang || 'pt';
  const LOCALE = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES' }[LANG] || 'pt-PT';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const msg = (k, v = {}) => ($(`#msgs [data-m="${k}"]`)?.textContent.trim() || '').replace(/%([a-z])/g, (m, x) => (x in v ? v[x] : m));
  const status = $('#f-status'), mapMsg = $('.f-map-msg');
  const say = t => { status.textContent = t; };
  const cover = t => { mapMsg.textContent = t; mapMsg.hidden = !t; };

  const API = (box.dataset.api || '').trim();
  const FONTE = API || ROOT + 'farmacias/farmacias-exemplo.json';
  const KEY = (box.dataset.googleKey || '').trim(), MAP_ID = (box.dataset.googleMapId || '').trim() || 'DEMO_MAP_ID';

  /* ---------- dados: de cada registo da API para o que a página usa ---------- */
  const fold = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const num = v => (typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v));
  const txt = v => (v == null ? '' : String(v).trim());

  /* Horário: um campo por dia com os períodos em que está aberta, ex.
       "horario": { "seg": ["09:00-13:00", "14:30-19:30"], ..., "sab": ["09:00-13:00"], "dom": [] }
     [] (ou "fechado"/"encerrado") = fechada todo o dia; dia em falta = sem informação (mostra "—").
     Também aceita os dias em inglês (mon..sun), cada período como ["09:00", "13:00"] ou { abre, fecha }, e o dia
     como texto ("09:00-13:00, 14:30-19:30"). Fica como 7 dias (0 = segunda) com períodos em minutos [início, fim]. */
  const DIAS = [['seg', 'segunda', 'mon', 'monday'], ['ter', 'terca', 'tue', 'tuesday'], ['qua', 'quarta', 'wed', 'wednesday'],
    ['qui', 'quinta', 'thu', 'thursday'], ['sex', 'sexta', 'fri', 'friday'], ['sab', 'sabado', 'sat', 'saturday'], ['dom', 'domingo', 'sun', 'sunday']];
  const minutos = s => { const m = /^(\d{1,2})[:h.]?(\d{2})?$/.exec(txt(s)); return m && +m[1] <= 24 ? +m[1] * 60 + +(m[2] || 0) : null; };
  const periodo = p => {
    const [a, b] = Array.isArray(p) ? p : typeof p === 'object' && p ? [p.abre ?? p.inicio ?? p.open, p.fecha ?? p.fim ?? p.close] : txt(p).split(/\s*[-–]\s*/);
    const i = minutos(a), f = minutos(b);
    return i != null && f != null && f > i ? [i, f] : null;
  };
  const dia = v => {
    if (v == null) return null;
    if (typeof v === 'string') v = /fechad|encerrad|closed/i.test(v) ? [] : v.split(/\s*[,;]\s*|\s+(?=\d{1,2}[:h]\d{2}\s*[-–])/).filter(Boolean);
    if (Array.isArray(v) && v.length === 2 && v.every(x => typeof x === 'string' && !/[-–]/.test(x))) v = [v]; // ["09:00", "13:00"]
    return (Array.isArray(v) ? v : [v]).map(periodo).filter(Boolean).sort((a, z) => a[0] - z[0]);
  };
  function horas(h) {
    if (!h || typeof h !== 'object') return null;
    const k = Object.fromEntries(Object.entries(h).map(([n, v]) => [fold(n).replace(/-?feira$/, ''), v]));
    const semana = Array.isArray(h) ? DIAS.map((_, i) => dia(h[i])) : DIAS.map(nomes => dia(nomes.map(n => k[n]).find(v => v !== undefined)));
    return semana.some(d => d) ? semana : null;
  }

  function normaliza(r, i) {
    const c = r.coordenadas || {};
    const lat = num(r.latitude ?? r.lat ?? c.latitude ?? c.lat), lng = num(r.longitude ?? r.lng ?? r.lon ?? c.longitude ?? c.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    const f = {
      id: txt(r.id ?? i + 1), nome: txt(r.nome), morada: txt(r.morada), codigoPostal: txt(r.codigoPostal),
      localidade: txt(r.localidade), distrito: txt(r.distrito), telefone: txt(r.telefone), email: txt(r.email), lat, lng,
      horario: horas(r.horario ?? r.horarios ?? r.horarioFuncionamento),
    };
    f.busca = fold([f.nome, f.morada, f.codigoPostal, f.localidade, f.distrito].join(' '));
    return f;
  }

  /* ---------- utilitários ---------- */
  const fmt = n => new Intl.NumberFormat(LOCALE).format(n);
  const km = m => (m < 1000 ? `${fmt(Math.max(10, Math.round(m / 10) * 10))} m` : `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: m < 10000 ? 1 : 0 }).format(m / 1000)} km`);
  const metros = (a, b) => { // distância em linha reta (haversine)
    const R = 6371e3, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const lugar = f => [f.localidade, f.distrito && f.distrito !== f.localidade ? f.distrito : ''].filter(Boolean).join(' · ');
  const el = (tag, text, cls) => { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; };

  /* ---------- estado ---------- */
  let todas = [], visiveis = [], escolhida = null, eu = null;
  let map = null, Marker = null, grupo = null, euM = null; // Google Maps (null enquanto não carrega ou se falhar)

  /* ---------- mapa: Google Maps ---------- */
  const PT = { lat: 39.6, lng: -8 };
  const REGIOES = {
    continente: { south: 36.95, west: -9.55, north: 42.16, east: -6.19 },
    madeira: { south: 32.6, west: -17.3, north: 33.1, east: -16.25 },
    acores: { south: 36.9, west: -31.3, north: 39.75, east: -25 },
  };
  // o pino: a gota verde com a cruz do logótipo do Grupo (a mesma da página 404), em branco com as facetas a 100/70/40 %
  const PIN = '<svg viewBox="0 0 30 40" aria-hidden="true"><path class="p-body" d="M15 1C7.3 1 1 7.1 1 14.7 1 25 15 39 15 39s14-14 14-24.3C29 7.1 22.7 1 15 1Z"/>'
    + '<g fill="#fff" transform="translate(6.5 6.2) scale(.017)"><path fill-opacity=".7" d="M759.2,12.7H260.4l239.5,247.9l103.7-99.1L759.2,12.7"/><polygon fill-opacity=".4" points="260.1,12.7 260.1,499.5 260.4,499.8 499.7,260.6"/><polygon points="759.2,12.7 500,260.6 759.2,260.6"/><polygon fill-opacity=".7" points="12.5,240.5 12.5,739.3 260.1,500 260.1,499.5"/><polygon fill-opacity=".4" points="260.4,499.8 260.1,500.1 260.1,500 12.5,739.3 499.9,739.3"/><polygon points="260.4,499.8 260.4,240.5 12.5,240.5"/><polygon fill-opacity=".7" points="499.9,739.4 240.6,987.3 739.5,987.3"/><polygon fill-opacity=".4" points="739.5,499.9 499.9,739.4 739.5,987.3"/><polygon points="499.9,739.4 240.6,739.4 240.6,987.3"/><polygon fill-opacity=".7" points="987.5,260.4 739.6,500 987.5,759.3"/><path fill-opacity=".4" d="M987.5,260.4H759.2v0.1h-259L739.6,500L987.5,260.4z"/><polygon points="500.1,260.4 500.2,260.6 759.2,260.6 759.2,260.4"/><polygon points="739.6,500 739.6,759.3 987.5,759.3"/></g></svg>';
  const dentro = f => !map || !map.getBounds() || map.getBounds().contains(f);
  const centro = () => eu || map?.getCenter()?.toJSON() || PT;
  const semMapa = () => { // sem chave, chave recusada ou sem rede: fica a lista
    map = null; cover(msg('map-error')); box.classList.add('off'); lista();
  };
  window.gm_authFailure = semMapa; // a Google chama isto quando recusa a chave (domínio não autorizado, faturação, …)

  const carregaGoogle = () => new Promise((ok, falha) => {
    window.__gnfMapa = ok;
    const s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?' + new URLSearchParams({
      key: KEY, v: 'weekly', loading: 'async', language: { pt: 'pt-PT', en: 'en', es: 'es' }[LANG] || 'pt-PT', region: 'PT', callback: '__gnfMapa',
    });
    s.async = true; s.onerror = falha;
    document.head.append(s);
  });
  function enquadra(pontos, maxZoom = 15) {
    if (!map || !pontos.length) return;
    if (pontos.length === 1) { map.setCenter(pontos[0]); map.setZoom(maxZoom); return; }
    const b = new google.maps.LatLngBounds(); pontos.forEach(p => b.extend(p));
    map.fitBounds(b, 48);
    google.maps.event.addListenerOnce(map, 'idle', () => { if (map && map.getZoom() > maxZoom) map.setZoom(maxZoom); });
  }
  const foca = f => { if (!map) return; map.panTo(f); if (map.getZoom() < 16) map.setZoom(16); }; // a partir do zoom 16 não há grupos
  const marca = (f, on) => { if (!f.m) return; f.m.content.classList.toggle('on', on); f.m.zIndex = on ? 1000 : null; };

  async function iniciaMapa() {
    if (!KEY || !window.markerClusterer) throw new Error('sem chave');
    await carregaGoogle();
    const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([google.maps.importLibrary('maps'), google.maps.importLibrary('marker')]);
    Marker = AdvancedMarkerElement;
    map = new Map(box, {
      mapId: MAP_ID, center: PT, zoom: 6, isFractionalZoomEnabled: true, gestureHandling: 'cooperative', clickableIcons: false,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false, cameraControl: false, zoomControl: true,
    });
    map.fitBounds(REGIOES.continente, 0);
    map.addListener('idle', lista);
    const { MarkerClusterer, SuperClusterAlgorithm } = window.markerClusterer;
    grupo = new MarkerClusterer({
      map,
      algorithm: new SuperClusterAlgorithm({ radius: 64, maxZoom: 15 }),
      renderer: {
        render: ({ count, position }) => {
          const s = count < 10 ? 40 : count < 50 ? 48 : count < 150 ? 56 : 64, c = document.createElement('div');
          c.className = 'f-cl'; c.style.width = c.style.height = s + 'px';
          c.innerHTML = `<span aria-hidden="true">${fmt(count)}</span>`;
          return new Marker({ position, content: c, title: msg('cluster', { n: fmt(count) }), zIndex: 100 + count });
        },
      },
    });
  }
  function criaMarcadores() {
    todas.forEach(f => {
      const c = document.createElement('div'); c.className = 'f-pin'; c.innerHTML = PIN;
      f.m = new Marker({ position: { lat: f.lat, lng: f.lng }, content: c, title: f.nome, gmpClickable: true });
      f.m.addEventListener('gmp-click', () => escolhe(f, 'mapa')); // também com Enter/Espaço (o marcador é um botão)
    });
  }

  /* ---------- lista: as farmácias visíveis no mapa, das mais perto (de si ou do centro do mapa) para as mais longe ---------- */
  const items = $('#f-items'), nLista = $('.f-list-n'), nota = $('.f-list-note'), MAX = 40;
  function lista() {
    const c = centro();
    const zona = visiveis.filter(f => dentro({ lat: f.lat, lng: f.lng }));
    zona.forEach(f => { f.d = metros(c, f); });
    zona.sort((a, z) => a.d - z.d);
    const foco = document.activeElement?.closest?.('#f-items button')?.dataset.id; // não perder o foco do teclado ao refazer a lista
    items.replaceChildren(...zona.slice(0, MAX).map(f => {
      const li = document.createElement('li'), bt = document.createElement('button');
      bt.type = 'button'; bt.dataset.id = f.id;
      bt.append(el('b', f.nome), el('span', lugar(f)));
      if (eu) bt.append(el('span', km(f.d), 'f-km'));
      if (f === escolhida) bt.setAttribute('aria-current', 'true');
      bt.addEventListener('click', () => escolhe(f, 'lista'));
      li.append(bt); return li;
    }));
    nLista.textContent = fmt(zona.length);
    nota.textContent = zona.length > MAX ? msg('list-more', { n: fmt(zona.length - MAX) }) : zona.length ? '' : msg('list-none');
    if (foco) items.querySelector(`button[data-id="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
  }

  /* ---------- detalhes da farmácia escolhida (por baixo do mapa) ---------- */
  const det = $('#farmacia'), card = $('.f-det-card', det);
  const anuncio = el('p', '', 'sr-only'); anuncio.setAttribute('aria-live', 'polite'); det.after(anuncio);
  const F = k => $(`[data-f="${k}"]`, det), row = k => $(`[data-row="${k}"]`, det);
  const tel = t => 'tel:' + t.replace(/[^\d+]/g, '');

  /* horário: a semana, dia a dia, e se está aberta agora (na hora local da farmácia: os Açores têm menos uma hora) */
  const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const nomeDia = i => new Intl.DateTimeFormat(LOCALE, { weekday: 'long', timeZone: 'UTC' }).format(Date.UTC(2024, 0, 1 + i)); // 1/1/2024 foi segunda
  const maiuscula = s => s.charAt(0).toLocaleUpperCase(LOCALE) + s.slice(1);
  const agora = f => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: f.lng < -24.5 ? 'Atlantic/Azores' : 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { d: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday), m: +p.hour * 60 + +p.minute };
  };
  const sempre = h => h.every(d => d && d.length === 1 && d[0][0] === 0 && d[0][1] === 1440);
  function estado(f) {
    const h = f.horario, { d, m } = agora(f);
    if (sempre(h)) return { aberta: true, texto: msg('h-24-7') };
    const ja = (h[d] || []).find(([a, z]) => a <= m && m < z);
    if (ja) return { aberta: true, texto: msg('h-open', { t: hhmm(ja[1]) }) };
    for (let k = 0; k < 7; k++) { // a próxima abertura: ainda hoje, amanhã ou noutro dia da semana
      const i = (d + k) % 7, p = (h[i] || []).find(([a]) => k > 0 || a > m);
      if (p) return { aberta: false, texto: msg(k === 0 ? 'h-next-today' : k === 1 ? 'h-next-tomorrow' : 'h-next-day', { t: hhmm(p[0]), w: nomeDia(i) }) };
    }
    return { aberta: false, texto: msg('h-closed') };
  }
  const horLista = $('[data-f="horario"]', det), horEstado = $('[data-f="estado"]', det);
  function preencheHorario(f) {
    row('horario').hidden = !f.horario;
    if (!f.horario) return;
    const e = estado(f), hoje = agora(f).d;
    horEstado.textContent = e.texto; horEstado.classList.toggle('on', e.aberta);
    horLista.replaceChildren(...f.horario.map((ps, i) => {
      const li = document.createElement('li'), h = el('span', '', 'f-hor-h');
      li.append(el('span', maiuscula(nomeDia(i)), 'f-hor-d'));
      if (i === hoje) { li.className = 'hoje'; li.firstChild.append(' ', el('small', msg('h-today'))); }
      if (!ps) h.append(el('span', '—'));
      else if (!ps.length) h.append(el('span', msg('h-closed-day'), 'f-hor-off'));
      else ps.forEach(([a, z], k) => {
        // entre dois períodos, a hora a que está fechada: "09:00 – 13:00 · Fechado 13:00 – 14:30 · 14:30 – 19:30"
        if (k) h.append(el('span', msg('h-pause', { a: hhmm(ps[k - 1][1]), b: hhmm(a) }), 'f-hor-off'));
        h.append(el('span', a === 0 && z === 1440 ? msg('h-24') : `${hhmm(a)} – ${hhmm(z)}`));
      });
      li.append(h); return li;
    }));
  }
  setInterval(() => { if (escolhida?.horario && !document.hidden) preencheHorario(escolhida); }, 60000); // "aberta agora" muda com a hora

  function preenche(f) {
    F('local').textContent = lugar(f);
    F('nome').textContent = f.nome;
    F('morada').textContent = f.morada;
    F('cp').textContent = [f.codigoPostal, f.localidade].filter(Boolean).join(' ');
    row('morada').hidden = !f.morada && !f.codigoPostal;
    F('telefone').textContent = f.telefone; F('telefone').href = tel(f.telefone); row('telefone').hidden = !f.telefone;
    F('email').textContent = f.email; F('email').href = 'mailto:' + f.email; row('email').hidden = !f.email;
    row('distancia').hidden = !eu;
    if (eu) F('distancia').textContent = msg('dist', { d: km(metros(eu, f)) });
    F('rota').href = `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}`;
    F('ligar').href = tel(f.telefone); F('ligar').hidden = !f.telefone;
    preencheHorario(f);
  }
  function escolhe(f, origem) {
    if (escolhida && escolhida !== f) marca(escolhida, false);
    escolhida = f; marca(f, true);
    preenche(f);
    card.hidden = false; det.classList.add('on');
    anuncio.textContent = [f.nome, lugar(f)].filter(Boolean).join(', ');
    history.replaceState(null, '', '?farmacia=' + encodeURIComponent(f.id) + location.hash);
    if (origem !== 'mapa') foca({ lat: f.lat, lng: f.lng }); // da lista ou do link: levar o mapa até à farmácia, já fora do grupo
    items.querySelectorAll('button').forEach(b => (b.dataset.id === f.id ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    if (origem !== 'url') det.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }
  $('.f-det-close', det).addEventListener('click', () => {
    if (escolhida) marca(escolhida, false);
    escolhida = null; card.hidden = true; det.classList.remove('on'); det.focus();
    items.querySelectorAll('[aria-current]').forEach(b => b.removeAttribute('aria-current'));
    history.replaceState(null, '', location.pathname + location.hash);
  });

  /* ---------- pesquisa: localidade, código postal, nome, morada ou distrito, sem ligar a acentos ---------- */
  const q = $('#f-q');
  function filtra(mover) {
    const texto = q.value.trim(), termos = fold(texto).split(/\s+/).filter(Boolean);
    visiveis = termos.length ? todas.filter(f => termos.every(t => f.busca.includes(t))) : todas;
    if (grupo) { grupo.clearMarkers(true); grupo.addMarkers(visiveis.map(f => f.m)); }
    if (!termos.length) say(msg('total', { n: fmt(todas.length) }));
    else if (!visiveis.length) say(msg('none', { q: texto }));
    else say(visiveis.length === 1 ? msg('found1', { q: texto }) : msg('found', { n: fmt(visiveis.length), q: texto }));
    if (mover && termos.length && visiveis.length) {
      // "braga" também encontra Bragança e "lisboa" o distrito todo: se o texto for o nome de uma localidade, o mapa vai
      // para essa localidade; senão, se for o de um distrito, para o distrito; senão, para todas as encontradas
      const t = termos.join(' '), so = k => visiveis.filter(f => fold(f[k]) === t);
      const alvo = [so('localidade'), so('distrito'), visiveis].find(l => l.length);
      enquadra(alvo.map(f => ({ lat: f.lat, lng: f.lng })));
    }
    lista();
  }
  let espera;
  q.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => filtra(true), 220); });
  $('.f-bar').addEventListener('submit', e => { e.preventDefault(); clearTimeout(espera); filtra(true); });

  /* ---------- Perto de mim ---------- */
  const geo = $('.f-geo');
  geo.addEventListener('click', () => {
    if (!navigator.geolocation) return say(msg('geo-none'));
    geo.setAttribute('aria-busy', 'true'); say(msg('geo-wait'));
    navigator.geolocation.getCurrentPosition(p => {
      geo.removeAttribute('aria-busy');
      eu = { lat: p.coords.latitude, lng: p.coords.longitude };
      if (map) {
        if (!euM) {
          const c = document.createElement('div'); c.className = 'f-me';
          euM = new Marker({ map, content: c, title: msg('you'), zIndex: 2000 });
        }
        euM.position = eu;
        const perto = [...visiveis].sort((a, z) => metros(eu, a) - metros(eu, z)).slice(0, 5);
        enquadra([eu, ...perto.map(f => ({ lat: f.lat, lng: f.lng }))]);
      }
      say(msg('geo-ok'));
      if (escolhida) preenche(escolhida);
      lista();
    }, () => { geo.removeAttribute('aria-busy'); say(msg('geo-error')); }, { timeout: 10000, maximumAge: 300000 });
  });

  /* ---------- Continente, Madeira, Açores ---------- */
  document.querySelectorAll('[data-regiao]').forEach(b => b.addEventListener('click', () => { if (map) map.fitBounds(REGIOES[b.dataset.regiao], 0); }));

  /* ---------- carregar: os dados e o mapa ao mesmo tempo ---------- */
  (async () => {
    cover(msg('loading')); say(msg('loading'));
    const mapa = iniciaMapa().then(() => true, () => false);
    try {
      const r = await fetch(FONTE, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      todas = (Array.isArray(j) ? j : j.farmacias || []).map(normaliza).filter(Boolean);
    } catch (e) {
      cover(msg('error')); say(msg('error')); return;
    }
    $('.f-demo').hidden = !!API;
    if (await mapa && map) { criaMarcadores(); cover(''); } else semMapa();
    filtra(false);
    const id = new URLSearchParams(location.search).get('farmacia'); // link para uma farmácia: ?farmacia=<id>
    const f = id && todas.find(x => x.id === id);
    if (f) escolhe(f, 'url');
  })();
})();
