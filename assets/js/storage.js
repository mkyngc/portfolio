/* storage.js — single data layer. Swap these functions for fetch() calls when a backend exists. */
const Store = (() => {
  const KEY = 'pf_data_v1';
  let mem = null; // content currently in use (published copy for visitors, working copy in the dashboard)
  const uid = () => Math.random().toString(36).slice(2, 9);
  const seed = () => ({
    profile: {
      name: 'Your Name', title: 'IT Professional & Web Enthusiast', welcome: 'Welcome to my portfolio', badgeTitle: 'Creative & Tech-Savvy', badgeText: 'Always learning and growing',
      tagline: 'I am passionate about technology, web development, digital innovation, and creating meaningful solutions through technology.',
      photo: '', resume: '', resumeName: '',
      bio: 'I am a developer who works where design meets data. I turn spreadsheets, survey layers and rough ideas into websites people actually enjoy using. I care about accessible markup, honest performance, and details that make a product feel considered.',
      education: 'BS Information Technology | Your University | 2018 – 2022\nCertificate in GIS and Web Mapping | Online Program | 2023',
      experience: 'Front-End Developer | Studio Example | 2022 – 2024\nGIS Analyst | Mapping Lab | 2024 – Present',
      interests: 'Web mapping, accessible design, open data, design systems',
      goals: 'To lead product teams that build civic and environmental tools, and to keep mentoring early-career developers.',
      socials: { github: 'https://github.com', linkedin: 'https://linkedin.com', facebook: 'https://facebook.com' }
    },
    contact: { email: 'hello@example.com', phone: '+00 000 000 0000', location: 'Your City, Country' },
    projects: [
      { id: uid(), title: 'Barangay Atlas', category: 'GIS', date: '2025-08-01', desc: 'An interactive web map that lets residents explore flood zones, evacuation centers and health facilities with offline-friendly layers.', tech: 'Leaflet, JavaScript, GeoJSON', thumb: '', demo: '#', repo: '#', status: 'Published' },
      { id: uid(), title: 'Petal Planner', category: 'Web App', date: '2025-03-12', desc: 'A habit and task planner with drag-and-drop boards, reminders and a quiet, distraction-free layout.', tech: 'HTML, CSS, JavaScript', thumb: '', demo: '#', repo: '#', status: 'Published' },
      { id: uid(), title: 'Studio Lumen', category: 'Website', date: '2024-11-20', desc: 'A responsive marketing site for a photography studio, built for speed with a lightweight gallery and booking form.', tech: 'HTML, CSS, JavaScript', thumb: '', demo: '#', repo: '#', status: 'Published' },
      { id: uid(), title: 'Clinic Queue', category: 'Web App', date: '2024-05-04', desc: 'A queue-tracking dashboard for a community clinic with live status cards and a printable daily report.', tech: 'PHP, MySQL, JavaScript', thumb: '', demo: '#', repo: '#', status: 'Published' }
    ],
    skills: [
      ['JavaScript', 'Programming Languages', 'fa-brands fa-js', 90], ['Python', 'Programming Languages', 'fa-brands fa-python', 75],
      ['HTML5', 'Front-End Development', 'fa-brands fa-html5', 95], ['CSS3', 'Front-End Development', 'fa-brands fa-css3-alt', 92],
      ['PHP', 'Back-End Development', 'fa-brands fa-php', 70], ['Node.js', 'Back-End Development', 'fa-brands fa-node-js', 65],
      ['MySQL', 'Database Management', 'fa-solid fa-database', 80], ['PostgreSQL', 'Database Management', 'fa-solid fa-server', 70],
      ['React', 'Frameworks and Libraries', 'fa-brands fa-react', 70], ['Bootstrap', 'Frameworks and Libraries', 'fa-brands fa-bootstrap', 85],
      ['QGIS', 'GIS and Mapping Tools', 'fa-solid fa-earth-asia', 85], ['Leaflet', 'GIS and Mapping Tools', 'fa-solid fa-map-location-dot', 80],
      ['Figma', 'Design and Productivity Tools', 'fa-brands fa-figma', 80], ['Git', 'Other Technical Skills', 'fa-brands fa-git-alt', 85]
    ].map(([name, cat, icon, level]) => ({ id: uid(), name, cat, icon, level })),
    certs: [
      { id: uid(), title: 'Responsive Web Design', org: 'Example Academy', date: '2023-06-15', desc: 'Covered semantic HTML, flexbox, grid and accessible design practice.', file: '', fileName: '', visible: 'Visible' },
      { id: uid(), title: 'GIS Fundamentals', org: 'Geospatial Institute', date: '2023-09-02', desc: 'Spatial data models, projections and cartographic design in QGIS.', file: '', fileName: '', visible: 'Visible' },
      { id: uid(), title: 'Python for Data Analysis', org: 'Online Academy', date: '2024-02-10', desc: 'Data cleaning, analysis and visualization with pandas and matplotlib.', file: '', fileName: '', visible: 'Visible' },
      { id: uid(), title: 'UI/UX Design Essentials', org: 'Design Institute', date: '2024-07-22', desc: 'User research, wireframing and prototyping fundamentals.', file: '', fileName: '', visible: 'Visible' }
    ],
    messages: [],
    settings: { title: 'My Portfolio', logoText: 'My Portfolio', seoTitle: 'Your Name – IT Professional & Web Enthusiast', seoDesc: 'Personal portfolio of an IT professional and web enthusiast.', footer: '© 2026 Your Name. All Rights Reserved.', accent: '#B2757C', favicon: '',
      sections: { about: true, projects: true, skills: true, certs: true, contact: true } }
  });
  const draft = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const load = () => mem || draft() || seed();
  const use = d => { mem = d; };
  // Public pages: read the published data/content.json (the file the dashboard commits to GitHub).
  const fetchSite = async url => { const r = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
  const init = async () => { try { mem = await fetchSite((Store.base || '') + 'data/content.json'); } catch {} return load(); };
  // save() returns true on success, otherwise a string reason: 'quota' (storage full) or 'blocked' (storage unavailable / not kept).
  const save = d => {
    try {
      const json = JSON.stringify(d);
      localStorage.setItem(KEY, json);
      if (localStorage.getItem(KEY) !== json) return 'blocked';
      mem = d; return true; // read back to confirm it was really kept
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) { mem = d; return 'quota'; } // keep full-size content in memory so it can still be published
      return 'blocked';
    }
  };
  const available = () => { try { localStorage.setItem('pf_probe', '1'); localStorage.removeItem('pf_probe'); return true; } catch { return false; } };
  const reset = () => { localStorage.removeItem(KEY); mem = null; };
  const api = { load, save, reset, uid, available, seed, draft, use, init, fetchSite, base: '', src: p => !p || /^(data:|https?:|\/)/.test(p) ? p : api.base + p };
  return api;
})();
const isImg = s => typeof s === 'string' && (s.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg|avif|ico)(\?.*)?$/i.test(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function toast(msg, type = 'ok') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; box.append(t);
  setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3600);
}
const placeholder = (i = 0) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260"><rect width="400" height="260" fill="${['#F5E8E8', '#EBD3D6', '#F0DFD9'][i % 3]}"/><circle cx="${90 + i * 60}" cy="70" r="70" fill="#C58B91" opacity=".25"/><rect x="40" y="150" width="${200 + i * 30}" height="14" rx="7" fill="#A77B83" opacity=".35"/><rect x="40" y="178" width="140" height="14" rx="7" fill="#A77B83" opacity=".2"/></svg>`);
const parseRows = t => String(t || '').split('\n').map(l => l.split('|').map(s => s.trim())).filter(r => r[0]);
