export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, digitransit-subscription-key');
  
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
  
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }
  
    const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';
    const targetUrl = 'https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql'; 
  
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'digitransit-subscription-key': API_KEY,
        },
        body: JSON.stringify(req.body),
      });
  
      const body = await response.text();
      res.status(response.status).send(body);
    } catch (err) {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error: ' + err.message);
    }
  }
  