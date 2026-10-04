/** Static generator. Editorial page content lives in tools/content.mjs.
 * Runtime calculator caps live in docs/assets/js/hpro-config.js.
 * Rebuild with node tools/build.mjs after editing either source.
 */
import { copyFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { buildContent } from './content.mjs';

const DOCS = fileURLToPath(new URL('../docs', import.meta.url));
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASE = 'https://ontariofurnacerebates.ca';
const VERIFIED = 'October 4, 2026';
const YEAR = 2026;
const LASTMOD = '2026-10-04';
const BRAND = 'Ontario Furnace Rebates';
const ENTITY_DESCRIPTION = 'Ontario Furnace Rebates is an independent information and inquiry website for Ontario homeowners planning furnace and hybrid quote review.';

/* ------------------------------------------------------------------ helpers */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Wrap $-figures (and ranges) in <span class="dollar"> | mirrors hpro_accent_dollars(). */
const accentDollars = (t) => t.replace(/\$\d(?:[\d,]*\d)?(?:\s?[--]\s?\$?\d(?:[\d,]*\d)?)?/gu, (m) => `<span class="dollar">${m}</span>`);

const ICONS = {
	shield: '<path d="M12 3.5 19 6v5.2c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6z"/><path d="m9.2 12 1.9 1.9L15 10.2"/>',
	check: '<path d="m5 12.5 4.2 4.2L19 7"/>',
	spark: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>',
	leaf: '<path d="M5 19c0-7 5-12 14-13 0 9-5 14-12 14-1 0-2-.3-2-1z"/><path d="M9 15c2.5-3 4.5-4.5 7.5-5.5"/>'
};
const icon = (name, s = 16, w = 1.9) =>
	`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;

const CONTACT_FORM = `<form id="hpro-contact-form" class="hpro-contact" novalidate>
	<div class="hpro-field"><label for="cf-name">First name</label><input id="cf-name" name="name" autocomplete="given-name" required></div>
	<div class="hpro-row2">
		<div class="hpro-field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email"></div>
		<div class="hpro-field"><label for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" autocomplete="tel"></div>
	</div>
	<div class="hpro-field"><label for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="4"></textarea></div>
	<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Company website<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label></div>
	<label class="hpro-consent"><input type="checkbox" name="consent"> <span>I agree to be contacted about my rebate estimate. Your inquiry may be shared with a relevant provider for follow-up.</span></label>
	<p class="err" hidden></p>
	<button class="hpro-btn" type="submit">Send message</button>
</form>`;

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
		<p class="hpro-footer-compliance">Ontario Furnace Rebates is an independent service that helps homeowners assess furnace quotes and heat pump options. We are not affiliated with the Government of Ontario, Save on Energy, Enbridge, or Natural Resources Canada. Rebate amounts shown are estimates and depend on your home and eligibility. &copy; ${YEAR} Ontario Furnace Rebates.</p>
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
	<meta property="og:image" content="${BASE}/assets/img/hero.webp" />
	<meta property="og:image:alt" content="Ontario Furnace Rebates | furnace and HVAC rebate help for Ontario homeowners" />
	<meta property="og:locale" content="en_CA" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="${esc(page.title)}" />
	<meta name="twitter:description" content="${esc(page.desc || '')}" />
	<meta name="twitter:image" content="${BASE}/assets/img/hero.webp" />
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

/* ========================================================== EDITORIAL PAGES */
// Each site has a different purpose and authored content in content.mjs.
const pages = buildContent({ brand: BRAND, contactForm: CONTACT_FORM });
for (const p of pages) {
 p.schema = [
  p.url === '/' ? websiteSchema() : breadcrumb([{ name: 'Home', url: BASE + '/' }, { name: p.title.split(' | ')[0], url: BASE + p.url }]),
  ...(p.url === '/about/' ? [{ '@context': 'https://schema.org', '@type': 'AboutPage', name: p.title, url: BASE + p.url, mainEntity: { '@id': BASE + '/#org' } }] : []),
  ...(p.url === '/hrs-2026-update/' ? [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, datePublished: '2026-06-06', dateModified: LASTMOD, author: { '@id': BASE + '/#org' }, publisher: { '@id': BASE + '/#org' }, mainEntityOfPage: BASE + p.url }] : []),
 ];
}
// The common privacy notice remains accessible without competing in search.
for (const page of pages) if (page.url === '/privacy-policy/') page.noindex = true;
const sitemap = pages.filter(p=>!p.noindex).map(p=>BASE+p.url);

/* --- 404 --------------------------------------------------------------- */
const notFound = layout({
	url: '/404.html', title: 'Page not found | Ontario Furnace Rebates', desc: 'The page you’re looking for can’t be found.', noindex: true,
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
// llms.txt reflects the same current guidance as the generated pages.
writeFileSync(DOCS + '/llms.txt', `# ${BRAND}

> ${ENTITY_DESCRIPTION}

${pages.filter(p=>!p.noindex).map(p=>`- [${p.title}](${BASE}${p.url}): ${p.desc}`).join('\n')}
`);
// CNAME (GitHub Pages custom domain) + Jekyll opt-out
writeFileSync(DOCS + '/CNAME', 'ontariofurnacerebates.ca\n');
writeFileSync(DOCS + '/.nojekyll', '');

console.log(`Built ${count} pages + 404 + sitemap (${sitemap.length} urls) + robots + CNAME → docs/`);
