# Devign Agency Website

A fast, responsive one-page website for the agency. Plain HTML, CSS and JavaScript — no build step.

## Preview locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Fill in your content

Content is filled in from the Upwork profile. Still to add:

- Business email (`CONTACT_EMAIL` in `assets/js/main.js`) — until set, the form sends visitors to the Upwork profile
- Portfolio images: put them in `assets/img/` and add an `<img>` inside each `.work__thumb`

Brand colours live at the top of `assets/css/styles.css` (`--primary`, `--accent`).

## Contact form

By default the form opens the visitor's email app. To receive messages directly,
create a free form at https://formspree.io and paste its URL into `FORM_ENDPOINT`
in `assets/js/main.js`.

## Publish for free with GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source "Deploy from a branch",
choose your branch and `/ (root)`, then Save. The site goes live at
`https://<username>.github.io/<repo>/`. You can connect a custom domain on the same page.
