/* Guided breathing: a ring that grows on the inhale and shrinks on the exhale, with a seconds countdown like a second hand.
   COH.pacer.open('calma', 1). Rhythms live in data.js (COH.PACES) so the CRM can attach one to a lesson. */
(() => {
  const P = COH.PACES, $ = (s) => document.querySelector(s), fmt = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  let el, raf, lock, cur;
  const build = () => { el = document.createElement('div'); el.className = 'pacer'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Respiración guiada'); document.body.append(el); el.addEventListener('click', onClick); };
  const shut = () => { cancelAnimationFrame(raf); lock?.release?.().catch(() => {}); lock = null; el.classList.remove('on'); document.body.style.overflow = ''; };
  function setup() {
    const p = P[cur.key];
    el.innerHTML = `<button class="px" data-p="close" aria-label="Cerrar">✕</button><div class="pbody"><p class="eyebrow">Respirar con ritmo</p><h2>${p.name}</h2><p class="mute pmsg">${p.hint}</p>
    <div class="pchips" role="group" aria-label="Ritmo">${Object.entries(P).map(([k, v]) => `<button class="pill ${k === cur.key ? 'on' : ''}" data-p="key" data-k="${k}">${v.name}</button>`).join('')}</div>
    <div class="pchips" role="group" aria-label="Duración">${[1, 3, 5, 10].map((n) => `<button class="pill ${n === cur.mins ? 'on' : ''}" data-p="mins" data-n="${n}">${n} min</button>`).join('')}</div>
    <div class="pring idle"><i></i><div class="cue"><span class="pat">${p.seq.map((s) => s[1]).join(' · ')}</span></div></div>
    <button class="btn" data-p="start">Empezar</button></div>`;
  }
  function run() {
    const p = P[cur.key], total = cur.mins * 6e4, cyc = p.seq.reduce((s, x) => s + x[1], 0) * 1000, t0 = performance.now();
    el.innerHTML = `<button class="px" data-p="stop" aria-label="Parar">✕</button><div class="pbody"><p class="eyebrow">${p.name}</p><div class="pring"><i id="pi"></i><div class="cue" aria-live="polite"><b id="pl"></b><span id="pn"></span></div></div><p class="mute" id="pt"></p><button class="btn ghost" data-p="stop">Parar</button></div>`;
    navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
    const ring = $('#pi'); let last = -1, scale = .6;
    const tick = (now) => {
      const e = now - t0; if (e >= total) return finish();
      let t = e % cyc, i = 0, acc = 0; while (t >= acc + p.seq[i][1] * 1000) { acc += p.seq[i][1] * 1000; i++; }
      const [label, sec] = p.seq[i];
      if (i !== last) { last = i; $('#pl').textContent = label; ring.style.transitionDuration = sec + 's'; if (label === 'Inhala') scale = 1; else if (label === 'Exhala') scale = .6; ring.style.transform = `scale(${scale})`; navigator.vibrate?.(25); }
      $('#pn').textContent = Math.ceil((acc + sec * 1000 - t) / 1000); $('#pt').textContent = fmt(total - e);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function finish() {
    cancelAnimationFrame(raf); lock?.release?.().catch(() => {}); lock = null; navigator.vibrate?.([40, 60, 40]);
    el.innerHTML = `<div class="pbody"><p class="eyebrow">Hecho</p><h2>Bien hecho</h2><p class="mute pmsg">${cur.mins} min de respiración. Nota cómo estás ahora.</p><div class="pring idle"><i></i></div><div class="pchips"><button class="btn" data-p="close">Cerrar</button><button class="btn ghost" data-p="again">Otra vez</button></div></div>`;
  }
  function onClick(e) {
    const t = e.target.closest('[data-p]'); if (!t) return; const a = t.dataset.p;
    if (a === 'close' || a === 'stop') return shut();
    if (a === 'key') { cur.key = t.dataset.k; setup(); } else if (a === 'mins') { cur.mins = +t.dataset.n; setup(); } else if (a === 'start') run(); else if (a === 'again') setup();
  }
  COH.pacer = { open(key = 'calma', mins = 1) { if (!el) build(); cur = { key: P[key] ? key : 'calma', mins }; setup(); el.classList.add('on'); document.body.style.overflow = 'hidden'; el.querySelector('[data-p=start]').focus(); } };
})();
