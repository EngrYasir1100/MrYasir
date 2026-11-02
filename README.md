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

**Client work (Upwork):** all Upwork projects are shown together in one "Client Work" block (`#client-work`) on
the Projects page and the home page. Clicking any tile opens one shared gallery; the pop-up lists each project so
visitors can jump between them. Images live in `assets/img/work/<project>/` (`cover.jpg` for the tile, `01.jpg`,
`02.jpg`… for the gallery, max 1600px).

**Other projects:** separate cards below the client work (`#workGrid`), filterable by category. Concept samples are
illustrations in `assets/img/portfolio/`, marked **Concept**. To add a project, copy one
`<article class="work__item">` block, change the text, and point the image paths at your new folder.

## Contact form

The quote form sends messages straight to **hello@deveignagency.com** through FormSubmit
(formsubmit.co), a free service with no account (`CONTACT_EMAIL` / `FORM_ENDPOINT` in `assets/js/main.js`).

- **One-time activation:** the first message triggers an email from FormSubmit to hello@deveignagency.com.
  Click **Activate Form** in it once; after that every message arrives automatically.
- Replies go straight to the client, because their address is set as the reply-to.
- A hidden field filters out simple spam bots.
- If sending ever fails, the form opens the visitor's email app instead, so no enquiry is lost.

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
