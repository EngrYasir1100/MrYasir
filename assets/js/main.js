/* Devign Agency — site scripts */
document.documentElement.classList.add('js');
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
      if (g > 0.02) {
        ctx.fillStyle = `rgba(249, ${Math.round(115 + 60 * (1 - g))}, 22, ${0.15 + g * 0.85})`;
      } else {
        ctx.fillStyle = `rgba(148, 163, 184, ${0.07 + wave * 0.08})`;
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

/* ---------- Typing headline ---------- */
const typed = $('#typed');
if (typed && !reduceMotion) {
  const words = typed.dataset.words.split('|');
  let wi = 0, ci = words[0].length, deleting = true;
  const step = () => {
    const word = words[wi];
    if (deleting) {
      ci--;
      typed.textContent = word.slice(0, ci);
      if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; }
      setTimeout(step, 45);
    } else {
      const next = words[wi];
      ci++;
      typed.textContent = next.slice(0, ci);
      if (ci === next.length) { deleting = true; setTimeout(step, 2200); }
      else setTimeout(step, 85);
    }
  };
  setTimeout(step, 2400);
}

/* ---------- Animated workspace: build loop + parallax ---------- */
const scene = $('#scene');
if (scene && !reduceMotion) {
  const win = $('.win', scene);
  const btn = $('.b__btn', scene);
  const cart = $('.b__cart em', scene);
  let count = 0;

  const placeCursor = () => {
    const wr = win.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    // getBoundingClientRect includes the 3D tilt; close enough for a pointer target
    scene.style.setProperty('--cx', `${br.left - wr.left + br.width * 0.55}px`);
    scene.style.setProperty('--cy', `${br.top - wr.top + br.height * 0.4}px`);
  };

  const play = () => {
    scene.classList.remove('play');
    btn.classList.remove('press');
    void scene.offsetWidth; // restart CSS animations
    placeCursor();
    scene.classList.add('play');
    setTimeout(() => btn.classList.add('press'), 4950);
    setTimeout(() => {
      count = (count % 9) + 1;
      cart.textContent = count;
      cart.classList.remove('bump'); void cart.offsetWidth; cart.classList.add('bump');
    }, 5100);
  };
  play();
  setInterval(() => { if (!document.hidden) play(); }, 9100);
  window.addEventListener('resize', placeCursor);

  // Mouse parallax
  const hero = scene.closest('.hero');
  const layers = $$('[data-depth]', scene);
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
} else if (scene) {
  scene.classList.remove('play');
}

/* ---------- Scroll reveal + counters ---------- */
const revealEls = $$('.stat, .card, .work__item, .why__item, .step, .review, .award, .head-row, .svc, .info-card, .focus > div, .facts > div');
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

/* ---------- Footer year ---------- */
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();
