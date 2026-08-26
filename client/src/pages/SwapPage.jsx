import React, { useEffect, useState } from "react";
import {
  getMySwaps,
  createSwap,
  acceptSwap,
  declineSwap,
  counterSwap,
  cancelSwap
} from "../api/swapApi.js";
import { ArrowLeftRight, Check, X, RefreshCcw, Trash2 } from "lucide-react";

const STATUS_COLORS = {
  pending: "#f5c56d",
  accepted: "#63e6a5",
  declined: "#ff6b6b",
  countered: "#b48bf1",
  cancelled: "#8a8a9a",
  expired: "#8a8a9a"
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        padding: "0.25rem 0.75rem",
        borderRadius: "1rem",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "capitalize",
        color: "#120e28",
        background: STATUS_COLORS[status] || "#8a8a9a"
      }}
    >
      {status}
    </span>
  );
}

function CounterForm({ swap, onSubmit, onCancel }) {
  const [offered, setOffered] = useState(swap.offeredSkill?.skillName || "");
  const [requested, setRequested] = useState(swap.requestedSkill?.skillName || "");
  const [message, setMessage] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          offeredSkill: { skillName: offered },
          requestedSkill: { skillName: requested },
          message
        });
      }}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}
    >
      <label className="field">
        <span>New offered skill</span>
        <input value={offered} onChange={(e) => setOffered(e.target.value)} required />
      </label>
      <label className="field">
        <span>New requested skill</span>
        <input value={requested} onChange={(e) => setRequested(e.target.value)} required />
      </label>
      <label className="field">
        <span>Message</span>
        <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Optional note" />
      </label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="submit" className="primary-button">Send Counter</button>
        <button type="button" className="ghost-button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function SwapPage({ user, token, selectedUserId, setView }) {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [counteringId, setCounteringId] = useState(null);

  const [recipient, setRecipient] = useState(selectedUserId || "");
  const [offeredSkill, setOfferedSkill] = useState("");
  const [requestedSkill, setRequestedSkill] = useState("");
  const [message, setMessage] = useState("");

  async function loadSwaps() {
    try {
      setLoading(true);
      const data = await getMySwaps(token);
      setSwaps(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSwaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createSwap(token, {
        recipient,
        offeredSkill: { skillName: offeredSkill },
        requestedSkill: { skillName: requestedSkill },
        message
      });
      setOfferedSkill("");
      setRequestedSkill("");
      setMessage("");
      setShowNewForm(false);
      await loadSwaps();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAccept(swapId) {
    setError("");
    try {
      await acceptSwap(token, swapId);
      await loadSwaps();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDecline(swapId) {
    setError("");
    try {
      await declineSwap(token, swapId);
      await loadSwaps();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCounterSubmit(swapId, payload) {
    setError("");
    try {
      await counterSwap(token, swapId, payload);
      setCounteringId(null);
      await loadSwaps();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(swapId) {
    setError("");
    try {
      await cancelSwap(token, swapId);
      await loadSwaps();
    } catch (err) {
      setError(err.message);
    }
  }

  const myId = user?._id || user?.id;

  return (
    <div className="portfolio-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <ArrowLeftRight size={22} /> Swap Requests
        </h2>
        <button className="primary-button" onClick={() => setShowNewForm((v) => !v)}>
          {showNewForm ? "Close" : "New Swap Request"}
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {showNewForm ? (
        <form
          onSubmit={handleCreate}
          style={{
            background: "rgba(18, 14, 40, 0.6)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "1rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}
        >
          <label className="field">
            <span>Recipient user ID</span>
            <input value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
          </label>
          <label className="field">
            <span>Skill you're offering</span>
            <input value={offeredSkill} onChange={(e) => setOfferedSkill(e.target.value)} required />
          </label>
          <label className="field">
            <span>Skill you want</span>
            <input value={requestedSkill} onChange={(e) => setRequestedSkill(e.target.value)} required />
          </label>
          <label className="field">
            <span>Message (optional)</span>
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <button type="submit" className="primary-button">Send Request</button>
        </form>
      ) : null}

      {loading ? (
        <p className="text-muted">Loading swaps...</p>
      ) : swaps.length === 0 ? (
        <p className="text-muted">No swap requests yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {swaps.map((swap) => {
            const isRequester = swap.requester?._id === myId || swap.requester === myId;
            const otherParty = isRequester ? swap.recipient : swap.requester;
            const otherName = otherParty?.name || otherParty?.email || (typeof otherParty === "string" ? otherParty : "Unknown");

            return (
              <div
                key={swap._id}
                style={{
                  background: "rgba(18, 14, 40, 0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "1rem",
                  padding: "1.25rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--cream)" }}>
                    {isRequester ? "To" : "From"}: {otherName}
                  </strong>
                  <StatusBadge status={swap.status} />
                </div>

                <p style={{ color: "var(--muted)", margin: "0.5rem 0" }}>
                  Offering <strong>{swap.offeredSkill?.skillName}</strong> for{" "}
                  <strong>{swap.requestedSkill?.skillName}</strong>
                </p>

                {swap.status === "countered" && swap.counterOffer ? (
                  <p style={{ color: "var(--lavender)", fontSize: "0.9rem" }}>
                    Countered: {swap.counterOffer.offeredSkill?.skillName} for{" "}
                    {swap.counterOffer.requestedSkill?.skillName}
                    {swap.counterOffer.message ? ` — "${swap.counterOffer.message}"` : ""}
                  </p>
                ) : null}

                {["pending", "countered"].includes(swap.status) ? (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    <button className="primary-button small" onClick={() => handleAccept(swap._id)}>
                      <Check size={14} /> Accept
                    </button>
                    <button className="ghost-button small" onClick={() => handleDecline(swap._id)}>
                      <X size={14} /> Decline
                    </button>
                    <button
                      className="ghost-button small"
                      onClick={() => setCounteringId(counteringId === swap._id ? null : swap._id)}
                    >
                      <RefreshCcw size={14} /> Counter
                    </button>
                  </div>
                ) : null}

                {isRequester && swap.status !== "accepted" ? (
                  <button
                    className="ghost-button small"
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => handleCancel(swap._id)}
                  >
                    <Trash2 size={14} /> Cancel
                  </button>
                ) : null}

                {counteringId === swap._id ? (
                  <CounterForm
                    swap={swap}
                    onSubmit={(payload) => handleCounterSubmit(swap._id, payload)}
                    onCancel={() => setCounteringId(null)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
