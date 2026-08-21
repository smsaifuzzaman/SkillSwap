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
// PROGRESS TRACKERS
// ----------------------------------------------------

export function getProgressTrackers(token) {
  return requestJSON("/progress", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function getProgressTracker(token, trackerId) {
  return requestJSON(`/progress/${trackerId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function createProgressTracker(token, sessionId, title, goal) {
  return requestJSON("/progress", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId,
      title,
      goal
    })
  });
}

export function updateProgressTracker(token, trackerId, trackerData) {
  return requestJSON(`/progress/${trackerId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(trackerData)
  });
}

// ----------------------------------------------------
// MILESTONES
// ----------------------------------------------------

export function addProgressMilestone(token, trackerId, milestoneData) {
  return requestJSON(`/progress/${trackerId}/milestones`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(milestoneData)
  });
}

export function updateProgressMilestone(
  token,
  trackerId,
  milestoneId,
  milestoneData
) {
  return requestJSON(
    `/progress/${trackerId}/milestones/${milestoneId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(milestoneData)
    }
  );
}

export function toggleProgressMilestone(token, trackerId, milestoneId) {
  return requestJSON(
    `/progress/${trackerId}/milestones/${milestoneId}/toggle`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}

export function deleteProgressMilestone(token, trackerId, milestoneId) {
  return requestJSON(
    `/progress/${trackerId}/milestones/${milestoneId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
}