# Ontario Furnace Rebates — static site

A **static, no-WordPress** version of the Ontario Furnace Rebates site, built to
publish on **GitHub Pages**. Plain HTML/CSS/JS — no PHP, no database, no build
step on the host. The published site lives in [`docs/`](docs/).

This is an **independent rebate concierge** for Ontario homeowners — it helps
people estimate, find, and claim every furnace, AC and heat pump rebate they
qualify for (Home Renovation Savings Program, Enbridge, Oil to Heat Pump
Affordability, the Canada Greener Homes Loan, and municipal programs). It is not
a contractor site and is not affiliated with any government body or utility.

## What's where

```
docs/                      ← the published static site (GitHub Pages serves this)
├── index.html             Home
├── how-it-works/ … etc.   one folder per page (clean URLs)
├── rebates/<program>/     5 rebate-program spokes
├── furnace-rebate-<city>/ 10 city pages
├── assets/
│   ├── css/style.css       design system (navy/copper — no framework)
│   └── js/
│       ├── hpro-config.js  rebate $ amounts + lead webhook URL  ← edit me
│       ├── calculator.js   the multi-step rebate calculator (vanilla JS)
│       └── contact-form.js /contact/ form handler
├── sitemap.xml, robots.txt, llms.txt
└── CNAME                   custom domain (ontariofurnacerebates.ca)

tools/build.mjs            ← generator: re-renders everything in docs/ from data
assets/img/                ← source images (hero.webp, brand logos) copied into docs/
README.md
```

## Publishing to GitHub Pages

1. Commit and push to `main`.
2. Repo **Settings → Pages → Build and deployment**: Source = **Deploy from a
   branch**, Branch = **`main`** (or whichever branch holds this), Folder = **`/docs`**. Save.
3. The site builds at the GitHub Pages URL within a minute.
4. **Custom domain:** the `docs/CNAME` file points the site at
   `ontariofurnacerebates.ca`. Add a DNS record at your registrar pointing the
   domain to GitHub Pages (a `CNAME` to `<user>.github.io`, or the four Pages
   `A` records for an apex domain), then tick "Enforce HTTPS" in Settings → Pages.

> The internal links are root-absolute (`/rebate-calculator/`), so the site must
> be served at a **domain root** — i.e. via the custom domain above (recommended),
> not a `username.github.io/repo/` project sub-path.

## Editing content

- **Rebate dollar amounts** (calculator results): `docs/assets/js/hpro-config.js`.
  Also update the table rows in `tools/build.mjs` (`rebateTableHTML()`) and re-run
  the generator so the on-page table matches.
- **Page copy:** edit `tools/build.mjs` (each page's `body`) and re-run, or edit the
  generated `docs/**/index.html` directly for a one-off.
- **Add a city:** add an entry to the `CITIES` array in `tools/build.mjs` and re-run.
- **Add a rebate program:** add an entry to the `SPOKES` array and re-run.

Re-generate after any change to `tools/build.mjs`:

```bash
node tools/build.mjs
```

(Requires Node 16+. No npm install — zero dependencies.)

## Leads (the calculator + contact form)

There is no server, so both forms **POST directly to the n8n webhook** set in
`docs/assets/js/hpro-config.js` (`leadUrl` → `https://auto.sdagents.ai/webhook/hvac-sites`).
The request is sent as a CORS-simple **`application/x-www-form-urlencoded`** `no-cors`
POST so it is delivered even though GitHub Pages can't run server-side code and the
webhook may not return CORS headers.

The body uses the **Gravity Forms field-ID keys** that the shared n8n workflow
("HVAC Form Lead Tracking") reads — the same keys the WordPress Gravity Forms sites
post — so leads from this static site are processed identically (don't rename these):

```
1.3  = Full / first name
2    = Email
3    = Message  (the calculator folds fuel type, ownership, system, estimate,
                lead priority and any UTMs into this field, since the webhook
                ignores keys other than the ones listed here)
4    = Phone
5.1  = Street address   (blank — not collected)
5.3  = City             (blank — not collected)
5.5  = Postal code      (calculator quiz answer; blank on the contact form)
source_url   = page URL
date_created = UTC "Y-m-d H:i:s"
```

**Trade-off:** because the response is opaque (`no-cors`), the front-end treats a
completed send as success and can't surface a webhook-side error. If you want real
success/error handling, add `Access-Control-Allow-Origin` to the n8n webhook
response and switch the fetch in `calculator.js` / `contact-form.js` back to a
normal `cors` request that reads the JSON reply.

## What changed vs. the old contractor site

- Repositioned from an **HVAC service contractor** (HVACBusiness schema, service
  catalog, quote form) to an **independent furnace & HVAC rebate concierge**
  (Organization/ProfessionalService schema, interactive calculator, city + program pages).
- Replaced the single-page SPA + quote form with a generated multi-page site
  using the same engine as `heatpumprebateontario.ca`.
- New navy/copper design system (kept the same `.hpro-*` class structure).
- Everything else — lead flow, calculator UX, schema, compliance footer — mirrors
  the heat-pump site.

## Compliance

The site-wide footer independence/no-government-affiliation disclaimer is preserved
(rendered into every page footer). Privacy Policy and Terms are **starter drafts** —
have them reviewed before launch.
