// Hands the GitHub token to the CRM once the CRM password is right. Both live in Vercel env vars, never in the repo:
//   CRM_PASSWORD  what Alejandro types once   GITHUB_TOKEN  fine-grained token, Contents: Read and write on this repo only
// shortcut: no rate limit beyond a 1 s delay on a wrong password; use a long password, or add real sign-in when the CRM gets it.
const { timingSafeEqual } = require('node:crypto');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { CRM_PASSWORD, GITHUB_TOKEN } = process.env;
  if (!CRM_PASSWORD || !GITHUB_TOKEN) return res.status(501).json({ error: 'not configured' });
  const pw = typeof req.body === 'object' && req.body ? req.body.password : '';
  if (!same(pw ?? '', CRM_PASSWORD)) { await new Promise((r) => setTimeout(r, 1000)); return res.status(401).json({ error: 'Contraseña incorrecta' }); }
  res.json({ token: GITHUB_TOKEN, repo: process.env.GITHUB_REPO || 'AX07/coheresencia', branch: process.env.GITHUB_BRANCH || 'main' });
};
