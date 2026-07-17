const express = require('express');
const router = express.Router();
const { getZohoToken } = require('../lib/zoho-auth');

const ZOHO_API = 'https://www.zohoapis.eu/crm/v8';
const FIELDS = 'Subject,Call_Start_Time,Call_Duration,Call_Duration_in_seconds,Call_Type,From_Number__s,To_Number__s,Telephony_External_ID__s,Description';

// Wildix registra due leg SIP per le chiamate in ingresso:
//   SIP-<trunkName>-...  -> leg del trunk (da scartare)
//   SIP-<interno>-...    -> leg verso l'interno (da tenere)
// In uscita esiste solo la leg SIP-<interno>-.
// Teniamo quindi solo i record il cui segmento dopo "SIP-" e' numerico.
function isInternalLeg(extId) {
  if (!extId) return true; // se manca l'id, non filtriamo
  const m = /^SIP-([^-]+)-/.exec(extId);
  if (!m) return true;
  return /^\d+$/.test(m[1]);
}

function mapCall(c) {
  const outgoing = c.Call_Type === 'In uscita';
  return {
    id:        c.id,
    subject:   c.Subject,
    startTime: c.Call_Start_Time,
    duration:  c.Call_Duration,
    seconds:   c.Call_Duration_in_seconds ?? 0,
    direction: outgoing ? 'OUT' : 'IN',
    // numero del cliente: in uscita e' il chiamato, in ingresso il chiamante
    phone:     outgoing ? c.To_Number__s : c.From_Number__s,
    // interno coinvolto
    extension: outgoing ? c.From_Number__s : c.To_Number__s,
    note:      c.Description ?? null,
    extId:     c.Telephony_External_ID__s ?? null,
  };
}

// Scarica una related list di chiamate (Calls_History = chiuse, Calls = aperte)
async function fetchCallsList(module, id, relatedList, token) {
  const r = await fetch(
    `${ZOHO_API}/${module}/${id}/${relatedList}?fields=${FIELDS}&per_page=200`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  if (r.status === 204) return [];
  const data = await r.json();
  return (data?.data ?? []).filter(c => isInternalLeg(c.Telephony_External_ID__s)).map(mapCall);
}

// Chiamate chiuse (storico) - quello che mostriamo oggi
router.get('/:module/:id', async (req, res) => {
  try {
    const { module, id } = req.params;
    const token = await getZohoToken();
    const calls = await fetchCallsList(module, id, 'Calls_History', token);
    calls.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    res.json(calls);
  } catch (e) {
    console.error('[activities] errore:', e.message);
    res.json([]);
  }
});

// --- USO FUTURO ---
// Chiamate aperte / pianificate (related list "Calls").
// Sono le chiamate schedulate o ancora in corso, non lo storico.
// Endpoint gia' pronto, non ancora usato dal widget.
//
// router.get('/open/:module/:id', async (req, res) => {
//   try {
//     const { module, id } = req.params;
//     const token = await getZohoToken();
//     const calls = await fetchCallsList(module, id, 'Calls', token);
//     calls.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
//     res.json(calls);
//   } catch (e) {
//     console.error('[activities open] errore:', e.message);
//     res.json([]);
//   }
// });
//
// --- Chiamate chiuse + aperte insieme ---
// router.get('/all/:module/:id', async (req, res) => {
//   try {
//     const { module, id } = req.params;
//     const token = await getZohoToken();
//     const [closed, open] = await Promise.all([
//       fetchCallsList(module, id, 'Calls_History', token),
//       fetchCallsList(module, id, 'Calls', token),
//     ]);
//     const calls = [...closed, ...open].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
//     res.json(calls);
//   } catch (e) {
//     console.error('[activities all] errore:', e.message);
//     res.json([]);
//   }
// });

module.exports = router;
