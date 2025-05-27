import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

const requestHandler = (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, digitransit-subscription-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let requestBody = '';
    req.on('data', (chunk) => {
      requestBody += chunk.toString();
    });

    req.on('end', async () => {
      let targetUrl = '';
      let contentType = 'application/json'; // Возвращаем по умолчанию application/json

      if (parsedUrl.pathname === '/api/schedule') {
        targetUrl = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
      } else if (parsedUrl.pathname === '/api/plan') {
        targetUrl = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      console.log(`Proxying POST request to ${targetUrl} with Content-Type: ${contentType}`);

      const backendUrl = new URL(targetUrl);
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'digitransit-subscription-key': API_KEY,
        },
      };

      const proxyReq = https.request(backendUrl, requestOptions, (proxyRes) => {
        console.log(`Response status from HSL API: ${proxyRes.statusCode}`);
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (e) => {
        console.error('Proxy request error:', e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + e.message);
      });

      proxyReq.write(requestBody);
      proxyReq.end();
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
};

const server = http.createServer(requestHandler);

server.listen(PORT, 'localhost', () => {
  console.log(`Proxy server running at http://localhost:${PORT}/`);
});