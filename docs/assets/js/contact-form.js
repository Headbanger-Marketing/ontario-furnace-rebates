/**
 * Contact form handler (static).
 *
 * Replaces the WordPress Fluent Form on /contact/. Posts the same lead shape as
 * the calculator directly to the n8n webhook (window.HPRO_CALC.leadUrl), then
 * sends the visitor to /thank-you/. CORS-simple request so it lands without
 * server-side CORS config.
 */
(function () {
	'use strict';
	var form = document.getElementById('hpro-contact-form');
	if (!form || typeof window.HPRO_CALC === 'undefined') return;
	var CFG = window.HPRO_CALC;
	var btn = form.querySelector('button[type=submit]');
	var err = form.querySelector('.err');

	function utms() {
		var q = new URLSearchParams(location.search), o = {};
		['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) { o['utm_' + k] = q.get('utm_' + k) || ''; });
		return o;
	}
	function gfDate() { var d = new Date(); function p(n) { return (n < 10 ? '0' : '') + n; } return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()); }

	form.addEventListener('submit', function (e) {
		e.preventDefault();
		var f = {
			name: form.querySelector('[name=name]'),
			email: form.querySelector('[name=email]'),
			phone: form.querySelector('[name=phone]'),
			message: form.querySelector('[name=message]'),
			consent: form.querySelector('[name=consent]')
		};
		var emailOk = /\S+@\S+\.\S+/.test(f.email.value);
		var phoneOk = f.phone.value.replace(/\D/g, '').length >= 10;
		if (!f.name.value.trim() || (!emailOk && !phoneOk) || !f.consent.checked) {
			err.textContent = 'Please add your name, an email or phone, and check the consent box.';
			err.hidden = false; return;
		}
		// Honeypot.
		if (form.querySelector('[name=company_website]').value) { location.href = '/thank-you/'; return; }

		err.hidden = true; if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

		var msg = f.message.value.trim();
		var u = utms(), camp = [];
		['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { if (u[k]) camp.push(k + '=' + u[k]); });
		if (camp.length) msg += '\n\n— Campaign: ' + camp.join(' ');

		// Gravity Forms-style body: the shared n8n "hvac-sites" webhook reads these
		// exact field-ID keys (1.3 name, 2 email, 3 message, 4 phone, source_url,
		// date_created). Contact form has no address, so 5.x stay blank. CORS-simple
		// urlencoded request so it lands without server-side CORS config.
		var params = new URLSearchParams();
		params.set('1.3', f.name.value.trim());
		params.set('2', f.email.value.trim());
		params.set('3', msg);
		params.set('4', f.phone.value.trim());
		params.set('5.1', '');
		params.set('5.3', '');
		params.set('5.5', '');
		params.set('source_url', location.href);
		params.set('date_created', gfDate());

		fetch(CFG.leadUrl, { method: 'POST', mode: 'no-cors', body: params }).then(function () {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push({ event: 'lead_submit', lead_priority: 'standard', source_form: 'contact' });
			location.href = '/thank-you/';
		}).catch(function () {
			if (btn) { btn.disabled = false; btn.textContent = 'Send message'; }
			err.textContent = 'Something went wrong — please try again in a moment.';
			err.hidden = false;
		});
	});
})();
