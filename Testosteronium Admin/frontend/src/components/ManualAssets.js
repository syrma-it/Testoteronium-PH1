import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AssetTable.css";

const MOCK_MANUAL = [
  {
    id: 1,
    name: "Conference Room Projector",
    type: "Projector",
    owner: "Facilities",
    location: "3rd Floor — Room B",
    addedOn: "2026-05-12",
    source: "Manual entry",
  },
  {
    id: 2,
    name: "Spare Laptop #4",
    type: "Laptop",
    owner: "IT Storage",
    location: "IT Closet",
    addedOn: "2026-06-01",
    source: "Excel import",
  },
];

export default function ManualAssets() {
  const [assets, setAssets] = useState(MOCK_MANUAL);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("http://localhost:5000/api/assets/manual")
      .then((res) => {
        if (!res.ok) throw new Error("Backend returned " + res.status);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setAssets(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="asset-list-page" style={{ "--accent": "#F2A93B" }}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">
          ← Back to Setup
        </Link>

        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Manual Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Records your team entered by hand — one at a time through a form, or
          in bulk from a spreadsheet import. No agent is checking in on these.
        </p>

        {error && (
          <p className="asset-list-page__notice">
            Backend not reachable yet — showing sample data. Wire up{" "}
            <code>GET /api/assets/manual</code> on the Flask server to
            replace it.
          </p>
        )}

        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">
              No manual assets added yet — add one, or import a spreadsheet.
            </div>
          ) : (
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Location</th>
                  <th>Added on</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.type}</td>
                    <td>{a.owner}</td>
                    <td>{a.location}</td>
                    <td className="mono">{a.addedOn}</td>
                    <td>{a.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}