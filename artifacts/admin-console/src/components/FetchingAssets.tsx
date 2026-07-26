import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api";

interface FetchingAsset {
  id: number;
  ip: string;
  mac: string;
  guess: string | null;
  os_guess: string | null;
  connection: string | null;
  first_seen: string;
  last_seen: string;
}

const MOCK: FetchingAsset[] = [
  { id: 1, ip: "10.10.9.147", mac: "3C:22:FB:9A:4D:11", guess: "Android phone", os_guess: null, connection: "Wi-Fi", first_seen: "2026-07-18T09:14:00Z", last_seen: "2026-07-18T09:14:00Z" },
  { id: 2, ip: "10.10.9.152", mac: "A4:83:E7:0C:2B:99", guess: "MacBook (personal)", os_guess: null, connection: "Wi-Fi", first_seen: "2026-07-19T08:02:00Z", last_seen: "2026-07-19T08:02:00Z" },
];

export default function FetchingAssets() {
  const [assets, setAssets] = useState<FetchingAsset[]>(MOCK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/assets/fetching`)
      .then((r) => { if (!r.ok) throw new Error("Backend returned " + r.status); return r.json(); })
      .then((data: FetchingAsset[]) => { if (!cancelled && data.length > 0) setAssets(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="asset-list-page" style={{ "--accent": "#B98CFF" } as React.CSSProperties}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">← Back to Setup</Link>
        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Fetching Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Devices seen on your network or Wi-Fi that aren't in Tracked or Manual yet — often a personal phone or laptop someone connected. Claim one to move it into Manual, or ignore it.
        </p>
        {error && <p className="asset-list-page__notice">Backend not reachable yet — showing sample data. ARP scanning is stubbed in this environment. ({error})</p>}
        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">Nothing unclaimed right now.</div>
          ) : (
            <table className="asset-table">
              <thead><tr><th>IP address</th><th>MAC address</th><th>Likely device</th><th>Connection</th><th>First seen</th><th>Status</th></tr></thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td className="mono">{a.ip}</td>
                    <td className="mono">{a.mac}</td>
                    <td>{a.guess ?? "Unknown"}</td>
                    <td>{a.connection ?? "—"}</td>
                    <td className="mono">{a.first_seen ? new Date(a.first_seen).toLocaleString() : "—"}</td>
                    <td><span className="status-pill status-pill--unclassified">unclassified</span></td>
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
