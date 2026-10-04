// Purchased HRS heat pump caps checked against official guidance, October 4, 2026.
// Qualifying capacity, home and pre-approval must be confirmed by the participating contractor.
window.HPRO_CALC = {
  "leadUrl": "https://auto.sdagents.ai/webhook/hvac-sites",
  "source": "ontariofurnacerebates.ca",
  "verified": "2026-10-04",
  "rules": {
    "natural-gas": {
      "label": "Natural gas",
      "airMax": 2000,
      "geoMax": 3000,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    },
    "electric": {
      "label": "Electric resistance",
      "airMax": 7500,
      "geoMax": 12000,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    },
    "oil": {
      "label": "Oil",
      "airMax": 7500,
      "geoMax": 12000,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    },
    "propane": {
      "label": "Propane",
      "airMax": 7500,
      "geoMax": 12000,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    },
    "wood": {
      "label": "Wood",
      "airMax": 7500,
      "geoMax": 12000,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    },
    "not-sure": {
      "label": "Unknown heating source",
      "airMax": 0,
      "geoMax": 0,
      "priority": "standard",
      "oilBonus": false,
      "oilBonusText": ""
    }
  }
};
