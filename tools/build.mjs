/**
 * Ontario Furnace Rebates — static site generator.
 *
 * Renders the rebate-concierge content + data into plain static HTML under
 * /docs (GitHub Pages). No framework, no runtime dependencies — just Node.
 *
 *   node tools/build.mjs
 *
 * Source of truth: the data + copy in this file. The calculator UI is runtime
 * JS (docs/assets/js/calculator.js) that reads docs/assets/js/hpro-config.js.
 *
 * To add a city: add an entry to CITIES and re-run. To change rebate amounts:
 * edit docs/assets/js/hpro-config.js (calculator) and the table rows below.
 */
import { copyFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

const DOCS = fileURLToPath(new URL('../docs', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = 'https://ontariofurnacerebates.ca';
const VERIFIED = 'June 2026';
const YEAR = 2026;
const LASTMOD = '2026-06-06';
const BRAND = 'Ontario Furnace Rebates';
const ENTITY_DESCRIPTION = 'Ontario Furnace Rebates is an independent furnace & HVAC rebate concierge that helps Ontario homeowners find, estimate, and claim every rebate they qualify for on furnaces, air conditioners, and heat pumps.';

/* ------------------------------------------------------------------ helpers */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Wrap $-figures (and ranges) in <span class="dollar"> — mirrors hpro_accent_dollars(). */
const accentDollars = (t) => t.replace(/\$\d(?:[\d,]*\d)?(?:\s?[–-]\s?\$?\d(?:[\d,]*\d)?)?/gu, (m) => `<span class="dollar">${m}</span>`);

const ICONS = {
	shield: '<path d="M12 3.5 19 6v5.2c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6z"/><path d="m9.2 12 1.9 1.9L15 10.2"/>',
	check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
	spark: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>',
	leaf: '<path d="M5 19c0-7 5-12 14-13 0 9-5 14-12 14-1 0-2-.3-2-1z"/><path d="M9 15c2.5-3 4.5-4.5 7.5-5.5"/>'
};
const icon = (name, s = 16, w = 1.9) =>
	`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

/* ---------------------------------------------------------- shared sections */
function heroHTML(a = {}) {
	const eyebrow = a.eyebrow || 'Ontario Furnace Rebates';
	const headline = a.headline || 'See how much you can get back on a furnace or HVAC upgrade in Ontario.';
	const subhead = a.subhead ||
		'Ontario Furnace Rebates is an independent rebate concierge for Ontario homeowners. Most homes qualify for $1,000–$7,500 back on a furnace, AC or heat pump — oil-heated homes can reach $22,000. Your estimate is free with no obligation.';
	const heroClass = a.image === false ? 'hero' : 'hero hpro-hero-visual';
	const trust = [['shield', 'Independent'], ['check', 'Free &amp; no obligation'], ['spark', 'No energy audit required'], ['leaf', 'Ontario homeowners']];
	const chips = trust.map(([i, t]) => `<span class="chip">${icon(i, 16)} ${t}</span>`).join('');
	return `<div class="hpro-wrap"><div class="hpro-ui">
	<div class="${heroClass}">
		<div class="hero-copy">
			<span class="eyebrow"><span class="dot"></span> ${esc(eyebrow)}</span>
			<h1 class="headline">${esc(headline)}</h1>
			<p class="subhead">${accentDollars(esc(subhead))}</p>
			<div class="trust">${chips}</div>
		</div>
		<div>
			<div class="hpro-calc-mount" data-hpro-calc></div>
			<div class="trust-mobile">${chips}</div>
		</div>
	</div>
</div></div>`;
}

const CALC_MOUNT = '<div class="hpro-calc-mount" data-hpro-calc></div>';

/** [hpro_rebate_table] — amounts-by-fuel (computed from the verified seed). */
function rebateTableHTML() {
	const rows = [
		['Natural gas (furnace upgrade)', '$1,000–$2,000'],
		['Electric / oil / propane / wood', '$3,000–$7,500'],
		['Geothermal (ground-source)', '$3,000–$12,000'],
		['Oil (stacked with federal OHPA)', 'up to ~$22,000 combined']
	];
	return `<div class="hpro-wrap">
	<p><strong>How much you get back depends mostly on how your home is heated today.</strong></p>
	<table class="hpro-table">
		<thead><tr><th>Your home is heated by</th><th>Estimated rebate (furnace / AC / heat pump)</th></tr></thead>
		<tbody>
		${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('\n\t\t')}
		</tbody>
	</table>
	<p class="hpro-verified">No energy audit required for a heat pump on its own. Amounts are estimates and depend on your home and eligibility — confirm current figures on the official program site. <strong>Last verified: ${VERIFIED}.</strong></p>
</div>`;
}

/** Single source of truth for FAQ — feeds [hpro_faq] + FAQPage schema. */
const FAQ = [
	['How much can I get back on a furnace or HVAC upgrade in Ontario?', 'A high-efficiency gas furnace upgrade typically returns $1,000–$2,000. Electric, oil, propane and wood homes replacing heating with a heat pump usually qualify for $3,000–$7,500, and up to $12,000 for geothermal. Oil homes can stack federal funding toward roughly $22,000.'],
	['Do I need an energy audit?', 'Not for a heat pump installed on its own — that’s one of the best parts of the current program. Audits only come in if you bundle other upgrades like insulation or windows.'],
	['Is this free?', 'Yes. Checking your rebate and getting matched with a registered contractor costs you nothing.'],
	['Do you submit my application?', 'We connect you with a registered contractor who handles the application for you — that’s who the program requires to submit it.'],
	['How long until I get paid?', 'Usually 60–90 days after your system is installed.'],
	['Can I keep my gas furnace?', 'Yes — many homes keep the furnace as backup and still qualify for a heat pump rebate.'],
	['What if I heat with oil?', 'Oil homes qualify for the most: the provincial rebate plus federal oil-conversion funding, which can approach $22,000 combined.'],
	['Is there a deadline?', 'The Home Renovation Savings Program is confirmed through November 2026 but can close earlier, and contractor registration closes May 31, 2026 — so it’s worth not waiting.']
];
function faqHTML() {
	return `<div class="hpro-faq">
${FAQ.map(([q, a]) => `	<details><summary>${q}</summary><p>${a}</p></details>`).join('\n')}
</div>`;
}

const CONTACT_FORM = `<form id="hpro-contact-form" class="hpro-contact" novalidate>
	<div class="hpro-field"><label for="cf-name">First name</label><input id="cf-name" name="name" autocomplete="given-name" required></div>
	<div class="hpro-row2">
		<div class="hpro-field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email"></div>
		<div class="hpro-field"><label for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" autocomplete="tel"></div>
	</div>
	<div class="hpro-field"><label for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="4"></textarea></div>
	<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Company website<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label></div>
	<label class="hpro-consent"><input type="checkbox" name="consent"> <span>I agree to be contacted about my rebate estimate. We’ll never sell your info.</span></label>
	<p class="err" hidden></p>
	<button class="hpro-btn" type="submit">Send message</button>
</form>`;

function expandShortcodes(html) {
	return html
		.replace(/\[hpro_hero\]/g, heroHTML())
		.replace(/\[hpro_calculator\]/g, CALC_MOUNT)
		.replace(/\[hpro_rebate_table\]/g, rebateTableHTML())
		.replace(/\[hpro_faq\]/g, faqHTML())
		.replace(/\[fluentform[^\]]*\]/g, CONTACT_FORM);
}

/* ------------------------------------------------------------------ chrome */
const HEADER_LOGO = `<svg class="brand__lockup" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 372 80" role="img" aria-label="Ontario Furnace Rebates" fill="none">
	<rect x="0" y="8" width="64" height="64" rx="15" fill="#1e3e4a"/>
	<path d="M32 12c1.1 7.6-5.6 10.4-5.6 17.2A5.6 5.6 0 0032 35a5.6 5.6 0 005.6-5.5c0-2.2-.9-4-2-5.5C41.5 25 45.5 30.6 45.5 37a13 13 0 11-27 0c0-9.8 10-14.2 13.5-25z" fill="#f08a4b"/>
	<text x="84" y="40" font-family="Figtree, sans-serif" font-size="30" font-weight="800" letter-spacing="-0.7" fill="#1e3e4a">Furnace Rebates</text>
	<text x="86" y="61" font-family="Figtree, sans-serif" font-size="12" font-weight="700" letter-spacing="3.2" fill="#9e3918">ONTARIO</text>
</svg>`;

const NAV = [
	{ label: 'How It Works', href: '/how-it-works/' },
	{ label: 'Rebates', href: '/rebates-explained/', match: ['/rebates-explained/', '/rebates/'] },
	{ label: 'Who Qualifies', href: '/who-qualifies/' },
	{ label: 'About', href: '/about/' },
	{ label: 'Check My Rebate', href: '/rebate-calculator/', cta: true }
];
const FOOTER_NAV = [
	{ label: 'How It Works', href: '/how-it-works/' },
	{ label: 'Rebates', href: '/rebates-explained/' },
	{ label: 'Who Qualifies', href: '/who-qualifies/' },
	{ label: 'FAQ', href: '/faq/' },
	{ label: 'Blog', href: '/blog/' },
	{ label: 'About', href: '/about/' },
	{ label: 'Contact', href: '/contact/' },
	{ label: 'Privacy Policy', href: '/privacy-policy/' },
	{ label: 'Terms', href: '/terms/' }
];

function navItem(item, current) {
	const matches = (item.match || [item.href]).some((m) => current === m || (m.length > 1 && m !== '/' && current.startsWith(m)));
	const cls = [item.cta ? 'hpro-nav-cta' : '', matches ? 'current-menu-item' : ''].filter(Boolean).join(' ');
	const aria = matches ? ' aria-current="page"' : '';
	return `<li${cls ? ` class="${cls}"` : ''}><a href="${item.href}"${aria}>${item.label}</a></li>`;
}

function headerHTML(current) {
	return `<a class="skip-link screen-reader-text" href="#content">Skip to content</a>
<header class="site-header">
	<div class="hpro-wrap site-header__inner">
		<a class="brand" href="/" rel="home" aria-label="Ontario Furnace Rebates">${HEADER_LOGO}</a>
		<button class="nav-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Toggle menu"><span></span><span></span><span></span></button>
		<nav class="site-nav" id="primary-nav" aria-label="Primary">
			<ul class="menu">${NAV.map((i) => navItem(i, current)).join('')}</ul>
		</nav>
	</div>
</header>
<main id="content" class="site-main">`;
}

const FOOTER_MARK = `<span class="brand__mark" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
	<path d="M12 3c.5 3.5-2.5 4.8-2.5 8A2.5 2.5 0 0012 12.5 2.5 2.5 0 0014.5 10c0-1-.4-1.8-.9-2.5C16 8.5 18 11 18 14a6 6 0 11-12 0c0-4.5 4.5-6.5 6-12z" fill="#f08a4b"/>
</svg></span>`;

function footerHTML() {
	return `</main>
<footer class="site-footer">
	<div class="hpro-wrap site-footer__inner">
		<a class="brand brand--light" href="/" rel="home">${FOOTER_MARK}<span class="brand__name"><b>Furnace Rebates</b><span>ONTARIO</span></span></a>
		<nav class="footer-nav" aria-label="Footer"><ul class="menu">${FOOTER_NAV.map((i) => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}</ul></nav>
	</div>
	<div class="hpro-wrap">
		<p class="hpro-footer-compliance">Ontario Furnace Rebates is an independent service that helps homeowners find and claim furnace, AC and heat pump rebates. We are not affiliated with the Government of Ontario, Save on Energy, Enbridge, or Natural Resources Canada. Rebate amounts shown are estimates and depend on your home and eligibility. &copy; ${YEAR} Ontario Furnace Rebates.</p>
	</div>
</footer>
<div class="hpro-stickybar"><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></div>
<script>
(function () {
	var btn = document.querySelector('.nav-toggle'), nav = document.getElementById('primary-nav');
	if (!btn || !nav) return;
	function setOpen(o) { nav.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
	btn.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
	document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
	nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
	document.addEventListener('click', function (e) { if (nav.classList.contains('is-open') && !e.target.closest('#primary-nav') && !e.target.closest('.nav-toggle')) setOpen(false); });
})();
</script>`;
}

/* ------------------------------------------------------------------- schema */
const ORG = {
	'@context': 'https://schema.org',
	'@type': ['Organization', 'ProfessionalService'],
	'@id': BASE + '/#org',
	name: BRAND,
	url: BASE + '/',
	logo: BASE + '/assets/img/logo-horizontal.svg',
	description: ENTITY_DESCRIPTION,
	areaServed: { '@type': 'State', name: 'Ontario', containedInPlace: { '@type': 'Country', name: 'Canada' } },
	knowsAbout: ['Ontario furnace rebates', 'Ontario HVAC rebates', 'Home Renovation Savings Program', 'Oil to Heat Pump Affordability', 'Canada Greener Homes Loan', 'furnace and AC rebate eligibility'],
	priceRange: 'Free'
};
const websiteSchema = () => ({
	'@context': 'https://schema.org',
	'@type': 'WebSite',
	'@id': BASE + '/#website',
	name: BRAND,
	url: BASE + '/',
	description: ENTITY_DESCRIPTION,
	publisher: { '@id': BASE + '/#org' },
	inLanguage: 'en-CA'
});
const faqPageSchema = () => ({
	'@context': 'https://schema.org', '@type': 'FAQPage',
	mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') } }))
});
const breadcrumb = (items) => ({
	'@context': 'https://schema.org', '@type': 'BreadcrumbList',
	itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url }))
});
function ldScript(obj) {
	let j = JSON.stringify(obj);
	j = j.replace(/</g, '\\u003C').replace(/>/g, '\\u003E').replace(/&/g, '\\u0026');
	return `<script type="application/ld+json">${j}</script>`;
}

/* -------------------------------------------------------------------- layout */
function layout(page) {
	const url = page.url;
	const canonical = BASE + (url === '/' ? '/' : url);
	const robots = page.noindex ? '<meta name="robots" content="noindex, follow" />\n\t' : '';
	const schema = [ORG, ...(page.schema || [])].map(ldScript).join('\n\t');
	const scripts = (page.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n\t');
	return `<!DOCTYPE html>
<html lang="en-CA">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	${robots}<title>${esc(page.title)}</title>
	<meta name="description" content="${esc(page.desc || '')}" />
	<link rel="canonical" href="${canonical}" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Ontario Furnace Rebates" />
	<meta property="og:title" content="${esc(page.title)}" />
	<meta property="og:description" content="${esc(page.desc || '')}" />
	<meta property="og:url" content="${canonical}" />
	<meta name="twitter:card" content="summary" />
	<link rel="icon" href="/assets/img/logo-mark.svg" type="image/svg+xml" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap" />
	<link rel="stylesheet" href="/assets/css/style.css?v=1.0.0" />
	${schema}
</head>
<body class="${page.bodyClass || ''}">
${headerHTML(url)}
<article class="hpro-page">
	<div class="entry-content">
${page.body}
	</div>
</article>
${footerHTML()}
<script src="/assets/js/hpro-config.js"></script>
<script src="/assets/js/calculator.js" defer></script>
${scripts}
</body>
</html>
`;
}

function write(url, html) {
	const rel = url === '/' ? 'index.html' : url.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
	const full = DOCS + '/' + rel;
	mkdirSync(full.substring(0, full.lastIndexOf('/')), { recursive: true });
	writeFileSync(full, html);
	return rel;
}

/* ===================================================================== PAGES */
const pages = [];
const sitemap = [];
function addPage(p) { pages.push(p); if (!p.noindex) sitemap.push(BASE + (p.url === '/' ? '/' : p.url)); }

/* --- Home -------------------------------------------------------------- */
addPage({
	url: '/',
	title: 'Ontario Furnace Rebates — Check Your Rebate in 60 Seconds',
	desc: 'Ontario Furnace Rebates helps homeowners estimate and claim furnace, AC and heat pump rebates. Most qualify for $1,000–$7,500, oil homes up to ~$22,000.',
	schema: [websiteSchema(), faqPageSchema()],
	body: expandShortcodes(`
<section class="hpro-section">[hpro_hero]</section>

<section class="hpro-proof hpro-section"><div class="hpro-wrap"><h2>Homes like yours are getting back thousands.</h2>
<div class="hpro-proof__tiles">
<div class="hpro-tile"><div class="hpro-tile__big">Up to $7,500</div><div class="hpro-tile__label">electric, oil, propane &amp; wood homes</div></div>
<div class="hpro-tile"><div class="hpro-tile__big">Up to $12,000</div><div class="hpro-tile__label">geothermal systems</div></div>
<div class="hpro-tile"><div class="hpro-tile__big">No energy audit</div><div class="hpro-tile__label">required for a heat pump on its own</div></div>
</div></div></section>

<section class="hpro-section"><div class="hpro-wrap"><h2>How getting your rebate works</h2>
<div class="hpro-steps">
<div class="hpro-stepcard"><div class="hpro-stepcard__num">1</div><h3>Check your rebate.</h3><p>Tell us how your home is heated and where you live — we’ll estimate what you qualify for on a furnace, AC or heat pump.</p></div>
<div class="hpro-stepcard"><div class="hpro-stepcard__num">2</div><h3>We match you with a registered contractor.</h3><p>They confirm your exact amount and handle the rebate application for you.</p></div>
<div class="hpro-stepcard"><div class="hpro-stepcard__num">3</div><h3>Get your upgrade — and your rebate.</h3><p>Lower bills, year-round comfort, money back.</p></div>
</div></div></section>

<section class="hpro-section"><div class="hpro-wrap" style="max-width:760px"><h2>One place for every Ontario furnace &amp; HVAC rebate.</h2>
<p>Ontario Furnace Rebates is an independent rebate concierge that helps Ontario homeowners estimate, find, and claim every furnace, AC and heat pump rebate they qualify for. Most contractors only point you to one program. We look across the Home Renovation Savings Program, federal oil-conversion funding, and low-interest loans to find every dollar you’re owed, then connect you with a registered contractor who handles the paperwork. You don’t pay us anything.</p>
</div></section>

<section class="hpro-section" id="guide"><div class="hpro-wrap" style="max-width:820px">
<p class="hpro-verified">Last updated: June 2026</p>

<h2>How much is the furnace &amp; HVAC rebate in Ontario?</h2>
<p>Ontario homeowners can get $1,000–$2,000 on a high-efficiency gas furnace, or up to $7,500 (electric, oil, propane, wood) toward a heat pump, and up to $12,000 for geothermal, through the Home Renovation Savings Program. Oil homes can stack federal funding toward roughly $22,000.</p>
[hpro_rebate_table]

<h2>Who qualifies for the rebate?</h2>
<p>You qualify if you own your Ontario home, it’s an eligible home type, you’re on the electricity grid or an Enbridge gas customer, and you install NRCan-listed equipment through a registered contractor.</p>
<ul>
<li>You own the home (the rebate is claimed by the homeowner).</li>
<li>The home is in Ontario, on the electricity grid or an Enbridge gas customer (Cornwall Electric excluded).</li>
<li>The equipment is on the NRCan approved list.</li>
<li>The application is submitted by an HRS-registered contractor.</li>
</ul>

<h2>How do you apply (without losing the rebate)?</h2>
<p>Three steps: check your rebate, get matched with a registered contractor who confirms your amount and handles the application, then install and get paid — usually 60–90 days after install. The one rule that protects your rebate: <strong>don’t start work before your contractor confirms eligibility.</strong></p>

<h2>Which programs can you use?</h2>
<p>The main one is the <strong>Home Renovation Savings Program (HRS)</strong>. Oil homes can add the federal <strong>Oil to Heat Pump Affordability (OHPA)</strong> program. And the interest-free <strong>Canada Greener Homes Loan</strong> stacks on top to finance the rest.</p>

<h2>Is there a deadline?</h2>
<p>The program is confirmed through November 2026 but can close earlier, and contractor registration closes May 31, 2026 — so it’s worth not waiting.</p>

<h2>Frequently asked questions</h2>
[hpro_faq]
</div></section>

<section class="hpro-section"><div class="hpro-wrap"><div class="hpro-cta"><h2>Find your rebate in 60 seconds.</h2>
<p>Free, no obligation. Most homeowners qualify for $1,000–$7,500 back.</p>
<p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p>
</div></div></section>`)
});

/* --- Standard pages (with breadcrumb + per-page schema) ----------------- */
const std = [
	{
		url: '/how-it-works/', title: 'How It Works — Ontario Furnace Rebates',
		desc: 'Three steps to your Ontario furnace or HVAC rebate: check your rebate, get matched with a registered contractor who handles the application, and get paid. Free, no obligation.',
		schema: [{
			'@context': 'https://schema.org', '@type': 'HowTo', name: 'How to get your Ontario furnace & HVAC rebate',
			description: 'Check your rebate, get matched with a registered contractor who handles the application, and get money back.',
			step: [
				{ '@type': 'HowToStep', position: 1, name: 'Check your rebate', text: 'Tell us how your home is heated and where you live — we estimate what you qualify for.' },
				{ '@type': 'HowToStep', position: 2, name: 'Get matched with a registered contractor', text: 'They confirm your exact amount and handle the rebate application for you.' },
				{ '@type': 'HowToStep', position: 3, name: 'Install and get paid', text: 'Get your furnace, AC or heat pump and your rebate — typically paid 60–90 days after install.' }
			]
		}],
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:820px">
<h1>How getting your rebate works</h1>
<p>Three simple steps, no cost to you, no obligation. We handle the confusing part.</p>

<div class="hpro-steps">
<div class="hpro-stepcard"><div class="hpro-stepcard__num">1</div><h3>Check your rebate.</h3><p>Use the 60-second calculator: tell us how your home is heated and where you live, and we’ll estimate what you qualify for across every program — provincial, federal, and municipal.</p></div>
<div class="hpro-stepcard"><div class="hpro-stepcard__num">2</div><h3>We match you with a registered contractor.</h3><p>A rebate specialist confirms your exact amount, then connects you with a registered contractor who handles the rebate application for you. That’s who the program requires to submit it.</p></div>
<div class="hpro-stepcard"><div class="hpro-stepcard__num">3</div><h3>Get your upgrade — and your rebate.</h3><p>Your furnace, AC or heat pump is installed, and your rebate is typically paid 60–90 days afterward. Lower bills, year-round comfort, money back.</p></div>
</div>

<h2>What it costs you: nothing</h2>
<p>Checking your rebate and getting matched with a registered contractor is completely free, with no obligation. We’re independent — we don’t sell equipment, so our only job is finding you every dollar you’re owed.</p>

<p style="margin-top:1.5rem"><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p>
</div></section>`
	},
	{
		url: '/who-qualifies/', title: 'Who Qualifies for a Furnace & HVAC Rebate in Ontario',
		desc: 'See if you qualify for an Ontario furnace, AC or heat pump rebate by fuel type — gas, electric, oil, propane, wood, geothermal — plus the full eligibility checklist.',
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:900px">
<h1>Who qualifies for a furnace &amp; HVAC rebate</h1>
<p>How much you get back depends mostly on how your home is heated today. Find your fuel type below — and if you’re not sure, check anyway.</p>

<div class="hpro-fuelgrid">
<div class="hpro-fuelcard"><h3>Natural gas</h3><div class="hpro-fuelcard__amt">$1,000–$2,000</div><p>High-efficiency furnace upgrades return the most for gas homes.</p></div>
<div class="hpro-fuelcard"><h3>Electric</h3><div class="hpro-fuelcard__amt">$3,000–$7,500</div><p>Electric-to-heat-pump upgrades deliver the biggest savings.</p></div>
<div class="hpro-fuelcard"><h3>Oil</h3><div class="hpro-fuelcard__amt">up to ~$22,000</div><p>Provincial rebate + federal oil-conversion funding stacked.</p></div>
<div class="hpro-fuelcard"><h3>Propane</h3><div class="hpro-fuelcard__amt">$3,000–$7,500</div><p>Same top tier as electric and oil.</p></div>
<div class="hpro-fuelcard"><h3>Wood</h3><div class="hpro-fuelcard__amt">$3,000–$7,500</div><p>Same top tier as electric and oil.</p></div>
<div class="hpro-fuelcard"><h3>Geothermal</h3><div class="hpro-fuelcard__amt">up to $12,000</div><p>Ground-source systems; higher install, higher rebate.</p></div>
</div>

<h2>Eligibility checklist</h2>
<ul>
<li>You own your home.</li>
<li>The home is in Ontario, on the electricity grid or an Enbridge gas customer (Cornwall Electric excluded).</li>
<li>The equipment is on the NRCan approved list.</li>
<li>The application is submitted by an HRS-registered contractor.</li>
</ul>

<p>Even if you’re not sure about your fuel type or eligibility, check anyway — it takes 60 seconds and a specialist will confirm the details.</p>
<p style="margin-top:1.25rem"><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p>

<p class="hpro-verified">Amounts are estimates and depend on your home and eligibility — confirm current figures on the official program site. Last verified: June 2026.</p>
</div></section>`
	},
	{
		url: '/rebate-calculator/', title: 'Rebate Calculator — Check Your Ontario Furnace & HVAC Rebate',
		desc: 'Answer a few quick questions and get your estimated Ontario furnace, AC or heat pump rebate in 60 seconds. Free, no obligation.',
		body: expandShortcodes(`
<section class="hpro-section"><div class="hpro-wrap" style="max-width:680px">
<h1>Check your rebate</h1>
<p>Answer a few quick questions and get your estimated Ontario furnace or HVAC rebate in 60 seconds. Free, no obligation.</p>
[hpro_calculator]
<p class="hpro-verified" style="margin-top:1rem">Amounts are estimates and depend on your home and eligibility. Last verified: June 2026.</p>
</div></section>`)
	},
	{
		url: '/contact/', title: 'Get Started — Ontario Furnace Rebates',
		desc: 'Find your Ontario furnace or HVAC rebate. Use the 60-second calculator or send us a message — we serve homeowners across Ontario.',
		scripts: ['/assets/js/contact-form.js'],
		body: expandShortcodes(`
<section class="hpro-section"><div class="hpro-wrap" style="max-width:680px">
<h1>Let’s find your rebate</h1>
<p>The fastest way to your number is the 60-second calculator. Prefer to talk? Use the form below — we serve homeowners across Ontario.</p>
[hpro_calculator]
<h2 style="margin-top:2rem">Or send us a message</h2>
[fluentform id="1"]
<p class="hpro-verified" style="margin-top:1rem">By submitting, you agree we can contact you about your rebate. We’ll never sell your info. See our <a href="/privacy-policy/">Privacy Policy</a>.</p>
</div></section>`)
	},
	{
		url: '/thank-you/', title: 'Thank You — Ontario Furnace Rebates',
		desc: 'Thanks — your rebate estimate is on its way. A specialist will reach out within one business day.', noindex: true,
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:680px;text-align:center">
<h1>Thanks — your estimate is on its way.</h1>
<p>A rebate specialist will reach out within one business day to confirm your exact amount and next steps. In the meantime, here’s how the process works.</p>
<p style="margin-top:1.25rem"><a class="hpro-btn" href="/how-it-works/">See how it works</a></p>
<div class="hpro-standout" style="margin-top:2rem;text-align:left">💡 <strong>Heat with oil?</strong> Oil homes qualify for the most — the provincial rebate plus federal oil-conversion funding can approach $22,000 combined. Ask your specialist about it.</div>
</div></section>`
	},
	{
		url: '/rebates-explained/', title: 'Ontario Furnace & HVAC Rebates Explained (2026)',
		desc: 'Every Ontario furnace, AC and heat pump rebate, who runs it, and how much it’s worth — HRS, Enbridge, the Canada Greener Homes Loan, and municipal programs. Updated June 2026.',
		schema: [{
			'@context': 'https://schema.org', '@type': 'ItemList', name: 'Ontario furnace & HVAC rebate programs',
			itemListElement: [
				['Home Renovation Savings Program (HRS)', '/rebates/home-renovation-savings-program/'],
				['Oil to Heat Pump Affordability (OHPA)', '/rebates/oil-to-heat-pump-affordability/'],
				['Enbridge Home Efficiency Rebate', '/rebates/enbridge-home-efficiency-rebate/'],
				['Canada Greener Homes Loan', '/rebates/canada-greener-homes-loan/'],
				['Municipal & Utility Programs', '/rebates/municipal-utility-programs/']
			].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, url: BASE + u }))
		}],
		body: expandShortcodes(`
<section class="hpro-section"><div class="hpro-wrap" style="max-width:900px">
<p class="hpro-verified">Last updated: June 2026</p>
<h1>Ontario furnace &amp; HVAC rebates explained</h1>
<p>There isn’t just one rebate in Ontario — there are several, and they stack. The provincial Home Renovation Savings Program is the main one; oil homes can add federal funding, and an interest-free federal loan covers the rest. Here’s every program, who runs it, and how much it’s worth. Or skip the reading and <a href="/rebate-calculator/">check your rebate in 60 seconds</a>.</p>

[hpro_rebate_table]

<h2>The programs</h2>
<div class="hpro-fuelgrid">
<div class="hpro-fuelcard"><h3><a href="/rebates/home-renovation-savings-program/">Home Renovation Savings Program (HRS)</a></h3><div class="hpro-fuelcard__amt">up to $7,500</div><p>Ontario’s main rebate — furnaces $1,000–$2,000, air-source heat pumps up to $7,500, geothermal up to $12,000. No energy audit for a heat pump on its own.</p></div>
<div class="hpro-fuelcard"><h3><a href="/rebates/oil-to-heat-pump-affordability/">Oil to Heat Pump Affordability (OHPA)</a></h3><div class="hpro-fuelcard__amt">+ up to ~$22,000</div><p>Federal top-up for oil-heated homes. Stacks on HRS so combined funding can approach $22,000.</p></div>
<div class="hpro-fuelcard"><h3><a href="/rebates/enbridge-home-efficiency-rebate/">Enbridge Home Efficiency Rebate</a></h3><div class="hpro-fuelcard__amt">up to $1,000</div><p>For Enbridge gas customers upgrading to a high-efficiency furnace, plus insulation and smart thermostat top-ups.</p></div>
<div class="hpro-fuelcard"><h3><a href="/rebates/canada-greener-homes-loan/">Canada Greener Homes Loan</a></h3><div class="hpro-fuelcard__amt">up to $40,000</div><p>Interest-free federal loan over 10 years. Stacks with the rebates to finance the rest.</p></div>
<div class="hpro-fuelcard"><h3><a href="/rebates/municipal-utility-programs/">Municipal &amp; utility programs</a></h3><div class="hpro-fuelcard__amt">varies</div><p>Some cities and utilities add their own loans or top-ups, like Toronto’s BetterHomesTO HELP.</p></div>
</div>

<h2>Which ones can you stack?</h2>
<p>For oil homes: HRS + OHPA + (optionally) the Greener Homes Loan. For everyone else: HRS + the Greener Homes Loan, plus any municipal program where you live. Not sure what applies to your address? <a href="/who-qualifies/">See who qualifies</a> or <a href="/rebate-calculator/">check your rebate</a>.</p>

<h2>Rebates by city</h2>
<p>Same provincial and federal rebates apply across Ontario, plus any local utility or municipal program:</p>
<p><a href="/furnace-rebate-toronto/">Toronto</a> · <a href="/furnace-rebate-ottawa/">Ottawa</a> · <a href="/furnace-rebate-mississauga/">Mississauga</a> · <a href="/furnace-rebate-hamilton/">Hamilton</a> · <a href="/furnace-rebate-london/">London</a> · <a href="/furnace-rebate-brampton/">Brampton</a> · <a href="/furnace-rebate-kitchener-waterloo/">Kitchener-Waterloo</a> · <a href="/furnace-rebate-windsor/">Windsor</a> · <a href="/furnace-rebate-barrie/">Barrie</a> · <a href="/furnace-rebate-kingston/">Kingston</a></p>

<div class="hpro-cta" style="margin-top:2rem"><h2>Find your number across every program.</h2><p>Free, no obligation, 60 seconds.</p><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div>
</div></section>`)
	},
	{
		url: '/faq/', title: 'Furnace & HVAC Rebate FAQ — Ontario',
		desc: 'Answers to the questions Ontario homeowners ask most about furnace, AC and heat pump rebates: amounts, eligibility, audits, deadlines, and how you get paid.',
		schema: [faqPageSchema()],
		body: expandShortcodes(`
<section class="hpro-section"><div class="hpro-wrap" style="max-width:820px">
<h1>Furnace &amp; HVAC rebate FAQ</h1>
<p>The questions Ontario homeowners ask most. Still unsure? <a href="/rebate-calculator/">Check your rebate</a> and a specialist will confirm the details.</p>
[hpro_faq]
<p style="margin-top:1.5rem">Want the full breakdown by program? See <a href="/rebates-explained/">Rebates Explained</a> or <a href="/who-qualifies/">Who Qualifies</a>.</p>
</div></section>`)
	},
	{
		url: '/about/', title: 'About — Why Ontario Furnace Rebates',
		desc: 'We’re an independent furnace & HVAC rebate concierge for Ontario homeowners — we find every dollar you’re owed, then connect you with a registered contractor who handles the application.',
		schema: [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About', url: BASE + '/about/', mainEntity: { '@id': BASE + '/#org' } }],
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:760px">
<h1>Why Ontario Furnace Rebates</h1>
<p>We’re an independent rebate concierge for Ontario homeowners. We don’t sell furnaces and we’re not tied to one contractor — so our only job is finding you every dollar you’re owed across every program, then connecting you with a registered contractor who handles the application.</p>

<h2>Independent, by design</h2>
<p>Most "rebate help" comes from a contractor who only points you to the one program their sale qualifies for. Because we’re independent, we look across the Home Renovation Savings Program, federal oil-conversion funding (OHPA), the Canada Greener Homes Loan, and municipal programs — and tell you the real number for your home before anyone tries to sell you anything.</p>

<h2>Accurate, and dated</h2>
<p>Rebate programs change often and can close at any time. Every amount on this site shows when it was last verified and links to the official program portal, so you’re always working from current figures. <strong>Rebate data last verified: June 2026.</strong></p>

<h2>What it costs you: nothing</h2>
<p>Checking your rebate and getting matched with a registered contractor is free, with no obligation. We connect you with a registered contractor who handles your application — that’s who the program requires to submit it.</p>

<p><em>We are not affiliated with the Government of Ontario, Save on Energy, Enbridge, or Natural Resources Canada.</em></p>

<div class="hpro-cta" style="margin-top:2rem"><h2>Ready to see your number?</h2><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div>
</div></section>`
	},
	{
		url: '/privacy-policy/', title: 'Privacy Policy — Ontario Furnace Rebates',
		desc: 'How Ontario Furnace Rebates collects, uses, and protects your information. We never sell your data.',
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:760px">
<h1>Privacy Policy</h1>
<p><em>Last updated: June 2026. This is a starter policy — have it reviewed before launch.</em></p>
<h2>Who we are</h2>
<p>Ontario Furnace Rebates is an independent service that helps Ontario homeowners find and claim furnace, AC and heat pump rebates. We are not affiliated with the Government of Ontario, Save on Energy, Enbridge, or Natural Resources Canada.</p>
<h2>What we collect</h2>
<p>When you use our rebate calculator or contact form, we collect the details you provide (such as your name, email, phone, postal code, home heating type, and system preference) along with basic technical data (page URL and marketing source/UTM parameters).</p>
<h2>How we use it</h2>
<p>We use your information to estimate your rebate, confirm your eligibility, and connect you with a registered contractor who can handle your rebate application. We contact you only about your rebate. <strong>We never sell your information.</strong></p>
<h2>Who we share it with</h2>
<p>We share your details with the registered contractor matched to your project and with the service providers we use to operate the site and manage enquiries (for example, our CRM and notification tools). They process your data on our behalf.</p>
<h2>Consent (CASL)</h2>
<p>By submitting a form, you consent to us contacting you about your rebate. You can withdraw consent at any time by replying to any message or contacting us.</p>
<h2>Your rights</h2>
<p>You may request access to, correction of, or deletion of your personal information. Contact us and we’ll help.</p>
<h2>Contact</h2>
<p>Questions about your privacy? Email privacy@ontariofurnacerebates.ca.</p>
</div></section>`
	},
	{
		url: '/terms/', title: 'Terms of Use & Rebate Disclaimer — Ontario Furnace Rebates',
		desc: 'Terms of use and rebate disclaimer for Ontario Furnace Rebates. Rebate amounts are estimates, not guarantees.',
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:760px">
<h1>Terms of Use &amp; Rebate Disclaimer</h1>
<p><em>Last updated: June 2026. This is a starter document — have it reviewed before launch.</em></p>
<h2>Independent service</h2>
<p>Ontario Furnace Rebates is an independent service. We are not a government entity and are not affiliated with the Government of Ontario, Save on Energy, Enbridge, or Natural Resources Canada.</p>
<h2>Estimates, not guarantees</h2>
<p>Rebate amounts shown on this site, including calculator results, are estimates. Your actual rebate depends on your home, your equipment, program rules, and eligibility, and is confirmed by the program administrator and your registered contractor. Programs can change or close at any time. Always confirm current figures on the official program site.</p>
<h2>How applications are handled</h2>
<p>We connect you with a registered contractor who handles your rebate application. We do not submit applications ourselves.</p>
<h2>No cost, no obligation</h2>
<p>Using our calculator and getting matched with a contractor is free and carries no obligation.</p>
<h2>Limitation of liability</h2>
<p>We provide this site and our matching service "as is." To the extent permitted by law, we are not liable for decisions made based on estimates shown here.</p>
</div></section>`
	}
];
for (const p of std) {
	p.schema = [breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: p.title.split(' — ')[0].split(' (')[0], url: BASE + p.url }]), ...(p.schema || [])];
	addPage(p);
}

/* --- Rebate program spokes --------------------------------------------- */
const SPOKES = [
	{
		slug: 'home-renovation-savings-program', title: 'Home Renovation Savings Program (HRS)',
		administrator: 'Save on Energy + Enbridge Gas (Government of Ontario)', maxAmount: 7500, status: 'active', auditRequired: false,
		officialUrl: 'https://www.saveonenergy.ca/',
		excerpt: 'Ontario’s main rebate — furnaces $1,000–$2,000, air-source heat pumps up to $7,500 (more for geothermal). No energy audit required for a heat pump on its own.',
		content: `
<p>The Home Renovation Savings Program (HRS) is Ontario’s main furnace & HVAC rebate, delivered by Save on Energy and Enbridge Gas and backed by the Government of Ontario. It replaced the HER+ program.</p>
<ul>
<li><strong>High-efficiency gas furnace:</strong> $1,000–$2,000 for qualifying upgrades.</li>
<li><strong>Air-source heat pump:</strong> up to ~$2,000 (natural gas homes); up to ~$7,500 (electric, oil, propane, wood) at about $1,250/ton.</li>
<li><strong>Geothermal:</strong> ~$3,000 flat for gas homes; up to ~$12,000 for non-gas ($2,000/ton).</li>
<li><strong>No energy audit</strong> required for a heat pump as a single upgrade.</li>
<li><strong>Timeline:</strong> confirmed through November 2026, can close earlier; contractor registration closes May 31, 2026.</li>
</ul>
<p>Heat with oil? You can stack the federal <a href="/rebates/oil-to-heat-pump-affordability/">Oil to Heat Pump Affordability (OHPA)</a> program on top — and finance the rest with the interest-free <a href="/rebates/canada-greener-homes-loan/">Canada Greener Homes Loan</a>.</p>
<p>Amounts are estimates — confirm current figures and eligibility on the official program site. Last verified: June 2026.</p>`
	},
	{
		slug: 'oil-to-heat-pump-affordability', title: 'Oil to Heat Pump Affordability (OHPA)',
		administrator: 'Natural Resources Canada (federal)', cap: 22000, status: 'active', officialUrl: 'https://natural-resources.canada.ca/',
		excerpt: 'Federal program for oil-heated homes. Stacks on top of HRS, adding roughly $5,000–$15,000 so combined funding can approach ~$22,000.',
		content: `
<p>Oil to Heat Pump Affordability (OHPA) is a federal program for homes that currently heat with oil. It stacks on top of the provincial HRS rebate, adding roughly $5,000–$15,000, so combined funding can approach ~$22,000.</p>
<p>If you heat with oil, this is the single biggest opportunity — it’s why oil homes get back the most. OHPA stacks on top of the provincial <a href="/rebates/home-renovation-savings-program/">Home Renovation Savings Program</a>. Amounts are estimates — confirm current figures and eligibility on the official program site. Last verified: June 2026.</p>`
	},
	{
		slug: 'enbridge-home-efficiency-rebate', title: 'Enbridge Home Efficiency Rebate',
		administrator: 'Enbridge Gas', maxAmount: 1000, status: 'active', officialUrl: 'https://enbridgegas.com/',
		excerpt: 'For Enbridge gas customers upgrading to a high-efficiency furnace, plus insulation and smart-thermostat top-ups. Up to $1,000.',
		content: `
<p>The Enbridge Home Efficiency Rebate is for Enbridge gas customers making efficiency upgrades. A high-efficiency natural gas furnace replacement typically qualifies for up to $1,000, and you can add top-ups for attic insulation, air sealing, and a smart thermostat.</p>
<p>If you heat with oil or propane, you’ll usually get more from the provincial <a href="/rebates/home-renovation-savings-program/">Home Renovation Savings Program</a> heat pump rebate. If you heat with gas, the Enbridge rebate is often the fastest path. Amounts are estimates — confirm current figures and eligibility on the official program site. Last verified: June 2026.</p>`
	},
	{
		slug: 'canada-greener-homes-loan', title: 'Canada Greener Homes Loan',
		administrator: 'Natural Resources Canada (federal)', maxAmount: 40000, status: 'active',
		officialUrl: 'https://natural-resources.canada.ca/energy-efficiency/homes/canada-greener-homes-initiative',
		excerpt: 'Interest-free federal loan up to $40,000 over 10 years. The grant closed in 2024; the loan did not, and it stacks with provincial rebates.',
		content: `
<p>The Canada Greener Homes Loan is an interest-free federal loan of up to $40,000 over a 10-year term. The Greener Homes <em>grant</em> closed in 2024, but the <em>loan</em> is still active and stacks with provincial rebates — useful for financing the part of a furnace, AC or heat pump install the rebates don’t cover.</p>
<p>Amounts and terms are estimates — confirm current details on the official program site. Last verified: June 2026.</p>`
	},
	{
		slug: 'municipal-utility-programs', title: 'Municipal & Utility Programs',
		status: 'active',
		excerpt: 'Some cities and utilities add their own low-interest loans or top-ups, like Toronto’s BetterHomesTO HELP. We check these for your address.',
		content: `
<p>On top of provincial and federal programs, some Ontario cities and utilities offer their own low-interest loans or top-ups — for example, Toronto’s BetterHomesTO Home Energy Loan Program (HELP). Availability depends on where you live.</p>
<p>When you check your rebate, we look at the municipal and utility options for your specific address too. Last verified: June 2026.</p>`
	}
];
const STATUS_LABELS = { active: 'Active', closing: 'Closing soon', closed: 'Closed' };
for (const s of SPOKES) {
	const url = `/rebates/${s.slug}/`;
	const headlineAmt = s.maxAmount;
	let tiles = '';
	if (headlineAmt || s.administrator || s.status) {
		tiles = '<div class="hpro-proof__tiles" style="margin:1.25rem 0">';
		if (headlineAmt) tiles += `<div class="hpro-tile" style="background:#fff;border-color:var(--hpro-line)"><div class="hpro-tile__big" style="color:var(--hpro-accent-deep)">up to $${headlineAmt.toLocaleString('en-US')}</div><div class="hpro-tile__label" style="color:var(--hpro-muted)">maximum</div></div>`;
		if (s.administrator) tiles += `<div class="hpro-tile" style="background:#fff;border-color:var(--hpro-line)"><div class="hpro-tile__big" style="font-size:1.1rem;color:var(--hpro-base)">${esc(s.administrator)}</div><div class="hpro-tile__label" style="color:var(--hpro-muted)">administered by</div></div>`;
		if (s.status && STATUS_LABELS[s.status]) tiles += `<div class="hpro-tile" style="background:#fff;border-color:var(--hpro-line)"><div class="hpro-tile__big" style="font-size:1.4rem;color:var(--hpro-base)">${STATUS_LABELS[s.status]}</div><div class="hpro-tile__label" style="color:var(--hpro-muted)">status</div></div>`;
		tiles += '</div>';
	}
	const auditLine = (s.auditRequired === true || s.auditRequired === false)
		? `<p><strong>Energy audit:</strong> ${s.auditRequired ? 'required' : 'not required for a heat pump on its own.'}</p>` : '';
	const officialLine = s.officialUrl
		? `<p><a class="hpro-btn hpro-btn--ghost" href="${s.officialUrl}" target="_blank" rel="noopener nofollow">View the official program site ↗</a></p>` : '';
	addPage({
		url, title: `${s.title} — Ontario Furnace & HVAC Rebate`, desc: s.excerpt,
		schema: [
			{ '@context': 'https://schema.org', '@type': 'GovernmentService', name: s.title, serviceType: 'Furnace & HVAC rebate program', areaServed: { '@type': 'State', name: 'Ontario' }, provider: { '@id': BASE + '/#org' }, description: s.excerpt },
			breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: 'Rebates Explained', url: BASE + '/rebates-explained/' }, { name: s.title, url: BASE + url }])
		],
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:860px">
<nav class="hpro-verified" aria-label="Breadcrumb" style="margin-bottom:1rem"><a href="/">Home</a> › <a href="/rebates-explained/">Rebates Explained</a> › <span>${esc(s.title)}</span></nav>
<h1>${esc(s.title)}</h1>
${tiles}
<div class="hpro-content">${s.content}</div>
${auditLine}
${officialLine}
<p class="hpro-verified">Amounts are estimates and depend on your home and eligibility — confirm current figures on the official program site. <strong>Last verified: ${VERIFIED}.</strong></p>
<div class="hpro-cta" style="margin-top:2rem"><h2>See what you’d get back.</h2><p>Check your rebate across every program in 60 seconds — free, no obligation.</p><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div>
<p style="margin-top:1.5rem"><a href="/rebates-explained/">← All Ontario furnace & HVAC rebate programs</a></p>
</div></section>`
	});
}

