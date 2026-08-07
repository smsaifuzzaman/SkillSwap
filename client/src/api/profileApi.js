const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

export function getProfile(token) {
  return requestJSON("/profile", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function updateProfile(token, profileData) {
  return requestJSON("/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
}

export async function uploadProfilePhoto(token, file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_URL}/profile/photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to upload photo.");
  }
  return data;
}
