const API_URL = import.meta.env.VITE_API_URL || "/api";

async function vaultRequest(path, token, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Vault request failed.");
  }

  return data;
}

export function getMyVaultResources(token) {
  return vaultRequest("/vault/mine", token);
}

export function uploadVaultResource(token, payload) {
  const formData = new FormData();

  formData.append("title", payload.title);
  formData.append("category", payload.category);
  formData.append("file", payload.file);

  return vaultRequest("/vault", token, {
    method: "POST",
    body: formData
  });
}

export function deleteVaultResource(token, id) {
  return vaultRequest(`/vault/${id}`, token, {
    method: "DELETE"
  });
}