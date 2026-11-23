COH.ready.then(() => {
  const C = COH, $ = (s) => document.querySelector(s), view = $('#view'), dlg = $('#dlg');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let db = C.load(), tab = 'miembros', filter = 'todos', q = '';
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2400); };
  const save = () => C.save(db);
  const first = (m) => m.name.split(' ')[0];
  const welcome = (m) => `Hola ${first(m)}! Soy ${C.CFG.coach}. Este es tu acceso personal a Coheresencia: ${C.link(m)}\nGuárdalo en favoritos, es solo tuyo. Cualquier duda, escríbeme por aquí.`;
  const renewMsg = (m) => `Hola ${first(m)}, tu membresía de Coheresencia renueva el ${C.fmt(m.renew)}. ¿Te la renuevo?`;
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copiado'); } catch { prompt('Copia esto:', t); } };
  const kind = (m) => (!m.active || C.daysLeft(m) < 0) ? 'vencidas' : C.daysLeft(m) <= 7 ? 'renovar' : 'activas';

  function members() {
    const all = db.members, n = (k) => all.filter((m) => kind(m) === k).length;
    const avg = all.length ? Math.round(all.reduce((s, m) => s + C.progress(m), 0) / all.length) : 0;
    const list = all.filter((m) => (filter === 'todos' || kind(m) === filter) && (m.name + m.ig + m.phone).toLowerCase().includes(q.toLowerCase()));
    return `<div class="stats"><div class="card"><b>${n('activas') + n('renovar')}</b><small>miembros activos</small></div><div class="card"><b>${n('renovar')}</b><small>renuevan en 7 días</small></div><div class="card"><b>${n('vencidas')}</b><small>vencidas o sin enlace</small></div><div class="card"><b>${avg}%</b><small>progreso medio</small></div></div>
    <div class="tools"><input id="q" placeholder="Buscar por nombre, teléfono o Instagram" value="${esc(q)}">${[['todos', 'Todos'], ['activas', 'Activas'], ['renovar', 'Por renovar'], ['vencidas', 'Vencidas']].map(([k, t]) => `<button class="pill ${filter === k ? 'on' : ''}" data-f="${k}">${t}</button>`).join('')}</div>
    <div class="list">${list.map((m) => { const [s, c] = C.status(m); return `<article class="card mrow" data-m="${m.id}"><div><b>${esc(m.name)}</b><small>${esc(m.source)}${m.ig ? ' · @' + esc(m.ig) : ''}${m.phone ? ' · ' + esc(m.phone) : ''}</small></div><div><span class="chip ${c}">${s}</span><small>Renueva ${C.fmt(m.renew)}</small></div><div><div class="bar"><i style="width:${C.progress(m)}%"></i></div><small>${C.progress(m)}% · Cuerpo ${C.doneN(m, 'cuerpo')}/10</small></div><div><small>Última actividad</small>${C.ago(C.lastActive(m))}</div></article>`; }).join('') || '<p class="empty">No hay miembros con ese filtro.</p>'}</div>`;
  }

  // ---- Contenido: lessons and their videos, saved to GitHub ----
  let up = null; // { id, pct, msg } while a video is going up
  const fail = (e) => { up = null; render(); toast(e.message || 'No se pudo guardar'); };
  function content() {
    const g = C.gh.cfg(), on = C.gh.ok();
    const banner = `<div class="card gh ${on ? 'ok' : ''}"><div><b>${on ? 'GitHub conectado' : 'Conecta GitHub para subir vídeos'}</b><small class="mute" style="display:block">${on ? esc(g.repo) + ' · rama ' + esc(g.branch) + '. Cada vídeo se guarda en el proyecto y la web se actualiza sola en ~1 minuto.' : 'Los vídeos se guardan dentro del proyecto, sin Vimeo ni YouTube. Hace falta un permiso de GitHub, una sola vez.'}</small></div><button class="btn sm ${on ? 'ghost' : ''}" data-g="settings">${on ? 'Ajustes' : 'Conectar'}</button></div>`;
    return banner + Object.entries(C.TRACKS).map(([k, t]) => { const ls = C.lessons(k); return `<div class="tr"><h2>${t.name}</h2><span class="mute">${t.sub} · ${t.seq ? 'se desbloquea en orden' : 'acceso libre'}</span><button class="btn sm ghost" style="margin-left:auto" data-g="add" data-t="${k}">+ Lección</button></div><div class="list">${ls.map((l, i) => {
      const busy = up && up.id === l.id;
      const right = busy ? `<div class="upbar"><div class="bar"><i style="width:${Math.round(up.pct * 100)}%"></i></div><small class="mute">${esc(up.msg)}</small></div>` : `<span class="chip ${l.video ? 'ok' : 'warn'}">${l.video ? 'Vídeo subido' : 'Sin vídeo'}</span><label class="btn sm ${l.video ? 'ghost' : ''}" ${up ? 'style="opacity:.4;pointer-events:none"' : ''}>${l.video ? 'Reemplazar' : 'Subir vídeo'}<input type="file" accept="video/mp4,video/webm" hidden data-up="${l.id}"></label>`;
      return `<article class="card les"><img class="thumb" src="${esc(l.poster)}" alt=""><div><b style="font-weight:500">${i + 1}. ${esc(l.title)}</b><small class="mute" style="display:block">${l.min} min</small></div>${right}<span class="acts" style="flex-wrap:nowrap"><button class="btn sm ghost ic" data-g="up" data-id="${l.id}" ${i ? '' : 'disabled'} aria-label="Subir">↑</button><button class="btn sm ghost ic" data-g="down" data-id="${l.id}" ${i < ls.length - 1 ? '' : 'disabled'} aria-label="Bajar">↓</button><button class="btn sm ghost" data-g="edit" data-id="${l.id}">Editar</button></span></article>`;
    }).join('')}</div>`; }).join('') + '<p class="mute" style="margin-top:22px">El orden de Cuerpo es el orden en que se desbloquea. Vídeos en .mp4 o .webm, hasta 90 MB cada uno: exporta a 720p y pesan poco.</p>';
  }
  const persist = async (msg) => { if (!C.gh.ok()) { settings(); return false; } try { toast('Guardando…'); await C.gh.saveLessons(); toast(msg || 'Guardado. La web se actualiza en ~1 minuto'); return true; } catch (e) { toast(e.message); return false; } };
  function settings() {
    const g = C.gh.cfg();
    dlg.innerHTML = `<form class="dlg" id="gf"><h2>Conectar GitHub</h2><p class="mute">Una sola vez. Así el CRM guarda los vídeos en el proyecto y la web se publica sola.</p>
    <ol class="mute" style="padding-left:18px;display:grid;gap:4px;font-size:14px"><li>Entra en <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="color:var(--gold)">github.com → Fine-grained token</a>.</li><li>Repository access: solo este repositorio.</li><li>Permissions → Contents: <b>Read and write</b>.</li><li>Pega aquí el token. Se queda en este navegador.</li></ol>
    <label>Repositorio<input name="repo" value="${esc(g.repo)}" required pattern="[\w.\-]+/[\w.\-]+"></label>
    <div class="two"><label>Rama<input name="branch" value="${esc(g.branch)}" required></label><label>Token<input name="token" type="password" value="${esc(g.token || '')}" placeholder="github_pat_…" autocomplete="off" required></label></div>
    <p id="gerr" style="color:var(--bad);min-height:20px"></p>
    <div class="acts"><button class="btn" type="submit">Guardar y probar</button><button class="btn ghost" type="button" data-x>Cancelar</button>${g.token ? '<button class="btn ghost" type="button" data-g="forget" style="margin-left:auto;color:var(--bad)">Desconectar</button>' : ''}</div></form>`;
    dlg.dataset.id = ''; dlg.showModal();
  }
  function lessonForm(l, track) {
    dlg.innerHTML = `<form class="dlg" id="lf"><h2>${l ? 'Editar lección' : 'Nueva lección'}</h2>
    <label>Título<input name="title" required maxlength="80" value="${esc(l?.title || '')}"></label>
    <label>Descripción<textarea name="text" maxlength="400">${esc(l?.text || '')}</textarea></label>
    <div class="two"><label>Nivel<select name="level"><option value="">Sin nivel</option>${C.LEVELS.map((v) => `<option ${v === l?.level ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>Ritmo de respiración (opcional)<select name="pace"><option value="">Ninguno</option>${Object.entries(C.PACES).map(([k, v]) => `<option value="${k}" ${k === l?.pace ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label></div>
    <label>Duración (minutos, se rellena sola al subir el vídeo)<input name="min" type="number" min="1" max="180" value="${l?.min || 10}"></label>
    <div class="acts"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-x>Cancelar</button>${l ? '<button class="btn ghost" type="button" data-g="delete" style="margin-left:auto;color:var(--bad)">Eliminar</button>' : ''}</div></form>`;
    dlg.dataset.id = l?.id || ''; dlg.dataset.t = track || l?.track; dlg.showModal();
  }

  const render = () => { view.innerHTML = tab === 'miembros' ? members() : content(); document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); };

  function openMember(id) {
    const m = db.members.find((x) => x.id === id), [s, c] = C.status(m);
    dlg.innerHTML = `<div class="dlg"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><span class="chip ${c}">${s}</span><h2 style="margin-top:8px">${esc(m.name)}</h2><p class="mute">Desde ${C.fmt(m.start)} · renueva ${C.fmt(m.renew)}</p></div><button class="btn sm ghost" data-x>Cerrar</button></div>
    <div><p class="eyebrow">Enlace personal</p><div class="linkbox" style="margin-top:6px">${esc(C.link(m))}</div></div>
    <div class="acts"><button class="btn sm" data-a="copylink">Copiar enlace</button><button class="btn sm" data-a="copywelcome">Copiar mensaje de bienvenida</button><a class="btn sm ghost" target="_blank" rel="noopener" href="${C.wa(welcome(m), m.phone.replace(/\D/g, ''))}">Abrir WhatsApp</a><a class="btn sm ghost" href="${C.link(m)}" target="_blank" rel="noopener">Ver como miembro</a></div>
    <div class="two"><label>Teléfono (con prefijo)<input data-f="phone" value="${esc(m.phone)}" placeholder="34600111222"></label><label>Instagram<input data-f="ig" value="${esc(m.ig)}" placeholder="usuario"></label></div>
    <div class="two"><label>Renueva el<input type="date" data-f="renew" value="${m.renew.slice(0, 10)}"></label><label>Origen<select data-f="source">${['WhatsApp', 'Instagram', 'En persona', 'Otro'].map((o) => `<option ${o === m.source ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>
    <div class="acts"><button class="btn sm" data-a="renew">Renovar +1 mes</button><button class="btn sm ghost" data-a="renewmsg">Copiar aviso de renovación</button><button class="btn sm ghost" data-a="newlink">Enlace nuevo</button><button class="btn sm ghost" data-a="toggle">${m.active ? 'Apagar enlace' : 'Encender enlace'}</button></div>
    <div><p class="eyebrow">Progreso</p>${Object.entries(C.TRACKS).map(([k, t]) => `<div style="margin-top:10px;display:flex;justify-content:space-between"><span>${t.name}</span><span class="mute">${C.doneN(m, k)}/${C.lessons(k).length}</span></div><div class="bar" style="margin-top:4px"><i style="width:${(C.doneN(m, k) / C.lessons(k).length) * 100}%"></i></div>`).join('')}<p class="mute" style="margin-top:10px">Racha: ${C.streak(m)} días · última actividad: ${C.ago(C.lastActive(m)).toLowerCase()}</p></div>
    <label>Notas privadas (el miembro no las ve)<textarea data-f="notes">${esc(m.notes)}</textarea></label>
    <div class="acts"><button class="btn sm ghost" data-a="del" style="color:var(--bad)">Eliminar miembro</button></div></div>`;
    dlg.dataset.id = id; dlg.showModal();
  }

  function newMember() {
    const today = new Date().toISOString().slice(0, 10);
    dlg.innerHTML = `<form class="dlg" method="dialog" id="nf"><h2>Nuevo miembro</h2><p class="mute">Crea su enlace personal y envíaselo por WhatsApp o Instagram.</p>
    <label>Nombre<input name="name" required maxlength="60" autocomplete="off"></label>
    <div class="two"><label>Teléfono (con prefijo)<input name="phone" placeholder="34600111222" inputmode="numeric"></label><label>Instagram<input name="ig" placeholder="usuario"></label></div>
    <div class="two"><label>Origen<select name="source"><option>WhatsApp</option><option>Instagram</option><option>En persona</option><option>Otro</option></select></label><label>Empieza el<input type="date" name="start" value="${today}"></label></div>
    <div class="acts"><button class="btn" type="submit">Crear y obtener enlace</button><button class="btn ghost" type="button" data-x>Cancelar</button></div></form>`;
    dlg.dataset.id = ''; dlg.showModal();
  }

  dlg.addEventListener('submit', (e) => {
    if (e.target.id !== 'nf') return; e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), name = f.name.trim(); if (!name) return;
    let slug = C.slugify(name), base = slug, i = 2; while (db.members.some((x) => x.slug === slug)) slug = base + i++;
    const m = { id: 'm' + Date.now(), name, slug, token: C.token(), phone: f.phone.replace(/\D/g, ''), ig: f.ig.replace('@', '').trim(), source: f.source, start: new Date(f.start).toISOString(), renew: C.addMonth(f.start), active: true, notes: '', done: {} };
    db.members.unshift(m); save(); render(); openMember(m.id); toast('Miembro creado: copia su enlace y envíalo');
  });
  dlg.addEventListener('change', (e) => { const f = e.target.dataset.f, m = db.members.find((x) => x.id === dlg.dataset.id); if (!f || !m) return; m[f] = f === 'renew' ? new Date(e.target.value).toISOString() : f === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value; save(); render(); });
  dlg.addEventListener('click', (e) => {
    const t = e.target.closest('[data-x],[data-a]'); if (!t) return; if (t.dataset.x !== undefined) return dlg.close();
    const m = db.members.find((x) => x.id === dlg.dataset.id), a = t.dataset.a;
    if (a === 'copylink') copy(C.link(m)); else if (a === 'copywelcome') copy(welcome(m)); else if (a === 'renewmsg') copy(renewMsg(m));
    else if (a === 'renew') { m.renew = C.addMonth(new Date(m.renew) > new Date() ? m.renew : new Date()); m.active = true; save(); toast('Renovada hasta ' + C.fmt(m.renew)); render(); openMember(m.id); }
    else if (a === 'newlink') { if (confirm('El enlace anterior dejará de funcionar. ¿Crear uno nuevo?')) { m.token = C.token(); save(); toast('Enlace nuevo creado'); openMember(m.id); } }
    else if (a === 'toggle') { m.active = !m.active; save(); render(); openMember(m.id); }
    else if (a === 'del') { if (confirm(`¿Eliminar a ${m.name}? No se puede deshacer.`)) { db.members = db.members.filter((x) => x !== m); save(); dlg.close(); render(); } }
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab],[data-m],[data-f],#new,#reset'); if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; render(); } else if (t.dataset.m) openMember(t.dataset.m);
    else if (t.dataset.f && !t.closest('dialog')) { filter = t.dataset.f; render(); }
    else if (t.id === 'new') newMember();
    else if (t.id === 'reset' && confirm('Volver a los miembros de ejemplo? Se borran los cambios de esta vista previa.')) { db = C.reset(); render(); toast('Ejemplo restablecido'); }
  });
  document.addEventListener('input', (e) => { if (e.target.id === 'q') { q = e.target.value; const p = e.target.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); } });

  dlg.addEventListener('submit', async (e) => {
    const f = e.target.id; if (f !== 'gf' && f !== 'lf') return; e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (f === 'gf') {
      C.gh.setCfg({ repo: d.repo.trim(), branch: d.branch.trim(), token: d.token.trim() });
      try { $('#gerr').textContent = 'Probando…'; await C.gh.test(); dlg.close(); render(); toast('GitHub conectado'); } catch (x) { $('#gerr').textContent = x.message; }
    } else {
      let l = C.LESSONS.find((x) => x.id === dlg.dataset.id);
      if (!l) { l = { id: 'x' + Date.now().toString(36), track: dlg.dataset.t }; C.LESSONS.push(l); }
      Object.assign(l, { title: d.title.trim(), text: d.text.trim(), min: +d.min || 10, level: d.level || undefined, pace: d.pace || undefined }); C.renumber(); dlg.close(); render(); await persist();
    }
  });
  dlg.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-g]'); if (!t) return;
    if (t.dataset.g === 'forget') { C.gh.setCfg({ ...C.gh.cfg(), token: '' }); dlg.close(); render(); toast('Desconectado'); }
    if (t.dataset.g === 'delete') {
      const l = C.LESSONS.find((x) => x.id === dlg.dataset.id);
      if (!confirm(`¿Eliminar «${l.title}»? Los miembros que la hicieron perderán ese progreso.`)) return;
      C.LESSONS.splice(C.LESSONS.indexOf(l), 1); C.renumber(); dlg.close(); render();
      if (await persist()) [l.video, l.poster].filter((p) => p && p.startsWith('/media/videos/')).forEach((p) => C.gh.del(p.slice(1), 'Quitar vídeo').catch(() => {}));
    }
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-g]'); if (!t || t.closest('dialog')) return;
    const g = t.dataset.g, l = C.LESSONS.find((x) => x.id === t.dataset.id);
    if (g === 'settings') return settings();
    if (g === 'add') return lessonForm(null, t.dataset.t);
    if (g === 'edit') return lessonForm(l);
    if (g === 'up' || g === 'down') {
      const ls = C.lessons(l.track), o = ls[ls.indexOf(l) + (g === 'up' ? -1 : 1)]; if (!o) return;
      const a = C.LESSONS.indexOf(l), b = C.LESSONS.indexOf(o); [C.LESSONS[a], C.LESSONS[b]] = [C.LESSONS[b], C.LESSONS[a]]; C.renumber(); render(); persist('Orden guardado');
    }
  });
  document.addEventListener('change', async (e) => {
    const inp = e.target.closest('[data-up]'); if (!inp) return;
    const l = C.LESSONS.find((x) => x.id === inp.dataset.up), file = inp.files[0]; if (!file) return;
    if (!C.gh.ok()) { inp.value = ''; return settings(); }
    up = { id: l.id, pct: 0, msg: 'Preparando…' }; render();
    try {
      await C.gh.uploadVideo(l, file, (p) => { up.pct = p; up.msg = p < 1 ? `Subiendo ${Math.round(p * 100)}%` : 'Guardando…'; const b = document.querySelector('.upbar'); if (b) { b.querySelector('i').style.width = p * 100 + '%'; b.querySelector('small').textContent = up.msg; } });
      up = null; render(); toast('Vídeo subido. La web se actualiza en ~1 minuto');
    } catch (x) { fail(x); }
  });
  render();
});
