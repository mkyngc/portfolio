const sess = Auth.guard(); let D = Store.load();
const persist = () => {
  const r = Store.save(D);
  if (r === true) { Pub.schedule(() => D); return true; }
  if (r === 'quota' && Pub.ready()) { Pub.schedule(() => D); return true; } // large photos: kept in memory and published at full size
  toast(r === 'quota' ? 'Photo is too large to keep as a browser draft. Connect GitHub on the Publishing page so it can be published at full size.' : 'Could not save: this browser is blocking storage (private window, or storage disabled). Nothing was saved.', 'err');
  return false;
};
if (!Store.available()) setTimeout(() => toast('This browser is blocking storage, so changes will NOT be saved. Use a normal (non-private) window.', 'err'), 600);
const get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const set = (o, p, v) => { const ks = p.split('.'), l = ks.pop(); ks.reduce((a, k) => a[k] ??= {}, o)[l] = v; };
const CATS = ['Programming Languages', 'Front-End Development', 'Back-End Development', 'Database Management', 'Frameworks and Libraries', 'GIS and Mapping Tools', 'Design and Productivity Tools', 'Other Technical Skills'];
const readFile = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Could not read file.')); r.readAsDataURL(f); });

const MODS = {
  projects: { label: 'Project', list: 'projects', cols: [['title', 'Title'], ['category', 'Category'], ['status', 'Status']], def: { status: 'Published' }, fields: [
    { k: 'title', l: 'Title', req: 1 }, { k: 'category', l: 'Category', req: 1, h: 'Used for the filter buttons.' }, { k: 'date', l: 'Date', t: 'date' }, { k: 'status', l: 'Visibility', t: 'select', o: ['Published', 'Draft'] },
    { k: 'desc', l: 'Description', t: 'textarea', req: 1, full: 1 }, { k: 'tech', l: 'Technologies', h: 'Separate with commas.', full: 1 }, { k: 'images', l: 'Project photos', t: 'gallery', accept: 'image/*', full: 1, h: 'Select one or more photos. The first one is the cover shown on the project card.' },
    { k: 'demo', l: 'Live demo URL', t: 'url' }, { k: 'repo', l: 'GitHub URL', t: 'url' }] },
  skills: { label: 'Skill', list: 'skills', cols: [['name', 'Skill'], ['cat', 'Category'], ['level', 'Level %']], reorder: 1, def: { cat: CATS[0], level: 70, icon: 'fa-solid fa-code' }, fields: [
    { k: 'name', l: 'Name', req: 1 }, { k: 'cat', l: 'Category', t: 'select', o: CATS }, { k: 'icon', l: 'Icon class', h: 'A Font Awesome class, e.g. fa-brands fa-js' }, { k: 'level', l: 'Proficiency (0–100)', t: 'number' }] },
  certs: { label: 'Certificate', list: 'certs', cols: [['title', 'Title'], ['org', 'Issuer'], ['visible', 'Visibility']], def: { visible: 'Visible' }, fields: [
    { k: 'title', l: 'Title', req: 1 }, { k: 'org', l: 'Issuing organization', req: 1 }, { k: 'date', l: 'Date issued', t: 'date' }, { k: 'visible', l: 'Visibility', t: 'select', o: ['Visible', 'Hidden'] },
    { k: 'desc', l: 'Description', t: 'textarea', full: 1 }, { k: 'file', l: 'Certificate image or PDF', t: 'file', accept: 'image/*,application/pdf', nameKey: 'fileName', full: 1 }] }
};
const SINGLE = {
  profile: { title: 'Profile', sub: 'This content appears in the hero and About sections.', fields: [
    { k: 'profile.name', l: 'Full name', req: 1 }, { k: 'profile.title', l: 'Professional title', t: 1 }, { k: 'profile.tagline', l: 'Tagline', t: 'textarea', full: 1 }, { k: 'profile.welcome', l: 'Welcome pill text' }, { k: 'profile.badgeTitle', l: 'Hero badge title' }, { k: 'profile.badgeText', l: 'Hero badge subtitle', full: 1 }, { k: 'profile.photo', l: 'Profile photo (hero)', t: 'file', accept: 'image/*' }, { k: 'profile.aboutPhoto', l: 'About Me photo', t: 'file', accept: 'image/*', h: 'Optional. If empty, the hero profile photo is used.' },
    { k: 'profile.resume', l: 'Resume (PDF)', t: 'file', accept: 'application/pdf', nameKey: 'profile.resumeName' }, { k: 'profile.bio', l: 'Biography', t: 'textarea', full: 1 },
    { k: 'profile.education', l: 'Education', t: 'textarea', full: 1, h: 'One per line: Degree | School | Years' }, { k: 'profile.experience', l: 'Work experience', t: 'textarea', full: 1, h: 'One per line: Role | Company | Years' },
    { k: 'profile.interests', l: 'Professional interests', full: 1 }, { k: 'profile.goals', l: 'Career goals', t: 'textarea', full: 1 },
    { k: 'profile.socials.github', l: 'GitHub URL', t: 'url' }, { k: 'profile.socials.linkedin', l: 'LinkedIn URL', t: 'url' }, { k: 'profile.socials.facebook', l: 'Facebook URL', t: 'url' }] },
  contact: { title: 'Contact info', sub: 'Shown in the Contact section. Social links are edited under Profile.', fields: [
    { k: 'contact.email', l: 'Email address', t: 'email', req: 1 }, { k: 'contact.phone', l: 'Phone number', h: 'Optional.' }, { k: 'contact.location', l: 'Location', h: 'Optional.', full: 1 }] },
  settings: { title: 'Settings', sub: 'Site-wide options.', fields: [
    { k: 'settings.logoText', l: 'Logo text' }, { k: 'settings.title', l: 'Website title' }, { k: 'settings.accent', l: 'Accent color', t: 'color' }, { k: 'settings.seoTitle', l: 'SEO title', full: 1 }, { k: 'settings.seoDesc', l: 'SEO description', t: 'textarea', full: 1 },
    { k: 'settings.footer', l: 'Footer text', full: 1 }, { k: 'settings.favicon', l: 'Favicon', t: 'file', accept: 'image/*', full: 1 },
    ...['about', 'projects', 'skills', 'certs', 'contact'].map(s => ({ k: 'settings.sections.' + s, l: 'Show ' + { certs: 'certificates' }[s] || s, t: 'check' }))] }
};
SINGLE.settings.fields.forEach(f => { if (f.t === 'check') f.l = 'Show the ' + ({ certs: 'certificates' }[f.k.split('.').pop()] || f.k.split('.').pop()) + ' section'; });