/* --- City pages -------------------------------------------------------- */
const CITIES = [
	{ slug: 'furnace-rebate-toronto', city: 'Toronto', region: 'Greater Toronto Area', utility: 'Toronto Hydro', muni: 'BetterHomesTO Home Energy Loan Program (HELP)', muniUrl: 'https://www.toronto.ca/services-payments/water-environment/net-zero-homes-buildings/betterhomesto/', lat: 43.6532, lng: -79.3832 },
	{ slug: 'furnace-rebate-ottawa', city: 'Ottawa', region: 'Eastern Ontario', utility: 'Hydro Ottawa', muni: 'Better Homes Ottawa Loan Program', muniUrl: 'https://betterhomesottawa.ca/loan/', lat: 45.4215, lng: -75.6972 },
	{ slug: 'furnace-rebate-mississauga', city: 'Mississauga', region: 'Peel Region', utility: 'Alectra Utilities', lat: 43.5890, lng: -79.6441 },
	{ slug: 'furnace-rebate-hamilton', city: 'Hamilton', region: 'Greater Hamilton', utility: 'Alectra Utilities', lat: 43.2557, lng: -79.8711 },
	{ slug: 'furnace-rebate-london', city: 'London', region: 'Southwestern Ontario', utility: 'London Hydro', lat: 42.9849, lng: -81.2453 },
	{ slug: 'furnace-rebate-brampton', city: 'Brampton', region: 'Peel Region', utility: 'Alectra Utilities', lat: 43.7315, lng: -79.7624 },
	{ slug: 'furnace-rebate-kitchener-waterloo', city: 'Kitchener-Waterloo', region: 'Waterloo Region', utility: 'Enova Power', lat: 43.4516, lng: -80.4925 },
	{ slug: 'furnace-rebate-windsor', city: 'Windsor', region: 'Southwestern Ontario', utility: 'ENWIN Utilities', lat: 42.3149, lng: -83.0364 },
	{ slug: 'furnace-rebate-barrie', city: 'Barrie', region: 'Central Ontario', utility: 'Alectra Utilities', lat: 44.3894, lng: -79.6903 },
	{ slug: 'furnace-rebate-kingston', city: 'Kingston', region: 'Eastern Ontario', utility: 'Utilities Kingston', lat: 44.2312, lng: -76.4860 }
];
for (const c of CITIES) {
	const url = `/${c.slug}/`;
	const intro = `${c.city} homeowners qualify for the same Ontario furnace & HVAC rebates as the rest of the province — $1,000–$7,500 for most homes, and up to ~$22,000 for oil-heated homes. Check what you can get back in 60 seconds.`;
	const excerpt = `Furnace & HVAC rebates for ${c.city}, Ontario homeowners — $1,000–$7,500 for most homes, up to ~$22,000 for oil. Check yours in 60 seconds.`;
	let local = '';
	if (c.utility || c.muni) {
		local = `<h2>Local programs in ${esc(c.city)}</h2>\n<div class="hpro-fuelgrid">`;
		if (c.utility) local += `<div class="hpro-fuelcard"><h3>Your utility</h3><p>In ${esc(c.city)}, electricity is delivered by <strong>${esc(c.utility)}</strong>. Being on the Ontario electricity grid is part of qualifying for the Home Renovation Savings Program.</p></div>`;
		if (c.muni) local += `<div class="hpro-fuelcard"><h3>Municipal financing</h3><p>${esc(c.city)} offers ${c.muniUrl ? `<a href="${c.muniUrl}" target="_blank" rel="noopener nofollow">${esc(c.muni)} ↗</a>,` : `<strong>${esc(c.muni)}</strong>,`} which can stack with provincial and federal rebates to finance your upgrade.</p></div>`;
		local += `</div>`;
	}
	const service = { '@context': 'https://schema.org', '@type': 'Service', name: `Furnace & HVAC rebate help in ${c.city}, Ontario`, serviceType: 'Furnace & HVAC rebate concierge', provider: { '@id': BASE + '/#org' }, areaServed: { '@type': 'City', name: c.city, containedInPlace: { '@type': 'State', name: 'Ontario' } }, description: `Find and claim every Ontario furnace & HVAC rebate available to ${c.city} homeowners.` };
	if (c.lat && c.lng) service.areaServed.geo = { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng };
	addPage({
		url, title: `Furnace Rebate ${c.city}, Ontario — Up to $7,500 (or ~$22,000 Oil)`, desc: excerpt,
		schema: [service, faqPageSchema(), breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: 'Rebates Explained', url: BASE + '/rebates-explained/' }, { name: 'Furnace Rebate ' + c.city, url: BASE + url }])],
		body: expandShortcodes(`
<section class="hpro-section">
	<div class="hpro-wrap"><nav class="hpro-verified" aria-label="Breadcrumb" style="margin-bottom:.25rem"><a href="/">Home</a> › <a href="/rebates-explained/">Rebates</a> › <span>Furnace Rebate ${esc(c.city)}</span></nav></div>
	${heroHTML({ eyebrow: 'Furnace & HVAC rebates · ' + c.city, headline: 'Furnace & HVAC rebates in ' + c.city + ', Ontario.', subhead: intro, image: false })}
</section>

<section class="hpro-section"><div class="hpro-wrap" style="max-width:860px">
<h2>How much is the furnace &amp; HVAC rebate in ${esc(c.city)}?</h2>
<p>${esc(c.city)} homes get back the same provincial and federal amounts as everywhere in Ontario — what you qualify for depends mostly on how your home is heated today.</p>
[hpro_rebate_table]

${local}

<div class="hpro-content"><p>Furnace & HVAC rebates available to ${esc(c.city)} homeowners come from the same provincial and federal programs as the rest of Ontario. Use the calculator above for your exact number, or read the breakdown below.</p></div>

<h2>Which programs can ${esc(c.city)} homeowners use?</h2>
<p>The provincial <a href="/rebates/home-renovation-savings-program/">Home Renovation Savings Program</a> is the main one. Oil-heated homes can add the federal <a href="/rebates/oil-to-heat-pump-affordability/">Oil to Heat Pump Affordability</a> program, and the interest-free <a href="/rebates/canada-greener-homes-loan/">Canada Greener Homes Loan</a> stacks on top. See <a href="/who-qualifies/">who qualifies</a> for the full checklist.</p>

<h2>Frequently asked questions</h2>
[hpro_faq]

<p class="hpro-verified">Amounts are estimates and depend on your home and eligibility — confirm current figures on the official program site. <strong>Last verified: ${VERIFIED}.</strong></p>

<div class="hpro-cta" style="margin-top:2rem"><h2>See your ${esc(c.city)} rebate in 60 seconds.</h2><p>Free, no obligation.</p><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div>
</div></section>`)
	});
}

