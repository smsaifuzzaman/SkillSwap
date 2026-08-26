const API_URL = (import.meta.env.VITE_API_URL || "/api") + "/teams";

function getAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function createTeam(token, name) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create team");
  }
  return res.json();
}

export async function getMyTeam(token) {
  const res = await fetch(`${API_URL}/my-team`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch team");
  }
  return res.json();
}

export async function joinTeam(token, inviteCode) {
  const res = await fetch(`${API_URL}/join`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify({ inviteCode })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to join team");
  }
  return res.json();
}

export async function removeMember(token, teamId, userId) {
  const res = await fetch(`${API_URL}/${teamId}/members/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to remove member");
  }
  return res.json();
}
