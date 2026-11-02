# Devign Agency Website

A fast, responsive multi-page website for Devign Agency. Plain HTML, CSS and JavaScript, with no build step.

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

Until it's configured, the form sends visitors to the Upwork profile. In `assets/js/main.js`:

- set `CONTACT_EMAIL` to open the visitor's email app with the message filled in, or
- create a free form at https://formspree.io and paste its URL into `FORM_ENDPOINT` to receive messages directly.

## Publish with GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source "Deploy from a branch", choose the branch and
`/ (root)`, then Save. The site goes live at `https://<username>.github.io/<repo>/`.
