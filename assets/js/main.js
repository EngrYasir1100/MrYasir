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

// Header border on scroll
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal sections on scroll
const revealEls = document.querySelectorAll('.card, .step, .work__item, .review, .member, .section__head');
revealEls.forEach((el) => el.classList.add('reveal'));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('visible'));
}

// Contact form
// By default this opens the visitor's email app with the message filled in.
// To receive submissions without email apps, sign up at https://formspree.io,
// then set FORM_ENDPOINT to your form URL (e.g. "https://formspree.io/f/xxxxxx").
const FORM_ENDPOINT = '';
const CONTACT_EMAIL = ''; // TODO: add your business email to receive messages
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
    statusEl.textContent = 'Thanks! Opening our Upwork profile so you can message us there…';
    statusEl.classList.add('ok');
    setTimeout(() => window.open(UPWORK_URL, '_blank', 'noopener'), 900);
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
    statusEl.textContent = "Thanks! We'll get back to you within 24 hours.";
    statusEl.classList.add('ok');
  } catch {
    statusEl.textContent = 'Something went wrong. Please email us directly.';
    statusEl.classList.add('err');
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
