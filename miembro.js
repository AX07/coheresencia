COH.ready.then(() => {
  const C = COH, $ = (s, r = document) => r.querySelector(s), app = $('#app'), sheet = $('#sheet');
  const slug = decodeURIComponent(location.pathname.replace(/^\/|\/$/g, '')), tok = location.hash.slice(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = 'inicio', db = C.load(), m = db.members.find((x) => x.slug === slug);
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

  const ring = (p, size) => { const R = size * .36, c = 2 * Math.PI * R, h = size / 2; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p}% completado"><circle cx="${h}" cy="${h}" r="${R}" fill="none" stroke="rgba(247,240,222,.12)" stroke-width="${size / 17}"/><circle cx="${h}" cy="${h}" r="${R}" fill="none" stroke="#e3bd72" stroke-width="${size / 17}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" transform="rotate(-90 ${h} ${h})"/><text x="${h}" y="${h + size / 18}" text-anchor="middle" fill="#f7f0de" font-family="Fraunces,serif" font-size="${size / 5}" font-weight="300">${p}%</text></svg>`; };
  const minutes = () => C.LESSONS.filter((l) => m.done[l.id]).reduce((s, l) => s + l.min, 0);
  const bars = () => Object.entries(C.TRACKS).map(([k, t]) => { const a = C.doneN(m, k), b = C.lessons(k).length || 1; return `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between"><span>${t.name}</span><span class="mute">${a}/${b}</span></div><div class="bar" style="margin-top:6px"><i style="width:${(a / b) * 100}%"></i></div></div>`; }).join('');
  const views = {
    inicio() {
      const n = C.next(m), st = C.streak(m), p = C.progress(m), cu = C.lessons('cuerpo'), re = C.lessons('respiracion');
      const door = (tab, name, sub, extra) => `<button class="card door" data-tab="${tab}"><span class="eyebrow">${name}</span><b>${sub}</b><small class="mute">${extra}</small></button>`;
      return `${n ? `<section class="card next" data-open="${n.id}" style="cursor:pointer"><div class="ph">${poster(n)}</div><div><p class="eyebrow">Tu siguiente paso</p><h2>${esc(n.title)}</h2><p class="mute">${n.min} min · Cuerpo ${n.n + 1} de ${cu.length}</p><button class="btn sm" style="margin-top:12px">Empezar</button></div></section>` : `<section class="card"><p class="eyebrow">Cuerpo</p><h2>Completaste el recorrido</h2><p class="mute">Repite la rutina completa cuando quieras o pasa a Respiración.</p></section>`}
      <section class="card sum"><div class="sumring">${ring(p, 100)}</div><div class="stats"><div><b>${st}</b><small>días de racha</small></div><div><b>${minutes()}</b><small>minutos</small></div><div><b>${Object.keys(m.done).length}</b><small>lecciones</small></div></div></section>
      <section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><p class="eyebrow">Esta semana</p><span class="mute">${st ? `Racha de ${st} ${st === 1 ? 'día' : 'días'}` : 'Empieza hoy tu racha'}</span></div><div class="week">${week()}</div></section>
      <div class="doors">${door('cuerpo', 'Cuerpo', `${C.doneN(m, 'cuerpo')}/${cu.length}`, 'Entrenamiento')}${door('respiracion', 'Respirar', `${C.doneN(m, 'respiracion')}/${re.length}`, 'Respiración')}${door('uno', '1:1', 'Sesiones', 'con ' + C.CFG.coach)}</div>
      <section class="card breathe"><p class="eyebrow">Pausa de un minuto</p><div class="orb" id="orb"><img src="/media/star.png" alt=""></div><p class="mute">Inhala 4, exhala 6. Yo te marco el ritmo.</p><button class="btn ghost sm" data-pacer="calma" style="margin-top:12px">Respirar ahora</button></section>`;
    },
    cuerpo() {
      const cur = C.next(m);
      return `<div><p class="eyebrow">Cuerpo</p><h2 style="font-size:30px;margin-top:6px">Entrenamiento consciente</h2><p class="mute" style="margin-top:6px">Cada vídeo se desbloquea cuando marcas el anterior como hecho. A tu ritmo.</p></div>
      <div class="path">${C.lessons('cuerpo').map((l) => { const ok = C.unlocked(m, l), dn = !!m.done[l.id], isCur = cur && cur.id === l.id; return `<article class="card row ${dn ? 'done' : ''} ${isCur ? 'cur' : ''} ${ok ? '' : 'lock'}" ${ok ? `data-open="${l.id}"` : `data-locked="1"`}><span class="dot">${dn ? '✓' : ''}</span>${isCur ? '<img class="star sidestar" src="/media/star.png" alt="" style="width:34px;height:34px">' : ''}<div class="ph">${poster(l)}</div><div><h3>${esc(l.title)}</h3><small>${ok ? `${l.min} min` : 'Termina la anterior para abrirla'}</small></div><span class="go">${ok ? '›' : ''}</span></article>`; }).join('')}</div>`;
    },
    respiracion() {
      return `<div><p class="eyebrow">Respiración</p><h2 style="font-size:30px;margin-top:6px">Respiración funcional</h2><p class="mute" style="margin-top:6px">Acceso libre, sin orden. Elige según cómo te sientas hoy.</p></div>
      <section class="card breathe"><p class="eyebrow">Respirar con ritmo</p><p class="mute" style="margin-top:6px">Un aro que se abre y se cierra, con los segundos a la vista. Elige el ritmo y el tiempo.</p><div class="pchips" style="margin-top:14px">${Object.entries(C.PACES).map(([k, v]) => `<button class="pill" data-pacer="${k}" data-mins="3">${v.name}</button>`).join('')}</div></section>
      <div class="grid">${C.lessons('respiracion').map((l) => `<article class="card tile ${m.done[l.id] ? 'done' : ''}" data-open="${l.id}"><div class="ph">${poster(l)}</div><div class="t"><h3>${esc(l.title)}</h3><small>${l.min} min${l.level ? ' · ' + esc(l.level) : ''}${m.done[l.id] ? ' · hecha ✓' : ''}</small></div></article>`).join('')}</div>`;
    },
    perfil() {
      const p = C.progress(m);
      return `<section class="card prof"><span class="avatar" aria-hidden="true">${esc(first[0] || '·')}</span><div><h2>${esc(m.name)}</h2><p class="mute">Miembro desde ${C.fmt(m.start)}</p></div></section>
      <section class="card"><p class="eyebrow">Tu membresía</p><p style="margin-top:6px">Renueva el ${C.fmt(m.renew)} · ${C.daysLeft(m) > 0 ? `faltan ${C.daysLeft(m)} días` : 'toca renovar'}</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${contact(`Hola ${C.CFG.coach}, soy ${first}. Te escribo por mi membresía.`)}</div></section>
      <section class="card" style="text-align:center"><p class="eyebrow">Tu progreso</p><div class="ring" style="margin:10px 0">${ring(p, 150)}</div><p class="mute">${Object.keys(m.done).length} de ${C.LESSONS.length} lecciones · ${minutes()} min · racha de ${C.streak(m)}</p></section>
      <section class="card"><p class="eyebrow">Por recorrido</p>${bars()}</section>`;
    },
    uno() {
      return `<section class="card"><p class="eyebrow">Trabajo interno</p><h2 style="font-size:30px;margin:8px 0 10px">Sesiones uno a uno</h2><p class="mute">Respiración activa y acompañamiento profundo con ${C.CFG.coach}, online o presencial. Se reservan aparte de la membresía.</p></section>
      <section class="card"><p>Cuéntale qué necesitas y acordáis día y hora.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${contact(`Hola ${C.CFG.coach}, soy ${first}. Quiero reservar una sesión 1:1.`)}</div></section>`;
    },
  };

  function render() {
    app.innerHTML = `<header class="top"><img src="/media/logo-mark.png" alt="Coheresencia"><div><p class="eyebrow">Mi práctica</p><h1>Hola, ${esc(first)}</h1></div><span class="chip ${C.status(m)[1]}">${C.status(m)[0]}</span></header><main>${views[tab]()}</main>
    <nav class="tabs"><div>${[['inicio', 'Inicio'], ['cuerpo', 'Cuerpo'], ['respiracion', 'Respirar'], ['uno', '1:1'], ['perfil', 'Perfil']].map(([k, t]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div></nav>`;
  }
  const go = (t) => { tab = t; render(); scrollTo(0, 0); };

  function openLesson(id) {
    const l = C.LESSONS.find((x) => x.id === id), dn = !!m.done[id];
    sheet.innerHTML = `<div class="player">${l.video ? `<video src="${esc(l.video)}" poster="${esc(l.poster)}" controls playsinline preload="metadata" controlslist="nodownload"></video>` : `${poster(l)}<button class="play" aria-label="Reproducir" data-play></button><span class="tag">Vídeo próximamente</span>`}<button class="close" data-close>‹ Volver</button></div>
    <div class="body"><p class="eyebrow">${C.TRACKS[l.track].name}${l.track === 'cuerpo' ? ` · ${l.n + 1} de ${C.lessons('cuerpo').length}` : ''} · ${l.min} min${l.level ? ' · ' + esc(l.level) : ''}</p><h2>${esc(l.title)}</h2><p class="mute">${esc(l.text)}</p>
    ${l.pace && C.PACES[l.pace] ? `<button class="btn ghost" data-pacer="${l.pace}" data-mins="${Math.max(1, Math.min(10, l.min))}">Respirar con ritmo · ${C.PACES[l.pace].name}</button>` : ''}
    <button class="btn" data-done="${id}" ${dn ? 'style="background:transparent;color:var(--gold)"' : ''}>${dn ? '✓ Hecha · toca para deshacer' : 'Marcar como hecha'}</button></div>`;
    sheet.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  const closeSheet = () => { sheet.querySelector('video')?.pause(); sheet.classList.remove('on'); document.body.style.overflow = ''; };

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-open],[data-locked],[data-close],[data-play],[data-done],[data-pacer]'); if (!t) return;
    if (t.dataset.tab) return go(t.dataset.tab);
    if (t.dataset.open) return openLesson(t.dataset.open);
    if (t.dataset.locked) return toast('Termina la lección anterior para abrir esta');
    if (t.dataset.close !== undefined) { closeSheet(); return render(); }
    if (t.dataset.play !== undefined) return toast('Este vídeo aún no está subido');
    if (t.dataset.pacer) return COH.pacer.open(t.dataset.pacer, +t.dataset.mins || 1);
    if (t.dataset.done) {
      const id = t.dataset.done, l = C.LESSONS.find((x) => x.id === id);
      if (m.done[id]) { const nx = l.track === 'cuerpo' && C.lessons('cuerpo')[l.n + 1]; if (nx && m.done[nx.id]) return toast('Primero deshaz la siguiente'); delete m.done[id]; toast('Lección desmarcada'); }
      else { m.done[id] = new Date().toISOString(); const nx = l.track === 'cuerpo' && C.lessons('cuerpo')[l.n + 1]; toast(nx ? '¡Hecha! Se desbloquea la siguiente' : '¡Hecha! Buen trabajo'); }
      save(); closeSheet(); render();
    }
  });
  render();
});
