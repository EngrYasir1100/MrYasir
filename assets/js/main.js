/* Deveign Agency — site scripts */
document.documentElement.classList.add('js'); // also set early in <head>
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Mobile navigation ---------- */
const nav = $('#nav');
const toggle = $('#navToggle');
if (nav && toggle) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- Interactive dot-grid background (all page heroes) ---------- */
$$('.hero-canvas').forEach((canvas) => {
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  const GAP = 30;
  let w = 0, h = 0, dpr = 1, dots = [], visible = true, raf = 0;
  const mouse = { x: -9999, y: -9999, active: false };
  let t = Math.random() * 100;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = host.clientWidth; h = host.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push([x, y]);
    if (reduceMotion) draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    // Light source: the mouse, or a slow wandering point when idle
    let lx, ly;
    if (mouse.active) { lx = mouse.x; ly = mouse.y; }
    else { lx = w * (0.62 + 0.25 * Math.sin(t * 0.37)); ly = h * (0.45 + 0.3 * Math.sin(t * 0.53 + 1)); }
    const R = Math.max(170, Math.min(w, h) * 0.32);
    for (const [x, y] of dots) {
      const dx = x - lx, dy = y - ly;
      const d = Math.sqrt(dx * dx + dy * dy);
      const g = d < R ? Math.pow(1 - d / R, 2) : 0;
      const wave = 0.5 + 0.5 * Math.sin(x * 0.012 + y * 0.008 + t * 1.4);
      const push = g * 10;
      const px = x + (d ? (dx / d) * push : 0);
      const py = y + (d ? (dy / d) * push : 0);
      const r = 0.9 + g * 1.8;
      // Brand colours: orange at the centre, amber further out, a blue halo beyond
      if (g > 0.02) {
        const r1 = Math.round(214 + 13 * (1 - g)), g1 = Math.round(88 + 50 * (1 - g)), b1 = Math.round(46 + 8 * (1 - g));
        ctx.fillStyle = `rgba(${r1}, ${g1}, ${b1}, ${0.15 + g * 0.85})`;
      } else if (d < R * 1.7) {
        const h = 1 - (d - R) / (R * 0.7);
        ctx.fillStyle = `rgba(72, 108, 230, ${0.08 + h * 0.32})`;
      } else {
        ctx.fillStyle = `rgba(170, 170, 185, ${0.06 + wave * 0.07})`;
      }
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const loop = () => {
    t += 0.016;
    draw();
    raf = visible ? requestAnimationFrame(loop) : 0;
  };

  host.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
  });
  host.addEventListener('pointerleave', () => { mouse.active = false; });
  window.addEventListener('resize', resize);
  resize();

  if (!reduceMotion) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(host);
  }
});

/* ---------- Service orbit: one drawing per service, synced with the headline ---------- */
const SERVICES_META = [
  ['Branding', 'Logos & brand identity'],
  ['Shopify Stores', 'Store design & setup'],
  ['Apparel & POD', 'T-shirts & merch'],
  ['Websites', 'WordPress & custom sites'],
  ['Etsy & Amazon', 'Listings that sell'],
  ['Architecture', 'Floor plans & 3D renders'],
  ['Marketing', 'Ads & social creatives'],
  ['UI/UX Design', 'Web & mobile apps'],
];
const orbit = $('#orbit');
const artSets = orbit ? $$('.art__set', orbit) : [];
const chips = orbit ? $$('.chip', orbit) : [];
const stageLabel = orbit ? $('.stage__label', orbit) : null;
const setService = (i) => {
  if (!orbit) return;
  artSets.forEach((g, k) => g.classList.toggle('on', k === i));
  chips.forEach((c, k) => c.classList.toggle('active', k === i));
  $('#stageTitle').textContent = SERVICES_META[i][0];
  $('#stageSub').textContent = SERVICES_META[i][1];
  stageLabel.classList.remove('swap'); void stageLabel.offsetWidth; stageLabel.classList.add('swap');
};
setService(0);

if (orbit && !reduceMotion) {
  // Mouse parallax on the orbit layers
  const hero = orbit.closest('.hero');
  const layers = $$('[data-depth]', orbit);
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    layers.forEach((l) => {
      const d = Number(l.dataset.depth);
      l.style.translate = `${-nx * d}px ${-ny * d}px`;
    });
  });
  hero.addEventListener('pointerleave', () => layers.forEach((l) => { l.style.translate = ''; }));
}

/* ---------- Typing headline ---------- */
const typed = $('#typed');
if (typed && !reduceMotion) {
  const words = typed.dataset.words.split('|');
  let wi = 0, ci = words[0].length, deleting = true;
  const step = () => {
    if (deleting) {
      ci--;
      typed.textContent = words[wi].slice(0, ci);
      if (ci === 0) {
        deleting = false;
        wi = (wi + 1) % words.length;
        setService(wi % SERVICES_META.length);
      }
      setTimeout(step, 40);
    } else {
      const next = words[wi];
      ci++;
      typed.textContent = next.slice(0, ci);
      if (ci === next.length) { deleting = true; setTimeout(step, 2300); }
      else setTimeout(step, 80);
    }
  };
  setTimeout(step, 2600);
}

