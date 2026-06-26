// lib/zoho-url.js
// Genera i link diretti ai record Zoho CRM

const ORG_ID = process.env.ZOHO_ORG_ID;
const BASE = `https://crm.zoho.eu/crm/org${ORG_ID}/tab`;

const contactUrl = (id) => `${BASE}/Contacts/${id}`;
const dealUrl    = (id) => `${BASE}/Potentials/${id}`;
const leadUrl    = (id) => `${BASE}/Leads/${id}`;

module.exports = { contactUrl, dealUrl, leadUrl };
