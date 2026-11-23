/* Saves lessons and videos straight into the project's GitHub repo from the CRM (GitHub "contents" API).
   Vercel redeploys on every commit, so a video is live about a minute after it is uploaded.
   The token is the owner's own, kept in this browser only (localStorage). It needs "Contents: Read and write" on this one repo.
   shortcut: one request per file, GitHub caps a file at 100 MB (we stop at 90). For bigger videos, compress them or move to object storage. */
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
    x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch {} x.status < 300 ? res(j) : rej(Object.assign(new Error(x.status === 401 ? 'El token no es válido' : x.status === 403 || x.status === 404 ? 'Sin permiso o repositorio no encontrado' : j.message || 'Error ' + x.status), { status: x.status })); };
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
  const saveLessons = () => put('lessons.json', JSON.stringify(C.LESSONS.map(({ id, track, title, min, text, poster, video, level, pace }) => ({ id, track, title, min, text, poster, video, level, pace })), null, 1) + '\n', 'Actualizar lecciones desde el CRM');
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
  async function uploadVideo(l, file, onp) {
    if (!/\.(mp4|webm)$/i.test(file.name)) throw new Error('Usa un vídeo .mp4 o .webm');
    if (file.size > MAX) throw new Error('Pesa más de 90 MB. Comprímelo (por ejemplo 720p) y vuelve a subirlo');
    const { poster, min } = await probe(file), tag = rand(), base = `media/videos/${l.id}-${tag}`, old = [l.video, l.poster].filter(own);
    if (poster) await put(base + '.jpg', poster, `Póster de «${l.title}»`, { fresh: true });
    await put(base + '.' + file.name.split('.').pop().toLowerCase(), file, `Vídeo de «${l.title}»`, { fresh: true, onp });
    l.video = '/' + base + '.' + file.name.split('.').pop().toLowerCase(); if (poster) l.poster = '/' + base + '.jpg'; if (min) l.min = min;
    await saveLessons();
    for (const p of old) await del(p.slice(1), 'Quitar vídeo anterior').catch(() => {});
  }
  C.gh = { cfg, setCfg, ok, test, saveLessons, uploadVideo, del };
})();
