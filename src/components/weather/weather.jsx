import React, {useEffect, useState} from "react";
import './weather.css';

const Weather = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const WEATHER_API_KEY = '357ee4fdc4d3c39d4477916aa0615029';
  const gettingWeather = async() => {
    setIsLoading(true);
    setError(null);
    try{ 
      const URL = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Helsinki,FI&cnt=4&units=metric&appid=${WEATHER_API_KEY}`);
      if (!URL.ok) {
        throw new Error(`HTTP ERROR: status ${URL.status}`);
      }
      const data = await URL.json();

      if(data.cod !== "200"){
        throw new Error(`Eroor API: ${data.message || 'Unknown error'}`)
      }

      setWeatherData(data);
      console.log(data);
    } catch (error){
      console.error("Error", error);
      setError(error)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    gettingWeather();
  }, [])

    return (
      <div className="weather">
        {isLoading && <p>Data loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

         {!isLoading && weatherData && !error &&(
        <div className="info">
          <h2>{weatherData.city.name}</h2>
          <div className="currentTemp">
            <div>
            <h4>Current weather</h4>
            <p className="temp">{weatherData.list[0].main.temp.toFixed()}°C</p>
            <p className="humidity">Humidity {weatherData.list[0].main.humidity}%</p>
            <p className="feels_like">Feels like: {weatherData.list[0].main.feels_like.toFixed()}°C</p>
            <p className="description">Description: {weatherData.list[0].weather[0].description}</p>
          </div>
          </div>
                    <div className="futureTemp">
                      {weatherData.list.slice(1, 4).map(forecast => (
                        <div key={forecast.dt}>
                          <p>Time: {new Date(forecast.dt * 1000).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="temp">{forecast.main.temp.toFixed()}°C</p>
                          <p className="humidity">Humidity {forecast.main.humidity}%</p>
                          <p className="feels_like">Feels like: {forecast.main.feels_like.toFixed()}°C</p>
                          <p className="description">Description: {forecast.weather[0].description}</p>
                        </div>
                      ))}
                  </div>  
          </div>
         )}
      </div>
    );
  };
  
  export default Weather;