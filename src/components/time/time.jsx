import React, { useState, useEffect } from 'react';

const Time = () => { 
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timerId = setInterval(() => {
    setCurrentTime(new Date());
  }, 60 * 1000);

  return () => {
    clearInterval(timerId);
  };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], 
    { hour: '2-digit', 
    minute: '2-digit'});
  const formattedDate = currentTime.toLocaleDateString([], 
    { year: 'numeric', 
      month: 'long', 
      day: 'numeric' });

  return (
    <div className='date'>
      <h2 className='time'>{formattedTime}</h2>
      <h2 className='year'>{formattedDate}</h2>
    </div>
  );
}

export default Time;