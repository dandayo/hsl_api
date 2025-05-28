import http from 'http';
import https from 'https';
import { URL } from 'url';

// Server port
const PORT = 3001;
// Digitransit API Key
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

const requestHandler = (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  
  // Allow requests from any origin (CORS)
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
      let contentType = 'application/json';

      // Choose target API based on request path
      if (parsedUrl.pathname === '/api/schedule') {
        targetUrl = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
        contentType = 'application/graphql';
      } else if (parsedUrl.pathname === '/api/plan') {
        targetUrl = 'https://api.digitransit.fi/routing/v2/routers/hsl/index/graphql';
        contentType = 'application/json';
      }
      
      const backendUrl = new URL(targetUrl);
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'digitransit-subscription-key': API_KEY,
        },
      };

      // Forward request to Digitransit API
      const proxyReq = https.request(backendUrl, requestOptions, (proxyRes) => {
        // Send API response back to frontend
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      // Handle errors
      proxyReq.on('error', (e) => {
        console.error('Proxy request error:', e);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Proxy error: ' + e.message);
      });

      proxyReq.write(requestBody);
      proxyReq.end();
    });
  } else {
    // Method not allowed
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
};

// Create and start the server
const server = http.createServer(requestHandler);

server.listen(PORT, 'localhost', () => {
  console.log(`Proxy server running at http://localhost:${PORT}/`);
});