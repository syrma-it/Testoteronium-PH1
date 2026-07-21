import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AssetTable.css";

const MOCK_FETCHING = [
  {
    id: 1,
    ip: "10.10.9.147",
    mac: "3C:22:FB:9A:4D:11",
    guess: "Android phone",
    connection: "Wi-Fi",
    firstSeen: "2026-07-18 09:14",
  },
  {
    id: 2,
    ip: "10.10.9.152",
    mac: "A4:83:E7:0C:2B:99",
    guess: "MacBook (personal)",
    connection: "Wi-Fi",
    firstSeen: "2026-07-19 08:02",
  },
];

export default function FetchingAssets() {
  const [assets, setAssets] = useState(MOCK_FETCHING);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("http://localhost:5000/api/assets/fetching")
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
    <div className="asset-list-page" style={{ "--accent": "#B98CFF" }}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">
          ← Back to Setup
        </Link>

        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Fetching Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Devices seen on your network or Wi-Fi that aren't in Tracked or
          Manual yet — often a personal phone or laptop someone connected.
          Claim one to move it into Manual, or ignore it.
        </p>

        {error && (
          <p className="asset-list-page__notice">
            Backend not reachable yet — showing sample data. Wire up{" "}
            <code>GET /api/assets/fetching</code> on the Flask server
            (e.g. reading your router/DHCP lease table) to replace it.
          </p>
        )}

        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">
              Nothing unclaimed right now — every device on the network is
              accounted for.
            </div>
          ) : (
            <table className="asset-table">
              <thead>
                <tr>
                  <th>IP address</th>
                  <th>MAC address</th>
                  <th>Likely device</th>
                  <th>Connection</th>
                  <th>First seen</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.ip}</td>
                    <td className="mono">{a.mac}</td>
                    <td>{a.guess}</td>
                    <td>{a.connection}</td>
                    <td className="mono">{a.firstSeen}</td>
                    <td>
                      <span className="status-pill status-pill--unclassified">
                        unclassified
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