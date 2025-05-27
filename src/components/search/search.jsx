import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './search.css';

const GEOCODE_URL = 'https://api.digitransit.fi/geocoding/v1/autocomplete';
const PLAN_URL = 'http://localhost:3001/api/plan';
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

export default function Search() {
  const navigate = useNavigate();
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [fromStop, setFromStop] = useState(null);
  const [toStop, setToStop] = useState(null);
  const [message, setMessage] = useState('');
  const t1 = useRef();
  const t2 = useRef();
  const [suggestFrom, setSuggestFrom] = useState([]);
  const [suggestTo, setSuggestTo] = useState([]);

  // Request autocomplete suggestions from Digitransit
  const fetchSuggestions = async (text, setSuggestions) => {
    if (!text) return setSuggestions([]);
    try {
      const res = await fetch(`${GEOCODE_URL}?text=${encodeURIComponent(text)}&layers=stop`, {
        headers: { 'digitransit-subscription-key': API_KEY }
      });
      const json = await res.json();
      setSuggestions(json.features || []);
    } catch (e) {
      console.error('Suggest error:', e);
      setSuggestions([]);
    }
  };

  const onChangeFrom = e => {
    clearTimeout(t1.current);
    const val = e.target.value;
    setFromInput(val);
    setFromStop(null);
    t1.current = setTimeout(() => fetchSuggestions(val, setSuggestFrom), 300);
  };

  const onChangeTo = e => {
    clearTimeout(t2.current);
    const val = e.target.value;
    setToInput(val);
    setToStop(null);
    t2.current = setTimeout(() => fetchSuggestions(val, setSuggestTo), 300);
  };

  // Save selected stop from suggestions
  const selectStop = (feature, setInput, setStop, setSuggestions) => {
    setInput(feature.properties.label);
    // Store the coordinates [lon, lat] from the feature geometry
    const [lon, lat] = feature.geometry.coordinates;
    setStop({ lat, lon });
    setSuggestions([]);
  };

  // When form is submitted, call Digitransit routing API
  const handleSubmit = async e => {
    e.preventDefault();
    if (!fromStop || !toStop) {
      setMessage('Please choose both stops from the list.');
      return;
    }
    setMessage(`Searching route from ${fromInput} to ${toInput}...`);

    const query = `
      query Plan($aLat: Float!, $aLon: Float!, $bLat: Float!, $bLon: Float!) {
        plan(from: {lat: $aLat, lon: $aLon}, to: {lat: $bLat, lon: $bLon}, numItineraries: 3) {
          itineraries {
            duration
            walkDistance
            legs {
              mode
              from { 
                name 
                stop{
                  name
                  code
                }
              }
              to   { 
                name
          			stop{
                  name
                  code
                }
              }
              trip { 
                routeShortName
                tripShortName
               }
            }
          }
        }
      }
    `;
    const variables = { aLat: fromStop.lat, aLon: fromStop.lon, bLat: toStop.lat, bLon: toStop.lon };

    try {
      const res = await fetch(PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'digitransit-subscription-key': API_KEY
        },
        body: JSON.stringify({ query, variables })
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error('Invalid JSON:', text, err);
        throw new Error('Invalid response format');
      }

      if (json.errors) {
        console.error('GraphQL errors:', json.errors);
        throw new Error(json.errors.map(e => e.message).join('; '));
      }

      console.log('Routing result:', json.data);
      setMessage(JSON.stringify(json.data.plan.itineraries, null, 2));
    } catch (err) {
      console.error('Routing error:', err);
      setMessage(`Routing error: ${err.message}`);
    }
  };

  return (
    <div className="searchMain">
      <button onClick={() => navigate(-1)} className="back-button">←</button>
      <h2>Plan your route</h2>
      <form onSubmit={handleSubmit}>
        <input value={fromInput} onChange={onChangeFrom} placeholder="From stop" />
        {suggestFrom.length > 0 && (
          <ul className="suggestions">
            {suggestFrom.map(f => (
              <li key={f.properties.id} onClick={() => selectStop(f, setFromInput, setFromStop, setSuggestFrom)}>
                {f.properties.label}
              </li>
            ))}
          </ul>
        )}

        <input value={toInput} onChange={onChangeTo} placeholder="To stop" />
        {suggestTo.length > 0 && (
          <ul className="suggestions">
            {suggestTo.map(f => (
              <li key={f.properties.id} onClick={() => selectStop(f, setToInput, setToStop, setSuggestTo)}>
                {f.properties.label}
              </li>
            ))}
          </ul>
        )}

        <button type="submit">Go</button>
      </form>
      {message && <pre className="message">{message}</pre>}
    </div>
  );
}
