import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './bus.css';
import '../search/search';

const ENDPOINT = 'https://api.digitransit.fi/routing/v2/hsl/gtfs/v1';
const API_KEY = '443c7d32d16745ed85de9dd47b911cf2';

const locations = [
  { name: 'To work', bus: '400', stopId: 'HSL:4150220'},
  { name: 'To home', bus: '400', stopId: 'HSL:1150101'},
];

const query = `
  query ($stopId: String!, $limit: Int!) {
    stop(id: $stopId) {
      name
      stoptimesWithoutPatterns(numberOfDepartures: $limit) {
        serviceDay
        realtimeDeparture
        realtime
        headsign
        trip { route { shortName } }
      }
    }
  }
`;

export default function Bus() {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    async function load() {
      console.log('Loading schedules for locations:', locations);
      try {
        const results = await Promise.all(
          locations.map(async ({ name, stopId }) => {
            console.log(`Fetching schedule for ${name} (${stopId})`);
            const resp = await fetch(ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'digitransit-subscription-key': API_KEY,
              },
              body: JSON.stringify({ query, variables: { stopId, limit: 8 } }),
            });
            console.log(`Response status for ${name}:`, resp.status);
            const json = await resp.json();
            console.log(`GraphQL data for ${name}:`, json);
            const { data, errors } = json;
            if (errors) throw new Error(errors.map(e => e.message).join('; '));
            return [name, data.stop];
          })
        );
        setSchedules(Object.fromEntries(results));
        console.log('All schedules loaded', results);
      } catch (e) {
        console.error('Error loading schedules:', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="bus-wrapper">
      <div className="nav-buttons">
        <button onClick={() => swiperRef.current?.slidePrev()}>&larr;</button>
        <button onClick={() => swiperRef.current?.slideNext()}>&rarr;</button>
      </div>
      <Swiper
        spaceBetween={16}
        slidesPerView={1}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
      >
        {locations.map(({ name, bus }) => {
          const stop = schedules[name];
          const times =
            stop?.stoptimesWithoutPatterns.filter(
              t => t.trip.route.shortName === bus
            ) || [];

          return (
            <SwiperSlide key={name}>
              <div className="bus-card">
                <h2>{name}</h2>
                <ul>
                  {times.map((t, i) => {
                    const date = new Date((t.serviceDay + t.realtimeDeparture) * 1000);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const className = i === 0 ? 'bus-time first-time' : 'bus-time';
                    return (
                      <li key={i} className={className}>
                       <p>{timeString} → {t.headsign} - {bus}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}