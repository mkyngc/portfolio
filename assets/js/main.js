const D = Store.load(), P = D.profile, S = D.settings;
const ICONS = { github: 'fa-brands fa-github', linkedin: 'fa-brands fa-linkedin-in', facebook: 'fa-brands fa-facebook-f' };
const fmt = d => d ? new Date(d).toLocaleDateString('en', { year: 'numeric', month: 'short' }) : '';
const img = (src, i) => isImg(src) ? src : placeholder(i);
function openModal(html) { $('#mBody').innerHTML = html; $('#modal').classList.add('open'); $('#mx').focus(); }
const closeModal = () => { $('#modal').classList.remove('open'); $('#mBody').innerHTML = ''; gal.list = []; };
/* project photos: use the images array, fall back to the old single thumbnail */
const imgsOf = p => (Array.isArray(p.images) && p.images.length ? p.images : p.thumb ? [p.thumb] : []).filter(isImg);
let gal = { list: [], i: 0 };
function showSlide(i) {
  const n = gal.list.length; if (n < 2 || !$('#gImg')) return; gal.i = (i + n) % n;
  $('#gImg').src = gal.list[gal.i]; $('#gCnt').textContent = `${gal.i + 1} / ${n}`;
  $$('#mBody [data-g]').forEach(b => { const on = +b.dataset.g === gal.i; b.classList.toggle('on', on); b.setAttribute('aria-current', on); });
  $('#mBody [data-g].on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* favicon: a small generated icon that mirrors the nav "mark", so every page/tab shows it */
function setFavicon() {
  const letter = (S.logoText || P.name || 'M').trim().charAt(0).toUpperCase() || 'M';
  const rose = (S.accent || '#C58B91');
  const dark = document.documentElement.dataset.theme === 'dark';
  const bg = dark ? '#1B1A1F' : '#ffffff';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${rose}"/><text x="32" y="43" font-family="Georgia,serif" font-size="32" font-weight="700" text-anchor="middle" fill="${bg}">${letter}.</text></svg>`;
  let l = document.querySelector('link[rel="icon"][data-auto]');
  if (!l) { l = document.createElement('link'); l.rel = 'icon'; l.dataset.auto = '1'; document.head.appendChild(l); }
  l.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

function renderSettings() {
  const label = document.body.dataset.pageTitle;
  document.title = label ? `${label} \u2014 ${S.title || 'Portfolio'}` : (S.seoTitle || S.title);
  const meta = $('meta[name=description]'); if (meta) meta.content = S.seoDesc || '';
  if (S.accent && !['#c58b91', '#b2757c'].includes(S.accent.toLowerCase())) document.documentElement.style.setProperty('--rose', S.accent);
  if (S.favicon) { const l = document.createElement('link'); l.rel = 'icon'; l.href = S.favicon; document.head.append(l); }
  const foot = $('#foot'); if (foot) foot.textContent = S.footer;
  Object.entries(S.sections).forEach(([k, on]) => $$(`[data-s=${k}]`).forEach(el => el.hidden = !on));
}
function renderProfile() {
  const logoText = $('#logoText'), logoMark = $('#logoMark');
  if (logoText) logoText.textContent = S.logoText || 'My Portfolio';
  if (logoMark) logoMark.textContent = (S.logoText || 'My Portfolio').charAt(0).toUpperCase() + '.';
  if ($('#hName')) $('#hName').textContent = /[.!?]$/.test(P.name) ? P.name : P.name + '.';
  if ($('#hWelcome')) $('#hWelcome').textContent = P.welcome || 'Welcome to my portfolio';
  if ($('#hBadge')) $('#hBadge').textContent = P.badgeTitle || 'Creative & Tech-Savvy';
  if ($('#hBadgeSub')) $('#hBadgeSub').textContent = P.badgeText || 'Always learning and growing';
  if ($('#hTitle')) $('#hTitle').textContent = P.title;
  if ($('#hTag')) $('#hTag').textContent = P.tagline;
  const AVATAR = '<svg viewBox="0 0 200 240" aria-hidden="true" style="width:100%;height:100%"><circle cx="100" cy="88" r="46" fill="#C58B91" opacity=".55"/><path d="M20 240c4-62 34-92 80-92s76 30 80 92z" fill="#C58B91" opacity=".55"/></svg>';
  const photo = P.photo ? `<img src="${esc(P.photo)}" alt="${esc(P.name)}">` : AVATAR;
  if ($('#hPhoto')) $('#hPhoto').innerHTML = photo;
  if ($('#aPhoto')) $('#aPhoto').innerHTML = P.aboutPhoto ? `<img src="${esc(P.aboutPhoto)}" alt="${esc(P.name)}">` : photo;
  if ($('#aBio')) { const b = $('#aBio'); b.style.whiteSpace = 'pre-line'; b.textContent = String(P.bio || '').replace(/\r\n?/g, '\n').trim().replace(/\n{3,}/g, '\n\n'); } // keeps the paragraphs and line breaks as typed in the dashboard
  if ($('#aInt')) $('#aInt').textContent = P.interests;
  if ($('#aGoal')) $('#aGoal').textContent = P.goals;
  const tl = rows => rows.map(r => `<li><strong>${esc(r[0])}</strong><small>${esc(r[1] || '')}${r[2] ? ' \u00b7 ' + esc(r[2]) : ''}</small></li>`).join('');
  if ($('#aEdu')) $('#aEdu').innerHTML = tl(parseRows(P.education));
  if ($('#aExp')) $('#aExp').innerHTML = tl(parseRows(P.experience));
  const aResume = $('#aResume');
  if (aResume) { if (P.resume) { aResume.href = P.resume; aResume.download = P.resumeName || 'resume.pdf'; } else aResume.addEventListener('click', e => { e.preventDefault(); toast('No resume has been uploaded yet.', 'err'); }); }
  const soc = Object.entries(P.socials).filter(([, v]) => v).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener" aria-label="${k}"><i class="${ICONS[k] || 'fa-solid fa-link'}"></i></a>`).join('');
  if ($('#hSocials')) $('#hSocials').innerHTML = soc;
  if ($('#cSocials')) $('#cSocials').innerHTML = soc;
  /* contact page: plain info, no form */
  const c = D.contact;
  const cEmail = $('#cEmail'), cPhone = $('#cPhone'), cLoc = $('#cLocText');
  if (cEmail) { $('#cEmailText').textContent = c.email || 'Not provided'; cEmail.href = c.email ? 'mailto:' + c.email : '#'; if (!c.email) cEmail.style.pointerEvents = 'none'; }
  if (cPhone) { $('#cPhoneText').textContent = c.phone || 'Not provided'; cPhone.href = c.phone ? 'tel:' + c.phone.replace(/\s+/g, '') : '#'; if (!c.phone) cPhone.style.pointerEvents = 'none'; }
  if (cLoc) cLoc.textContent = c.location || 'Not provided';
}
/* projects */
let cat = 'All', q = '', pAll = false, cAll = false;
const LIMIT = 3;
function moreBtn(sel, total, expanded, noun) {
  const el = $(sel); if (!el) return; el.hidden = total <= LIMIT;
  el.innerHTML = `<button class="btn ghost" aria-expanded="${expanded}">${expanded ? 'Show less' : `View all ${noun} (${total})`} <i class="fa-solid fa-arrow-${expanded ? 'up' : 'right'}"></i></button>`;
}
const pubProjects = () => D.projects.filter(p => p.status === 'Published');
function renderProjects() {
  if (!$('#pGrid')) return;
  const all = pubProjects(), cats = ['All', ...new Set(all.map(p => p.category))];
  $('#pCats').innerHTML = cats.map(c => `<button class="chip ${c === cat ? 'on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
  const list = all.filter(p => (cat === 'All' || p.category === cat) && (p.title + p.desc + p.tech).toLowerCase().includes(q));
  const filtering = cat !== 'All' || q, shown = pAll || filtering ? list : list.slice(0, LIMIT);
  moreBtn('#pMore', filtering ? 0 : list.length, pAll, 'projects');
  $('#pGrid').innerHTML = list.length ? shown.map((p, i) => `<article class="card proj" tabindex="0" data-id="${p.id}" data-reveal style="--i:${i}"><img src="${img(imgsOf(p)[0], i)}" alt="" loading="lazy"><div class="pad"><div class="meta">${esc(p.category)} \u00b7 ${fmt(p.date)}</div><h3>${esc(p.title)}</h3><p style="font-size:.95rem;margin-top:6px">${esc(p.desc.slice(0, 100))}${p.desc.length > 100 ? '\u2026' : ''}</p><div class="tags">${p.tech.split(',').filter(Boolean).map(t => `<span class="tag">${esc(t.trim())}</span>`).join('')}</div></div></article>`).join('')
    : `<div class="empty"><h3>${all.length ? 'No matching projects' : 'No projects yet'}</h3><p>${all.length ? 'Try a different search or category.' : 'Published projects will appear here.'}</p></div>`;
  initReveal();
}
function projectModal(id) {
  const p = D.projects.find(x => x.id === id); if (!p) return;
  const list = imgsOf(p); gal = { list: list.length ? list : [placeholder(0)], i: 0 }; const multi = gal.list.length > 1;
  openModal(`<div class="gl-main"><img id="gImg" src="${gal.list[0]}" alt="${esc(p.title)}">${multi ? `<button class="gl-nav prev" data-gn="-1" aria-label="Previous photo"><i class="fa-solid fa-chevron-left"></i></button><button class="gl-nav next" data-gn="1" aria-label="Next photo"><i class="fa-solid fa-chevron-right"></i></button><span class="gl-cnt" id="gCnt">1 / ${gal.list.length}</span>` : ''}</div>${multi ? `<div class="gl-thumbs">${gal.list.map((s, k) => `<button data-g="${k}" class="${k ? '' : 'on'}" aria-label="Show photo ${k + 1}"><img src="${s}" alt=""></button>`).join('')}</div>` : ''}<div class="pad" style="padding:28px"><div class="meta">${esc(p.category)} \u00b7 ${fmt(p.date)}</div><h2 style="font-size:2rem">${esc(p.title)}</h2><p style="margin:12px 0">${esc(p.desc)}</p><div class="tags" style="margin-bottom:22px">${p.tech.split(',').filter(Boolean).map(t => `<span class="tag">${esc(t.trim())}</span>`).join('')}</div><div class="cta" style="margin:0">${p.demo ? `<a class="btn" href="${esc(p.demo)}" target="_blank" rel="noopener">Live demo</a>` : ''}${p.repo ? `<a class="btn ghost" href="${esc(p.repo)}" target="_blank" rel="noopener">GitHub repository</a>` : ''}</div></div>`);
}
/* skills */
function renderSkills() {
  if (!$('#sGrid')) return;
  const cats = [...new Set(D.skills.map(s => s.cat))];
  $('#sGrid').innerHTML = cats.length ? cats.map((c, ci) => `<div class="card skcard" data-reveal style="--i:${ci}"><h3>${esc(c)}</h3>${D.skills.filter(s => s.cat === c).map((s, si) => `<div class="sk" style="--si:${si}"><i class="${esc(s.icon || 'fa-solid fa-code')}"></i><div><span>${esc(s.name)}</span><div class="bar" role="img" aria-label="${s.level}%"><b style="--w:${+s.level || 0}%"></b></div></div></div>`).join('')}</div>`).join('')
    : '<div class="empty"><h3>No skills yet</h3><p>Skills added in the dashboard will appear here.</p></div>';
  initReveal();
}
/* certs */
const pub = D.certs.filter(c => c.visible === 'Visible');
function renderCerts() {
  if (!$('#cGrid')) return;
  moreBtn('#cMore', pub.length, cAll, 'certificates');
  $('#cGrid').innerHTML = pub.length ? (cAll ? pub : pub.slice(0, LIMIT)).map((c, i) => `<article class="card cert" tabindex="0" data-id="${c.id}" data-reveal style="--i:${i}">${isImg(c.file) ? `<img src="${c.file}" alt="">` : c.file ? '<div class="pdf"><i class="fa-solid fa-file-pdf"></i></div>' : `<img src="${placeholder(i)}" alt="">`}<div class="pad"><div class="meta">${esc(c.org)} \u00b7 ${fmt(c.date)}</div><h3>${esc(c.title)}</h3><p style="font-size:.93rem;margin:6px 0 14px">${esc(c.desc)}</p><span class="btn sm ghost">View certificate</span></div></article>`).join('')
    : '<div class="empty"><h3>No certificates yet</h3><p>Visible certificates will appear here.</p></div>';
  initReveal();
}
function certModal(id) {
  const c = D.certs.find(x => x.id === id); if (!c) return;
  const view = isImg(c.file) ? `<div class="gl-main cert"><img src="${c.file}" alt="${esc(c.title)}"></div>` : c.file ? `<iframe src="${c.file}" title="${esc(c.title)}"></iframe>` : `<div class="empty" style="margin:20px">No file uploaded for this certificate yet.</div>`;
  openModal(`${view}<div style="padding:24px"><h3>${esc(c.title)}</h3><p class="meta">${esc(c.org)} \u00b7 ${fmt(c.date)}</p><p>${esc(c.desc)}</p></div>`);
}
/* scroll-reveal */
let revealIO = null;
function initReveal() {
  const els = $$('[data-reveal]').filter(el => !el.classList.contains('in'));
  if (!els.length) return;
  if (!revealIO) revealIO = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -60px 0px' });
  els.forEach(el => revealIO.observe(el));
}
/* wiring */
const pCats = $('#pCats'); if (pCats) pCats.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { cat = b.dataset.c; renderProjects(); } });
const pSearch = $('#pSearch'); if (pSearch) pSearch.addEventListener('input', e => { q = e.target.value.toLowerCase().trim(); renderProjects(); });
const open = (sel, fn) => { const el = $(sel); if (!el) return; el.addEventListener('click', e => { const c = e.target.closest('[data-id]'); if (c) fn(c.dataset.id); }); el.addEventListener('keydown', e => { if (e.key === 'Enter') { const c = e.target.closest('[data-id]'); if (c) fn(c.dataset.id); } }); };
const pMore = $('#pMore'); if (pMore) pMore.onclick = () => { pAll = !pAll; renderProjects(); if (!pAll) $('#projects').scrollIntoView(); };
const cMore = $('#cMore'); if (cMore) cMore.onclick = () => { cAll = !cAll; renderCerts(); if (!cAll) $('#certs').scrollIntoView(); };
open('#pGrid', projectModal); open('#cGrid', certModal);
const mBody = $('#mBody'); if (mBody) mBody.addEventListener('click', e => { const n = e.target.closest('[data-gn]'), t = e.target.closest('[data-g]'); if (n) showSlide(gal.i + +n.dataset.gn); else if (t) showSlide(+t.dataset.g); });
document.addEventListener('keydown', e => { if (!$('#modal') || !$('#modal').classList.contains('open')) return; if (e.key === 'ArrowLeft') showSlide(gal.i - 1); if (e.key === 'ArrowRight') showSlide(gal.i + 1); });
const mx = $('#mx'); if (mx) mx.onclick = closeModal;
const modalEl = $('#modal'); if (modalEl) modalEl.addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', e => e.key === 'Escape' && closeModal());
const burger = $('#burger'), links = $('#links');
if (burger && links) burger.onclick = () => { const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o); };
if (links) links.onclick = e => e.target.tagName === 'A' && links.classList.remove('open');
/* active nav link = current page, not scroll position (each section is now its own page) */
(() => {
  const page = (location.pathname.split('/').pop() || 'index.html');
  $$('.links a').forEach(a => { const href = a.getAttribute('href'); if (href === page || (page === '' && href === 'index.html')) a.classList.add('active'); });
})();
renderSettings(); renderProfile(); renderProjects(); renderSkills(); renderCerts(); setFavicon(); initReveal();

/* theme toggle (dark is the default) */
const setThemeUi = () => { const dark = document.documentElement.dataset.theme === 'dark', b = $('#theme'); if (!b) return; b.innerHTML = `<i class="fa-solid fa-${dark ? 'sun' : 'moon'}"></i>`; b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); };
const themeBtn = $('#theme');
if (themeBtn) themeBtn.onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('pf_theme', t); } catch {} setThemeUi(); setFavicon(); };
setThemeUi();

