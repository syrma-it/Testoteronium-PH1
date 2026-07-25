import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AssetTable.css";

export default function GeneratePatch() {
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [expiresHours, setExpiresHours] = useState(72);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const load = () => {
    fetch("http://localhost:5000/api/patch/list")
      .then((res) => {
        if (!res.ok) throw new Error("Backend returned " + res.status);
        return res.json();
      })
      .then(setLinks)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("http://localhost:5000/api/patch/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, expires_hours: Number(expiresHours) }),
      });
      if (!res.ok) throw new Error("Backend returned " + res.status);
      setLabel("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/enroll/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  return (
    <div className="asset-list-page" style={{ "--accent": "#5B8DEF" }}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">
          ← Back to Setup
        </Link>

        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Generate Patch</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Create a one-time link. Send it to the end user — opening it walks
          them through installing the agent, and their device shows up in
          Tracked Assets automatically. No admin needs to touch their machine.
        </p>

        {error && (
          <p className="asset-list-page__notice">
            Backend not reachable — {error}
          </p>
        )}

        <form onSubmit={handleGenerate} className="patch-form">
          <input
            type="text"
            placeholder="Label (e.g. 'Dave's laptop, IT ticket #204')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="patch-form__input"
          />
          <select
            value={expiresHours}
            onChange={(e) => setExpiresHours(e.target.value)}
            className="patch-form__select"
          >
            <option value={24}>Expires in 24 hours</option>
            <option value={72}>Expires in 3 days</option>
            <option value={168}>Expires in 7 days</option>
          </select>
          <button type="submit" className="patch-form__button" disabled={creating}>
            {creating ? "Generating…" : "Generate link"}
          </button>
        </form>

        <div className="asset-table-wrap" style={{ marginTop: 24 }}>
          {links.length === 0 ? (
            <div className="asset-list-page__empty">
              No patch links generated yet.
            </div>
          ) : (
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((l) => (
                  <tr key={l.token}>
                    <td>{l.label || <span className="mono">—</span>}</td>
                    <td>
                      <span
                        className={
                          "status-pill " +
                          (l.status === "active"
                            ? "status-pill--online"
                            : l.status === "used"
                            ? "status-pill--unclassified"
                            : "status-pill--offline")
                        }
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="mono">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="mono">{new Date(l.expires_at).toLocaleString()}</td>
                    <td>
                      {l.status === "active" ? (
                        <button
                          className="patch-copy-btn"
                          onClick={() => copyLink(l.token)}
                        >
                          {copiedToken === l.token ? "Copied!" : "Copy link"}
                        </button>
                      ) : (
                        <span className="mono">—</span>
                      )}
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