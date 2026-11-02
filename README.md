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

The quote form sends messages straight to **hello@deveignagency.com** through FormSubmit
(formsubmit.co), a free service with no account (`CONTACT_EMAIL` / `FORM_ENDPOINT` in `assets/js/main.js`).

- **One-time activation:** the first message triggers an email from FormSubmit to hello@deveignagency.com.
  Click **Activate Form** in it once; after that every message arrives automatically.
- Replies go straight to the client, because their address is set as the reply-to.
- A hidden field filters out simple spam bots.
- If sending ever fails, the form opens the visitor's email app instead, so no enquiry is lost.

## Flight Checker app (`flights/`)

A free live flight tracker at **https://deveignagency.com/flights/**. It needs no build step, server or API key.

- **Track a flight:** type a ticket flight number (`EK600`, `PK 301`) or a radio callsign (`UAE600`). It shows
  where the plane is, its altitude, speed, heading and climb rate, and the nearest airport, on a live map that
  refreshes every 20 seconds and draws a trail of where the plane has been.
- **Near an airport:** pick an airport to list and map every plane within 50–200 km. Click **Track** on a row
  to follow that plane.
- Shareable links: `flights/?flight=EK600` or `flights/?airport=ISB`. Recent searches are remembered in the browser.

Live positions come from the free [OpenSky Network](https://opensky-network.org) API. Its limits:

- Planes only appear while their transponder is on, roughly from push-back to landing, and only where
  OpenSky has ground receivers.
- It has no schedules, gates or delays, so each flight links to FlightAware and Flightradar24 for those.
- Each visitor's IP gets a daily request allowance. A flight search uses one large request,
  then each refresh asks only for that one plane, which is cheap.

Files: `flights/index.html` (page), `flights/app.css`, `flights/app.js` (logic) and `flights/data.js`
(airline codes and airports; add rows there to support more).

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
