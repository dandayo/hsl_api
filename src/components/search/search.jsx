import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './search.css';

// URLs and key
const GEOCODE_URL = 'https://api.digitransit.fi/geocoding/v1/autocomplete';
const PLAN_URL = 'http://localhost:3001/api/plan';
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

export default function Search() {
  const navigate = useNavigate();

  // Input and coordinates
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [fromCoords, setFromCoords] = useState(null);
  const [toCoords, setToCoords] = useState(null);

  // Suggestions (stops and addresses)
  const [suggestFrom, setSuggestFrom] = useState([]);
  const [suggestTo, setSuggestTo] = useState([]);

  // Route options
  const [routes, setRoutes] = useState([]);

  // Debounce refs
  const debounceFrom = useRef();
  const debounceTo = useRef();


  // Fetch suggestions (stop,address,station,street,venue)
  const fetchSuggestions = async (text, setter) => {
    if (!text) return setter([]);
    try {
      //Filter only Espoo, Vantaa, Helsinki
      const regionFilter = '&boundary.circle.lat=60.25&boundary.circle.lon=24.85&boundary.circle.radius=20000';
      const res = await fetch(
        `${GEOCODE_URL}?text=${encodeURIComponent(text)}&layers=stop,address,station,street,venue${regionFilter}`,
        { headers: { 'digitransit-subscription-key': API_KEY } }
      );
      const { features } = await res.json();
      setter(features || []);
    } catch (err) {
      console.error('Suggest error:', err);
      setter([]);
    }
  };

  const onFromChange = e => {
    clearTimeout(debounceFrom.current);
    const val = e.target.value;
    setFromText(val);
    setFromCoords(null);
    debounceFrom.current = setTimeout(() => fetchSuggestions(val, setSuggestFrom), 600);
  };

  const onToChange = e => {
    clearTimeout(encodeURIComponent.current);
    const val = e.target.value;
    setToText(val);
    setToCoords(null);
    debounceTo.current = setTimeout(() => fetchSuggestions(val, setSuggestTo), 600);
  };

  const pickStopOrAddress = (f, setText, setCoords, clearList) => {
    setText(f.properties.label);
    const [lon, lat] = f.geometry.coordinates;
    setCoords({ lat, lon });
    clearList([]);
  };

  // Plan 3 routes
  const onSubmit = async e => {
    e.preventDefault();
    if (!fromCoords || !toCoords) {
      console.error('Both points must be selected');
      return;
    }

    const query = `
      query Plan($aLat: Float!, $aLon: Float!, $bLat: Float!, $bLon: Float!) {
        plan(
          from: {lat: $aLat, lon: $aLon}, to: {lat: $bLat, lon: $bLon}, numItineraries: 3
        ) {
          itineraries {
            duration
            walkDistance
            legs {
              mode
              startTime
              from { name stop { name code } }
              to   { name stop { name code } }
              trip { routeShortName tripShortName }
            }
          }
        }
      }
    `;

    const variables = {
      aLat: fromCoords.lat,
      aLon: fromCoords.lon,
      bLat: toCoords.lat,
      bLon: toCoords.lon,
    };

    try {
      const res = await fetch(PLAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const { data } = await res.json();
      setRoutes(data.plan.itineraries || []);
    } catch (err) {
      console.error('Plan error:', err);
    }
  };

  // Format seconds into minutes
  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    return `${m}min`;
  };

  const bigLetter = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  // Format departure time (Unix ms -> HH:MM)
  const formatDepartureTime = (ms) => {
    if (!ms) return '—';
    const date = new Date(ms);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div>
      <button className="btn-back" onClick={() => navigate(-1)}>←</button>
      <div className="search-main">
        <form className="form" onSubmit={onSubmit}>
          <h2 className="title">Plan your route</h2>

          {/* From input */}
          <div className="input-group">
            <input
              className="input-field"
              value={fromText}
              onChange={onFromChange}
              placeholder="From (stop or address)"
            />
            {suggestFrom.length > 0 && (
              <ul className="suggest-list">
                {suggestFrom.slice(0, 5).map(f => (
                  <li
                    key={f.properties.id}
                    className="suggest-item"
                    onClick={() => pickStopOrAddress(f, setFromText, setFromCoords, setSuggestFrom)}
                  >
                    {f.properties.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* To input */}
          <div className="input-group">
            <input
              className="input-field"
              value={toText}
              onChange={onToChange}
              placeholder="To (stop or address)"
            />
            {suggestTo.length > 0 && (
              <ul className="suggest-list">
                {suggestTo.slice(0, 5).map(f => (
                  <li
                    key={f.properties.id}
                    className="suggest-item"
                    onClick={() => pickStopOrAddress(f, setToText, setToCoords, setSuggestTo)}
                  >
                    {f.properties.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="btn-go" type="submit">Go</button>
        </form>

        {/* Show 3 route options */}
        <div className='result'>
          <h2>Your Route</h2>
          {routes.map((r, idx) => (
            <div key={idx} className="result-box">
              <p className="option">Option {idx + 1}</p>
              <p className="departure">Departure: <span className='departure-time result-info'>{formatDepartureTime(r.legs[0]?.startTime)}</span></p>
              <p>Duration: <span className='duration-time result-info'>{formatTime(r.duration)}</span></p>
              <p className="walk">
                Walk: <span className="distance result-info">{Math.round(r.walkDistance)}</span>m
              </p>
              {r.legs.map((leg, i) => (
                <div className='route-map'>
                  <p key={i}>
                    {bigLetter(leg.mode === 'RAIL' ? 'Train' : leg.mode)}
                    <span className='result-info'>{leg.trip?.routeShortName && ` ${leg.trip.routeShortName}`}</span>
                    {` from ${leg.from.name}`}
                    <span className='result-info'>{leg.from.stop?.code && ` (stop code ${leg.from.stop.code})`}</span>
                    {` to ${leg.to.name}`}
                    <span className='result-info'>{leg.to.stop?.code && ` (stop code ${leg.to.stop.code})`}</span>
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
