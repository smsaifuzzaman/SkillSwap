const API_URL = import.meta.env.VITE_API_URL || "/api";

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || fallbackMessage);
  }
  return res.json();
}

export async function getMySwaps(token, { status, direction } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (direction) params.set("direction", direction);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${API_URL}/swaps${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch swap requests");
  return data.data;
}

export async function createSwap(token, { recipient, offeredSkill, requestedSkill, message, proposedSchedule }) {
  const res = await fetch(`${API_URL}/swaps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ recipient, offeredSkill, requestedSkill, message, proposedSchedule })
  });

  const data = await handle(res, "Failed to create swap request");
  return data.data;
}

export async function acceptSwap(token, swapId) {
  const res = await fetch(`${API_URL}/swaps/${swapId}/accept`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to accept swap request");
  return data.data;
}

export async function declineSwap(token, swapId, reason) {
  const res = await fetch(`${API_URL}/swaps/${swapId}/decline`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  const data = await handle(res, "Failed to decline swap request");
  return data.data;
}

export async function counterSwap(token, swapId, { offeredSkill, requestedSkill, proposedSchedule, message }) {
  const res = await fetch(`${API_URL}/swaps/${swapId}/counter`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ offeredSkill, requestedSkill, proposedSchedule, message })
  });

  const data = await handle(res, "Failed to counter swap request");
  return data.data;
}

export async function cancelSwap(token, swapId) {
  const res = await fetch(`${API_URL}/swaps/${swapId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to cancel swap request");
  return data.data;
}
