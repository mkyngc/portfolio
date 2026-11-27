/* auth.js — PROTOTYPE ONLY. Real security needs a server (hashed passwords, sessions, rate limiting).
   Passwords are never stored in plaintext: a salted PBKDF2 hash is kept in localStorage, which anyone with
   access to this browser can read or replace. Treat this as a UI placeholder for a future API login. */
const Auth = (() => {
  const CRED = 'pf_admin_cred', SES = 'pf_admin_session';
  const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function hash(pw, salt) {
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
    return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, k, 256));
  }
  const hasAccount = () => !!localStorage.getItem(CRED);
  async function register(user, pw) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem(CRED, JSON.stringify({ user: user.toLowerCase(), salt: b64(salt), hash: await hash(pw, salt) }));
  }
  async function login(user, pw, remember) {
    const c = JSON.parse(localStorage.getItem(CRED) || 'null');
    if (!c || c.user !== user.toLowerCase() || c.hash !== await hash(pw, unb64(c.salt))) return false;
    const s = JSON.stringify({ user: c.user, exp: Date.now() + (remember ? 7 * 864e5 : 2 * 36e5) });
    (remember ? localStorage : sessionStorage).setItem(SES, s); return true;
  }
  const session = () => { for (const st of [sessionStorage, localStorage]) { try { const s = JSON.parse(st.getItem(SES)); if (s && s.exp > Date.now()) return s; } catch {} } return null; };
  const logout = () => { sessionStorage.removeItem(SES); localStorage.removeItem(SES); };
  const resetAccount = () => { logout(); localStorage.removeItem(CRED); };
  const guard = () => { const s = session(); if (!s) location.replace('../login.html'); return s; };
  return { hasAccount, register, login, session, logout, guard, resetAccount };
})();
