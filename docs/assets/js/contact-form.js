/** Contact inquiry handler. Preserve the shared Gravity Forms field mapping.
 * An explicit stored-enquiry receipt is required before redirecting.
 * HTTP or network failure leaves entered fields in place for a retry.
 */
(function () {
	'use strict';
	var form = document.getElementById('hpro-contact-form');
	if (!form || typeof window.HPRO_CALC === 'undefined') return;
	var CFG = window.HPRO_CALC;
	var btn = form.querySelector('button[type=submit]');
	var err=form.querySelector('.err'),intake=window.HPRO_INTAKE,sending=false;
	if(!intake)return;intake.bindContact(form);if(btn)btn.disabled=false;

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
			address: form.querySelector('[name=address]'),
			city: form.querySelector('[name=city]'),
			postal: form.querySelector('[name=postal]'),
			service: form.querySelector('[name=service]'),
			message: form.querySelector('[name=message]'),
			consent: form.querySelector('[name=consent]')
		};
		if(sending||!intake.validate(form))return;
		// Honeypot.
		if(form.querySelector('[name=company_website]').value){intake.announce(form,'Your enquiry could not be confirmed.');return;}

		err.hidden=true;sending=true;if(btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

		var msg=(f.service.value?'Work to discuss: '+f.service.options[f.service.selectedIndex].text+'\n':'')+f.message.value.trim()+'\nConsent: enquiry follow-up agreed';
		var u = utms(), camp = [];
		['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { if (u[k]) camp.push(k + '=' + u[k]); });
		if (camp.length) msg += '\n\n, Campaign: ' + camp.join(' ');

		// Gravity Forms-style body: the shared n8n "hvac-sites" webhook reads these
		// exact field-ID keys (1.3 name, 2 email, 3 message, 4 phone, source_url,
		// date_created), including the restored address fields.
		var params = new URLSearchParams();
		params.set('1.3', f.name.value.trim());
		params.set('2',f.email.disabled?'':f.email.value.trim());
		params.set('3', msg);
		params.set('4',f.phone.disabled?'':f.phone.value.trim());
		params.set('5.1', f.address.value.trim());
		params.set('5.3', f.city.value.trim());
		params.set('5.5', f.postal.value.trim().toUpperCase());
		params.set('source_url', location.href);
		params.set('date_created', gfDate());

		intake.send(params).then(function () {
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push({ event: 'lead_submit', lead_priority: 'standard', source_form: 'contact' });
			location.href = '/thank-you/';
		}).catch(function () {
			sending=false;if(btn){btn.disabled=false;btn.textContent='Request My Free Quote';}
			intake.announce(form,'We could not confirm receipt. Your details are still here. The request may already have arrived; check for follow-up before sending again.');
		});
	});
})();
