import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <h1 className="home-heading">Testosteronium</h1>
      <button className="start-button" onClick={() => navigate("/setup")}>
        start
      </button>
    </div>
  );
}