/* ---------- Blueprint layer on white sections ---------- */
const DECOS = [
  // construction circles
  `<svg class="deco deco--tr deco--spin" viewBox="0 0 300 300">
    <circle class="d" cx="150" cy="150" r="118" pathLength="1"/>
    <circle class="d" cx="112" cy="150" r="76" pathLength="1"/>
    <circle class="d" cx="188" cy="150" r="76" pathLength="1"/>
    <path class="g" d="M10 150 H290 M150 10 V290"/>
    <path class="d" d="M95 205 L150 95 L205 205 Z" pathLength="1"/>
    <rect class="dot" x="146" y="91" width="8" height="8"/><rect class="dot" x="91" y="201" width="8" height="8"/><rect class="dot" x="201" y="201" width="8" height="8"/>
  </svg>`,
  // pen tool curve
  `<svg class="deco deco--bl deco--float" viewBox="0 0 300 300">
    <path class="d" d="M20 230 C 90 90, 170 300, 230 150 S 290 60, 290 60" pathLength="1"/>
    <path class="d" d="M20 230 L90 90 M230 150 L290 40" pathLength="1"/>
    <path class="g" d="M20 270 H290 M20 260 V280 M290 260 V280"/>
    <rect class="dot" x="16" y="226" width="8" height="8"/><rect class="dot" x="226" y="146" width="8" height="8"/>
    <circle class="dot" cx="90" cy="90" r="4"/><circle class="dot" cx="290" cy="40" r="4"/>
  </svg>`,
  // dimension lines
  `<svg class="deco deco--tr2" viewBox="0 0 300 300">
    <path class="d" d="M40 60 H260" pathLength="1"/>
    <path class="d" d="M40 50 V70 M260 50 V70" pathLength="1"/>
    <path class="d" d="M60 90 V270" pathLength="1"/>
    <path class="d" d="M50 90 H70 M50 270 H70" pathLength="1"/>
    <rect class="g" x="90" y="90" width="170" height="180"/>
    <path class="g" d="M90 90 L260 270 M260 90 L90 270"/>
    <text x="118" y="50">1200 PX</text>
  </svg>`,
  // golden-ratio spiral
  `<svg class="deco deco--br deco--float" viewBox="0 0 300 300">
    <rect class="g" x="20" y="60" width="260" height="161"/>
    <path class="g" d="M181 60 V221 M181 160 H280 M219 160 V221 M181 198 H219"/>
    <path class="d" d="M20 221 A161 161 0 0 1 181 60 A99 99 0 0 1 280 160 A61 61 0 0 1 219 221 A38 38 0 0 1 181 183" pathLength="1"/>
    <circle class="dot" cx="181" cy="60" r="4"/><circle class="dot" cx="280" cy="160" r="4"/>
  </svg>`,
];
const lightSections = $$('main > .section:not(.dark)');
if (lightSections.length) {
  // one shared gradient for every motif
  document.body.insertAdjacentHTML('afterbegin',
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <linearGradient id="decoGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#3459d6" stop-opacity=".55"/><stop offset=".6" stop-color="#e38a36" stop-opacity=".6"/><stop offset="1" stop-color="#d6582e" stop-opacity=".65"/>
      </linearGradient></defs></svg>`);
  lightSections.forEach((sec, i) => {
    sec.classList.add('lined');
    sec.insertAdjacentHTML('afterbegin', DECOS[i % DECOS.length]);
    const eb = $('.eyebrow', sec);
    if (eb) sec.insertAdjacentHTML('afterbegin',
      `<span class="side-label" aria-hidden="true"><b>${String(i + 1).padStart(2, '0')}</b>${eb.textContent.trim()}</span>`);
  });
  if ('IntersectionObserver' in window) {
    const dio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('deco-on'); dio.unobserve(e.target); }
    }), { threshold: 0.15 });
    lightSections.forEach((s) => dio.observe(s));
  } else lightSections.forEach((s) => s.classList.add('deco-on'));
}

/* ---------- Scroll reveal + counters ---------- */
const revealEls = $$('.brandband, .stat, .card, .work__item, .why__item, .step, .review, .award, .head-row, .svc, .info-card, .focus > div, .facts > div');
const counters = $$('[data-count]');
const countUp = (el) => {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / 1500, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};
if ('IntersectionObserver' in window && !reduceMotion) {
  revealEls.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter((c) => c.classList.contains('reveal'));
      e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 5) * 70}ms`;
      e.target.classList.add('visible');
      const t = e.target;
      setTimeout(() => { t.style.transitionDelay = ''; t.classList.add('settled'); }, 1300);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));

  counters.forEach((el) => { el.textContent = '0'; });
  const co = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach((el) => co.observe(el));
}

