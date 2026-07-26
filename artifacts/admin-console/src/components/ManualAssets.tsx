import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "/api";

interface ManualAsset {
  id: number;
  name: string;
  type: string | null;
  owner: string | null;
  location: string | null;
  serial: string | null;
  notes: string | null;
  source: string;
  addedOn: string;
}

const MOCK: ManualAsset[] = [
  { id: 1, name: "Conference Room Projector", type: "Projector", owner: "Facilities", location: "3rd Floor — Room B", serial: null, notes: null, source: "Manual entry", addedOn: "2026-05-12" },
  { id: 2, name: "Spare Laptop #4", type: "Laptop", owner: "IT Storage", location: "IT Closet", serial: null, notes: null, source: "Excel import", addedOn: "2026-06-01" },
];

export default function ManualAssets() {
  const [assets, setAssets] = useState<ManualAsset[]>(MOCK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/assets/manual`)
      .then((r) => { if (!r.ok) throw new Error("Backend returned " + r.status); return r.json(); })
      .then((data: ManualAsset[]) => { if (!cancelled && data.length > 0) setAssets(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="asset-list-page" style={{ "--accent": "#F2A93B" } as React.CSSProperties}>
      <div className="asset-list-page__inner">
        <Link to="/setup" className="asset-list-page__back">← Back to Setup</Link>
        <div className="asset-list-page__header">
          <span className="asset-list-page__bar" />
          <h1 className="asset-list-page__title">Manual Assets</h1>
        </div>
        <p className="asset-list-page__subtitle">
          Records your team entered by hand — one at a time through a form, or in bulk from a spreadsheet import. No agent is checking in on these.
        </p>
        {error && <p className="asset-list-page__notice">Backend not reachable yet — showing sample data. ({error})</p>}
        <div className="asset-table-wrap">
          {assets.length === 0 ? (
            <div className="asset-list-page__empty">No manual assets added yet.</div>
          ) : (
            <table className="asset-table">
              <thead><tr><th>Name</th><th>Type</th><th>Owner</th><th>Location</th><th>Added on</th><th>Source</th></tr></thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.type ?? "—"}</td>
                    <td>{a.owner ?? "—"}</td>
                    <td>{a.location ?? "—"}</td>
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
