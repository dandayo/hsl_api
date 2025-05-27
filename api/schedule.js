console.log('api/schedule.js is being initialized.');

const API_KEY = process.env.DIGITRANSIT_API_KEY;

export default async (req, res) => {
  console.log('Received API request:', req.method, req.url);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, digitransit-subscription-key');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request.');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let targetUrl = '';
  if (req.url === '/api/schedule' || req.url === '/api/plan') {
    targetUrl = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
  } else {
    console.log('Endpoint not found:', req.url);
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  if (!API_KEY) {
    console.error('DIGITRANSIT_API_KEY is not set.');
    res.status(500).json({ error: 'Server configuration error: API key is missing.' });
    return;
  }

  try {
    console.log('Attempting to read request body.');
    let requestBody = '';
    if (req.body) {
       requestBody = JSON.stringify(req.body);
       console.log('Using pre-parsed req.body.');
    } else {
        console.log('Reading request body from stream.');
        await new Promise((resolve, reject) => {
            req.on('data', (chunk) => {
                requestBody += chunk;
            });
            req.on('end', resolve);
            req.on('error', (err) => { console.error('Error reading body stream:', err); reject(err); });
        });
        console.log('Finished reading request body stream.');
    }
    console.log('Request body read successfully.');

    console.log('Fetching data from Digitransit API:', targetUrl);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'digitransit-subscription-key': API_KEY,
      },
      body: requestBody,
    });

    console.log('Received response status from Digitransit API:', response.status);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('Parsed JSON response from Digitransit API.');
    } else {
      data = await response.text();
      console.log('Received non-JSON response from Digitransit API:', response.status, data);
      // Attempt to parse as JSON in case of malformed header
      try {
          data = JSON.parse(data);
          console.log('Successfully parsed non-JSON response as JSON.');
      } catch (e) {
          console.error('Failed to parse non-JSON response as JSON.', e);
          // If parsing fails, return the text data with an error status
           res.status(response.status || 500).json({ error: 'Received non-JSON response from external API', rawResponse: data });
           return;
      }
    }

    console.log('Sending response back to frontend.');
    res.status(response.status).json(data);

  } catch (error) {
    console.error('API request failed in serverless function:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}; 