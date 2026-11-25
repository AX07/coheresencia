/* Saves lessons and videos straight into the project's GitHub repo from the CRM (GitHub "contents" API).
   Vercel redeploys on every commit, so a video is live about a minute after it is uploaded.
   The token is the owner's own, kept in this browser only (localStorage). It needs "Contents: Read and write" on this one repo.
   shortcut: one request per file, GitHub caps a file at 100 MB (we stop at 90). Heavy or non-WebM videos are converted first (see toWebm). Move to object storage if the repo gets too big. */
(() => {
  const C = COH, KEY = 'coh-gh-v1', MAX = 90 * 1024 * 1024;
  const cfg = () => { try { return { repo: 'AX07/coheresencia', branch: 'main', ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return { repo: 'AX07/coheresencia', branch: 'main' }; } };
  const setCfg = (c) => localStorage.setItem(KEY, JSON.stringify(c));
  const ok = () => !!cfg().token;
  const b64 = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('No se pudo leer el archivo')); r.readAsDataURL(blob); });
  const url = (path) => `https://api.github.com/repos/${cfg().repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
  const call = (method, path, body, onp) => new Promise((res, rej) => {
    const c = cfg(), x = new XMLHttpRequest();
    x.open(method, url(path) + (method === 'GET' ? '?ref=' + encodeURIComponent(c.branch) : ''));
    x.setRequestHeader('Authorization', 'Bearer ' + c.token); x.setRequestHeader('Accept', 'application/vnd.github+json');
    if (onp) x.upload.onprogress = (e) => e.lengthComputable && onp(e.loaded / e.total);
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch {} x.status < 300 ? res(j) : rej(Object.assign(new Error(x.status === 401 ? (setCfg({ ...cfg(), token: '' }), 'La conexión caducó: vuelve a pulsar Conectar') : x.status === 403 || x.status === 404 ? 'Sin permiso o repositorio no encontrado' : j.message || 'Error ' + x.status), { status: x.status })); };
    x.onerror = () => rej(new Error('Sin conexión con GitHub'));
    x.send(body ? JSON.stringify(body) : null);
  });
  const sha = (p) => call('GET', p).then((j) => j.sha, (e) => e.status === 404 ? undefined : Promise.reject(e));
  const put = async (path, data, msg, { fresh, onp } = {}) => {
    const content = typeof data === 'string' ? btoa(unescape(encodeURIComponent(data))) : await b64(data);
    return call('PUT', path, { message: msg, content, branch: cfg().branch, sha: fresh ? undefined : await sha(path) }, onp);
  };
  const del = async (path, msg) => { const s = await sha(path); if (s) await call('DELETE', path, { message: msg, sha: s, branch: cfg().branch }); };
  // Checks the token can write to the repo before the owner finds out the hard way.
  const test = async () => {
    const c = cfg(), r = await fetch('https://api.github.com/repos/' + c.repo, { headers: { Authorization: 'Bearer ' + c.token, Accept: 'application/vnd.github+json' } });
    if (r.status === 401) throw new Error('El token no es válido');
    if (!r.ok) throw new Error('No encuentro el repositorio ' + c.repo);
    if (!(await r.json()).permissions?.push) throw new Error('El token no tiene permiso de escritura (Contents: Read and write)');
  };
  const saveLessons = () => put('lessons.json', JSON.stringify(C.LESSONS.map(({ id, track, title, min, text, poster, videos, level, pace, circuit }) => ({ id, track, title, min, text, poster, videos, level, pace, circuit })), null, 1) + '\n', 'Actualizar lecciones desde el CRM');
  const saveContent = () => put('content.json', JSON.stringify({ texts: C.texts() }, null, 1) + '\n', 'Actualizar textos desde el CRM');
  // First frame and length, so each lesson gets its own poster and minutes without the owner typing them.
  const probe = (file) => new Promise((res) => {
    const v = document.createElement('video'), u = URL.createObjectURL(file), done = (r) => { URL.revokeObjectURL(u); res(r); };
    v.muted = true; v.preload = 'metadata'; v.src = u;
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
    v.onseeked = () => { const s = Math.min(1, 800 / v.videoWidth), c = document.createElement('canvas'); c.width = v.videoWidth * s; c.height = v.videoHeight * s; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); c.toBlob((b) => done({ poster: b, min: Math.max(1, Math.round(v.duration / 60)) }), 'image/jpeg', .8); };
    v.onerror = () => done({}); setTimeout(() => done({}), 8000);
  });
  const rand = () => [...crypto.getRandomValues(new Uint8Array(5))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const own = (p) => p && p.startsWith('/media/videos/');
  // WebM is lighter. A video that is not WebM and is big, or is over the limit, is re-encoded in the browser (720p, bitrate chosen to fit).
  // shortcut: it plays the video once in real time to record it, so a 10 minute video takes about 10 minutes and the tab must stay open. Use a server-side encoder (ffmpeg) if this gets slow.
  const needsConvert = (f) => f.size > MAX || (!/\.webm$/i.test(f.name) && f.size > 20 * 1024 * 1024);
  const toWebm = (file, onst) => new Promise((res, rej) => {
    if (!window.MediaRecorder) return rej(new Error('Este navegador no puede convertir vídeo. Usa Chrome o Edge, o súbelo ya en WebM'));
    const v = document.createElement('video'), u = URL.createObjectURL(file); v.src = u; v.playsInline = true;
    v.onerror = () => { URL.revokeObjectURL(u); rej(new Error('No se pudo leer el vídeo para convertirlo')); };
    v.onloadedmetadata = async () => {
      try {
        const dur = v.duration, k = Math.min(1, 1280 / v.videoWidth, 720 / v.videoHeight), w = Math.round(v.videoWidth * k / 2) * 2, h = Math.round(v.videoHeight * k / 2) * 2;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
        const ctx = new AudioContext(), dst = ctx.createMediaStreamDestination(); ctx.createMediaElementSource(v).connect(dst); // sound goes to the recording, not the speakers
        const bps = Math.max(3e5, Math.min(1.6e6, (MAX * .85 * 8) / dur - 128e3));
        const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
        const rec = new MediaRecorder(new MediaStream([...cv.captureStream(30).getVideoTracks(), ...dst.stream.getAudioTracks()]), { mimeType: mime, videoBitsPerSecond: bps, audioBitsPerSecond: 96e3 }), chunks = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        let raf; const draw = () => { g.drawImage(v, 0, 0, w, h); onst(v.currentTime / dur); raf = requestAnimationFrame(draw); };
        v.onended = () => { cancelAnimationFrame(raf); rec.stop(); };
        rec.onstop = () => { URL.revokeObjectURL(u); ctx.close(); res(new File([new Blob(chunks, { type: 'video/webm' })], file.name.replace(/\.\w+$/, '') + '.webm', { type: 'video/webm' })); };
        await ctx.resume(); rec.start(1000); await v.play(); draw();
      } catch (e) { rej(new Error('No se pudo convertir el vídeo: ' + (e.message || e))); }
    };
  });
  // Adds a video to a lesson (or replaces number `idx`). The first video also gives the lesson its poster and length.
  async function uploadVideo(l, file, { onp, onst, idx } = {}) {
    if (!/\.(mp4|webm|mov|m4v)$/i.test(file.name)) throw new Error('Usa un vídeo .mp4, .mov o .webm');
    if (needsConvert(file)) { onst && onst('Convirtiendo a WebM… no cierres esta pestaña'); file = await toWebm(file, (p) => onst && onst(`Convirtiendo a WebM ${Math.round(p * 100)}%`)); }
    if (file.size > MAX) throw new Error('Aun convertido pesa más de 90 MB. Recórtalo en partes y sube cada una como un vídeo');
    const { poster, min } = await probe(file), tag = rand(), base = `media/videos/${l.id}-${tag}`, ext = file.name.split('.').pop().toLowerCase();
    const old = idx != null && l.videos[idx] ? l.videos[idx].src : null, first = idx === 0 || (idx == null && !l.videos.length);
    if (poster && first) await put(base + '.jpg', poster, `Póster de «${l.title}»`, { fresh: true });
    await put(`${base}.${ext}`, file, `Vídeo de «${l.title}»`, { fresh: true, onp });
    const item = { src: `/${base}.${ext}`, min: min || undefined };
    if (idx != null && l.videos[idx]) l.videos[idx] = item; else l.videos.push(item);
    if (poster && first) { const oldPoster = own(l.poster) ? l.poster : null; l.poster = `/${base}.jpg`; if (oldPoster) del(oldPoster.slice(1), 'Quitar póster anterior').catch(() => {}); }
    const tot = l.videos.reduce((t, x) => t + (x.min || 0), 0); if (tot) l.min = tot;
    await saveLessons();
    if (old) await del(old.slice(1), 'Quitar vídeo anterior').catch(() => {});
  }
  async function removeVideo(l, idx) {
    const v = l.videos.splice(idx, 1)[0]; await saveLessons(); if (v && own(v.src)) await del(v.src.slice(1), 'Quitar vídeo').catch(() => {});
  }
  // The owner types the CRM password once; the server hands back the token it keeps in its own settings.
  const unlock = async (password) => {
    const r = await fetch('/api/token', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    if (r.status === 501 || r.status === 404) throw Object.assign(new Error('Este sitio aún no tiene la contraseña configurada'), { manual: true });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'No se pudo conectar');
    setCfg({ repo: j.repo, branch: j.branch, token: j.token });
  };
  C.gh = { cfg, setCfg, ok, test, unlock, saveLessons, saveContent, uploadVideo, removeVideo, toWebm, del };
})();
