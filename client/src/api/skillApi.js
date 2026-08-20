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

// ----------------------------------------------------
// SKILLS
// ----------------------------------------------------

export function getSkills(token) {
  return requestJSON("/skills", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getSkillMatches(token) {
  return requestJSON("/skills/matches", {
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

// ----------------------------------------------------
// FEATURE 1: FEATURED LISTING & SKILL BOOST
// ----------------------------------------------------

export function boostSkillListing(token, skillId) {
  return requestJSON(`/boosts/${skillId}/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function renewSkillListingBoost(token, skillId) {
  return requestJSON(`/boosts/${skillId}/renew`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMyBoostTransactions(token) {
  return requestJSON("/boosts/transactions/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// ----------------------------------------------------
// FEATURED MARKETPLACE
// ----------------------------------------------------

export function getFeaturedSkills() {
  return requestJSON("/skills/featured");
}