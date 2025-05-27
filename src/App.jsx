import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Search from "./components/search/search";
import Weather from "./components/weather/weather";
import Bus from "./components/bus/bus";
import Time from "./components/time/time";
import './App.css';

const HomePage = () => (
  <div className="body">
    <Time />
    <div className="main">
      <div className="bus">  
        <h2>Bus</h2>    
        <Bus />
        <h2>Or</h2>
        <Link to="/search/search">
          <button className="buttonToSearch">Route search</button>
        </Link>
      </div>
      <Weather />
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search/search" element={<Search />} />
      </Routes>
    </Router>
  );
};

export default App;
