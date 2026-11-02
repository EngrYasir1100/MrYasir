# Deveign Agency Website

A fast, responsive multi-page website for Deveign Agency. Plain HTML, CSS and JavaScript, with no build step.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home: animated hero, services, featured projects, process, ratings |
| `services.html` | All 8 services with deliverables and skills, full skill list |
| `portfolio.html` | Filterable projects with a details pop-up |
| `about.html` | Story, values, awards, team, client focus |
| `contact.html` | Quote form, contact details, FAQ |

Styles are in `assets/css/styles.css` and scripts in `assets/js/main.js`.
Brand colours are at the top of the stylesheet (`--orange`, `--navy`).

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Portfolio images

Images live in `assets/img/portfolio/`. Projects marked **Client project** are real Upwork jobs, but their
images are illustrations. Projects marked **Concept** are sample work showing the agency's style.
To use a real image, save it in that folder (for example `my-project.jpg`) and change both `src="..."` paths for
that project in `portfolio.html` (and `index.html` if it's featured). To turn a concept into a client
project, change its `Concept` pill to `<span class="pill pill--ok">Client project</span>`.

## Contact form

The quote form is connected to **hello@deveignagency.com** (`CONTACT_EMAIL` in `assets/js/main.js`).
Submitting it opens the visitor's email app with their details filled in, addressed to that inbox.

To receive messages directly without the visitor's email app, create a free form at https://formspree.io
with hello@deveignagency.com and paste its URL into `FORM_ENDPOINT`.

## Domain: deveignagency.com

The site is served by GitHub Pages at **https://deveignagency.com**. The `CNAME` file in the repository
root tells GitHub Pages which domain to use, so don't delete it.

DNS records at the domain registrar:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `engryasir1100.github.io` |

GitHub settings: **Settings → Pages**, source "Deploy from a branch" (the site's branch, `/ (root)`),
custom domain `deveignagency.com`, then tick **Enforce HTTPS** once the certificate is ready.

`sitemap.xml` and `robots.txt` help search engines find every page.