/* --- Blog -------------------------------------------------------------- */
const POSTS = [
	{
		slug: 'hrs-2026-update', title: 'HRS 2026 update: what Ontario homeowners need to know before the deadline',
		date: '2026-06-06', dateLabel: 'June 6, 2026', category: 'Program Updates',
		excerpt: 'The Home Renovation Savings Program is confirmed through November 2026 but can close earlier, and contractor registration closes May 31, 2026.',
		content: `
<p>The Home Renovation Savings Program (HRS) remains Ontario’s main furnace & HVAC rebate in 2026, worth up to $7,500 for most homes and up to $12,000 for geothermal. A few timing notes matter right now:</p>
<ul>
<li><strong>Confirmed through November 2026</strong> — but the program terms allow it to close earlier at any time.</li>
<li><strong>Contractor registration closes May 31, 2026</strong> — you need a registered contractor to submit your application.</li>
<li><strong>No energy audit</strong> is required for a heat pump installed on its own.</li>
</ul>
<p>If you’ve been thinking about a furnace, AC or heat pump upgrade, it’s worth not waiting. <a href="/rebate-calculator/">Check your rebate</a> to see your number, or read the full <a href="/rebates-explained/">programs breakdown</a>.</p>
<p class="hpro-verified">Last verified: June 2026.</p>`
	}
];
// Blog index
const cards = POSTS.map((p) => `<article class="hpro-postcard"><div class="hpro-postcard__body">
<h2 class="hpro-postcard__title"><a href="/${p.slug}/">${esc(p.title)}</a></h2>
<p class="hpro-postcard__excerpt">${esc(p.excerpt)}</p>
<a class="hpro-readmore" href="/${p.slug}/">Read more →</a>
</div></article>`).join('\n');
addPage({
	url: '/blog/', title: 'Blog — Ontario Furnace & HVAC Rebate Updates',
	desc: 'Program updates, deadlines, and how-to guides for Ontario furnace & HVAC rebates.',
	schema: [breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: 'Blog', url: BASE + '/blog/' }])],
	body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:1000px">
