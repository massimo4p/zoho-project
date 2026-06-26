// lib/zoho-auth.js
// Gestisce il token OAuth Zoho con refresh automatico e cache in memoria

let tokenCache = { token: null, expiresAt: 0 };

async function getZohoToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });

  const r = await fetch('https://accounts.zoho.eu/oauth/v2/token', {
    method: 'POST',
    body: params,
  });

  if (!r.ok) {
    throw new Error(`Zoho OAuth error: ${r.status} ${await r.text()}`);
  }

  const data = await r.json();
  console.log('[zoho-auth] risposta:', JSON.stringify(data));

  if (!data.access_token) {
    throw new Error(`Token non ricevuto: ${JSON.stringify(data)}`);
  }

  tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  console.log('[zoho-auth] token aggiornato');
  return tokenCache.token;
}

module.exports = { getZohoToken };
