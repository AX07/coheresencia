/* Preview data and helpers shared by /admin and /<name>. Everything is saved in this browser only (localStorage):
   the real version moves it to a database. Lessons are SAMPLE content until Alejandro sends his videos. */
window.COH = (() => {
  // Alejandro's WhatsApp number with country code and no +. Empty hides the WhatsApp buttons.
  const CFG = { coach: 'Alejandro', whatsapp: '34674821290', instagram: 'alehandromena', graceDays: 0 };
  const DAY = 864e5, KEY = 'coh-preview-v1';
  const POSTERS = ['Dfu8ma-oi-x', 'Dd4A6otIHMg', 'DdorV83I_Pq', 'DeNN-wsownb', 'Df5NQCkRSzo', 'Df0EKeyofXe', 'Df-aRRmxvif'].map((id) => `/media/ig-${id}.jpg`);
  const L = (id, track, n, title, min, text) => ({ id, track, n, title, min, text, poster: POSTERS[n % POSTERS.length] });
  const LESSONS = [
    L('c1', 'cuerpo', 0, 'Pies y tobillos: despierta la base', 10, 'Reconecta pies y tobillos antes de cualquier otra cosa. Una esterilla y una pelota de tenis.'),
    L('c2', 'cuerpo', 1, 'Muñecas y manos', 8, 'Movilidad y fuerza para muñecas y manos, la parte que más olvidamos.'),
    L('c3', 'cuerpo', 2, 'Columna: ondas y movilidad', 12, 'Mueve la columna en todas sus direcciones, sin prisa y sin dolor.'),
    L('c4', 'cuerpo', 3, 'Caderas abiertas', 12, 'Libera caderas y pelvis con movimientos lentos y conscientes.'),
    L('c5', 'cuerpo', 4, 'Fuerza: empujar', 15, 'Patrones de empuje con tu propio peso.'),
    L('c6', 'cuerpo', 5, 'Fuerza: tirar', 15, 'Patrones de tracción y control de los hombros.'),
    L('c7', 'cuerpo', 6, 'Potencia: saltos suaves', 12, 'Potencia sin impacto innecesario.'),
    L('c8', 'cuerpo', 7, 'Psicomotricidad: coordinación', 14, 'Coordinación y ritmo para que el cuerpo se sienta tuyo.'),
    L('c9', 'cuerpo', 8, 'Equilibrio y pelota de tenis', 10, 'Equilibrio, apoyo y auto-masaje con la pelota.'),
    L('c10', 'cuerpo', 9, 'Tu rutina completa', 20, 'Junta todo lo aprendido en una sola práctica.'),
    L('r1', 'respiracion', 0, 'Respiración nasal básica', 6, 'Respirar por la nariz para regular el sistema nervioso.'),
    L('r2', 'respiracion', 1, 'Exhalación larga', 5, 'Alarga la exhalación para bajar revoluciones.'),
    L('r3', 'respiracion', 2, 'Respiración coherente', 10, 'Un ritmo constante para encontrar calma y claridad.'),
    L('r4', 'respiracion', 3, 'Para activar la mañana', 7, 'Energía suave al empezar el día.'),
    L('r5', 'respiracion', 4, 'Para dormir mejor', 9, 'Cierra el día respirando.'),
    L('r6', 'respiracion', 5, 'Pausa de un minuto', 1, 'Un minuto, donde estés.'),
  ];
  // The CRM saves the real catalogue (titles, order, video paths) to /lessons.json in the repo; until it exists the sample list above is used.
  const renumber = () => { const c = {}; LESSONS.forEach((l) => { l.n = c[l.track] = (c[l.track] ?? -1) + 1; l.poster ||= POSTERS[l.n % POSTERS.length]; l.videos ||= l.video ? [{ src: l.video }] : []; delete l.video; }); };
  renumber();
  // Texts Alejandro can change from the CRM (Textos tab). The CRM saves only the ones he changed to /content.json.
  const TEXTS = {
    'cuerpo.titulo': ['Cuerpo · título', 'Entrenamiento consciente'],
    'cuerpo.texto': ['Cuerpo · descripción', 'Cada vídeo se desbloquea cuando marcas el anterior como hecho. A tu ritmo.'],
    'circuito.texto': ['Circuito · explicación', 'Haz el circuito del vídeo tantas veces como puedas hasta que suene el aviso. Después apunta cuántas rondas completaste.'],
    'respiracion.titulo': ['Respiración · título', 'Respiración funcional'],
    'respiracion.texto': ['Respiración · descripción', 'Acceso libre, sin orden. Elige según cómo te sientas hoy.'],
    'ritmo.texto': ['Respiración · ritmo guiado', 'Un aro que se abre y se cierra, con los segundos a la vista. Elige el ritmo y el tiempo.'],
    'uno.titulo': ['1:1 · título', 'Sesiones uno a uno'],
    'uno.texto': ['1:1 · descripción', 'Respiración activa y acompañamiento profundo con Alejandro, online o presencial. Se reservan aparte del curso.'],
    'uno.pasos': ['1:1 · cómo se reserva', 'Elige el día y la hora que mejor te vengan y envíale el mensaje. Alejandro te lo confirma o te propone otra hora, y verás tu cita aquí con la cuenta atrás.'],
    'precio.curso': ['Precio del curso (Cuerpo + Respiración)', 'Precio por confirmar'],
    'precio.uno': ['Precio de la sesión 1:1', 'Precio por confirmar'],
  };
  let OVERRIDE = {};
  const T = (k) => (OVERRIDE[k] ?? TEXTS[k][1]);
  const getJ = (u) => fetch(u, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const ready = Promise.all([getJ('/lessons.json'), getJ('/content.json')]).then(([j, c]) => {
    if (Array.isArray(j) && j.length) { LESSONS.length = 0; j.forEach((x) => LESSONS.push(x)); }
    if (c && c.texts) OVERRIDE = c.texts;
    renumber();
  });
  // Breathing rhythms: [phase, seconds]. A lesson can point at one with `pace`; the member page then offers it with the video.
  const PACES = {
    calma: { name: 'Calma', hint: 'Exhalar más largo que inhalar baja las revoluciones.', seq: [['Inhala', 4], ['Exhala', 6]] },
    coherente: { name: 'Coherente', hint: 'Un ritmo parejo para encontrar calma y claridad.', seq: [['Inhala', 5], ['Exhala', 5]] },
    caja: { name: 'Caja', hint: 'Cuatro tiempos iguales. Foco y estabilidad.', seq: [['Inhala', 4], ['Mantén', 4], ['Exhala', 4], ['Mantén', 4]] },
    dormir: { name: 'Dormir', hint: 'La pausa larga y la exhalación lenta preparan el sueño.', seq: [['Inhala', 4], ['Mantén', 7], ['Exhala', 8]] },
  };
  const LEVELS = ['Inicial', 'Intermedio', 'Avanzado'];
  const TRACKS = {
    cuerpo: { name: 'Cuerpo', sub: 'Entrenamiento consciente', seq: true },
    respiracion: { name: 'Respiración', sub: 'Respiración funcional', seq: false },
  };
  const iso = (d) => new Date(d).toISOString();
  const ago = (n) => iso(Date.now() - n * DAY);
  const token = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'miembro';
  const seed = () => ({ members: [
    { id: 'm0', name: 'Usuario Demo', slug: 'user', token: 'demo-user-7c3e9a21', phone: '', ig: 'usuario.demo', source: 'Instagram', start: ago(40), renew: iso(Date.now() + 2 * DAY), active: true, notes: 'Viene de un reel. Prefiere entrenar por la mañana.', done: { c1: ago(3), c2: ago(2), c3: ago(1), r1: ago(2), r3: ago(1) } },
    { id: 'm1', name: 'Laura Gómez', slug: 'laura', token: 'demo-laura-4f9c1a7e', phone: '', ig: 'laura.demo', source: 'Instagram', start: ago(40), renew: iso(Date.now() + 2 * DAY), active: true, notes: 'Viene de un reel. Prefiere entrenar por la mañana.', done: { c1: ago(3), c2: ago(2), c3: ago(1), r1: ago(2), r3: ago(1) } },
    { id: 'm2', name: 'Marcos Ruiz', slug: 'marcos', token: 'demo-marcos-81b2d6c3', phone: '', ig: '', source: 'WhatsApp', start: ago(12), renew: iso(Date.now() + 19 * DAY), active: true, notes: '', done: { c1: ago(9), r1: ago(8) } },
    { id: 'm3', name: 'Sofía Navarro', slug: 'sofia', token: 'demo-sofia-2e70aa95', phone: '', ig: 'sofia.demo', source: 'Instagram', start: ago(75), renew: ago(4), active: true, notes: 'Pendiente de renovar. Le interesa el trabajo interno 1:1.', done: { c1: ago(60), c2: ago(55), c3: ago(50), c4: ago(40), c5: ago(30), r1: ago(60), r2: ago(40), r3: ago(35), r4: ago(20) } },
  ] });
  const load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.members) return s; } catch {} const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s; };
  const save = (s) => localStorage.setItem(KEY, JSON.stringify(s));
  const reset = () => { localStorage.removeItem(KEY); return load(); };
  const find = (slug) => load().members.find((m) => m.slug === slug);

  const lessons = (track) => LESSONS.filter((l) => l.track === track);
  const doneN = (m, track) => lessons(track).filter((l) => m.done[l.id]).length;
  // Cuerpo is a path: the next lesson opens once the one before is done. Respiración is always open.
  const unlocked = (m, l) => !TRACKS[l.track].seq || l.n === 0 || !!m.done[lessons(l.track)[l.n - 1].id];
  const next = (m) => lessons('cuerpo').find((l) => !m.done[l.id]) || null;
  const progress = (m) => Math.round((Object.keys(m.done).length / LESSONS.length) * 100);
  const dayKey = (d) => new Date(d).toLocaleDateString('sv');
  const activeDays = (m) => new Set(Object.values(m.done).map(dayKey));
  const streak = (m) => { const a = activeDays(m); let n = 0, d = new Date(); if (!a.has(dayKey(d))) d = new Date(Date.now() - DAY); while (a.has(dayKey(d))) { n++; d = new Date(+d - DAY); } return n; };
  const lastActive = (m) => Object.values(m.done).sort().pop() || null;
  const daysLeft = (m) => Math.ceil((new Date(m.renew) - Date.now()) / DAY);
  const status = (m) => !m.active ? ['Enlace apagado', 'bad'] : daysLeft(m) < -CFG.graceDays ? ['Vencida', 'bad'] : daysLeft(m) <= 7 ? ['Por renovar', 'warn'] : ['Activa', 'ok'];
  const fmt = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const ago_ = (d) => { if (!d) return 'Aún sin actividad'; const n = Math.floor((Date.now() - new Date(d)) / DAY); return n <= 0 ? 'Hoy' : n === 1 ? 'Ayer' : `Hace ${n} días`; };
  const link = (m) => `${location.origin}/${m.slug}#${m.token}`;
  const wa = (text, phone) => `https://wa.me/${phone || ''}?text=${encodeURIComponent(text)}`;
  const addMonth = (d) => { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x.toISOString(); };
  // ---- 1:1 sessions: the member proposes a time by message, Alejandro confirms it in the CRM (m.session = { at, mode }) ----
  const SESSION_MIN = 60;
  const upcoming = (m) => (m.session && new Date(m.session.at) > Date.now() ? m.session : null);
  const stamp = (d) => new Date(d).toISOString().replace(/[-:]|\.\d+/g, '');
  const sessionTitle = (m) => `Sesión 1:1 con ${CFG.coach}${m.session && m.session.mode ? ' (' + m.session.mode.toLowerCase() + ')' : ''}`;
  const icsBlob = (m) => { const s = m.session, end = new Date(new Date(s.at).getTime() + SESSION_MIN * 60000); const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Coheresencia//ES', 'BEGIN:VEVENT', `UID:${m.id}-${stamp(s.at)}@coheresencia`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(s.at)}`, `DTEND:${stamp(end)}`, `SUMMARY:${sessionTitle(m)}`, 'DESCRIPTION:Tu sesión uno a uno de Coheresencia.', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Tu sesión empieza en una hora', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR']; return new Blob([L.join('\r\n')], { type: 'text/calendar' }); };
  const gcal = (m) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(sessionTitle(m))}&dates=${stamp(m.session.at)}/${stamp(new Date(new Date(m.session.at).getTime() + SESSION_MIN * 60000))}`;
  const countdown = (at) => { const ms = Math.max(0, new Date(at) - Date.now()), d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 36e5), mi = Math.floor(ms % 36e5 / 6e4); return { d, h, mi, ms }; };
  const fmtDT = (d) => new Date(d).toLocaleString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  return { T, TEXTS, texts: () => OVERRIDE, setTexts: (o) => { OVERRIDE = o; }, upcoming, icsBlob, gcal, countdown, fmtDT, sessionTitle, SESSION_MIN, PACES, LEVELS, ready, renumber, CFG, LESSONS, TRACKS, load, save, reset, find, lessons, doneN, unlocked, next, progress, streak, activeDays, lastActive, daysLeft, status, fmt, ago: ago_, link, wa, addMonth, token, slugify, dayKey, DAY };
})();
