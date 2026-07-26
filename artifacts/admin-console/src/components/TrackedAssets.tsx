import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api";

interface TrackedAsset {
  id: number;
  hostname: string;
  username: string | null;
  ip: string;
  mac_address: string | null;
  serial: string | null;
  os: string | null;
  specs: string | null;
  status: string;
  first_seen: string;
  last_seen: string;
}

const MOCK: TrackedAsset[] = [
  { id: 1, hostname: "WKS-ACCT-014", username: "s.harrison", ip: "10.10.4.22", mac_address: null, serial: "5CD1234XYZ", os: "Windows", specs: "i5-12400 · 16GB · Win 11", status: "online", first_seen: "", last_seen: "" },
  { id: 2, hostname: "WKS-DEV-003", username: "m.patel", ip: "10.10.2.11", mac_address: null, serial: "5CD9988ABC", os: "Linux", specs: "Ryzen 7 5800X · 32GB · Ubuntu 22.04", status: "offline", first_seen: "", last_seen: "" },
];

export default function TrackedAssets() {
  const [assets, setAssets] = useState<TrackedAsset[]>(MOCK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/assets/tracked`)
      .then((r) => { if (!r.ok) throw new Error("Backend returned " + r.status); return r.json(); })
      .then((data: TrackedAsset[]) => { if (!cancelled) setAssets(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="asset-list-page" style={{ "--accent": "#34D1B4" } as React.CSSProperties}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">← Back to Setup</Link>
        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Tracked Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Devices actively reporting through the agent — IP, hostname, logged-in user, serial number, and hardware specs, refreshed on every check-in.
        </p>
        {error && <p className="asset-list-page__notice">Backend not reachable yet — showing sample data. ({error})</p>}
        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">No agents have checked in yet.</div>
          ) : (
            <table className="asset-table">
              <thead><tr><th>Hostname</th><th>User</th><th>IP address</th><th>Serial number</th><th>Specs</th><th>Status</th></tr></thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.hostname}</td>
                    <td>{a.username ?? "—"}</td>
                    <td className="mono">{a.ip}</td>
                    <td className="mono">{a.serial ?? "—"}</td>
                    <td>{a.specs ?? "—"}</td>
                    <td>
                      <span className={`status-pill ${a.status === "online" ? "status-pill--online" : "status-pill--offline"}`}>{a.status}</span>
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