/* ---------- Services page: highlight sub-nav ---------- */
const subLinks = $$('.subnav a');
if (subLinks.length) {
  const targets = subLinks.map((a) => $(a.getAttribute('href')));
  const onScroll = () => {
    let current = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 200) current = i; });
    subLinks.forEach((a, i) => a.classList.toggle('active', i === current));
    if (current < 0) subLinks[0].parentElement.scrollLeft = 0;
    else {
      const a = subLinks[current];
      const bar = a.parentElement;
      if (a.offsetLeft < bar.scrollLeft || a.offsetLeft + a.offsetWidth > bar.scrollLeft + bar.clientWidth) {
        bar.scrollTo({ left: a.offsetLeft - 20, behavior: 'smooth' });
      }
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Portfolio filters ---------- */
const filters = $$('.filter');
if (filters.length) {
  const items = $$('#workGrid .work__item');
  const empty = $('#workEmpty');
  filters.forEach((f) => f.addEventListener('click', () => {
    const cat = f.dataset.filter;
    filters.forEach((b) => {
      const on = b === f;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    let shown = 0;
    items.forEach((it) => {
      const match = cat === 'all' || it.dataset.cat === cat;
      it.hidden = !match;
      it.classList.remove('show');
      if (match) { shown++; void it.offsetWidth; it.classList.add('show'); it.classList.add('visible'); }
    });
    empty.hidden = shown > 0;
  }));
}

/* ---------- Project modal ---------- */
const modal = $('#workModal');
$$('.work__open').forEach((btn) => btn.addEventListener('click', () => {
  const tpl = $('.work__details', btn.parentElement);
  if (!modal || !tpl || typeof modal.showModal !== 'function') {
    window.location.href = 'portfolio.html';
    return;
  }
  const content = $('.modal__content', modal);
  content.replaceChildren(tpl.content.cloneNode(true));
  modal.showModal();
}));
if (modal) {
  $('.modal__close', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
}

/* ---------- Contact form ----------
   To get messages by email, set CONTACT_EMAIL (opens the visitor's email app).
   To get them without an email app, create a free form at https://formspree.io
   and paste its URL into FORM_ENDPOINT.
   Until either is set, visitors are sent to the Upwork profile. */
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = '';
const UPWORK_URL = 'https://www.upwork.com/agencies/1889365964050848512/';

const form = $('#contactForm');
if (form) {
  const statusEl = $('#formStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.className = 'form__status';
    if (!form.checkValidity()) {
      statusEl.textContent = 'Please fill in your name, a valid email and project details.';
      statusEl.classList.add('err');
      return;
    }
    const data = new FormData(form);
    if (!FORM_ENDPOINT && !CONTACT_EMAIL) {
      statusEl.innerHTML = `Thanks! Please send this request to us on <a href="${UPWORK_URL}" target="_blank" rel="noopener">our Upwork profile</a>.`;
      statusEl.classList.add('ok');
      window.open(UPWORK_URL, '_blank', 'noopener');
      return;
    }
    if (!FORM_ENDPOINT) {
      const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\nBudget: ${data.get('budget')}\n\n${data.get('message')}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('New project inquiry')}&body=${encodeURIComponent(body)}`;
      return;
    }
    statusEl.textContent = 'Sending…';
    try {
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error();
      form.reset();
      statusEl.textContent = "Thanks! We'll get back to you soon.";
      statusEl.classList.add('ok');
    } catch {
      statusEl.textContent = 'Something went wrong. Please contact us on Upwork.';
      statusEl.classList.add('err');
    }
  });
}

/* ---------- Scroll progress, header state, back-to-top ---------- */
const progressBar = $('#progressBar');
const header = $('.header');
const toTop = $('#toTop');
const toTopRing = $('#toTopRing');
const onScrollUI = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  if (progressBar) progressBar.style.transform = `scaleX(${p})`;
  if (toTopRing) toTopRing.style.strokeDashoffset = String(100 - p * 100);
  if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
  if (header) header.classList.toggle('scrolled', window.scrollY > 20);
};
window.addEventListener('scroll', onScrollUI, { passive: true });
window.addEventListener('resize', onScrollUI);
onScrollUI();
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ---------- Card spotlight + 3D tilt ---------- */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (finePointer && !reduceMotion) {
  $$('.card, .work__item, .award, .info-card, .step, .review, .why__item, .focus > div').forEach((el) => {
    const tilt = el.matches('.card, .work__item, .why__item, .award');
    if (tilt) el.classList.add('tilt');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
      if (tilt) {
        const rx = ((y / r.height) - 0.5) * -6;
        const ry = ((x / r.width) - 0.5) * 6;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
      }
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
      el.style.transform = '';
    });
  });

  // Magnetic buttons
  $$('.btn--lg, .hero__cta .btn, .cta-band .btn').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.25}px`;
    });
    b.addEventListener('pointerleave', () => { b.style.translate = ''; });
  });
}

/* ---------- Smooth page transitions between site pages ---------- */
if (!reduceMotion) {
  $$('a[href$=".html"], a[href*=".html#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.pathname === location.pathname) return; // same-page anchors scroll normally
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { location.href = a.href; }, 220);
    });
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) document.body.classList.remove('leaving'); });
}

/* ---------- Footer year ---------- */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