<h1>Blog</h1>
<p>Program updates, deadlines, and how-to guides for Ontario furnace & HVAC rebates.</p>
<div class="hpro-postgrid">
${cards}
</div>
</div></section>
<section class="hpro-section"><div class="hpro-wrap"><div class="hpro-cta"><h2>Find your rebate in 60 seconds.</h2><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div></div></section>`
});
// Single posts
for (const p of POSTS) {
	addPage({
		url: `/${p.slug}/`, title: `${p.title} — Ontario Furnace Rebates`, desc: p.excerpt,
		schema: [
			{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, datePublished: p.date, dateModified: p.date, description: p.excerpt, author: { '@id': BASE + '/#org' }, publisher: { '@id': BASE + '/#org' }, mainEntityOfPage: BASE + `/${p.slug}/` },
			breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: 'Blog', url: BASE + '/blog/' }, { name: p.title, url: BASE + `/${p.slug}/` }])
		],
		body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:760px">
<nav class="hpro-verified" aria-label="Breadcrumb" style="margin-bottom:1rem"><a href="/">Home</a> › <a href="/blog/">Blog</a> › <span>${esc(p.title)}</span></nav>
<p class="hpro-verified" style="margin-bottom:.5rem">${p.category} · ${p.dateLabel}</p>
<h1>${esc(p.title)}</h1>
<div class="hpro-prose">${p.content}</div>
<div class="hpro-cta" style="margin-top:2.5rem"><h2>See your rebate in 60 seconds.</h2><p><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></p></div>
</div></section>`
	});
}

