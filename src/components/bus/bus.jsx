import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import './bus.css';

const locations = [
  { name: 'To work', bus: '400', stopId: 'HSL:4150220' },
  { name: 'To home', bus: '400', stopId: 'HSL:1150101' },
];

const QUERY = `
  query GetStopTimes($stopId: String!, $limit: Int!) {
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

export default function BusSchedule() {
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await Promise.all(
          locations.map(async ({ name, stopId }) => {
            const res = await fetch('/api/schedule', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: QUERY, variables: { stopId, limit: 10 } }),
            });
            if (!res.ok) throw new Error(res.statusText);
            const json = await res.json();
            return [name, json.data.stop];
          })
        );
        setSchedules(Object.fromEntries(data));
      } catch (e) {
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
        <button onClick={() => swiperRef.current?.slidePrev()}>Prev</button>
        <button onClick={() => swiperRef.current?.slideNext()}>Next</button>
      </div>
      <Swiper spaceBetween={16} slidesPerView={1} onSwiper={swiper => (swiperRef.current = swiper)}>
        {locations.map(({ name, bus }) => {
          const stop = schedules[name];
          const times = stop?.stoptimesWithoutPatterns.filter(t => t.trip.route.shortName === bus) || [];
          return (
            <SwiperSlide key={name}>
              <div className="bus-card">
                <h2>{name}</h2>
                <ul>
                  {times.length ? (
                    times.map((t, i) => {
                      const date = new Date((t.serviceDay + t.realtimeDeparture) * 1000);
                      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return <li key={i} className={i === 0 ? 'first-time' : ''}>{time} → {t.headsign}</li>;
                    })
                  ) : (
                    <li>No {bus} buses.</li>
                  )}
                </ul>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
