/* publish.js — dashboard only. Commits your content to your GitHub repo so GitHub Pages shows it to every visitor.
   Content  -> data/content.json
   Uploads  -> assets/uploads/<hash>.<ext>   (photos, resume, certificates are moved out of the JSON into real files)
   The token lives only in this browser's localStorage. Use a fine-grained token limited to this one repository. */
const Pub = (() => {
  const CFG = 'pf_gh', SHA = 'pf_sha', DIRTY = 'pf_dirty', FILE = 'data/content.json';
  const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'application/pdf': 'pdf' };
  const cfg = () => { try { return JSON.parse(localStorage.getItem(CFG)) || {}; } catch { return {}; } };
  const setCfg = c => localStorage.setItem(CFG, JSON.stringify(c));
  const ready = () => { const c = cfg(); return !!(c.owner && c.repo && c.token); };
  const branch = () => cfg().branch || 'main';
  const api = { cfg, setCfg, ready, state: { s: ready() ? 'idle' : 'off', msg: '' }, onStatus: null };
  const set = (s, msg = '') => { api.state = { s, msg }; api.onStatus && api.onStatus(api.state); };

  const enc = str => { const b = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000)); return btoa(bin); };
  const dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));
  const hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))).slice(0, 6)].map(b => b.toString(16).padStart(2, '0')).join('');

  async function gh(path, opt = {}) {
    const c = cfg(); let r;
    try {
      r = await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}${path}`, {
        ...opt, cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + c.token, 'X-GitHub-Api-Version': '2022-11-28', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) }
      });
    } catch { throw new Error('Could not reach GitHub. Check your internet connection.'); }
    if (r.ok) return r.json();
    let m = ''; try { m = (await r.json()).message || ''; } catch {}
    const e = new Error(r.status === 401 ? 'GitHub rejected the token (wrong or expired).'
      : r.status === 403 ? 'GitHub refused: ' + (m || 'the token needs Contents: Read and write.')
      : r.status === 404 ? 'Not found. Check the username, repository name, and that the token can access this repository.'
      : m || 'GitHub error ' + r.status);
    e.status = r.status; throw e;
  }

  api.test = async () => {
    const r = await gh('');
    if (r.permissions && !r.permissions.push) throw new Error('This token can only read the repository. Give it Contents: Read and write.');
    try { await gh('/branches/' + encodeURIComponent(branch())); }
    catch (e) { throw e.status === 404 ? new Error(`Branch "${branch()}" was not found. Your default branch is "${r.default_branch}".`) : e; }
    return r;
  };

  const pull = async () => {
    const f = await gh(`/contents/${FILE}?ref=${encodeURIComponent(branch())}`);
    if (!f.content) throw new Error('data/content.json is too large to read through the GitHub API.');
    return { sha: f.sha, data: JSON.parse(dec(f.content)) };
  };

  async function upload(url, done) {
    if (done.has(url)) return done.get(url);
    const m = /^data:([^;,]+);base64,(.*)$/s.exec(url);
    const path = `assets/uploads/${await hex(url)}.${EXT[m[1]] || 'bin'}`;
    try { await gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message: 'Upload ' + path, content: m[2], branch: branch() }) }); }
    catch (e) { if (e.status !== 422) throw e; } // 422: the same file is already in the repo
    done.set(url, path); return path;
  }
  // Replace embedded base64 files with real files in the repo (edits the object in place).
  async function externalize(o, done) {
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === 'string' && v.startsWith('data:') && /^data:[^;,]+;base64,/.test(v)) o[k] = await upload(v, done);
      else if (v && typeof v === 'object') await externalize(v, done);
    }
  }

  async function run(getD) {
    set('busy', 'Publishing…');
    const D = getD(); await externalize(D, new Map()); Store.save(D);
    let sha; try { sha = (await gh(`/contents/${FILE}?ref=${encodeURIComponent(branch())}`)).sha; } catch (e) { if (e.status !== 404) throw e; }
    const r = await gh(`/contents/${FILE}`, { method: 'PUT', body: JSON.stringify({ message: 'Update portfolio content', content: enc(JSON.stringify({ ...D, messages: [] }, null, 1)), branch: branch(), ...(sha ? { sha } : {}) }) });
    localStorage.setItem(SHA, r.content.sha); localStorage.removeItem(DIRTY);
  }

  let timer = 0, busy = false, again = false, getD = null;
  async function go() {
    if (busy) { again = true; return; }
    busy = true;
    try { await run(getD); set('ok', 'Published.'); } catch (e) { set('err', e.message); }
    busy = false; if (again) { again = false; go(); }
  }
  api.schedule = g => { // called after every local save
    getD = g; localStorage.setItem(DIRTY, '1');
    if (!ready()) return set('off', 'Saved in this browser only. Connect GitHub on the Publishing page.');
    set('pending', 'Publishing in a moment…'); clearTimeout(timer); timer = setTimeout(go, 1200);
  };
  api.now = g => { if (!ready()) return set('off'); getD = g; clearTimeout(timer); set('pending'); go(); };

  // Runs before the dashboard starts: pick the freshest copy of the content.
  api.boot = async () => {
    const local = Store.draft(), dirty = !!localStorage.getItem(DIRTY); let remote = null, sha = null, err = '';
    if (ready()) { try { ({ data: remote, sha } = await pull()); } catch (e) { if (e.status !== 404) err = e.message; } }
    if (!remote && !ready()) { try { remote = await Store.fetchSite('../data/content.json'); } catch {} }
    // Use the live copy when this browser has no unpublished edits (e.g. you edited from another device).
    if (remote && (!local || (!dirty && (!sha || sha !== localStorage.getItem(SHA))))) {
      Store.use(remote); Store.save(remote); if (sha) localStorage.setItem(SHA, sha);
    } else Store.use(local || Store.seed());
    if (err) set('err', err); else if (ready() && dirty) set('pending', 'You have unpublished changes.');
    if (ready() && dirty && !err) { getD = () => Store.load(); timer = setTimeout(go, 800); }
  };

  addEventListener('beforeunload', e => { if (['pending', 'busy'].includes(api.state.s)) { e.preventDefault(); e.returnValue = ''; } });
  return api;
})();
