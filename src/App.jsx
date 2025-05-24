import React from "react";
import Weather from "./components/weather/weather";
import Bus from "./components/bus/bus";
import Time from "./components/time/time";
import './App.css';

const App = () => {

  return (
      <div className="body">
        <Time />
        <h2>Bus</h2>
        <Bus />
        <Weather />
      </div>
    );
};

export default App;