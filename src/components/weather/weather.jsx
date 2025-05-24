import React, {useEffect, useState} from "react";

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
      <div>
        {isLoading && <p>Data loading...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

         {!isLoading && weatherData && !error &&(
          <div className="current_temp">
            <h2>Weather in {weatherData.city.name}</h2>
            <div>
            <h4>Current weather</h4>
            <p>{weatherData.list[0].main.temp.toFixed()}°C</p>
            <p>Humidity {weatherData.list[0].main.humidity}%</p>
            <p>Feels like: {weatherData.list[0].main.feels_like.toFixed()}°C</p>
            <p>Description: {weatherData.list[0].weather[0].description}</p>
          </div>
          <div className="future_temp">
            <h4>Next:</h4>
              {weatherData.list.slice(1, 4).map(forecast => (
                <div key={forecast.dt}>
                  <p>Time: {new Date(forecast.dt * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p>{forecast.main.temp.toFixed()}°C</p>
                  <p>Humidity {forecast.main.humidity}%</p>
                  <p>Feels like: {forecast.main.feels_like.toFixed()}°C</p>
                  <p>Description: {forecast.weather[0].description}</p>
                </div>
              ))}
          </div>  
          </div>
         )}
      </div>
    );
  };
  
  export default Weather;