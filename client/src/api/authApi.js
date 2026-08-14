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

export function getCurrentUser(token) {
  return requestJSON("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function loginUser(payload) {
  return requestJSON("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function signupUser(payload) {
  return requestJSON("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
