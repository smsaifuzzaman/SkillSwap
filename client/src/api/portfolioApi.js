const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function portfolioRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      // Protected portfolio routes need the JWT token created during login/signup.
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Portfolio request failed.");
  }

  return data;
}

export function getMyPortfolioItems(token) {
  return portfolioRequest("/portfolio/mine", token);
}

export function createPortfolioItem(token, payload) {
  return portfolioRequest("/portfolio", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function deletePortfolioItem(token, id) {
  return portfolioRequest(`/portfolio/${id}`, token, {
    method: "DELETE"
  });
}
