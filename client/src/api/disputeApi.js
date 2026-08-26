const API_URL = import.meta.env.VITE_API_URL || "/api";

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || fallbackMessage);
  }
  return res.json();
}

export async function fileDispute(token, { reportedUser, relatedSwap, relatedSession, reason, description, evidence }) {
  const res = await fetch(`${API_URL}/disputes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reportedUser, relatedSwap, relatedSession, reason, description, evidence })
  });

  const data = await handle(res, "Failed to file dispute");
  return data.data;
}

export async function getMyDisputes(token) {
  const res = await fetch(`${API_URL}/disputes/mine`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch your disputes");
  return data.data;
}

export async function getAllDisputes(token, status) {
  const query = status ? `?status=${status}` : "";
  const res = await fetch(`${API_URL}/disputes${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch disputes");
  return data.data;
}

export async function markUnderReview(token, disputeId, note) {
  const res = await fetch(`${API_URL}/disputes/${disputeId}/review`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ note })
  });

  const data = await handle(res, "Failed to mark dispute under review");
  return data.data;
}

export async function resolveDispute(token, disputeId, { action, summary }) {
  const res = await fetch(`${API_URL}/disputes/${disputeId}/resolve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, summary })
  });

  const data = await handle(res, "Failed to resolve dispute");
  return data.data;
}

export async function dismissDispute(token, disputeId, summary) {
  const res = await fetch(`${API_URL}/disputes/${disputeId}/dismiss`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ summary })
  });

  const data = await handle(res, "Failed to dismiss dispute");
  return data.data;
}
