const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function getConversation(token, userId) {
  const res = await fetch(`${API_URL}/chat/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch conversation");
  }

  return res.json();
}

export async function sendMessage(token, userId, content) {
  const res = await fetch(`${API_URL}/chat/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to send message");
  }

  return res.json();
}

export async function getInbox(token) {
  const res = await fetch(`${API_URL}/chat`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch inbox");
  }

  return res.json();
}
