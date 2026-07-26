import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "/api";

export default function EnrollPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); setReason("No token provided."); return; }
    fetch(`${API}/patch/${token}/info`)
      .then((res) => {
        if (res.ok) return res.json().then(() => setStatus("valid"));
        return res.json().then((d: { reason?: string }) => {
          setReason(d.reason ?? "This link is no longer valid.");
          setStatus("invalid");
        });
      })
      .catch(() => { setReason("Couldn't reach the server. Try again shortly."); setStatus("invalid"); });
  }, [token]);

  const downloadUrl = `${API}/patch/${token}/download`;

  return (
    <div className="enroll-page">
      <div className="enroll-card">
        <p className="enroll-eyebrow">Device Setup</p>
        {status === "checking" && <p className="enroll-status">Checking your link…</p>}
        {status === "invalid" && (
          <>
            <h1 className="enroll-title">This link isn't active</h1>
            <p className="enroll-text">{reason} Ask whoever sent it to generate a new one.</p>
          </>
        )}
        {status === "valid" && (
          <>
            <h1 className="enroll-title">Add this device</h1>
            <p className="enroll-text">
              This will register your computer so IT can see its status, specs, and keep it up to date. It takes about a minute.
            </p>
            <ol className="enroll-steps">
              <li>
                <span className="enroll-step-num">1</span>
                <div>
                  <strong>Download the setup file</strong>
                  <p>A small Python script, configured just for this device.</p>
                  <a className="enroll-download" href={downloadUrl}>Download enroll_agent.py</a>
                </div>
              </li>
              <li>
                <span className="enroll-step-num">2</span>
                <div>
                  <strong>Install the requirements</strong>
                  <p>Open a terminal in the folder you downloaded it to:</p>
                  <code className="enroll-code">pip install psutil requests</code>
                </div>
              </li>
              <li>
                <span className="enroll-step-num">3</span>
                <div>
                  <strong>Run it</strong>
                  <code className="enroll-code">python enroll_agent.py</code>
                  <p>Leave it running — it checks in every 5 minutes.</p>
                </div>
              </li>
            </ol>
            <p className="enroll-footnote">This link works once. If you need to set up another device, ask for a new link.</p>
          </>
        )}
      </div>
    </div>
  );
}
