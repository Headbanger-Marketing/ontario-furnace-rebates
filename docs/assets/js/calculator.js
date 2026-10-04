/** Heat pump program-cap checker and inquiry form.
 * Numeric caps come from hpro-config.js. Qualifying capacity and eligibility
 * require review. Inquiry success requires an accepted HTTP CORS response.
 */
(function () {
	'use strict';
	if (typeof window.HPRO_CALC === 'undefined') return;
	var CFG = window.HPRO_CALC;
	var RULES = CFG.rules || {};

	/* ---------------------------------------------------------------- icons */
	function ic(paths, s, w) {
		s = s || 24; w = w || 1.9;
		return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
			'stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
	}
	var I = {
		flame: function (s) { return ic('<path d="M12 3c2.5 3.2 4.5 5.4 4.5 8.4A4.5 4.5 0 0 1 12 16a4.5 4.5 0 0 1-4.5-4.6c0-1.6.8-2.8 1.9-4.1.4 2.2 2.6 1.8 2.6-.5 0-1.7-1-2.6 0-3.8z"/>', s); },
		bolt: function (s) { return ic('<path d="M13 3 5 13h5l-1 8 8-10h-5l1-8z"/>', s); },
		droplet: function (s) { return ic('<path d="M12 3.5c3 3.6 5.5 6.3 5.5 9.5A5.5 5.5 0 0 1 12 18.5 5.5 5.5 0 0 1 6.5 13c0-3.2 2.5-5.9 5.5-9.5z"/>', s); },
		flameSmall: function (s) { return ic('<path d="M12 6c1.8 2.2 3.2 3.8 3.2 5.9A3.2 3.2 0 0 1 12 15a3.2 3.2 0 0 1-3.2-3.1c0-1.1.5-2 1.3-2.9.3 1.5 1.9 1.3 1.9-.4 0-1.2-.7-1.8 0-2.6z"/><path d="M12 15v4"/>', s); },
		log: function (s) { return ic('<ellipse cx="6.5" cy="12" rx="2.2" ry="4"/><path d="M6.5 8h11M6.5 16h11"/><ellipse cx="17.5" cy="12" rx="2.2" ry="4"/><path d="M17.5 10.5v3"/>', s); },
		help: function (s) { return ic('<circle cx="12" cy="12" r="8.2"/><path d="M9.6 9.4a2.4 2.4 0 0 1 4.6.9c0 1.6-2.2 1.9-2.2 3.3"/><path d="M12 17.2v.01"/>', s); },
		homeOwn: function (s) { return ic('<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19h12v-8.5"/><path d="M10 19v-4.2h4V19"/>', s); },
		rent: function (s) { return ic('<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19h12v-8.5"/><path d="M9.2 14.4h5.6"/>', s); },
		air: function (s) { return ic('<rect x="3.5" y="6.5" width="17" height="7" rx="2"/><path d="M6.5 9.4h11"/><path d="M7.5 17c1.2 0 1.2 1.5 2.4 1.5M11.5 17c1.2 0 1.2 1.5 2.4 1.5M15.5 17c1 0 1 1.2 2 1.4"/>', s); },
		geo: function (s) { return ic('<path d="M12 3v3.5"/><path d="M5 8.5 12 6.5l7 2"/><path d="M5 8.5v4c0 4 3.3 7 7 8.5 3.7-1.5 7-4.5 7-8.5v-4"/><path d="M9.5 12.5h5M12 10v5"/>', s); },
		check: function (s, w) { return ic('<path d="m5 12.5 4.2 4.2L19 7"/>', s, w || 2.4); },
		shield: function (s) { return ic('<path d="M12 3.5 19 6v5.2c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6z"/><path d="m9.2 12 1.9 1.9L15 10.2"/>', s); },
		spark: function (s) { return ic('<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5"/>', s); },
		lock: function (s) { return ic('<rect x="5.5" y="10.5" width="13" height="9" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>', s); },
		clock: function (s) { return ic('<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 1.8"/>', s); },
		arrow: function (s) { return ic('<path d="M5 12h13M13 6l6 6-6 6"/>', s); },
		arrowL: function (s) { return ic('<path d="M19 12H6M11 6l-6 6 6 6"/>', s); },
		noSell: function (s) { return ic('<circle cx="12" cy="12" r="8.2"/><path d="M6.2 6.2 17.8 17.8"/>', s); },
		leaf: function (s) { return ic('<path d="M5 19c0-7 5-12 14-13 0 9-5 14-12 14-1 0-2-.3-2-1z"/><path d="M9 15c2.5-3 4.5-4.5 7.5-5.5"/>', s); }
	};

	/* ---------------------------------------------------------------- data */
	var HEAT = [
		{ id: 'natural-gas', label: 'Natural gas', sub: 'Furnace / boiler', icon: 'flame' },
		{ id: 'electric', label: 'Electric resistance', sub: 'Baseboard / electric furnace', icon: 'bolt' },
		{ id: 'oil', label: 'Oil', sub: 'Check Ontario support', icon: 'droplet' },
		{ id: 'propane', label: 'Propane', sub: 'Tank / boiler', icon: 'flameSmall' },
		{ id: 'wood', label: 'Wood', sub: 'Stove / fireplace', icon: 'log' },
		{ id: 'not-sure', label: 'Not sure', sub: "We'll help you check", icon: 'help' }
	];
	var OWN = [
		{ id: 'yes', label: 'Yes, I own my home', sub: 'Ownership is one eligibility condition', icon: 'homeOwn' },
		{ id: 'no', label: 'No, I rent', sub: "We'll point you the right way", icon: 'rent' }
	];
	var SYS = [
		{ id: 'air-source', label: 'Air-source heat pump', sub: 'Most common , wall or ducted', icon: 'air' },
		{ id: 'geothermal', label: 'Geothermal', sub: 'Ground-source , highest rebate', icon: 'geo' },
		{ id: 'help', label: 'Not sure yet', sub: "We'll recommend the best fit", icon: 'help' }
	];
	var TRUST = [
		{ icon: 'shield', t: 'Independent' },
		{ icon: 'check', t: 'Free & no obligation' },
		{ icon: 'spark', t: 'HRS heat pump guidance' },
		{ icon: 'leaf', t: 'Ontario homeowners' }
	];

	function ontarioPostal(value) { return /^[KLMNP][0-9][ABCEGHJKLMNPRSTVWXYZ] ?[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/.test(String(value || '').trim().toUpperCase()); }
	function fmt(n) { return '$' + Math.round(n).toLocaleString('en-CA'); }
	function nums(text) {
		var m = String(text || '').replace(/,/g, '').match(/\d{3,6}/g) || [];
		return m.map(function (x) { return parseInt(x, 10); }).filter(Boolean);
	}
	function dl(ev, data) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({ event: ev }, data || {})); }
	function utms() {
		var q = new URLSearchParams(location.search), o = {};
		['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) { o['utm_' + k] = q.get('utm_' + k) || ''; });
		return o;
	}
	function labelOf(arr, id) { for (var i = 0; i < arr.length; i++) { if (arr[i].id === id) return arr[i].label; } return id || ''; }
	function gfDate() { var d = new Date(); function p(n) { return (n < 10 ? '0' : '') + n; } return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()); }

	/* result numbers from ACF rule text */
	function result(ans) {
  var rule = RULES[ans.heat] || RULES['not-sure'] || {};
  var geo = ans.system === 'geothermal';
  var known = ans.own === 'yes' && ans.heat !== 'not-sure' && ans.system !== 'help' && ontarioPostal(ans.postal);
  var high = known ? Number(geo ? rule.geoMax : rule.airMax) || 0 : 0;
  return { low: 0, high: high, oil: false, geo: geo, oilHigh: 0,
   qualified: known, label: rule.label || 'unknown', priority: rule.priority || 'standard' };
 }

	/* ============================================================== widget */
	function Calc(root) {
		this.root = root;
		this.root.classList.add('hpro-ui');
		this.ans = { heat: null, own: null, postal: '', system: null };
		this.step = 0; this.phase = 'q'; this.started = false; this.advancing = false;
		this.form = { name: '', email: '', phone: '' };
		this.renderQuestion();
	}

	Calc.prototype.start = function () { if (!this.started) { this.started = true; dl('quiz_start', { quiz: 'rebate_calculator' }); } };

	Calc.prototype.optHTML = function (o, list, stacked, selKey) {
		var sel = this.ans[selKey] === o.id;
		return '<button type="button" class="opt' + (stacked ? ' stk' : '') + (sel ? ' sel' : '') + '" data-id="' + o.id + '">' +
			'<span class="ic">' + I[o.icon](20) + '</span>' +
			'<span class="lbl"><b>' + o.label + '</b>' + (o.sub ? '<span>' + o.sub + '</span>' : '') + '</span>' +
			'<span class="chk">' + (sel ? I.check(14, 2.6) : '') + '</span></button>';
	};

	Calc.prototype.renderQuestion = function () {
		var TOTAL = 4, s = this.step, prog = ((s + 1) / TOTAL) * 100, body = '';

		if (s === 0) {
			body = '<div class="q fade-enter"><h2>How is your home heated now?</h2>' +
				'<p class="qhint">Your current primary heating fuel sets the published incentive category.</p>' +
				'<div class="opts cols-3">' + HEAT.map(function (o) { return this.optHTML(o, HEAT, true, 'heat'); }, this).join('') + '</div></div>';
		} else if (s === 1) {
			body = '<div class="q fade-enter"><h2>Do you own your home?</h2>' +
				'<p class="qhint">Ownership and the equipment purchase or rental terms need confirmation.</p>' +
				'<div class="opts">' + OWN.map(function (o) { return this.optHTML(o, OWN, false, 'own'); }, this).join('') + '</div></div>';
		} else if (s === 2) {
			body = '<div class="q fade-enter"><h2>What\'s your postal code?</h2>' +
				'<p class="qhint">Enter the Ontario property postal code (starting K, L, M, N or P). It confirms the province for this cap checker; it does not select local programs.</p>' +
				'<input class="field" id="hpro-postal" inputmode="text" maxlength="7" placeholder="A1A 1A1" autocomplete="postal-code" value="' + this.ans.postal + '"></div>';
		} else if (s === 3) {
			body = '<div class="q fade-enter"><h2>Air-source or geothermal?</h2>' +
				'<p class="qhint">Not sure? Pick "Not sure yet" , most homes go air-source.</p>' +
				'<div class="opts">' + SYS.map(function (o) { return this.optHTML(o, SYS, false, 'system'); }, this).join('') + '</div></div>';
		}

		var contBtn = (s === 2)
			? '<button type="button" class="btn" id="hpro-cont"' + (!ontarioPostal(this.ans.postal) ? ' disabled' : '') + '>Continue ' + I.arrow(17) + '</button>'
			: '';

		this.root.innerHTML =
			'<div class="card">' +
				'<div class="card-top"><span class="step-meta">Step <b>' + (s + 1) + '</b> of ' + TOTAL + '</span>' +
				'<span class="secure">' + I.lock(13) + ' Secure</span></div>' +
				'<div class="bar"><i style="width:' + prog + '%"></i></div>' +
				'<div class="swap">' + body + '</div>' +
				'<div class="navrow"><button type="button" class="back"' + (s === 0 ? ' disabled' : '') + '>' + I.arrowL(15) + ' Back</button>' + contBtn + '</div>' +
				'<div class="under-card">' + I.clock(13) + ' Confirm current program terms before ordering equipment.</div>' +
			'</div>';

		this.bindQuestion();
	};

	Calc.prototype.bindQuestion = function () {
		var self = this, s = this.step;

		this.root.querySelectorAll('.opt').forEach(function (btn) {
			btn.addEventListener('click', function () {
				if (self.advancing) return;
				self.start();
				var id = btn.getAttribute('data-id');
				var key = s === 0 ? 'heat' : (s === 1 ? 'own' : 'system');
				self.ans[key] = id;
				self.root.querySelectorAll('.opt').forEach(function (b) { b.classList.remove('sel'); var c = b.querySelector('.chk'); if (c) c.innerHTML = ''; });
				btn.classList.add('sel'); var chk = btn.querySelector('.chk'); if (chk) chk.innerHTML = I.check(14, 2.6);
				self.advancing = true;
				setTimeout(function () {
					self.advancing = false;
					if (s === 3) self.toCalc();
					else self.go(s + 1);
				}, 340);
			});
		});

		if (s === 2) {
			var input = this.root.querySelector('#hpro-postal');
			var cont = this.root.querySelector('#hpro-cont');
			var sync = function () {
				self.ans.postal = input.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 7);
				input.value = self.ans.postal;
				if (cont) cont.disabled = !ontarioPostal(self.ans.postal);
			};
			input.addEventListener('input', sync);
			input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && ontarioPostal(self.ans.postal)) self.go(3); });
			if (cont) cont.addEventListener('click', function () { if (ontarioPostal(self.ans.postal)) self.go(3); });
			setTimeout(function () { input.focus(); }, 60);
		}

		var back = this.root.querySelector('.back');
		if (back) back.addEventListener('click', function () { if (s > 0) self.go(s - 1); });
	};

	Calc.prototype.go = function (n) { this.step = n; this.renderQuestion(); };

	/* ---- calculating ---- */
	Calc.prototype.toCalc = function () {
		var self = this;
		if (!ontarioPostal(this.ans.postal)) { this.go(2); return; }
		this.phase = 'calc';
		var lines = ['Reviewing your answers', 'Selecting the heating category', 'Showing the published cap'];
		var C = 2 * Math.PI * 34;
		this.root.innerHTML =
			'<div class="card"><div class="calc">' +
				'<div class="ring"><svg class="r" width="84" height="84">' +
					'<circle cx="42" cy="42" r="34" fill="none" stroke="var(--bg-2)" stroke-width="7"/>' +
					'<circle id="hpro-ringfg" cx="42" cy="42" r="34" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" style="transition:stroke-dashoffset .48s ease"/>' +
				'</svg><div class="t">' + I.spark(26) + '</div></div>' +
				'<div class="lab">Calculating your estimate…</div>' +
				'<div class="sub">Organizing the details you provided.</div>' +
				'<div class="steps">' + lines.map(function (l, i) {
					return '<div class="ln" data-i="' + i + '"><span class="tick">' + I.clock(15) + '</span>' + l + '</div>';
				}).join('') + '</div>' +
			'</div></div>';

		var fg = this.root.querySelector('#hpro-ringfg');
		var lns = this.root.querySelectorAll('.ln');
		var p = 0;
		var tick = setInterval(function () {
			p++;
			var frac = Math.min(1, (p + 0.5) / 3.2);
			if (fg) fg.setAttribute('stroke-dashoffset', C * (1 - frac));
			lns.forEach(function (ln) {
				var i = +ln.getAttribute('data-i');
				if (p > i) { ln.classList.add('on'); ln.querySelector('.tick').innerHTML = I.check(15, 2.6); }
			});
			if (p >= 3) clearInterval(tick);
		}, 480);

		setTimeout(function () { self.toResult(); }, 1700);
	};

	/* ---- count-up ---- */
	function countUp(el, target, dur, fmtFn) {
		var start = Date.now();
		var id = setInterval(function () {
			var p = Math.min(1, (Date.now() - start) / dur);
			var e = 1 - Math.pow(1 - p, 3);
			el.textContent = fmtFn(target * e);
			if (p >= 1) clearInterval(id);
		}, 28);
	}

	/* ---- result + lead ---- */
	Calc.prototype.toResult = function () {
		var self = this, r = result(this.ans);
		this.phase = 'result';
		dl('quiz_complete', { quiz: 'rebate_calculator', fuel_type: this.ans.heat, system_type: this.ans.system, lead_priority: r.priority });

		var standout = r.oil ?
			'<div class="standout"><span class="ic">' + I.droplet(22) + '</span><span class="tx">' +
			'<b>Oil homes can reach <span class="big" id="hpro-oil">$0</span></b>' +
			'<span>Combined with federal oil-to-heat-pump conversion funding.</span></span></div>' : '';

		var postalTxt = this.ans.postal ? ' · ' + this.ans.postal : '';
		var geoTxt = r.geo ? ', geothermal' : '';

		this.root.innerHTML =
			'<div class="reveal">' +
				'<div class="result-card">' +
					'<span class="r-eyebrow"><span class="pulse"></span> Estimate ready' + postalTxt + '</span>' +
					'<div class="r-label">Published purchased heat pump cap</div>' +
					'<div class="r-amount">' + (r.qualified ? 'Up to <span id="hpro-hi">$0</span>' : 'Eligibility review required') + '</div>' +
					'<p class="r-reassure">Based on a <b>' + r.label.toLowerCase() + '</b>-heated' + geoTxt + ' home in Ontario. This cap assumes no existing heat pump used for space heating; replacement of one is excluded. Qualifying capacity and all other conditions require contractor review. This is a cap, not approval.</p>' +
					standout +
				'</div>' +
				'<form class="lead" novalidate>' +
					'<h3>Request a project review</h3>' +
					'<p class="sub">Share your project details for follow-up. A participating contractor must confirm eligibility.</p>' +
					'<div class="form">' +
						'<label class="flbl"><span>First name</span><input class="field lc" name="name" placeholder="Jordan" autocomplete="given-name"></label>' +
						'<div class="row2">' +
							'<label class="flbl"><span>Email</span><input class="field lc" name="email" type="email" placeholder="you@email.com" autocomplete="email"></label>' +
							'<label class="flbl"><span>Phone</span><input class="field lc" name="phone" type="tel" placeholder="(416) 555-0123" autocomplete="tel"></label>' +
						'</div>' +
						'<div style="position:absolute;left:-9999px" aria-hidden="true"><label>Company website<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label></div>' +
						'<button class="btn big full" type="submit" disabled>Request Review ' + I.arrow(18) + '</button>' +
					'</div>' +
					'<div class="reassure-row"><span class="r">' + I.check(14) + ' Free</span><span class="r">' + I.shield(14) + ' No obligation</span><span class="r">' + I.noSell(14) + ' Provider follow-up</span></div>' +
					'<p class="err" hidden></p>' +
					'<p class="consent">By submitting, you agree to be contacted about your rebate estimate. Your inquiry may be shared with a relevant provider. Program approval is separate. <a href="/privacy-policy/">Privacy</a>.</p>' +
				'</form>' +
				'<div style="text-align:center"><button type="button" class="restart">' + I.arrowL(14) + ' Start over</button></div>' +
			'</div>';


		if (r.qualified) countUp(this.root.querySelector('#hpro-hi'), r.high, 1250, fmt);
		if (r.oil) countUp(this.root.querySelector('#hpro-oil'), r.oilHigh, 1500, fmt);

		this.bindLead(r);
	};

	Calc.prototype.bindLead = function (r) {
		var self = this, form = this.root.querySelector('.lead');
		var btn = form.querySelector('button[type="submit"]');
		var err = form.querySelector('.err');
		var fields = { name: form.querySelector('[name=name]'), email: form.querySelector('[name=email]'), phone: form.querySelector('[name=phone]') };

		function valid() {
			return fields.name.value.trim() && /\S+@\S+\.\S+/.test(fields.email.value) && fields.phone.value.replace(/\D/g, '').length >= 10;
		}
		function refresh() { btn.disabled = !valid(); }
		Object.keys(fields).forEach(function (k) { fields[k].addEventListener('input', refresh); });

		this.root.querySelector('.restart').addEventListener('click', function () { self.reset(); });

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			if (!valid()) return;
			err.hidden = true; btn.disabled = true; btn.textContent = 'Sending…';

			// Honeypot , real users never fill this; silently "succeed" and drop.
			if (form.querySelector('[name=company_website]').value) { self.done(fields.name.value.trim()); return; }

			var name = fields.name.value.trim();
			var msgLines = [
				'HVAC rebate calculator lead',
				'Fuel type: ' + labelOf(HEAT, self.ans.heat),
				'Owns home: ' + labelOf(OWN, self.ans.own),
				'System interest: ' + labelOf(SYS, self.ans.system),
				'Purchased heat pump cap: ' + (r.qualified ? fmt(r.high) : 'Eligibility review required'),
				'Lead priority: ' + r.priority
			];
			var u = utms(), camp = [];
			['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { if (u[k]) camp.push(k + '=' + u[k]); });
			if (camp.length) msgLines.push('Campaign: ' + camp.join(' '));

			// Gravity Forms-style body: the shared n8n "hvac-sites" webhook reads
			// these exact field-ID keys (1.3 name, 2 email, 3 message, 4 phone,
			// 5.1/5.3/5.5 address, source_url, date_created). The calculator's extra
			// context is folded into the message (3) because the webhook ignores other
			// keys. A CORS response must confirm HTTP success before the UI shows receipt.
			var params = new URLSearchParams();
			params.set('1.3', name);
			params.set('2', fields.email.value.trim());
			params.set('3', msgLines.join('\n'));
			params.set('4', fields.phone.value.trim());
			params.set('5.1', '');
			params.set('5.3', '');
			params.set('5.5', self.ans.postal || '');
			params.set('source_url', location.href);
			params.set('date_created', gfDate());

			fetch(CFG.leadUrl, { method: 'POST', mode: 'cors', body: params }).then(function (response) {
            if (!response.ok) throw new Error('The inquiry was not accepted.');
				dl('lead_submit', { lead_priority: r.priority, fuel_type: self.ans.heat, system_type: self.ans.system });
				self.done(name);
			}).catch(function () {
				btn.disabled = false; btn.innerHTML = 'Request Review ' + I.arrow(18);
				err.textContent = 'Something went wrong , please try again in a moment.';
				err.hidden = false;
			});
		});
	};

	Calc.prototype.done = function (name) {
		var first = (name || '').split(' ')[0];
		this.root.innerHTML =
			'<div class="reveal"><div class="result-card done-card">' +
				'<div class="big-ic">' + I.check(34, 2.4) + '</div>' +
				'<h3>You\'re all set' + (first ? ', ' + first : '') + '.</h3>' +
				'<p>Your inquiry was received for review and provider follow-up. It is not a program application or funding approval.</p>' +
				'<button type="button" class="restart">' + I.arrowL(14) + ' Start over</button>' +
			'</div></div>';
		var self = this;
		this.root.querySelector('.restart').addEventListener('click', function () { self.reset(); });
	};

	Calc.prototype.reset = function () {
		this.ans = { heat: null, own: null, postal: '', system: null };
		this.step = 0; this.phase = 'q'; this.form = { name: '', email: '', phone: '' };
		this.renderQuestion();
	};

	/* expose trust chips for the hero (PHP renders the rest) */
	window.HPRO_TRUST = TRUST;
	window.HPRO_ICON = I;

	function init() {
		document.querySelectorAll('[data-hpro-calc]').forEach(function (el) {
			if (!el.__hpro) { el.__hpro = true; new Calc(el); }
		});
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
	else init();
})();
