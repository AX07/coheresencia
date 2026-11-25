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
    const banner = `<div class="card gh ${on ? 'ok' : ''}"><div><b>${on ? 'Subida de vídeos activa' : 'Desbloquea la subida de vídeos'}</b><small class="mute" style="display:block">${on ? 'Cada vídeo que subes se guarda en tu web, que se actualiza sola en ~1 minuto. (' + esc(g.repo) + ')' : 'Los vídeos se guardan dentro de tu web, sin Vimeo ni YouTube. Escribe la contraseña del CRM una sola vez.'}</small></div><button class="btn sm ${on ? 'ghost' : ''}" data-g="settings">${on ? 'Ajustes' : 'Desbloquear'}</button></div>`;
    return banner + Object.entries(C.TRACKS).map(([k, t]) => { const ls = C.lessons(k); return `<div class="tr"><h2>${t.name}</h2><span class="mute">${t.sub} · ${t.seq ? 'se desbloquea en orden' : 'acceso libre'}</span><button class="btn sm ghost" style="margin-left:auto" data-g="add" data-t="${k}">+ Lección</button></div><div class="list">${ls.map((l, i) => {
      const busy = up && up.id === l.id;
      const n = l.videos.length, right = busy ? `<div class="upbar"><div class="bar"><i style="width:${Math.round(up.pct * 100)}%"></i></div><small class="mute">${esc(up.msg)}</small></div>` : `<span class="chip ${n ? 'ok' : 'warn'}">${n ? n + (n > 1 ? ' vídeos' : ' vídeo') : 'Sin vídeo'}</span><label class="btn sm ${n ? 'ghost' : ''}" ${up ? 'style="opacity:.4;pointer-events:none"' : ''}>${n ? '+ Vídeo' : 'Subir vídeo'}<input type="file" accept="video/mp4,video/webm,video/quicktime" hidden data-up="${l.id}"></label>`;
      return `<article class="card les"><img class="thumb" src="${esc(l.poster)}" alt=""><div><b style="font-weight:500">${i + 1}. ${esc(l.title)}</b><small class="mute" style="display:block">${l.min} min${l.circuit ? ' · circuito de ' + l.circuit + ' min' : ''}</small></div>${right}<span class="acts" style="flex-wrap:nowrap"><button class="btn sm ghost ic" data-g="up" data-id="${l.id}" ${i ? '' : 'disabled'} aria-label="Subir">↑</button><button class="btn sm ghost ic" data-g="down" data-id="${l.id}" ${i < ls.length - 1 ? '' : 'disabled'} aria-label="Bajar">↓</button><button class="btn sm ghost" data-g="edit" data-id="${l.id}">Editar</button></span></article>`;
    }).join('')}</div>`; }).join('') + '<p class="mute" style="margin-top:22px">El orden de Cuerpo es el orden en que se desbloquea. Una lección puede tener varios vídeos. Si un vídeo pesa mucho o no es WebM, el CRM lo convierte a WebM al subirlo (tarda lo que dura el vídeo y hay que dejar la pestaña abierta). Máximo 90 MB por vídeo.</p>';
  }
  const persist = async (msg) => { if (!C.gh.ok()) { settings(); return false; } try { toast('Guardando…'); await C.gh.saveLessons(); toast(msg || 'Guardado. La web se actualiza en ~1 minuto'); return true; } catch (e) { toast(e.message); return false; } };
  const persistTexts = async () => { if (!C.gh.ok()) return settings(); try { toast('Guardando…'); await C.gh.saveContent(); toast('Textos guardados. La web se actualiza en ~1 minuto'); } catch (e) { toast(e.message); } };
  function settings(manual) {
    const g = C.gh.cfg();
    if (!manual) { dlg.innerHTML = `<form class="dlg" id="pf"><h2>Desbloquear subida de vídeos</h2><p class="mute">Escribe la contraseña del CRM. Solo hace falta una vez en este navegador.</p>
    <label>Contraseña<input name="password" type="password" required autocomplete="current-password" autofocus></label><p id="gerr" style="color:var(--bad);min-height:20px"></p>
    <div class="acts"><button class="btn" type="submit">Desbloquear</button><button class="btn ghost" type="button" data-x>Cancelar</button><button class="btn ghost" type="button" data-g="manual" style="margin-left:auto;font-size:12px">Usar un token de GitHub</button></div></form>`; dlg.dataset.id = ''; dlg.showModal(); return; }
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
    ${(track || l?.track) === 'cuerpo' ? `<label>Circuito: tiempo en minutos que el miembro tiene para hacer rondas (0 = sin circuito)<input name="circuit" type="number" min="0" max="120" value="${l?.circuit || 0}"></label>` : ''}
    ${l ? `<div><p class="eyebrow">Vídeos de la lección</p>${l.videos.map((v, i) => `<div class="acts" style="justify-content:space-between;align-items:center;margin-top:8px"><span>Vídeo ${i + 1}${v.min ? ' · ' + v.min + ' min' : ''}</span><span class="acts"><label class="btn sm ghost">Reemplazar<input type="file" accept="video/mp4,video/webm,video/quicktime" hidden data-up="${l.id}" data-idx="${i}"></label><button type="button" class="btn sm ghost" data-g="rmvid" data-i="${i}" style="color:var(--bad)">Quitar</button></span></div>`).join('') || '<p class="mute">Aún no hay vídeos.</p>'}<label class="btn sm" style="margin-top:10px">+ Añadir vídeo<input type="file" accept="video/mp4,video/webm,video/quicktime" hidden data-up="${l.id}"></label></div>` : ''}
    <div class="acts"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-x>Cancelar</button>${l ? '<button class="btn ghost" type="button" data-g="delete" style="margin-left:auto;color:var(--bad)">Eliminar</button>' : ''}</div></form>`;
    dlg.dataset.id = l?.id || ''; dlg.dataset.t = track || l?.track; dlg.showModal();
  }

  function textos() {
    return `<p class="mute" style="margin-bottom:14px">Cambia aquí los textos que ven los miembros en su panel. Se guardan en tu web y se actualizan en ~1 minuto.</p><div class="list">${Object.entries(C.TEXTS).map(([k, [label, def]]) => `<label class="card" style="padding:14px 16px">${label}<textarea data-tx="${k}" maxlength="400" rows="2">${esc(C.T(k))}</textarea></label>`).join('')}</div><div class="acts" style="margin-top:14px"><button class="btn" data-g="savetx">Guardar textos</button><button class="btn ghost" data-g="resettx">Volver a los textos originales</button></div>`;
  }
  const render = () => { view.innerHTML = tab === 'miembros' ? members() : tab === 'contenido' ? content() : textos(); document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); };

  const localDT = (iso) => { const d = new Date(iso), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  function openMember(id) {
    const m = db.members.find((x) => x.id === id), [s, c] = C.status(m);
    dlg.innerHTML = `<div class="dlg"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><span class="chip ${c}">${s}</span><h2 style="margin-top:8px">${esc(m.name)}</h2><p class="mute">Desde ${C.fmt(m.start)} · renueva ${C.fmt(m.renew)}</p></div><button class="btn sm ghost" data-x>Cerrar</button></div>
    <div><p class="eyebrow">Enlace personal</p><div class="linkbox" style="margin-top:6px">${esc(C.link(m))}</div></div>
    <div class="acts"><button class="btn sm" data-a="copylink">Copiar enlace</button><button class="btn sm" data-a="copywelcome">Copiar mensaje de bienvenida</button><a class="btn sm ghost" target="_blank" rel="noopener" href="${C.wa(welcome(m), m.phone.replace(/\D/g, ''))}">Abrir WhatsApp</a><a class="btn sm ghost" href="${C.link(m)}" target="_blank" rel="noopener">Ver como miembro</a></div>
    <div class="two"><label>Teléfono (con prefijo)<input data-f="phone" value="${esc(m.phone)}" placeholder="34600111222"></label><label>Instagram<input data-f="ig" value="${esc(m.ig)}" placeholder="usuario"></label></div>
    <div class="two"><label>Renueva el<input type="date" data-f="renew" value="${m.renew.slice(0, 10)}"></label><label>Origen<select data-f="source">${['WhatsApp', 'Instagram', 'En persona', 'Otro'].map((o) => `<option ${o === m.source ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>
    <div class="acts"><button class="btn sm" data-a="renew">Renovar +1 mes</button><button class="btn sm ghost" data-a="renewmsg">Copiar aviso de renovación</button><button class="btn sm ghost" data-a="newlink">Enlace nuevo</button><button class="btn sm ghost" data-a="toggle">${m.active ? 'Apagar enlace' : 'Encender enlace'}</button></div>
    <div><p class="eyebrow">Progreso</p>${Object.entries(C.TRACKS).map(([k, t]) => `<div style="margin-top:10px;display:flex;justify-content:space-between"><span>${t.name}</span><span class="mute">${C.doneN(m, k)}/${C.lessons(k).length}</span></div><div class="bar" style="margin-top:4px"><i style="width:${(C.doneN(m, k) / C.lessons(k).length) * 100}%"></i></div>`).join('')}<p class="mute" style="margin-top:10px">Racha: ${C.streak(m)} días · última actividad: ${C.ago(C.lastActive(m)).toLowerCase()}</p></div>
    <div><p class="eyebrow">Sesión 1:1</p><p style="margin-top:6px">${m.session ? C.fmtDT(m.session.at) + ' · ' + esc(m.session.mode) : '<span class="mute">Sin sesión confirmada. Cuando el miembro te escriba y acordéis hora, ponla aquí y le aparece en su panel con cuenta atrás.</span>'}</p>
    <div class="two" style="margin-top:8px"><label>Día y hora<input type="datetime-local" data-s="at" value="${m.session ? localDT(m.session.at) : ''}"></label><label>Modo<select data-s="mode">${['Online', 'Presencial'].map((o) => `<option ${m.session && m.session.mode === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label></div>
    <div class="acts" style="margin-top:8px"><button class="btn sm" data-a="session">Confirmar sesión</button><button class="btn sm ghost" data-a="sessionmsg">Copiar mensaje de confirmación</button>${m.session ? '<button class="btn sm ghost" data-a="nosession">Quitar</button>' : ''}</div></div>
    ${(() => { const rows = C.LESSONS.filter((l) => (m.rounds || {})[l.id]).map((l) => `<div style="display:flex;justify-content:space-between;gap:10px;margin-top:6px"><span>${esc(l.title)}</span><span class="mute">${m.rounds[l.id].map((x) => x.n).join(' · ')} rondas</span></div>`); return rows.length ? `<div><p class="eyebrow">Rondas de los circuitos</p>${rows.join('')}</div>` : ''; })()}
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
    if (a === 'session') { const at = dlg.querySelector('[data-s=at]').value; if (!at) return toast('Elige el día y la hora'); m.session = { at: new Date(at).toISOString(), mode: dlg.querySelector('[data-s=mode]').value }; save(); toast('Sesión confirmada: el miembro la ve en su panel'); return openMember(m.id); }
    if (a === 'nosession') { delete m.session; save(); return openMember(m.id); }
    if (a === 'sessionmsg') { if (!m.session) return toast('Primero confirma la sesión'); return copy(`Hola ${first(m)}, confirmado: tu sesión 1:1 es el ${C.fmtDT(m.session.at)} (${m.session.mode.toLowerCase()}). La verás en tu panel con la cuenta atrás: ${C.link(m)}`); }
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
    const f = e.target.id; if (f !== 'gf' && f !== 'lf' && f !== 'pf') return; e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (f === 'pf') {
      try { $('#gerr').textContent = 'Comprobando…'; await C.gh.unlock(d.password); dlg.close(); render(); toast('Listo: ya puedes subir vídeos'); } catch (x) { if (x.manual) return settings(true); $('#gerr').textContent = x.message; }
    } else if (f === 'gf') {
      C.gh.setCfg({ repo: d.repo.trim(), branch: d.branch.trim(), token: d.token.trim() });
      try { $('#gerr').textContent = 'Probando…'; await C.gh.test(); dlg.close(); render(); toast('GitHub conectado'); } catch (x) { $('#gerr').textContent = x.message; }
    } else {
      let l = C.LESSONS.find((x) => x.id === dlg.dataset.id);
      if (!l) { l = { id: 'x' + Date.now().toString(36), track: dlg.dataset.t }; C.LESSONS.push(l); }
      Object.assign(l, { title: d.title.trim(), text: d.text.trim(), min: +d.min || 10, circuit: +d.circuit || undefined, level: d.level || undefined, pace: d.pace || undefined }); C.renumber(); dlg.close(); render(); await persist();
    }
  });
  dlg.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-g]'); if (!t) return;
    if (t.dataset.g === 'manual') return settings(true);
    if (t.dataset.g === 'forget') { C.gh.setCfg({ ...C.gh.cfg(), token: '' }); dlg.close(); render(); toast('Desconectado'); }
    if (t.dataset.g === 'rmvid') {
      const l = C.LESSONS.find((x) => x.id === dlg.dataset.id); if (!confirm('¿Quitar este vídeo de la lección?')) return;
      try { toast('Quitando…'); await C.gh.removeVideo(l, +t.dataset.i); lessonForm(l); render(); toast('Vídeo quitado'); } catch (x) { toast(x.message); }
    }
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
    if (g === 'settings') return settings(C.gh.ok());
    if (g === 'resettx') { C.setTexts({}); render(); return persistTexts(); }
    if (g === 'savetx') { const o = {}; document.querySelectorAll('[data-tx]').forEach((x) => { const v = x.value.trim(); if (v && v !== C.TEXTS[x.dataset.tx][1]) o[x.dataset.tx] = v; }); C.setTexts(o); return persistTexts(); }
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
    const idx = inp.dataset.idx != null ? +inp.dataset.idx : undefined; if (dlg.open) dlg.close();
    up = { id: l.id, pct: 0, msg: 'Preparando…' }; render();
    const show = (pct, msg) => { up.pct = pct; up.msg = msg; const b = document.querySelector('.upbar'); if (b) { b.querySelector('i').style.width = pct * 100 + '%'; b.querySelector('small').textContent = msg; } };
    try {
      await C.gh.uploadVideo(l, file, { idx, onst: (m) => show(0, m), onp: (p) => show(p, p < 1 ? `Subiendo ${Math.round(p * 100)}%` : 'Guardando…') });
      up = null; render(); toast('Vídeo subido. La web se actualiza en ~1 minuto');
    } catch (x) { fail(x); }
  });
  render();
});