/* --- 404 --------------------------------------------------------------- */
const notFound = layout({
	url: '/404.html', title: 'Page not found — Ontario Furnace Rebates', desc: 'The page you’re looking for can’t be found.', noindex: true,
	body: `
<section class="hpro-section"><div class="hpro-wrap" style="max-width:680px;text-align:center">
<h1>Page not found</h1>
<p>The page you’re looking for doesn’t exist or has moved. Let’s get you back on track.</p>
<p style="margin-top:1.25rem"><a class="hpro-btn" href="/">Go to the homepage</a></p>
<p style="margin-top:1rem"><a href="/rebate-calculator/">Check my rebate</a> · <a href="/rebates-explained/">Rebates explained</a> · <a href="/faq/">FAQ</a></p>
</div></section>`
});

/* ===================================================================== WRITE */
let count = 0;
mkdirSync(DOCS + '/assets/img', { recursive: true });
for (const f of ['hero.webp', 'logo-mark.svg', 'logo-horizontal.svg', 'logo-stacked.svg']) {
	copyFileSync(ROOT + '/assets/img/' + f, DOCS + '/assets/img/' + f);
}
for (const p of pages) { write(p.url, layout(p)); count++; }
writeFileSync(DOCS + '/404.html', notFound);

// sitemap.xml
const urls = sitemap.map((u) => `	<url><loc>${u}</loc><lastmod>${LASTMOD}</lastmod></url>`).join('\n');
writeFileSync(DOCS + '/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
// robots.txt
writeFileSync(DOCS + '/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`);
// llms.txt — concise site map for answer engines.
writeFileSync(DOCS + '/llms.txt', `# ${BRAND}

> ${ENTITY_DESCRIPTION}

${BRAND} helps Ontario homeowners understand furnace, AC and heat pump rebate amounts, eligibility, deadlines, and application steps before connecting them with a registered contractor.

## Key Pages

- [Homepage](${BASE}/): Estimate your Ontario furnace & HVAC rebate and learn how ${BRAND} helps homeowners claim available funding.
- [How It Works](${BASE}/how-it-works/): The three-step process for checking eligibility, matching with a registered contractor, and getting paid.
- [Who Qualifies](${BASE}/who-qualifies/): Eligibility requirements by home, fuel type, equipment, and contractor submission rules.
- [Rebates Explained](${BASE}/rebates-explained/): Overview of Ontario furnace & HVAC rebate programs and how they can stack.
- [Rebate Calculator](${BASE}/rebate-calculator/): Free 60-second estimate for Ontario homeowners.
- [FAQ](${BASE}/faq/): Direct answers about rebate amounts, audits, deadlines, payments, and oil-heated homes.
`);
// CNAME (GitHub Pages custom domain) + Jekyll opt-out
writeFileSync(DOCS + '/CNAME', 'ontariofurnacerebates.ca\n');
writeFileSync(DOCS + '/.nojekyll', '');

console.log(`Built ${count} pages + 404 + sitemap (${sitemap.length} urls) + robots + CNAME → docs/`);
