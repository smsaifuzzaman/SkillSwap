const API_URL = import.meta.env.VITE_API_URL || "/api";

async function portfolioRequest(path, token, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value) {
      formData.append(key, value);
    }
  });

  return portfolioRequest("/portfolio", token, {
    method: "POST",
    body: formData
  });
}

export function deletePortfolioItem(token, id) {
  return portfolioRequest(`/portfolio/${id}`, token, {
    method: "DELETE"
  });
}
