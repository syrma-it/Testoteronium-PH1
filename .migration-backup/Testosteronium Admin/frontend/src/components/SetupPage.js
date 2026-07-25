import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SetupPage.css";

const FALLBACK_COUNTS = { tracked: 0, manual: 0, fetching: 0 };

function useAssetCounts() {
  const [counts, setCounts] = useState(FALLBACK_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("http://localhost:5000/api/assets/summary");
        if (!res.ok) throw new Error("Backend returned " + res.status);
        const data = await res.json();
        if (!cancelled) {
          setCounts({
            tracked: data.tracked ?? 0,
            manual: data.manual ?? 0,
            fetching: data.fetching ?? 0,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { counts, loading, error };
}

function IconServer() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4L19 9l-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 6l4 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconRadar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <path d="M12 12 L18 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPatch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l2.2 2.2 3.1-.5.5 3.1L20 10l-2.2 2.2.5 3.1-3.1.5L12 18l-2.2-2.2-3.1.5-.5-3.1L4 10l2.2-2.2-.5-3.1 3.1-.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.5 10.5l1.7 1.7 3.3-3.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AssetCard({ accent, icon, label, description, count, loading, to, pulse, tag }) {
  return (
    <Link to={to} className="asset-card" style={{ "--accent": accent }}>
      <span className="asset-card__bar" />
      <div className="asset-card__body">
        <div className="asset-card__header">
          <span className="asset-card__icon">{icon}</span>
          {pulse && (
            <span className="asset-card__live" title="Live heartbeat">
              <span className="asset-card__live-dot" />
              live
            </span>
          )}
          {tag && <span className="asset-card__tag">{tag}</span>}
        </div>

        <span className="asset-card__label">{label}</span>

        {count !== undefined ? (
          <div className="asset-card__count">
            {loading ? <span className="asset-card__count-skeleton" /> : count}
          </div>
        ) : (
          <div className="asset-card__count asset-card__count--action">→</div>
        )}

        <p className="asset-card__desc">{description}</p>

        <span className="asset-card__cta">
          {count !== undefined ? "View all →" : "Open →"}
        </span>
      </div>
    </Link>
  );
}

export default function SetupPage() {
  const { counts, loading, error } = useAssetCounts();
  const total = counts.tracked + counts.manual + counts.fetching;

  return (
    <div className="setup-page">
      <div className="setup-page__grid-bg" aria-hidden="true" />

      <header className="setup-page__header">
        <p className="setup-page__eyebrow">Asset Tracker · Admin Console</p>
        <h1 className="setup-page__title">Where every device stands</h1>
        <p className="setup-page__subtitle">
          Three sources, one picture — plus a way to bring new devices in
          yourself, without touching them.
        </p>

        <div className="setup-page__strip">
          <div className="setup-page__strip-item">
            <span className="setup-page__strip-value">{loading ? "—" : total}</span>
            <span className="setup-page__strip-label">Total devices</span>
          </div>
          <div className="setup-page__strip-divider" />
          <div className="setup-page__strip-item">
            <span className="setup-page__strip-value" style={{ color: "#34D1B4" }}>
              {loading ? "—" : counts.tracked}
            </span>
            <span className="setup-page__strip-label">Tracked</span>
          </div>
          <div className="setup-page__strip-item">
            <span className="setup-page__strip-value" style={{ color: "#F2A93B" }}>
              {loading ? "—" : counts.manual}
            </span>
            <span className="setup-page__strip-label">Manual</span>
          </div>
          <div className="setup-page__strip-item">
            <span className="setup-page__strip-value" style={{ color: "#B98CFF" }}>
              {loading ? "—" : counts.fetching}
            </span>
            <span className="setup-page__strip-label">Fetching</span>
          </div>
        </div>

        {error && (
          <p className="setup-page__notice">
            Backend not reachable yet — showing placeholder counts. Wire up{" "}
            <code>/api/assets/summary</code> on the Flask server to populate this.
          </p>
        )}
      </header>

      <div className="asset-grid asset-grid--four">
        <AssetCard
          accent="#34D1B4"
          icon={<IconServer />}
          label="Tracked Assets"
          description="Devices reporting in through the agent — IP, hostname, user, serial number, specs, and live status."
          count={counts.tracked}
          loading={loading}
          to="/setup/tracked"
          pulse
        />
        <AssetCard
          accent="#F2A93B"
          icon={<IconPencil />}
          label="Manual Assets"
          description="Records your team added by hand — direct entry or bulk import from a spreadsheet."
          count={counts.manual}
          loading={loading}
          to="/setup/manual"
        />
        <AssetCard
          accent="#B98CFF"
          icon={<IconRadar />}
          label="Fetching Assets"
          description="Unclaimed devices seen on the network — someone's phone or laptop on company wifi that isn't in either list above."
          count={counts.fetching}
          loading={loading}
          to="/setup/fetching"
        />
        <AssetCard
          accent="#5B8DEF"
          icon={<IconPatch />}
          label="Generate Patch"
          description="Create a one-time self-install link — send it to an end user and their device enrolls itself into Tracked Assets."
          loading={false}
          to="/setup/patch"
          tag="self-service"
        />
      </div>
    </div>
  );
}