import React, { useEffect, useState } from "react";
import {
  fileDispute,
  getMyDisputes,
  getAllDisputes,
  resolveDispute,
  dismissDispute
} from "../api/disputeApi.js";
import { ShieldAlert, Gavel } from "lucide-react";

const REASONS = ["no-show", "inappropriate-behavior", "quality-issue", "harassment", "scam", "other"];
const ACTIONS = ["warning", "rating_penalty", "temporary_suspension", "account_ban", "no_action"];

function StatusPill({ status }) {
  const colors = {
    open: "#f5c56d",
    under_review: "#b48bf1",
    resolved: "#63e6a5",
    dismissed: "#8a8a9a"
  };
  return (
    <span
      style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "1rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#120e28",
        background: colors[status] || "#8a8a9a"
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ResolveForm({ dispute, onResolve, onDismiss }) {
  const [action, setAction] = useState(ACTIONS[0]);
  const [summary, setSummary] = useState("");

  return (
    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label className="field">
        <span>Action</span>
        <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: "0.6rem" }}>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace("_", " ")}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Summary</span>
        <input value={summary} onChange={(e) => setSummary(e.target.value)} />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="primary-button small" onClick={() => onResolve(dispute._id, { action, summary })}>
          Resolve
        </button>
        <button className="ghost-button small" onClick={() => onDismiss(dispute._id, summary)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function DisputePage({ user, token, selectedUserId }) {
  const isAdmin = user?.role === "system-admin";

  const [myDisputes, setMyDisputes] = useState([]);
  const [allDisputes, setAllDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openResolveId, setOpenResolveId] = useState(null);

  const [reportedUser, setReportedUser] = useState(selectedUserId || "");
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      const mine = await getMyDisputes(token);
      setMyDisputes(mine);
      if (isAdmin) {
        const all = await getAllDisputes(token);
        setAllDisputes(all);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  async function handleFile(e) {
    e.preventDefault();
    setError("");
    try {
      await fileDispute(token, { reportedUser, reason, description });
      setDescription("");
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResolve(id, payload) {
    setError("");
    try {
      await resolveDispute(token, id, payload);
      setOpenResolveId(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDismiss(id, summary) {
    setError("");
    try {
      await dismissDispute(token, id, summary);
      setOpenResolveId(null);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function renderDisputeCard(dispute, showAdminControls) {
    return (
      <div
        key={dispute._id}
        style={{
          background: "rgba(18, 14, 40, 0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1rem",
          padding: "1.25rem"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ color: "var(--cream)" }}>
            {dispute.reporter?.name || "Someone"} reported {dispute.reportedUser?.name || "a user"}
          </strong>
          <StatusPill status={dispute.status} />
        </div>
        <p style={{ color: "var(--muted)", margin: "0.5rem 0" }}>
          <em>{dispute.reason.replace("-", " ")}</em> — {dispute.description}
        </p>
        {dispute.resolution?.summary ? (
          <p style={{ color: "var(--lavender)", fontSize: "0.9rem" }}>
            Resolution ({dispute.resolution.action}): {dispute.resolution.summary}
          </p>
        ) : null}

        {showAdminControls && ["open", "under_review"].includes(dispute.status) ? (
          <>
            <button
              className="ghost-button small"
              style={{ marginTop: "0.5rem" }}
              onClick={() => setOpenResolveId(openResolveId === dispute._id ? null : dispute._id)}
            >
              <Gavel size={14} /> Take Action
            </button>
            {openResolveId === dispute._id ? (
              <ResolveForm dispute={dispute} onResolve={handleResolve} onDismiss={handleDismiss} />
            ) : null}
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <ShieldAlert size={22} /> Dispute Resolution
      </h2>

      {error ? <p className="form-error">{error}</p> : null}

      <form
        onSubmit={handleFile}
        style={{
          background: "rgba(18, 14, 40, 0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1rem",
          padding: "1.5rem",
          margin: "1.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}
      >
        <h3 style={{ margin: 0, color: "var(--cream)" }}>File a Dispute</h3>
        <label className="field">
          <span>User ID being reported</span>
          <input value={reportedUser} onChange={(e) => setReportedUser(e.target.value)} required />
        </label>
        <label className="field">
          <span>Reason</span>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: "0.6rem" }}>
            {REASONS.map((r) => (
              <option key={r} value={r}>{r.replace("-", " ")}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <button type="submit" className="primary-button">Submit Report</button>
      </form>

      {loading ? (
        <p className="text-muted">Loading disputes...</p>
      ) : (
        <>
          <h3 style={{ color: "var(--cream)" }}>My Disputes</h3>
          {myDisputes.length === 0 ? (
            <p className="text-muted">No disputes involving you yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              {myDisputes.map((d) => renderDisputeCard(d, false))}
            </div>
          )}

          {isAdmin ? (
            <>
              <h3 style={{ color: "var(--cream)" }}>All Disputes (Admin)</h3>
              {allDisputes.length === 0 ? (
                <p className="text-muted">No disputes on the platform.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {allDisputes.map((d) => renderDisputeCard(d, true))}
                </div>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
