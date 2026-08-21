const API_URL = (import.meta.env.VITE_API_URL || "/api") + "/notifications";

function getAuthHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

export async function getNotifications(token) {
  const res = await fetch(API_URL, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch notifications");
  }
  return res.json();
}

export async function markAsRead(token, notificationId) {
  const res = await fetch(`${API_URL}/${notificationId}/read`, {
    method: "PUT",
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark as read");
  }
  return res.json();
}

export async function markAllAsRead(token) {
  const res = await fetch(`${API_URL}/mark-all-read`, {
    method: "PUT",
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to mark all as read");
  }
  return res.json();
}

export async function deleteNotification(token, notificationId) {
  const res = await fetch(`${API_URL}/${notificationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete notification");
  }
  return res.json();
}