/* form engine */
function fieldHtml(f, v) {
  const id = 'f_' + f.k.replace(/\./g, '_'); let i;
  if (f.t === 'textarea') i = `<textarea id="${id}" name="${f.k}">${esc(v)}</textarea>`;
  else if (f.t === 'select') i = `<select id="${id}" name="${f.k}">${f.o.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  else if (f.t === 'file') i = `<input type="file" id="${id}" name="${f.k}" accept="${f.accept}">${isImg(v) ? `<img class="thumb" src="${Store.src(v)}" alt="">` : ''}<div class="hint">${v ? 'A file is saved. Choose another to replace it.' : 'No file yet.'}</div>`;
  else if (f.t === 'gallery') i = `<input type="file" id="${id}" name="${f.k}" accept="${f.accept}" multiple><div class="gal" data-gal></div>`;
  else if (f.t === 'check') return `<div class="sw full"><input type="checkbox" id="${id}" name="${f.k}" ${v !== false ? 'checked' : ''}><label for="${id}">${f.l}</label></div>`;
  else i = `<input id="${id}" name="${f.k}" type="${f.t || 'text'}" value="${esc(v)}" ${f.t === 'number' ? 'min="0" max="100"' : ''}>`;
  return `<div class="f ${f.full ? 'full' : ''}"><label for="${id}">${f.l}${f.req ? ' *' : ''}</label>${i}<div class="err"></div>${f.h ? `<div class="hint">${f.h}</div>` : ''}</div>`;
}
function setupGallery(form, it, k) {
  form._imgs = Array.isArray(it[k]) ? [...it[k]] : it.thumb ? [it.thumb] : [];
  const box = $('[data-gal]', form), inp = form.elements[k], err = inp.closest('.f').querySelector('.err');
  const draw = () => { box.innerHTML = form._imgs.map((s, n) => `<div class="gi ${n ? '' : 'cover'}"><img src="${Store.src(s)}" alt=""><span class="gtag">Cover</span><div class="gbar">${n ? `<button type="button" data-cover="${n}" title="Make cover" aria-label="Make cover"><i class="fa-solid fa-star"></i></button>` : ''}<button type="button" data-rm="${n}" title="Remove" aria-label="Remove photo"><i class="fa-solid fa-xmark"></i></button></div></div>`).join(''); };
  inp.onchange = async () => { err.textContent = ''; for (const f of [...inp.files]) { try { form._imgs.push(await readFile(f)); } catch (e) { err.textContent = e.message; } } inp.value = ''; draw(); };
  box.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.rm) form._imgs.splice(+b.dataset.rm, 1); if (b.dataset.cover) form._imgs.unshift(...form._imgs.splice(+b.dataset.cover, 1)); draw(); };
  draw();
}
async function collect(form, fields, obj) {
  let ok = true;
  for (const f of fields) {
    const el = form.elements[f.k], err = el.closest('.f')?.querySelector('.err');
    if (f.t === 'check') { set(obj, f.k, el.checked); continue; }
    if (f.t === 'gallery') { const l = form._imgs || []; set(obj, f.k, l); set(obj, 'thumb', l[0] || ''); continue; }
    if (f.t === 'file') { if (el.files[0]) { try { set(obj, f.k, await readFile(el.files[0])); if (f.nameKey) set(obj, f.nameKey, el.files[0].name); err.textContent = ''; } catch (e) { err.textContent = e.message; ok = false; } } continue; }
    const v = el.value.trim(), bad = (f.req && !v) || (f.t === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) || (f.t === 'url' && v && !/^(https?:\/\/|#)/.test(v));
    el.classList.toggle('bad', bad); err.textContent = bad ? (f.req && !v ? 'This field is required.' : f.t === 'email' ? 'Enter a valid email address.' : 'Start the link with https://') : '';
    if (bad) ok = false; else set(obj, f.k, f.t === 'number' ? Math.min(100, Math.max(0, +v || 0)) : v);
  }
  return ok;
}
const openModal = html => { $('#mbox').innerHTML = html; $('#modal').classList.add('open'); };
const closeModal = () => $('#modal').classList.remove('open');
const confirmBox = msg => new Promise(res => { openModal(`<h3>Are you sure?</h3><p style="margin:10px 0 22px">${esc(msg)}</p><div style="display:flex;gap:10px;justify-content:flex-end"><button class="btn ghost" id="no">Cancel</button><button class="btn danger" id="yes">Delete</button></div>`); $('#no').onclick = () => { closeModal(); res(false); }; $('#yes').onclick = () => { closeModal(); res(true); }; });

/* views */
const V = $('#view');
function overview() {
  const pf = ['name', 'title', 'tagline', 'photo', 'bio', 'education', 'experience', 'resume'], done = pf.filter(k => D.profile[k]).length, pct = Math.round(done / pf.length * 100);
  V.innerHTML = `<h1>Welcome back</h1><p class="sub">Here’s what’s on your portfolio right now.</p><div class="stats">
  ${[['Projects', D.projects.length, `${D.projects.filter(p => p.status === 'Published').length} published`], ['Skills', D.skills.length, `${new Set(D.skills.map(s => s.cat)).size} categories`], ['Certificates', D.certs.length, `${D.certs.filter(c => c.visible === 'Visible').length} visible`], ['Profile status', pct + '%', pct === 100 ? 'Complete' : `${pf.length - done} item(s) left`]].map(s => `<div class="panel stat"><b>${s[1]}</b>${s[0]}<br><span>${s[2]}</span></div>`).join('')}</div>
  <div class="panel"><h3>Quick actions</h3><p class="sub" style="margin:4px 0 16px">Jump to the parts you update most.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#projects">Add a project</a><a class="btn ghost" href="#profile">Edit profile</a><a class="btn ghost" href="#messages">Read messages</a></div></div>
  <div class="panel"><h3>Publishing</h3><p style="margin-top:6px">${Pub.ready() ? 'Every save is published to your GitHub repository. Visitors see changes about a minute later.' : 'Changes are only visible in this browser. <a href="#publishing"><b>Connect GitHub</b></a> to show them to your visitors.'}</p></div>`;
}
function single(key) {
  const c = SINGLE[key];
  V.innerHTML = `<h1>${c.title}</h1><p class="sub">${c.sub}</p><form class="panel" id="sf" novalidate><div class="fgrid">${c.fields.map(f => fieldHtml(f, get(D, f.k))).join('')}</div><button class="btn" style="margin-top:12px">Save changes</button></form>${key === 'settings' ? '<div class="panel"><h3>Reset demo data</h3><p class="sub" style="margin:4px 0 14px">Restores the sample content. Your login is kept.</p><button class="btn danger" id="rst">Reset content</button></div>' : ''}`;
  $('#sf').onsubmit = async e => { e.preventDefault(); const b = e.target.querySelector('button'); b.disabled = true; b.textContent = 'Saving…'; const copy = structuredClone(D);
    if (await collect(e.target, c.fields, copy)) { const prev = D; D = copy; if (persist()) toast('Changes saved.'); else D = prev; single(key); } else { toast('Fix the highlighted fields.', 'err'); b.disabled = false; b.textContent = 'Save changes'; } };
  if (key === 'settings') $('#rst').onclick = async () => { if (await confirmBox('This replaces all content with the sample data.')) { Store.reset(); D = Store.load(); persist(); toast('Content reset.'); single('settings'); } };
}
function crud(key) {
  const m = MODS[key], items = D[m.list];
  V.innerHTML = `<div class="head"><div><h1>${m.label}s</h1><p class="sub">${items.length} total</p></div><button class="btn" id="add"><i class="fa-solid fa-plus"></i>Add ${m.label.toLowerCase()}</button></div>
  <div class="panel tablewrap">${items.length ? `<table><thead><tr>${m.cols.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>${items.map((it, n) => `<tr>${m.cols.map(c => `<td>${['status', 'visible'].includes(c[0]) ? `<span class="pill ${['Draft', 'Hidden'].includes(it[c[0]]) ? 'draft' : ''}">${esc(it[c[0]])}</span>` : esc(it[c[0]])}</td>`).join('')}<td class="act">${m.reorder ? `<button class="btn sm ghost" data-up="${n}" aria-label="Move up" ${n === 0 ? 'disabled' : ''}>↑</button> <button class="btn sm ghost" data-dn="${n}" aria-label="Move down" ${n === items.length - 1 ? 'disabled' : ''}>↓</button> ` : ''}<button class="btn sm ghost" data-ed="${it.id}">Edit</button> <button class="btn sm danger" data-del="${it.id}">Delete</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty" style="border:0"><h3>No ${m.label.toLowerCase()}s yet</h3><p>Add your first one to show it on your portfolio.</p></div>`}</div>`;
  const form = it => { const isNew = !it; it = it || { ...m.def, id: Store.uid() };
    openModal(`<h3 style="margin-bottom:18px">${isNew ? 'Add' : 'Edit'} ${m.label.toLowerCase()}</h3><form id="mf" novalidate><div class="fgrid">${m.fields.map(f => fieldHtml(f, it[f.k] ?? '')).join('')}</div><div style="display:flex;gap:10px;justify-content:flex-end;margin-top:12px"><button type="button" class="btn ghost" id="cx">Cancel</button><button class="btn">Save ${m.label.toLowerCase()}</button></div></form>`);
    $('#cx').onclick = closeModal; m.fields.filter(f => f.t === 'gallery').forEach(f => setupGallery($('#mf'), it, f.k));
    $('#mf').onsubmit = async e => { e.preventDefault(); const b = e.target.querySelector('.btn:last-child'); b.disabled = true; const draft = { ...it };
      if (!(await collect(e.target, m.fields, draft))) { b.disabled = false; return toast('Fix the highlighted fields.', 'err'); }
      const prev = structuredClone(D); isNew ? D[m.list].push(draft) : D[m.list][D[m.list].findIndex(x => x.id === it.id)] = draft;
      if (persist()) { closeModal(); toast(isNew ? `${m.label} added.` : `${m.label} updated.`); crud(key); nav(); } else { D = prev; b.disabled = false; } };
  };
  $('#add').onclick = () => form();
  V.onclick = async e => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.ed) form(items.find(x => x.id === d.ed));
    if (d.del && await confirmBox(`This ${m.label.toLowerCase()} will be removed from your portfolio.`)) { const prevL = D[m.list]; D[m.list] = items.filter(x => x.id !== d.del); if (persist()) toast(`${m.label} deleted.`); else D[m.list] = prevL; crud(key); }
    if (d.up || d.dn) { const n = +(d.up ?? d.dn), t = d.up ? n - 1 : n + 1; [items[n], items[t]] = [items[t], items[n]]; persist(); crud(key); } };
}
function publishing() {
  const c = Pub.cfg();
  V.innerHTML = `<h1>Publishing</h1><p class="sub">Connect your GitHub repository so every save goes live on your site.</p>
  <form class="panel" id="gf" novalidate><div class="fgrid">
    <div class="f"><label for="g_owner">GitHub username *</label><input id="g_owner" value="${esc(c.owner)}" autocomplete="off"></div>
    <div class="f"><label for="g_repo">Repository name *</label><input id="g_repo" value="${esc(c.repo)}" autocomplete="off"></div>
    <div class="f"><label for="g_branch">Branch</label><input id="g_branch" value="${esc(c.branch || 'main')}" autocomplete="off"><div class="hint">The branch GitHub Pages publishes from.</div></div>
    <div class="f"><label for="g_token">Access token *</label><input id="g_token" type="password" value="${esc(c.token)}" autocomplete="off"><div class="hint">Stored only in this browser. Never put it in your code.</div></div>
  </div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn">Save &amp; test connection</button><button type="button" class="btn ghost" id="pnow">Publish now</button></div></form>
  <div class="panel"><h3>How to create the token</h3><ol style="margin:10px 0 0 18px;line-height:1.8"><li>On GitHub open <b>Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token</b>.</li><li>Under <b>Repository access</b> choose <b>Only select repositories</b> and pick your portfolio repository.</li><li>Under <b>Permissions → Repository permissions</b> set <b>Contents</b> to <b>Read and write</b>.</li><li>Generate the token, copy it, and paste it above. Only someone holding this token can change your live site.</li></ol></div>`;
  $('#gf').onsubmit = async e => { e.preventDefault(); const b = e.target.querySelector('button');
    const n = { owner: $('#g_owner').value.trim(), repo: $('#g_repo').value.trim(), branch: $('#g_branch').value.trim() || 'main', token: $('#g_token').value.trim() };
    if (!n.owner || !n.repo || !n.token) return toast('Fill in username, repository and token.', 'err');
    b.disabled = true; b.textContent = 'Testing…'; Pub.setCfg(n);
    try { await Pub.test(); toast('Connected to GitHub. Publishing your content…'); Pub.now(() => D); } catch (er) { toast(er.message, 'err'); }
    b.disabled = false; b.textContent = 'Save & test connection'; };
  $('#pnow').onclick = () => Pub.ready() ? Pub.now(() => D) : toast('Connect GitHub first.', 'err');
}
function messages() {
  const ms = D.messages;
  V.innerHTML = `<h1>Messages</h1><p class="sub">Submissions from your contact form.</p><div class="panel">${ms.length ? ms.map(m => `<div class="msg ${m.read ? '' : 'unread'}"><div class="head"><div><strong>${esc(m.subject)}</strong><div class="meta">${esc(m.name)} · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a> · ${new Date(m.date).toLocaleString()}</div></div><div>${m.read ? '' : `<button class="btn sm ghost" data-read="${m.id}">Mark as read</button> `}<button class="btn sm danger" data-md="${m.id}">Delete</button></div></div><p style="white-space:pre-wrap">${esc(m.message)}</p></div>`).join('') : '<div class="empty" style="border:0"><h3>No messages yet</h3><p>Messages sent through your contact form will show up here.</p></div>'}</div>`;
  V.onclick = async e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.read) { D.messages.find(x => x.id === b.dataset.read).read = true; persist(); messages(); nav(); }
    if (b.dataset.md && await confirmBox('This message will be deleted permanently.')) { const prevM = D.messages; D.messages = D.messages.filter(x => x.id !== b.dataset.md); if (persist()) toast('Message deleted.'); else D.messages = prevM; messages(); nav(); } };
}
/* shell */
function nav() { const n = D.messages.filter(m => !m.read).length, u = $('#unread'); u.hidden = !n; u.textContent = n; $$('.side a[href^="#"]:not(.logo)').forEach(a => a.classList.toggle('on', a.getAttribute('href') === location.hash)); }
function route() {
  const r = location.hash.slice(1) || 'overview'; V.onclick = null; V.innerHTML = '<div class="spin" role="status" aria-label="Loading"></div>'; $('#side').classList.remove('open'); nav();
  setTimeout(() => { if (MODS[r]) crud(r); else if (SINGLE[r]) single(r); else if (r === 'messages') messages(); else if (r === 'publishing') publishing(); else overview(); }, 150);
}
$('#un').textContent = sess.user; $('#av').textContent = sess.user.charAt(0).toUpperCase();
$('#pbtn').onclick = () => $('#dd').classList.toggle('open'); document.addEventListener('click', e => { if (!e.target.closest('.prof')) $('#dd').classList.remove('open'); });
$('#out').onclick = () => { Auth.logout(); location.href = '../login.html'; };
$('#menu').onclick = () => $('#side').classList.toggle('open');
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') closeModal(); }); document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
window.addEventListener('hashchange', route); route();

/* publish status pill in the top bar */
const pst = $('#pubst');
Pub.onStatus = st => {
  pst.className = 'pubst ' + st.s;
  pst.textContent = { off: 'Not published · connect GitHub', idle: 'Connected to GitHub', pending: 'Saving to site…', busy: 'Publishing…', ok: 'Published ✓', err: 'Publish failed · retry' }[st.s];
  pst.title = st.msg || '';
  if (st.s === 'ok') toast('Published. Visitors will see it in about a minute.');
  if (st.s === 'err') toast(st.msg, 'err');
};
Pub.onStatus(Pub.state);
pst.addEventListener('click', e => { if (Pub.state.s === 'err') { e.preventDefault(); Pub.now(() => D); } });
