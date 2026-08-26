const API_URL = import.meta.env.VITE_API_URL || "/api";

async function handle(res, fallbackMessage) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || fallbackMessage);
  }
  return res.json();
}

export async function getMyAnalytics(token) {
  const res = await fetch(`${API_URL}/analytics/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch your analytics");
  return data.data;
}

export async function getPopularSkills(token, limit) {
  const query = limit ? `?limit=${limit}` : "";
  const res = await fetch(`${API_URL}/analytics/popular-skills${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch popular skills");
  return data.data;
}

export async function getRecommendations(token) {
  const res = await fetch(`${API_URL}/analytics/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch recommendations");
  return data.data;
}

export async function getEngagementTrends(token, days) {
  const query = days ? `?days=${days}` : "";
  const res = await fetch(`${API_URL}/analytics/engagement${query}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await handle(res, "Failed to fetch engagement trends");
  return data.data;
}
