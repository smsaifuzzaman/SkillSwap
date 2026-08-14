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

export function getSkills(token) {
  return requestJSON("/skills", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function addSkill(token, skillData) {
  return requestJSON("/skills", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(skillData)
  });
}

export function deleteSkill(token, id) {
  return requestJSON(`/skills/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMatches(token) {
  return requestJSON("/skills/match", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
