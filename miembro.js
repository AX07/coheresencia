(() => {
  const C = COH, $ = (s, r = document) => r.querySelector(s), app = $('#app'), sheet = $('#sheet');
  const slug = decodeURIComponent(location.pathname.replace(/^\/|\/$/g, '')), tok = location.hash.slice(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = 'hoy', db = C.load(), m = db.members.find((x) => x.slug === slug);
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };
  const contact = (text) => { const links = []; if (C.CFG.whatsapp) links.push(`<a class="btn" href="${C.wa(text, C.CFG.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`); links.push(`<a class="btn ${C.CFG.whatsapp ? 'ghost' : ''}" href="https://ig.me/m/${C.CFG.instagram}" target="_blank" rel="noopener">Instagram</a>`); return links.join(''); };

  // The link is the key: right name and right secret after the #, and the link not switched off.
  if (!m || !m.active || m.token !== tok) return app.innerHTML = `<div class="msg"><img class="star" src="/media/star.png" alt=""><h1>Este enlace no es válido</h1><p class="mute">Puede haber caducado o haberse desactivado. Escríbele a ${C.CFG.coach} y te enviará uno nuevo.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${contact('Hola, mi enlace de Coheresencia no funciona.')}</div></div>`;
  const expired = C.daysLeft(m) < -C.CFG.graceDays;
  if (expired) return app.innerHTML = `<div class="msg"><img class="star" src="/media/star.png" alt=""><h1>Tu membresía venció</h1><p class="mute">Venció el ${C.fmt(m.renew)}. Tu progreso está guardado: renueva con ${C.CFG.coach} y sigues donde lo dejaste.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${contact('Hola, quiero renovar mi membresía de Coheresencia.')}</div></div>`;

  const save = () => C.save(db);
  const first = m.name.split(' ')[0];
  const poster = (l) => `<img src="${l.poster}" alt="" loading="lazy">`;
  const week = () => { const a = C.activeDays(m), now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); return ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((n, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = C.dayKey(d); return `<span class="${a.has(k) ? 'on' : ''} ${k === C.dayKey(now) ? 'today' : ''}">${n}<i></i></span>`; }).join(''); };

  const views = {
    hoy() {
      const n = C.next(m), st = C.streak(m);
      return `${n ? `<section class="card next" data-open="${n.id}" style="cursor:pointer"><div class="ph">${poster(n)}</div><div><p class="eyebrow">Tu siguiente paso</p><h2>${esc(n.title)}</h2><p class="mute">${n.min} min · Cuerpo ${n.n + 1} de 10</p><button class="btn sm" style="margin-top:12px">Empezar</button></div></section>` : `<section class="card"><p class="eyebrow">Cuerpo</p><h2>Completaste el recorrido</h2><p class="mute">Repite la rutina completa cuando quieras o pasa a Respiración.</p></section>`}
      <section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><p class="eyebrow">Esta semana</p><span class="mute">${st ? `Racha de ${st} ${st === 1 ? 'día' : 'días'}` : 'Empieza hoy tu racha'}</span></div><div class="week">${week()}</div></section>
      <section class="card breathe"><p class="eyebrow">Pausa de un minuto</p><div class="orb" id="orb"><img src="/media/star.png" alt=""></div><p id="orbtxt" class="mute">Pulsa y respira conmigo</p><button class="btn ghost sm" id="orbbtn" style="margin-top:12px">Empezar</button></section>
      <section class="card"><p class="eyebrow">Tu membresía</p><p>Activa · renueva el ${C.fmt(m.renew)}</p></section>`;
    },
    cuerpo() {
      const cur = C.next(m);
      return `<div><p class="eyebrow">Cuerpo</p><h2 style="font-size:30px;margin-top:6px">Entrenamiento consciente</h2><p class="mute" style="margin-top:6px">Cada vídeo se desbloquea cuando marcas el anterior como hecho. A tu ritmo.</p></div>
      <div class="path">${C.lessons('cuerpo').map((l) => { const ok = C.unlocked(m, l), dn = !!m.done[l.id], isCur = cur && cur.id === l.id; return `<article class="card row ${dn ? 'done' : ''} ${isCur ? 'cur' : ''} ${ok ? '' : 'lock'}" ${ok ? `data-open="${l.id}"` : `data-locked="1"`}><span class="dot">${dn ? '✓' : ''}</span>${isCur ? '<img class="star sidestar" src="/media/star.png" alt="" style="width:34px;height:34px">' : ''}<div class="ph">${poster(l)}</div><div><h3>${esc(l.title)}</h3><small>${ok ? `${l.min} min` : 'Termina la anterior para abrirla'}</small></div><span class="go">${ok ? '›' : ''}</span></article>`; }).join('')}</div>`;
    },
    respiracion() {
      return `<div><p class="eyebrow">Respiración</p><h2 style="font-size:30px;margin-top:6px">Respiración funcional</h2><p class="mute" style="margin-top:6px">Acceso libre, sin orden. Elige según cómo te sientas hoy.</p></div>
      <div class="grid">${C.lessons('respiracion').map((l) => `<article class="card tile ${m.done[l.id] ? 'done' : ''}" data-open="${l.id}"><div class="ph">${poster(l)}</div><div class="t"><h3>${esc(l.title)}</h3><small>${l.min} min${m.done[l.id] ? ' · hecha ✓' : ''}</small></div></article>`).join('')}</div>`;
    },
    progreso() {
      const p = C.progress(m), R = 54, circ = 2 * Math.PI * R, all = C.LESSONS.length, n = Object.keys(m.done).length;
      const mins = C.LESSONS.filter((l) => m.done[l.id]).reduce((s, l) => s + l.min, 0);
      return `<section class="card" style="text-align:center"><p class="eyebrow">Tu progreso</p><div class="ring"><svg width="150" height="150" viewBox="0 0 150 150"><circle cx="75" cy="75" r="${R}" fill="none" stroke="rgba(247,240,222,.12)" stroke-width="9"/><circle cx="75" cy="75" r="${R}" fill="none" stroke="#e3bd72" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - p / 100)}" transform="rotate(-90 75 75)"/><text x="75" y="83" text-anchor="middle" fill="#f7f0de" font-family="Fraunces,serif" font-size="30" font-weight="300">${p}%</text></svg></div><p class="mute">${n} de ${all} lecciones</p></section>
      <section class="card stats"><div><b>${C.streak(m)}</b><small>días de racha</small></div><div><b>${mins}</b><small>minutos</small></div><div><b>${C.doneN(m, 'cuerpo')}/10</b><small>Cuerpo</small></div></section>
      <section class="card"><p class="eyebrow">Por recorrido</p>${Object.entries(C.TRACKS).map(([k, t]) => { const a = C.doneN(m, k), b = C.lessons(k).length; return `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between"><span>${t.name}</span><span class="mute">${a}/${b}</span></div><div class="bar" style="margin-top:6px"><i style="width:${(a / b) * 100}%"></i></div></div>`; }).join('')}</section>`;
    },
    uno() {
      return `<section class="card"><p class="eyebrow">Trabajo interno</p><h2 style="font-size:30px;margin:8px 0 10px">Sesiones uno a uno</h2><p class="mute">Respiración activa y acompañamiento profundo con ${C.CFG.coach}, online o presencial. Se reservan aparte de la membresía.</p></section>
      <section class="card"><p>Cuéntale qué necesitas y acordáis día y hora.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${contact(`Hola ${C.CFG.coach}, soy ${first}. Quiero reservar una sesión 1:1.`)}</div></section>`;
    },
  };

  function render() {
    app.innerHTML = `<header class="top"><img src="/media/logo-mark.png" alt="Coheresencia"><div><p class="eyebrow">Mi práctica</p><h1>Hola, ${esc(first)}</h1></div><span class="chip ${C.status(m)[1]}">${C.status(m)[0]}</span></header><main>${views[tab]()}</main>
    <nav class="tabs"><div>${[['hoy', 'Hoy'], ['cuerpo', 'Cuerpo'], ['respiracion', 'Respirar'], ['progreso', 'Progreso'], ['uno', '1:1']].map(([k, t]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div></nav>`;
  }
  const go = (t) => { tab = t; render(); scrollTo(0, 0); };

  function openLesson(id) {
    const l = C.LESSONS.find((x) => x.id === id), dn = !!m.done[id];
    sheet.innerHTML = `<div class="player">${poster(l)}<button class="close" data-close>‹ Volver</button><button class="play" aria-label="Reproducir" data-play></button><span class="tag">Vídeo de ejemplo</span></div>
    <div class="body"><p class="eyebrow">${C.TRACKS[l.track].name}${l.track === 'cuerpo' ? ` · ${l.n + 1} de 10` : ''} · ${l.min} min</p><h2>${esc(l.title)}</h2><p class="mute">${esc(l.text)}</p>
    <button class="btn" data-done="${id}" ${dn ? 'style="background:transparent;color:var(--gold)"' : ''}>${dn ? '✓ Hecha · toca para deshacer' : 'Marcar como hecha'}</button></div>`;
    sheet.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  const closeSheet = () => { sheet.classList.remove('on'); document.body.style.overflow = ''; };

  // the one-minute breathing orb: 4 s in, 6 s out
  let breathing = null;
  function breathe() {
    const orb = $('#orb'), t = $('#orbtxt'), b = $('#orbbtn');
    if (breathing) { clearInterval(breathing); breathing = null; orb.className = 'orb'; t.textContent = 'Pulsa y respira conmigo'; b.textContent = 'Empezar'; return; }
    let i = 0, step = () => { const inh = i % 2 === 0; orb.className = 'orb ' + (inh ? 'in' : 'out'); t.textContent = inh ? 'Inhala…' : 'Exhala…'; i++; };
    b.textContent = 'Parar'; step(); breathing = setInterval(step, 5000);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-open],[data-locked],[data-close],[data-play],[data-done],#orbbtn'); if (!t) return;
    if (t.dataset.tab) return go(t.dataset.tab);
    if (t.dataset.open) return openLesson(t.dataset.open);
    if (t.dataset.locked) return toast('Termina la lección anterior para abrir esta');
    if (t.dataset.close !== undefined) { closeSheet(); return render(); }
    if (t.dataset.play !== undefined) return toast('Aquí se reproducirá el vídeo de la lección');
    if (t.id === 'orbbtn') return breathe();
    if (t.dataset.done) {
      const id = t.dataset.done, l = C.LESSONS.find((x) => x.id === id);
      if (m.done[id]) { const nx = l.track === 'cuerpo' && C.lessons('cuerpo')[l.n + 1]; if (nx && m.done[nx.id]) return toast('Primero deshaz la siguiente'); delete m.done[id]; toast('Lección desmarcada'); }
      else { m.done[id] = new Date().toISOString(); const nx = l.track === 'cuerpo' && C.lessons('cuerpo')[l.n + 1]; toast(nx ? '¡Hecha! Se desbloquea la siguiente' : '¡Hecha! Buen trabajo'); }
      save(); closeSheet(); render();
    }
  });
  render();
})();
