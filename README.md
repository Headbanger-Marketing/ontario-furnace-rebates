# Ontario Furnace Rebates — static website

A fast, static (HTML / CSS / vanilla JS) marketing site for **Ontario Furnace Rebates**,
an Ontario HVAC service provider (furnace, heat pump, AC, ductless, rebate guidance).

This was rebuilt from the old WordPress site to remove WordPress entirely and fix
several issues carried over from a cloned template (wrong "Strathroy Heating & Cooling"
branding in the title, schema and favicon; a truncated meta description; non-clickable
phone number). It also redesigns the UX/UI.

## Structure

```
ontario-furnace-rebates/
├── index.html        # single-page landing site
├── privacy.html      # privacy policy
├── css/styles.css    # design system + components (no framework)
├── js/main.js        # nav, FAQ accordion, sticky CTA, form validation/submit
├── assets/
│   ├── favicon.svg   # new brand flame icon (replaces old Strathroy icon)
│   └── img/          # real images pulled from the original site
└── README.md
```

No build step, no dependencies. Just open `index.html`.

## Run locally

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then visit http://localhost:8000
```

## The quote form

`js/main.js` posts the form to the endpoint set on the `<form data-endpoint="...">`
attribute in `index.html`.

- **As shipped** the endpoint is the placeholder `REPLACE_WITH_FORM_ENDPOINT`, so the
  form falls back to opening the visitor's email client (mailto) pre-filled with their
  details — it works with zero backend.
- **To collect submissions properly**, sign up for a no-backend form service
  (Formspree, Web3Forms, Getform, Netlify Forms, etc.) and paste your endpoint URL into
  `data-endpoint`. The script will then POST via `fetch` and show an inline success
  message, falling back to mailto only if the request fails.
- Update the fallback address in `data-email` if needed.

## Brand fixes applied vs. the old site

- Title tag now reads **Ontario Furnace Rebates** (no "Strathroy").
- `schema.org` `HVACBusiness` JSON-LD uses the correct business name, address, phone and service areas.
- New favicon (`assets/favicon.svg`) replaces the leftover Strathroy icon.
- Full, non-truncated meta description + Open Graph tags.
- Phone numbers are clickable `tel:` links throughout.
- Removed Strathroy wording from headings/body; copy now consistently says **Ontario**.

## Deployment

Drop the folder on any static host — Cloudflare Pages, Netlify, GitHub Pages, or the
existing server's web root. (The domain currently sits behind Cloudflare.)
```bash
# Cloudflare Pages example
npx wrangler pages deploy . --project-name ontario-furnace-rebates
```
