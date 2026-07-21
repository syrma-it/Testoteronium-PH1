import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const handleStartClick = () => {
    navigate("/next");
  };

  return (
    <div className="home-container">
      <h1 className="home-heading">Testosteronium</h1>
      <button className="start-button" onClick={handleStartClick}>
        start
      </button>
    </div>
  );
}

export default Home;
