import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AssetTable.css";

const MOCK_TRACKED = [
  {
    id: 1,
    hostname: "WKS-ACCT-014",
    username: "s.harrison",
    ip: "10.10.4.22",
    serial: "5CD1234XYZ",
    specs: "i5-12400 · 16GB · Win 11",
    status: "online",
  },
  {
    id: 2,
    hostname: "WKS-DEV-003",
    username: "m.patel",
    ip: "10.10.2.11",
    serial: "5CD9988ABC",
    specs: "Ryzen 7 5800X · 32GB · Ubuntu 22.04",
    status: "offline",
  },
];

export default function TrackedAssets() {
  const [assets, setAssets] = useState(MOCK_TRACKED);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("http://localhost:5000/api/assets/tracked")
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
    <div className="asset-list-page" style={{ "--accent": "#34D1B4" }}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">
          ← Back to Setup
        </Link>

        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Tracked Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Devices actively reporting through the agent — IP, hostname, logged-in
          user, serial number, and hardware specs, refreshed on every check-in.
        </p>

        {error && (
          <p className="asset-list-page__notice">
            Backend not reachable yet — showing sample data. Wire up{" "}
            <code>GET /api/assets/tracked</code> on the Flask server to
            replace it.
          </p>
        )}

        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">
              No agents have checked in yet.
            </div>
          ) : (
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Hostname</th>
                  <th>User</th>
                  <th>IP address</th>
                  <th>Serial number</th>
                  <th>Specs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.hostname}</td>
                    <td>{a.username}</td>
                    <td className="mono">{a.ip}</td>
                    <td className="mono">{a.serial}</td>
                    <td>{a.specs}</td>
                    <td>
                      <span
                        className={
                          "status-pill " +
                          (a.status === "online"
                            ? "status-pill--online"
                            : "status-pill--offline")
                        }
                      >
                        {a.status}
                      </span>
                    </td>
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