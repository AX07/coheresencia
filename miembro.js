COH.ready.then(() => {
  const C = COH, $ = (s, r = document) => r.querySelector(s), app = $('#app'), sheet = $('#sheet');
  const slug = decodeURIComponent(location.pathname.replace(/^\/|\/$/g, '')), tok = location.hash.slice(1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let tab = 'inicio', db = C.load(), m = db.members.find((x) => x.slug === slug);
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600); };
  const contact = (text) => { const links = []; if (C.CFG.whatsapp) links.push(`<a class="btn" href="${C.wa(text, C.CFG.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`); links.push(`<a class="btn ${C.CFG.whatsapp ? 'ghost' : ''}" href="https://ig.me/m/${C.CFG.instagram}" target="_blank" rel="noopener">Instagram</a>`); return links.join(''); };
  const logo = '<img src="/media/m360-logo.png" alt="Movimiento 360" style="height:72px;width:auto">';

  // The link is the key: right name and right secret after the #, and the link not switched off.
  if (!m || !m.active || m.token !== tok) return app.innerHTML = `<div class="msg">${logo}<h1>Este enlace no es válido</h1><p class="mute">Puede haber caducado o haberse desactivado. Escríbele a ${C.CFG.coach} y te enviará uno nuevo.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${contact('Hola, mi enlace de Movimiento 360 no funciona.')}</div></div>`;
  const expired = C.daysLeft(m) < -C.CFG.graceDays;
  if (expired) return app.innerHTML = `<div class="msg">${logo}<h1>Tu membresía venció</h1><p class="mute">Venció el ${C.fmt(m.renew)}. Tu progreso está guardado: renueva con ${C.CFG.coach} y sigues donde lo dejaste.</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${contact('Hola, quiero renovar mi membresía de Movimiento 360.')}</div></div>`;

  const save = () => C.save(db);
  const first = m.name.split(' ')[0];
  const poster = (l) => `<img src="${l.poster}" alt="" loading="lazy">`;
  const week = () => { const a = C.activeDays(m), now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); return ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((n, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = C.dayKey(d); return `<span class="${a.has(k) ? 'on' : ''} ${k === C.dayKey(now) ? 'today' : ''}">${n}<i></i></span>`; }).join(''); };

  const ring = (p, size) => { const R = size * .36, c = 2 * Math.PI * R, h = size / 2; return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p}% completado"><circle cx="${h}" cy="${h}" r="${R}" fill="none" stroke="rgba(247,240,222,.12)" stroke-width="${size / 17}"/><circle cx="${h}" cy="${h}" r="${R}" fill="none" stroke="#e3bd72" stroke-width="${size / 17}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" transform="rotate(-90 ${h} ${h})"/><text x="${h}" y="${h + size / 18}" text-anchor="middle" fill="#f7f0de" font-family="Fraunces,serif" font-size="${size / 5}" font-weight="300">${p}%</text></svg>`; };
  const minutes = () => C.all(m).filter((l) => m.done[l.id]).reduce((s, l) => s + l.min, 0);
  const bars = () => Object.entries(C.TRACKS).filter(([k]) => C.has(m, k)).map(([k, t]) => { const a = C.doneN(m, k), b = C.lessons(k, m).length || 1; return `<div style="margin-top:14px"><div style="display:flex;justify-content:space-between"><span>${t.name}</span><span class="mute">${a}/${b}</span></div><div class="bar" style="margin-top:6px"><i style="width:${(a / b) * 100}%"></i></div></div>`; }).join('');

  // the confirmed 1:1 session, with a live countdown and the calendar buttons
  const cdHtml = (at) => { const c = C.countdown(at); return `<span><b>${c.d}</b>${c.d === 1 ? 'día' : 'días'}</span><span><b>${c.h}</b>horas</span><span><b>${c.mi}</b>min</span>`; };
  const sessionCard = () => { const s = C.upcoming(m); if (!s) return ''; const url = URL.createObjectURL(C.icsBlob(m)); return `<section class="card sess"><p class="eyebrow">Tu sesión 1:1</p><h2>${esc(C.fmtDT(s.at))}</h2><p class="mute">${s.course && C.TRACKS[s.course] ? C.TRACKS[s.course].name + ' · ' : ''}${esc(s.mode)} · con ${C.CFG.coach} · ${C.SESSION_MIN} min</p><div class="count" data-at="${s.at}">${cdHtml(s.at)}</div><div class="acts"><a class="btn sm" download="sesion-1a1.ics" href="${url}">Añadir al calendario</a><a class="btn sm ghost" href="${C.gcal(m)}" target="_blank" rel="noopener">Google Calendar</a></div></section>`; };
  setInterval(() => document.querySelectorAll('.count').forEach((e) => { e.innerHTML = cdHtml(e.dataset.at); }), 30000);

  const noCourse = (t) => `<section class="card"><p class="eyebrow">${C.TRACKS[t].name}</p><h2 style="font-size:28px;margin:8px 0">Este curso no está en tu plan</h2><p class="mute">${C.TRACKS[t].sub}. Se compra por separado: <b>${esc(C.T('precio.' + t))}</b>.</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${contact(`Hola ${C.CFG.coach}, soy ${first}. Quiero añadir el curso de ${C.TRACKS[t].name}.`)}</div></section>`;
  const rd = (id) => (m.rounds && m.rounds[id]) || [];
  const roundStats = () => { const all = Object.values(m.rounds || {}).flat(); return { total: all.reduce((s, x) => s + x.n, 0), best: Math.max(0, ...all.map((x) => x.n)), sessions: all.length }; };
  const views = {
    inicio() {
      const n = C.next(m), st = C.streak(m), p = C.progress(m), cu = C.lessons('cuerpo', m), re = C.lessons('respiracion', m);
      const door = (tab, name, sub, extra) => `<button class="card door" data-tab="${tab}"><span class="eyebrow">${name}</span><b>${sub}</b><small class="mute">${extra}</small></button>`;
      return `${sessionCard()}${!C.has(m, 'cuerpo') ? '' : n ? `<section class="card next" data-open="${n.id}" style="cursor:pointer"><div class="ph">${poster(n)}</div><div><p class="eyebrow">Tu siguiente paso</p><h2>${esc(n.title)}</h2><p class="mute">${n.min} min · Cuerpo ${n.n + 1} de ${cu.length}</p><button class="btn sm" style="margin-top:12px">Empezar</button></div></section>` : `<section class="card"><p class="eyebrow">Cuerpo</p><h2>Completaste el recorrido</h2><p class="mute">Repite la rutina completa cuando quieras o pasa a Respiración.</p></section>`}
      <section class="card sum"><div class="sumring">${ring(p, 100)}</div><div class="stats"><div><b>${st}</b><small>días de racha</small></div><div><b>${minutes()}</b><small>minutos</small></div><div><b>${Object.keys(m.done).length}</b><small>lecciones</small></div></div></section>
      <section class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><p class="eyebrow">Esta semana</p><span class="mute">${st ? `Racha de ${st} ${st === 1 ? 'día' : 'días'}` : 'Empieza hoy tu racha'}</span></div><div class="week">${week()}</div></section>
      <div class="doors">${door('cuerpo', 'Cuerpo', C.has(m, 'cuerpo') ? `${C.doneN(m, 'cuerpo')}/${cu.length}` : 'Añadir', 'Entrenamiento')}${door('respiracion', 'Respirar', C.has(m, 'respiracion') ? `${C.doneN(m, 'respiracion')}/${re.length}` : 'Añadir', 'Respiración')}${door('uno', '1:1', 'Sesiones', 'con ' + C.CFG.coach)}</div>`;
    },
    cuerpo() {
      if (!C.has(m, 'cuerpo')) return noCourse('cuerpo');
      const cur = C.next(m), rs = roundStats();
      return `<div><p class="eyebrow">Cuerpo</p><h2 style="font-size:30px;margin-top:6px">${esc(C.T('cuerpo.titulo'))}</h2><p class="mute" style="margin-top:6px">${esc(C.T('cuerpo.texto'))}</p></div>
      <section class="card stats"><div><b>${rs.total}</b><small>rondas en total</small></div><div><b>${rs.best}</b><small>mejor circuito</small></div><div><b>${rs.sessions}</b><small>circuitos hechos</small></div></section>
      <div class="path">${C.lessons('cuerpo', m).map((l) => { const ok = C.unlocked(m, l), dn = !!m.done[l.id], isCur = cur && cur.id === l.id; return `<article class="card row ${dn ? 'done' : ''} ${isCur ? 'cur' : ''} ${ok ? '' : 'lock'}" ${ok ? `data-open="${l.id}"` : `data-locked="1"`}><span class="dot">${dn ? '✓' : ''}</span>${isCur ? '<img class="star sidestar" src="/media/star.png" alt="" style="width:34px;height:34px">' : ''}<div class="ph">${poster(l)}</div><div><h3>${esc(l.title)}</h3><small>${ok ? `${l.min} min${C.circuit(l) ? ' · circuito de ' + C.circuit(l) + ' min' : ''}${rd(l.id).length ? ' · <b style="color:var(--gold)">' + rd(l.id).slice(-1)[0].n + ' rondas</b>' : ''}` : 'Termina la anterior para abrirla'}</small></div><span class="go">${ok ? '›' : ''}</span></article>`; }).join('')}</div>`;
    },
    respiracion() {
      if (!C.has(m, 'respiracion')) return noCourse('respiracion');
      return `<div><p class="eyebrow">Respiración</p><h2 style="font-size:30px;margin-top:6px">${esc(C.T('respiracion.titulo'))}</h2><p class="mute" style="margin-top:6px">${esc(C.T('respiracion.texto'))}</p></div>
      <section class="card breathe"><p class="eyebrow">Respirar con ritmo</p><div class="orb" aria-hidden="true"><img src="/media/star.png" alt=""></div><p class="mute" style="margin-top:6px">${esc(C.T('ritmo.texto'))}</p><div class="pchips" style="margin-top:14px">${Object.entries(C.PACES).map(([k, v]) => `<button class="pill" data-pacer="${k}" data-mins="3">${v.name}</button>`).join('')}</div></section>
      <div class="grid">${C.lessons('respiracion', m).map((l) => `<article class="card tile ${m.done[l.id] ? 'done' : ''}" data-open="${l.id}"><div class="ph">${poster(l)}</div><div class="t"><h3>${esc(l.title)}</h3><small>${l.min} min${l.level ? ' · ' + esc(l.level) : ''}${m.done[l.id] ? ' · hecha ✓' : ''}</small></div></article>`).join('')}</div>`;
    },
    perfil() {
      const p = C.progress(m);
      return `<section class="card prof"><span class="avatar" aria-hidden="true">${esc(first[0] || '·')}</span><div><h2>${esc(m.name)}</h2><p class="mute">Miembro desde ${C.fmt(m.start)}</p></div></section>
      <section class="card"><p class="eyebrow">Tu membresía</p><p style="margin-top:6px">Cursos: ${C.courses(m).map((k) => C.TRACKS[k].name).join(' y ')}</p><p style="margin-top:4px">Renueva el ${C.fmt(m.renew)} · ${C.daysLeft(m) > 0 ? `faltan ${C.daysLeft(m)} días` : 'toca renovar'}</p><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${contact(`Hola ${C.CFG.coach}, soy ${first}. Te escribo por mi membresía.`)}</div></section>
      <section class="card" style="text-align:center"><p class="eyebrow">Tu progreso</p><div class="ring" style="margin:10px 0">${ring(p, 150)}</div><p class="mute">${C.all(m).filter((l) => m.done[l.id]).length} de ${C.all(m).length} lecciones · ${minutes()} min · racha de ${C.streak(m)}</p></section>
      <section class="card"><p class="eyebrow">Por recorrido</p>${bars()}</section>`;
    },
    uno() {
      const min = new Date(Date.now() + 864e5).toLocaleDateString('sv'), times = []; for (let h = 9; h <= 20; h++) for (const mm of ['00', '30']) if (!(h === 20 && mm === '30')) times.push(`${String(h).padStart(2, '0')}:${mm}`);
      return `${sessionCard()}<section class="card"><p class="eyebrow">Trabajo interno</p><h2 style="font-size:30px;margin:8px 0 10px">${esc(C.T('uno.titulo'))}</h2><p class="mute">${esc(C.T('uno.texto'))}</p><p style="margin-top:10px"><b>${esc(C.T('precio.uno'))}</b> <span class="mute">· se paga aparte del curso</span></p></section>
      <section class="card"><p class="eyebrow">Pide tu hora</p><p class="mute" style="margin:6px 0 14px">${esc(C.T('uno.pasos'))}</p>
      <div class="two"><label>Día<input type="date" id="sd" min="${min}" value="${min}"></label><label>Hora<select id="st">${times.map((t) => `<option ${t === '18:00' ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <p class="eyebrow" style="margin-top:14px">Sobre qué curso</p><div class="pchips" style="margin:8px 0">${C.courses(m).map((k, i) => `<button class="pill ${i ? '' : 'on'}" data-course="${k}">${C.TRACKS[k].name}</button>`).join('')}</div>
      <p class="eyebrow">Cómo</p><div class="pchips" style="margin:8px 0 12px"><button class="pill on" data-mode="Online">Online</button><button class="pill" data-mode="Presencial">Presencial</button></div>
      <p class="msgprev mute" id="smsg"></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">${C.CFG.whatsapp ? '<button class="btn" data-send="wa">Enviar por WhatsApp</button>' : ''}<button class="btn ${C.CFG.whatsapp ? 'ghost' : ''}" data-send="ig">Enviar por Instagram</button></div></section>`;
    },
  };

  let mode = 'Online', course = C.courses(m)[0];
  const request = () => { const d = $('#sd').value, t = $('#st').value, day = new Date(`${d}T${t}`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); return `Hola ${C.CFG.coach}, soy ${m.name}. Me gustaría reservar una sesión 1:1 de ${C.TRACKS[course].name} (${mode.toLowerCase()}) el ${day} a las ${t}. ¿Te viene bien? Si no, dime qué otro día y hora te va mejor.`; };
  const preview = () => { const e = $('#smsg'); if (e) e.textContent = '«' + request() + '»'; };

  function render() {
    app.innerHTML = `<header class="top"><img src="/media/m360-mark.png" alt="Movimiento 360"><div><p class="eyebrow">Mi práctica</p><h1>Hola, ${esc(first)}</h1></div><span class="chip ${C.status(m)[1]}">${C.status(m)[0]}</span></header><main>${views[tab]()}</main>
    <nav class="tabs"><div>${[['inicio', 'Inicio'], ['cuerpo', 'Cuerpo'], ['respiracion', 'Respirar'], ['uno', '1:1'], ['perfil', 'Perfil']].map(([k, t]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div></nav>`;
    preview();
  }
  const go = (t) => { tab = t; render(); scrollTo(0, 0); };

  // ---- a lesson: its videos (one or several) and, for Cuerpo, the circuit timer with the rounds
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
  let circ = null, wake = null;
  const stopCirc = () => { if (circ) clearInterval(circ.iv); circ = null; wake && wake.release().catch(() => {}); wake = null; };
  const beep = () => { try { const a = new AudioContext(); [0, .35, .7].forEach((t) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; g.gain.value = .25; o.connect(g); g.connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + .22); }); } catch {} navigator.vibrate && navigator.vibrate([200, 100, 200, 100, 400]); };
  const roundsHist = (id) => (m.rounds && m.rounds[id] || []).slice(-6).map((x) => `<span class="chip">${x.n}</span>`).join('');

  function openLesson(id) {
    const l = C.lesson(id, m), dn = !!m.done[id], vs = l.videos || [], pace = C.PACES[l.pace] ? l.pace : Object.keys(C.PACES)[0];
    stopCirc();
    sheet.innerHTML = `<div class="player">${vs.length ? `<video src="${esc(vs[0].src)}" poster="${esc(l.poster)}" controls playsinline preload="metadata" controlslist="nodownload"></video>` : `${poster(l)}<button class="play" aria-label="Reproducir" data-play></button><span class="tag">Vídeo próximamente</span>`}<button class="close" data-close>‹ Volver</button></div>
    <div class="body">${vs.length > 1 ? `<div class="pchips">${vs.map((v, i) => `<button class="pill ${i ? '' : 'on'}" data-vid="${i}">Vídeo ${i + 1}</button>`).join('')}</div>` : ''}
    <p class="eyebrow">${C.TRACKS[l.track].name}${l.track === 'cuerpo' ? ` · ${l.n + 1} de ${C.lessons('cuerpo', m).length}` : ''} · ${l.min} min${l.level ? ' · ' + esc(l.level) : ''}</p><h2>${esc(l.title)}</h2><p class="mute">${esc(l.text)}</p>
    ${C.circuit(l) ? `<section class="card circ"><p class="eyebrow">Circuito · ${C.circuit(l)} min</p><p class="mute" style="margin:6px 0">${esc(C.T('circuito.texto'))}</p><div class="clock" id="clk">${mmss(C.circuit(l) * 60)}</div><div class="acts" style="justify-content:center"><button class="btn" id="cgo" data-circ="start">Empezar circuito</button><button class="btn ghost" data-circ="reset">Reiniciar</button></div>
      <div class="rounds" id="rnd" hidden><p>¿Cuántas rondas hiciste?</p><div class="stepper"><button data-rd="-1" aria-label="Menos">−</button><b id="rn">1</b><button data-rd="1" aria-label="Más">+</button></div><button class="btn" data-saver="${id}">Guardar rondas</button></div><p class="mute" style="margin-top:10px;text-align:center">${roundsHist(id) ? 'Tus rondas: ' + roundsHist(id) : ''}</p></section>` : ''}
    ${l.track === 'respiracion' ? `<section class="card circ"><p class="eyebrow">Temporizador de respiración</p><p class="mute" style="margin:6px 0 12px">Elige el ritmo y el tiempo, y respira con el aro mientras haces el ejercicio del vídeo.</p><div class="pchips" style="justify-content:center">${Object.entries(C.PACES).map(([k, v]) => `<button class="pill ${k === pace ? 'on' : ''}" data-bp="${k}">${v.name}</button>`).join('')}</div><div class="pchips" style="justify-content:center;margin:10px 0 16px">${[...new Set([...C.OPTS.mins, C.breath(l)])].sort((a, b) => a - b).map((n) => `<button class="pill ${n === C.breath(l) ? 'on' : ''}" data-bm="${n}">${n} min</button>`).join('')}</div><button class="btn" data-bgo>Empezar a respirar</button></section>` : ''}
    ${l.track !== 'respiracion' && l.pace && C.PACES[l.pace] ? `<button class="btn ghost" data-pacer="${l.pace}" data-mins="${Math.max(1, Math.min(10, l.min))}">Respirar con ritmo · ${C.PACES[l.pace].name}</button>` : ''}
    <button class="btn" data-done="${id}" ${dn ? 'style="background:transparent;color:var(--gold)"' : ''}>${dn ? '✓ Hecha · toca para deshacer' : 'Marcar como hecha'}</button></div>`;
    sheet.dataset.id = id; sheet.classList.add('on'); document.body.style.overflow = 'hidden';
  }
  const closeSheet = () => { stopCirc(); sheet.querySelector('video')?.pause(); sheet.classList.remove('on'); document.body.style.overflow = ''; };

  function circuit(a) {
    const l = C.lesson(sheet.dataset.id, m), clk = $('#clk', sheet), go = $('#cgo', sheet), tot = C.circuit(l) * 60;
    if (a === 'reset') { stopCirc(); clk.textContent = mmss(tot); go.textContent = 'Empezar circuito'; $('#rnd', sheet).hidden = true; return; }
    if (circ && circ.end) { const left = Math.ceil((circ.end - Date.now()) / 1000); stopCirc(); circ = { paused: left }; go.textContent = 'Seguir'; return; } // pause
    const resume = circ && circ.paused != null, left = resume ? circ.paused : tot; if (!resume) $('#rnd', sheet).hidden = true;
    const end = Date.now() + left * 1000; circ = { end }; go.textContent = 'Pausa';
    navigator.wakeLock && navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {});
    circ.iv = setInterval(() => { const s = Math.ceil((end - Date.now()) / 1000); clk.textContent = mmss(s); if (s <= 0) { stopCirc(); go.textContent = 'Empezar de nuevo'; clk.textContent = '00:00'; beep(); const r = $('#rnd', sheet); r.hidden = false; r.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 250);
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-open],[data-locked],[data-close],[data-play],[data-done],[data-pacer],[data-vid],[data-circ],[data-rd],[data-saver],[data-mode],[data-course],[data-send],[data-bp],[data-bm],[data-bgo]'); if (!t) return;
    if (t.dataset.tab) return go(t.dataset.tab);
    if (t.dataset.open) return openLesson(t.dataset.open);
    if (t.dataset.locked) return toast('Termina la lección anterior para abrir esta');
    if (t.dataset.close !== undefined) { closeSheet(); return render(); }
    if (t.dataset.play !== undefined) return toast('Este vídeo aún no está subido');
    if (t.dataset.pacer) return COH.pacer.open(t.dataset.pacer, +t.dataset.mins || 1, sheet.classList.contains('on') ? C.tick(C.lesson(sheet.dataset.id, m)) : undefined);
    if (t.dataset.vid != null) { const l = C.lesson(sheet.dataset.id, m), v = sheet.querySelector('video'); v.src = l.videos[+t.dataset.vid].src; v.play().catch(() => {}); sheet.querySelectorAll('[data-vid]').forEach((b) => b.classList.toggle('on', b === t)); return; }
    if (t.dataset.circ) return circuit(t.dataset.circ);
    if (t.dataset.rd) { const n = $('#rn', sheet); n.textContent = Math.max(0, Math.min(99, +n.textContent + +t.dataset.rd)); return; }
    if (t.dataset.saver) {
      const id = t.dataset.saver, n = +$('#rn', sheet).textContent; (m.rounds ||= {})[id] = [...(m.rounds[id] || []), { at: new Date().toISOString(), n }];
      if (!m.done[id]) m.done[id] = new Date().toISOString(); save(); closeSheet(); render(); return toast(`${n} ${n === 1 ? 'ronda guardada' : 'rondas guardadas'}. ¡Buen trabajo!`);
    }
    if (t.dataset.bp || t.dataset.bm) { t.parentElement.querySelectorAll('.pill').forEach((b) => b.classList.toggle('on', b === t)); return; }
    if (t.dataset.bgo !== undefined) return COH.pacer.open(sheet.querySelector('[data-bp].on').dataset.bp, +sheet.querySelector('[data-bm].on').dataset.bm, C.tick(C.lesson(sheet.dataset.id, m)));
    if (t.dataset.course) { course = t.dataset.course; document.querySelectorAll('[data-course]').forEach((b) => b.classList.toggle('on', b === t)); return preview(); }
    if (t.dataset.mode) { mode = t.dataset.mode; document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', b === t)); return preview(); }
    if (t.dataset.send) {
      const text = request();
      if (t.dataset.send === 'wa') return window.open(C.wa(text, C.CFG.whatsapp), '_blank', 'noopener');
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Mensaje copiado: pégalo en el chat de Instagram'), () => toast('Copia el mensaje de arriba y pégalo en Instagram'));
      return void window.open(`https://ig.me/m/${C.CFG.instagram}`, '_blank', 'noopener');
    }
    if (t.dataset.done) {
      const id = t.dataset.done, l = C.lesson(id, m);
      if (m.done[id]) { const nx = l.track === 'cuerpo' && C.lessons('cuerpo', m)[l.n + 1]; if (nx && m.done[nx.id]) return toast('Primero deshaz la siguiente'); delete m.done[id]; toast('Lección desmarcada'); }
      else { m.done[id] = new Date().toISOString(); const nx = l.track === 'cuerpo' && C.lessons('cuerpo', m)[l.n + 1]; toast(nx ? '¡Hecha! Se desbloquea la siguiente' : '¡Hecha! Buen trabajo'); }
      save(); closeSheet(); render();
    }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'sd' || e.target.id === 'st') preview(); });
  render();
});
