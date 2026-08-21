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
// BADGES
// ----------------------------------------------------

export function evaluateAchievements(token) {
  return requestJSON("/achievements/evaluate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getMyAchievements(token) {
  return requestJSON("/achievements/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// ----------------------------------------------------
// CERTIFICATES
// ----------------------------------------------------

export function getCertificateEligibleTrackers(token) {
  return requestJSON("/achievements/certificates/eligible", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function generateCertificate(token, progressTrackerId) {
  return requestJSON("/achievements/certificates", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      progressTrackerId
    })
  });
}

export function getMyCertificates(token) {
  return requestJSON("/achievements/certificates/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function verifyCertificate(verificationCode) {
  return requestJSON(
    `/achievements/certificates/verify/${verificationCode}`
  );
}