import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './search.css';

const GEOCODE_URL = 'https://api.digitransit.fi/geocoding/v1/autocomplete';
const PLAN_URL = 'https://cors-anywhere.herokuapp.com/https://api.digitransit.fi/routing/v1/routers/hsl/index/graphql';
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

export default function Search() {
  const navigate = useNavigate();
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [fromStop, setFromStop] = useState(null);
  const [toStop, setToStop] = useState(null);
  const [suggestFrom, setSuggestFrom] = useState([]);
  const [suggestTo, setSuggestTo] = useState([]);
  const [message, setMessage] = useState('');
  const t1 = useRef();
  const t2 = useRef();

  const fetchSuggest = async (text, setter) => {
    if (!text) return setter([]);
    try {
      const res = await fetch(
        `${GEOCODE_URL}?text=${encodeURIComponent(text)}&layers=stop`,
        { headers: { 'digitransit-subscription-key': API_KEY } }
      );
      const { features } = await res.json();
      setter(features || []);
    } catch {
      setter([]);
    }
  };

  const onChangeFrom = e => {
    clearTimeout(t1.current);
    setFromInput(e.target.value);
    setFromStop(null);
    t1.current = setTimeout(() => fetchSuggest(e.target.value, setSuggestFrom), 300);
  };
  const onChangeTo = e => {
    clearTimeout(t2.current);
    setToInput(e.target.value);
    setToStop(null);
    t2.current = setTimeout(() => fetchSuggest(e.target.value, setSuggestTo), 300);
  };

  const selectStop = (feature, setInput, setStop, setSuggest) => {
    setInput(feature.properties.label);
    setStop(feature.properties.id);
    setSuggest([]);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!fromStop || !toStop) {
      setMessage('Please select both stops from suggestions');
      return;
    }
    setMessage(`Routing ${fromInput} → ${toInput}`);

    const planQuery = `
      query Plan($a: String!, $b: String!) {
        plan(
          from: {stopId: $a}
          to:   {stopId: $b}
          numItineraries: 3
        ) {
          itineraries {
            duration
            walkDistance
            legs {
              mode
              startTime
              endTime
              from { name stop { code name } }
              to   { name stop { code name } }
              trip { routeShortName }
            }
          }
        }
      }
    `;
    const variables = { a: fromStop, b: toStop };

    try {
      const res = await fetch(PLAN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'digitransit-subscription-key': API_KEY
        },
        body: JSON.stringify({ query: planQuery, variables })
      });
      const { data, errors } = await res.json();
      if (errors) throw new Error(errors.map(x => x.message).join('; '));
      setMessage(JSON.stringify(data.plan.itineraries, null, 2));
    } catch (err) {
      setMessage(`Routing error: ${err.message}`);
    }
  };

  return (
    <div className="searchMain">
      <button onClick={() => navigate(-1)} className="back-button">←</button>
      <h2>Route trip</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            value={fromInput}
            onChange={onChangeFrom}
            placeholder="From stop"
          />
          {suggestFrom.length > 0 && (
            <ul className="suggestions">
              {suggestFrom.map(f => (
                <li
                  key={f.properties.id}
                  onClick={() => selectStop(f, setFromInput, setFromStop, setSuggestFrom)}
                >
                  {f.properties.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="input-group">
          <input
            value={toInput}
            onChange={onChangeTo}
            placeholder="To stop"
          />
          {suggestTo.length > 0 && (
            <ul className="suggestions">
              {suggestTo.map(f => (
                <li
                  key={f.properties.id}
                  onClick={() => selectStop(f, setToInput, setToStop, setSuggestTo)}
                >
                  {f.properties.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="go-button">Go</button>
      </form>
      {message && <pre className="message">{message}</pre>}
    </div>
  );
}
