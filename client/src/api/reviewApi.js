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

export function getTrustSummary(token) {
  return requestJSON("/reviews/summary", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getReviews(token) {
  return requestJSON("/reviews", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function submitReview(token, reviewData) {
  return requestJSON("/reviews", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
}

export function deleteReview(token, reviewId) {
  return requestJSON(`/reviews/${reviewId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

