const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function sendMatchRequest(token, userId) {
  const res = await fetch(`${API_URL}/matches/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to send match request");
  }

  return res.json();
}

export async function respondToMatch(token, matchId, action) {
  const res = await fetch(`${API_URL}/matches/${matchId}/respond`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to respond to match request");
  }

  return res.json();
}

export async function getMatches(token) {
  const res = await fetch(`${API_URL}/matches`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch matches");
  }

  return res.json();
}
