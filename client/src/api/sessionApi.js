const API_URL = import.meta.env.VITE_API_URL || "/api";

async function requestJSON(path, options = {}) {
  const { headers, ...restOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export function getSessions(token) {
  return requestJSON("/sessions", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createSession(token, sessionData) {
  return requestJSON("/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(sessionData)
  });
}

export function updateSessionStatus(token, id, status, preferenceNotes = "") {
  return requestJSON(`/sessions/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status, preferenceNotes })
  });
}

export function deleteSession(token, id) {
  return requestJSON(`/sessions/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
