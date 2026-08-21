const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function searchUsers(token, query) {
  const res = await fetch(`${API_URL}/users/search?q=${encodeURIComponent(query)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to search users");
  }

  return res.json();
}

export async function getUserProfile(token, userId) {
  const res = await fetch(`${API_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch user profile");
  }

  return res.json();
}
