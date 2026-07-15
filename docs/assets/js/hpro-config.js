/**
 * Ontario Furnace Rebates — runtime config for the static site.
 *
 * Replaces the WordPress wp_localize_script('HPRO_CALC') payload. The calculator
 * (assets/js/calculator.js) and the contact form (assets/js/contact-form.js)
 * read from window.HPRO_CALC.
 *
 *  - rules:   the rebate dollar copy (the verified June-2026 seed — edit here to
 *             update site-wide). The Home Renovation Savings Program covers heat
 *             pumps, furnaces, AC, insulation, windows and smart thermostats.
 *  - leadUrl: the n8n webhook leads POST to directly. Change this to your own
 *             endpoint if you move it.
 *  - source:  stamped on every lead payload.
 */
window.HPRO_CALC = {
	leadUrl: 'https://auto.sdagents.ai/webhook/hvac-sites',
	source: 'ontariofurnacerebates.ca',
	rules: {
		'natural-gas': {
			label: 'Natural gas',
			airText: 'A high-efficiency gas furnace upgrade typically returns $1,000–$2,000.',
			geoText: 'N/A for furnaces — geothermal applies to heat pumps.',
			oilBonus: false, oilBonusText: '', priority: 'moderate'
		},
		'electric': {
			label: 'Electric',
			airText: 'Electric-to-heat-pump upgrades usually return $3,000–$7,500.',
			geoText: 'Up to $12,000 with a geothermal system.',
			oilBonus: false, oilBonusText: '', priority: 'high'
		},
		'oil': {
			label: 'Oil',
			airText: 'Oil-heated homes can stack the federal OHPA top-up toward up to ~$22,000 combined.',
			geoText: 'Up to ~$22,000 combined with federal oil-conversion funding.',
			oilBonus: true,
			oilBonusText: 'Oil-heated homes qualify for the most: the provincial rebate plus federal oil-conversion funding (OHPA), which can approach $22,000 combined.',
			priority: 'premium'
		},
		'propane': {
			label: 'Propane',
			airText: 'Propane homes typically return $3,000–$7,500 toward a new heat pump or furnace.',
			geoText: 'Up to $12,000 with a geothermal system.',
			oilBonus: false, oilBonusText: '', priority: 'high'
		},
		'wood': {
			label: 'Wood',
			airText: 'Wood-heated homes typically return $3,000–$7,500 toward a new heat pump or furnace.',
			geoText: 'Up to $12,000 with a geothermal system.',
			oilBonus: false, oilBonusText: '', priority: 'high'
		},
		'not-sure': {
			label: 'Not sure',
			airText: 'Likely $1,000–$7,500 — a specialist will confirm once we know your heating type.',
			geoText: 'Up to $12,000 — to be confirmed.',
			oilBonus: false, oilBonusText: '', priority: 'standard'
		}
	}
};
