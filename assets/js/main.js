// Mobile navigation
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// Highlight the nav link for the section in view
const navLinks = [...nav.querySelectorAll('a:not(.btn)')];
const sections = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
const setActive = () => {
  const y = window.scrollY + 140;
  let current = navLinks[0];
  sections.forEach((sec, i) => { if (sec.offsetTop <= y) current = navLinks[i]; });
  navLinks.forEach((a) => a.classList.toggle('active', a === current));
};
window.addEventListener('scroll', setActive, { passive: true });

// Service tabs
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('[data-panel]');
const showTab = (name) => {
  tabs.forEach((t) => {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  panels.forEach((p) => { p.hidden = p.dataset.panel !== name; });
};
tabs.forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));
document.querySelectorAll('a[data-tab]').forEach((a) =>
  a.addEventListener('click', () => showTab(a.dataset.tab))
);

// Reveal elements and count up stats when they scroll into view
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealEls = document.querySelectorAll('.stat, .work__item, .why__item, .step, .review, .award, .head-row');
const counters = document.querySelectorAll('[data-count]');

const countUp = (el) => {
  const target = Number(el.dataset.count);
  const start = performance.now();
  const dur = 1400;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
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
      e.target.classList.add('visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));

  counters.forEach((el) => { el.textContent = '0'; });
  const co = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countUp(e.target);
      co.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => co.observe(el));
}

// Contact form
// To receive messages by email, set CONTACT_EMAIL. To receive them without the
// visitor's email app, create a free form at https://formspree.io and set FORM_ENDPOINT.
// Until either is set, the form sends visitors to the Upwork profile.
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = '';
const UPWORK_URL = 'https://www.upwork.com/agencies/1889365964050848512/';

const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

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
    statusEl.innerHTML = `Thanks! Please send us this request on <a href="${UPWORK_URL}" target="_blank" rel="noopener"><u>our Upwork profile</u></a>.`;
    statusEl.classList.add('ok');
    window.open(UPWORK_URL, '_blank', 'noopener');
    return;
  }

  if (!FORM_ENDPOINT) {
    const body = `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\n\n${data.get('message')}`;
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

document.getElementById('year').textContent = new Date().getFullYear();
