// Restore the original landing-page hierarchy around the reviewed program content.
// Keep the calculator and contact handlers unchanged; these are real interactive forms.
const HRS='https://www.homerenovationsavings.ca/without-assessment/heat-pumps';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const CALC='<div id="rebate-checker" class="hpro-calc-mount" data-hpro-calc></div>';
const CHECKED='<p class="hpro-verified">Program sources checked October 4, 2026. Confirm current terms with the program administrator before ordering equipment.</p>';
const CITIES=[['toronto','Toronto'],['ottawa','Ottawa'],['mississauga','Mississauga'],['hamilton','Hamilton'],['london','London'],['brampton','Brampton'],['kitchener-waterloo','Kitchener-Waterloo'],['windsor','Windsor'],['barrie','Barrie'],['kingston','Kingston']];
const DATA={
 heat:{
  headline:'Heat pump rebates in Ontario.',
  intro:'Find the published rebate cap for your home, then take the next step with a project review.',
  cityPrefix:'heat-pump-rebate-',
  cityHeadline:city=>`Heat pump rebates in ${city}.`,
  cityIntro:city=>`Check your heating category, then explore equipment and installation planning for your ${city} home.`,
  checkerHeadline:'Check your heat pump rebate.',
  checkerIntro:'Answer four questions to see the purchased heat pump cap for your heating source. No contact details needed to check.',
  steps:[['Check your cap','Start with your current heating source, ownership and Ontario postal code.'],['Request a project review','Share your plans for provider follow-up when you are ready. The inquiry is free and optional.'],['Get approval before installation','A participating HRS contractor confirms the equipment and obtains pre-installation approval.']],
  faqs:[['Can I keep my gas furnace?','A compatible furnace can remain as backup, subject to the equipment and control requirements. The rebate applies to the qualifying heat pump, not the backup furnace.'],['Does the checker approve my rebate?','No. It shows a published purchased-system cap. Home eligibility, equipment and rated capacity still need review by a participating contractor.'],['Can I replace an existing heat pump?','HRS excludes replacing an existing heat pump used for space heating. Check the equipment already in your home before budgeting a rebate.'],['What if I heat with oil?','Check Ontario affordability support before arranging a private purchase. Eligible households may use a separate direct-install route; its project value is not a cash rebate.']],
  ctaHeading:'Start with your heating source.',
  ctaText:'Check the published cap now. Request a project review when you are ready.',
  guideCta:'Ready to plan your heat pump?',
  guideText:'Use your existing heating source to check the cap, then discuss the complete project with a participating contractor.'
 },
 furnace:{
  headline:'Replacing your furnace?',
  intro:'Compare furnace and heat pump options, then check the heat pump funding that could fit your Ontario home.',
  cityPrefix:'furnace-rebate-',
  cityHeadline:city=>`Replacing a furnace in ${city}?`,
  cityIntro:city=>`Compare repair, replacement and heat pump options for your ${city} home before committing to a quote.`,
  checkerHeadline:'Check heat pump funding.',
  checkerIntro:'See the heat pump cap for your existing heating source. A furnace-only replacement does not qualify for this HRS rebate.',
  steps:[['Check the equipment you have','Identify the primary heater and whether a heat pump is already used for space heating.'],['Compare complete quotes','Keep furnace equipment, heat pump equipment, installation and any rebate on separate lines.'],['Verify the funding first','A qualifying heat pump needs HRS pre-approval. Review scope and gross cost before installation begins.']],
  faqs:[['Does HRS rebate a new gas furnace?','A standalone gas furnace or cooling-only air conditioner is not an eligible HRS heat pump measure. A backup furnace does not earn a separate heat pump rebate.'],['Can I add a heat pump to my furnace?','A compatible furnace can work as backup in a qualifying system. Ask for the complete equipment combination and control plan before comparing costs.'],['Is the cap a discount on my quote?','No. It is a program maximum, not a confirmed payment or net installed price. The equipment, capacity and approval determine the final rebate.'],['What if the quote mentions a federal loan?','New Canada Greener Homes Loan applications closed October 1, 2025. Ask for a current financing option and compare the total repayment cost.']],
  ctaHeading:'Know your options before you buy.',
  ctaText:'Check heat pump funding, then ask about the furnace or hybrid project you are considering.',
  guideCta:'Comparing furnace and heat pump options?',
  guideText:'Check the heat pump cap separately from the furnace price. An itemized quote makes the decision clearer.'
 }
};
function hero(headline,intro){
 return `<section class="hpro-section landing-hero"><div class="hpro-wrap"><div class="hpro-ui"><div class="hero hpro-hero-visual">
 <div class="hero-copy"><h1 class="headline">${esc(headline)}</h1><p class="subhead">${esc(intro)}</p><a class="hpro-btn hero-action" href="#rebate-checker">Check My Rebate <span aria-hidden="true">↗</span></a></div>
 <div class="hero-checker">${CALC}</div></div></div></div></section>`;
}
function reassurance(){
 return '<div class="landing-reassurance"><div class="hpro-wrap"><ul><li>Free cap check</li><li>No obligation</li><li>Independent guidance</li></ul></div></div>';
}
function steps(data,kind){
 return `<section class="hpro-section landing-process"><div class="hpro-wrap"><h2>${kind==='heat'?'A clear path to your upgrade.':'Make the right heating decision.'}</h2><div class="landing-steps">${data.steps.map(([heading,body])=>`<div><h3>${heading}</h3><p>${body}</p></div>`).join('')}</div><a class="landing-text-link" href="/how-it-works/">See how it works <span aria-hidden="true">→</span></a></div></section>`;
}
function amounts(){
 return `<section class="hpro-section landing-rates"><div class="hpro-wrap landing-rates-grid"><div><h2>See what your home could get.</h2><p>Your existing heating source sets the HRS category. Equipment, capacity and approval determine the final amount.</p><a class="landing-text-link" href="/rebates/home-renovation-savings-program/">Explore the heat pump rates <span aria-hidden="true">→</span></a></div>
 <div class="landing-rate-list"><div class="landing-rate"><h3>Enbridge natural gas</h3><div><p><strong>Up to $2,000</strong><span>Purchased air-source heat pump</span></p><p><strong>$3,000</strong><span>Purchased ground-source heat pump</span></p></div></div>
 <div class="landing-rate"><h3>Electric resistance, oil, propane or wood</h3><div><p><strong>Up to $7,500</strong><span>Purchased air-source heat pump</span></p><p><strong>Up to $12,000</strong><span>Purchased ground-source heat pump</span></p></div></div>
 <p class="landing-rate-note">Non-gas homes must be on the Ontario grid. Rentals have separate rates. <a href="${HRS}">Official HRS rates</a>.</p></div></div></section>`;
}
function furnaceChoices(){
 return `<section class="hpro-section landing-choices"><div class="hpro-wrap landing-choice-grid"><div><h2>One home. Different ways forward.</h2><p>A repair, a new furnace and a heat pump project solve different problems. Start with the work your home needs.</p><a class="landing-text-link" href="/who-qualifies/">See which projects can qualify <span aria-hidden="true">→</span></a></div><div class="landing-choice-list">
 <div><h3>Repair your current furnace</h3><p>Use the diagnosis and equipment condition to decide whether a repair makes sense.</p></div>
 <div><h3>Replace the furnace on its own</h3><p>Compare the full installed price. HRS does not rebate a standalone gas furnace or cooling-only AC.</p></div>
 <div><h3>Explore a heat pump or hybrid</h3><p>A qualifying heat pump may receive HRS funding. Compatible backup heating does not earn a separate rebate.</p></div></div></div></section>`;
}
function faq(data){
 return `<section class="hpro-section landing-faq"><div class="hpro-wrap landing-faq-grid"><div><h2>Good questions. Clear answers.</h2><p>Understand the important details before you take the next step.</p><a class="landing-text-link" href="/faq/">View all questions <span aria-hidden="true">→</span></a></div><div class="hpro-faq">${data.faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>`;
}
function cityLinks(data){
 return `<section class="hpro-section landing-cities"><div class="hpro-wrap"><h2>${data.cityPrefix==='heat-pump-rebate-'?'Plan a heat pump project near you.':'Find guidance for your Ontario home.'}</h2><div class="landing-city-links">${CITIES.map(([slug,city])=>`<a href="/${data.cityPrefix}${slug}/">${city}<span aria-hidden="true">↗</span></a>`).join('')}</div></div></section>`;
}
function finalCta(data,anchor=false){
 return `<section class="hpro-section landing-final"><div class="hpro-wrap"><div class="landing-cta"><div><h2>${data.ctaHeading}</h2><p>${data.ctaText}</p></div><a class="hpro-btn" href="${anchor?'#rebate-checker':'/rebate-calculator/'}">Check My Rebate <span aria-hidden="true">→</span></a></div>${CHECKED}</div></section>`;
}
function guideCta(data){
 return `<aside class="landing-guide-cta"><div><h2>${data.guideCta}</h2><p>${data.guideText}</p></div><a class="hpro-btn" href="/rebate-calculator/">Check My Rebate</a></aside>`;
}
export function applyLandingDesign(page,{kind}){
 const data=DATA[kind];
 if(page.url==='/'){
  page.bodyClass='landing-page';
  page.body=hero(data.headline,data.intro)+reassurance()+(kind==='heat'?amounts():furnaceChoices())+steps(data,kind)+faq(data)+cityLinks(data)+finalCta(data,true);
 }else if(page.url==='/rebate-calculator/'){
  page.bodyClass='landing-page checker-page';
  const detail=page.body.replace(/<h1>[^]*?<\/h1>/,'').replace(/<div class="hpro-calc-mount" data-hpro-calc><\/div>/,'');
  page.body=hero(data.checkerHeadline,data.checkerIntro)+reassurance()+`<div class="landing-checker-details">${detail}</div>`;
 }else if(page.url.startsWith('/'+data.cityPrefix)){
  const slug=page.url.slice(data.cityPrefix.length+1).replace(/\/$/,'');
  const city=CITIES.find(([id])=>id===slug)?.[1];
  if(!city)throw new Error('Unknown city landing '+page.url);
  page.bodyClass='landing-page city-landing';
  const detail=page.body.replace(/<h1>([^]*?)<\/h1>/,'<h2>$1</h2>');
  page.body=hero(data.cityHeadline(city),data.cityIntro(city))+reassurance()+`<div class="landing-city-details">${detail}</div>`+finalCta(data,true);
 }else if(!['/contact/','/privacy-policy/','/terms/','/thank-you/','/blog/','/hrs-2026-update/'].includes(page.url)){
  // Preserve all reviewed guide copy and add the conversion path it lost.
  page.body=page.body.replace(/<\/div><\/section>$/,guideCta(data)+'</div></section>');
 }
 return page;
}
