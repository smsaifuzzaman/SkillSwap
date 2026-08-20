import React, { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  Circle,
  Flag,
  PlusCircle,
  Target,
  Trash2,
  TrendingUp,
  Users
} from "lucide-react";

import { getSessions } from "../api/sessionApi.js";

import {
  addProgressMilestone,
  createProgressTracker,
  deleteProgressMilestone,
  getProgressTrackers,
  toggleProgressMilestone
} from "../api/progressApi.js";

const emptyTrackerForm = {
  sessionId: "",
  title: "",
  goal: ""
};

const emptyMilestoneForm = {
  title: "",
  description: "",
  targetDate: ""
};

function getSessionId(sourceSession) {
  if (!sourceSession) {
    return "";
  }

  if (typeof sourceSession === "string") {
    return sourceSession;
  }

  return sourceSession._id || sourceSession.id || "";
}

function formatDate(value) {
  if (!value) {
    return "No target date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function SessionProgressPage({ token }) {
  const [trackers, setTrackers] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [trackerForm, setTrackerForm] = useState(
    emptyTrackerForm
  );

  const [milestoneForms, setMilestoneForms] = useState({});

  const [loading, setLoading] = useState(true);
  const [savingTracker, setSavingTracker] = useState(false);
  const [processingId, setProcessingId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------------------------
  // LOAD DATA
  // ----------------------------------------------------

  useEffect(() => {
    async function loadData() {
      if (!token) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [progressData, sessionData] = await Promise.all([
          getProgressTrackers(token),
          getSessions(token)
        ]);

        setTrackers(progressData.trackers || []);
        setSessions(sessionData.sessions || []);
      } catch (err) {
        setError(
          err.message ||
            "Failed to load session progress."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  // ----------------------------------------------------
  // ELIGIBLE SESSIONS
  // ----------------------------------------------------

  const eligibleSessions = useMemo(() => {
    const trackerSessionIds = new Set(
      trackers.map((tracker) =>
        getSessionId(tracker.sourceSession)
      )
    );

    return sessions.filter((session) => {
      return (
        ["Accepted", "Completed"].includes(session.status) &&
        session.partnerId &&
        !trackerSessionIds.has(session.id)
      );
    });
  }, [sessions, trackers]);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------

  const summary = useMemo(() => {
    const totalMilestones = trackers.reduce(
      (sum, tracker) =>
        sum + (tracker.totalMilestones || 0),
      0
    );

    const completedMilestones = trackers.reduce(
      (sum, tracker) =>
        sum + (tracker.completedMilestones || 0),
      0
    );

    const averageProgress =
      trackers.length === 0
        ? 0
        : Math.round(
            trackers.reduce(
              (sum, tracker) =>
                sum +
                (tracker.progressPercentage || 0),
              0
            ) / trackers.length
          );

    return {
      totalMilestones,
      completedMilestones,
      averageProgress
    };
  }, [trackers]);

  // ----------------------------------------------------
  // CREATE TRACKER
  // ----------------------------------------------------

  async function handleCreateTracker(event) {
    event.preventDefault();

    if (!trackerForm.sessionId) {
      setError(
        "Choose an accepted or completed session first."
      );

      return;
    }

    try {
      setSavingTracker(true);
      setError("");
      setSuccess("");

      const data = await createProgressTracker(
        token,
        trackerForm.sessionId,
        trackerForm.title,
        trackerForm.goal
      );

      setTrackers((current) => [
        data.progress,
        ...current
      ]);

      setTrackerForm(emptyTrackerForm);

      setSuccess(
        data.message ||
          "Progress tracker created."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to create progress tracker."
      );
    } finally {
      setSavingTracker(false);
    }
  }

  // ----------------------------------------------------
  // MILESTONE FORM
  // ----------------------------------------------------

  function getMilestoneForm(trackerId) {
    return (
      milestoneForms[trackerId] ||
      emptyMilestoneForm
    );
  }

  function updateMilestoneForm(
    trackerId,
    field,
    value
  ) {
    setMilestoneForms((current) => ({
      ...current,

      [trackerId]: {
        ...(current[trackerId] ||
          emptyMilestoneForm),

        [field]: value
      }
    }));
  }

  // ----------------------------------------------------
  // ADD MILESTONE
  // ----------------------------------------------------

  async function handleAddMilestone(
    event,
    trackerId
  ) {
    event.preventDefault();

    const form =
      getMilestoneForm(trackerId);

    if (!form.title.trim()) {
      setError(
        "Milestone title is required."
      );

      return;
    }

    try {
      setProcessingId(trackerId);
      setError("");
      setSuccess("");

      const data =
        await addProgressMilestone(
          token,
          trackerId,
          {
            title: form.title,
            description:
              form.description,
            targetDate:
              form.targetDate ||
              null
          }
        );

      setTrackers((current) =>
        current.map((tracker) =>
          tracker.id === trackerId
            ? data.progress
            : tracker
        )
      );

      setMilestoneForms(
        (current) => ({
          ...current,
          [trackerId]:
            emptyMilestoneForm
        })
      );

      setSuccess(
        data.message ||
          "Milestone added."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to add milestone."
      );
    } finally {
      setProcessingId("");
    }
  }

  // ----------------------------------------------------
  // TOGGLE MILESTONE
  // ----------------------------------------------------

  async function handleToggleMilestone(
    trackerId,
    milestoneId
  ) {
    try {
      setProcessingId(milestoneId);
      setError("");
      setSuccess("");

      const data =
        await toggleProgressMilestone(
          token,
          trackerId,
          milestoneId
        );

      setTrackers((current) =>
        current.map((tracker) =>
          tracker.id === trackerId
            ? data.progress
            : tracker
        )
      );

      setSuccess(data.message || "");
    } catch (err) {
      setError(
        err.message ||
          "Failed to update milestone."
      );
    } finally {
      setProcessingId("");
    }
  }

  // ----------------------------------------------------
  // DELETE MILESTONE
  // ----------------------------------------------------

  async function handleDeleteMilestone(
    trackerId,
    milestoneId
  ) {
    const confirmed =
      window.confirm(
        "Delete this milestone?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(milestoneId);
      setError("");
      setSuccess("");

      const data =
        await deleteProgressMilestone(
          token,
          trackerId,
          milestoneId
        );

      setTrackers((current) =>
        current.map((tracker) =>
          tracker.id === trackerId
            ? data.progress
            : tracker
        )
      );

      setSuccess(
        data.message ||
          "Milestone deleted."
      );
    } catch (err) {
      setError(
        err.message ||
          "Failed to delete milestone."
      );
    } finally {
      setProcessingId("");
    }
  }

  // ----------------------------------------------------
  // PAGE
  // ----------------------------------------------------

  return (
    <div className="portfolio-page session-progress-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">
            Multi-Session Learning
          </p>

          <h1>
            Session Progress
          </h1>

          <p>
            Track learning goals,
            milestones, and completion
            progress across ongoing
            SkillSwap sessions.
          </p>
        </div>

        <div className="portfolio-stat">
          <TrendingUp size={32} />

          <strong>
            {summary.averageProgress}%
          </strong>

          <span>
            Average Progress
          </span>
        </div>
      </div>

      {error ? (
        <p
          className="form-error"
          style={{
            marginTop: "1rem"
          }}
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="form-note"
          style={{
            marginTop: "1rem"
          }}
        >
          {success}
        </p>
      ) : null}

      <div className="progress-summary-grid">
        <div className="portfolio-stat">
          <Target size={28} />

          <strong>
            {trackers.length}
          </strong>

          <span>
            Learning Trackers
          </span>
        </div>

        <div className="portfolio-stat">
          <Flag size={28} />

          <strong>
            {summary.completedMilestones}
            {" / "}
            {summary.totalMilestones}
          </strong>

          <span>
            Milestones Completed
          </span>
        </div>

        <div className="portfolio-stat">
          <Users size={28} />

          <strong>
            {eligibleSessions.length}
          </strong>

          <span>
            Sessions Ready to Track
          </span>
        </div>
      </div>

      <div className="progress-layout">
        <form
          className="portfolio-form progress-create-form"
          onSubmit={handleCreateTracker}
        >
          <h2>
            Start Progress Tracker
          </h2>

          <label className="field">
            <span>
              Accepted session
            </span>

            <select
              value={
                trackerForm.sessionId
              }
              onChange={(event) =>
                setTrackerForm(
                  (current) => ({
                    ...current,

                    sessionId:
                      event.target.value
                  })
                )
              }
              required
            >
              <option value="">
                Choose session
              </option>

              {eligibleSessions.map(
                (session) => (
                  <option
                    value={session.id}
                    key={session.id}
                  >
                    {session.skillName} —{" "}
                    {session.viewerRole ===
                    "recipient"
                      ? session.requesterName
                      : session.partnerName}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="field">
            <span>
              Tracker title
            </span>

            <input
              type="text"
              value={
                trackerForm.title
              }
              placeholder="UX Design Learning Progress"
              onChange={(event) =>
                setTrackerForm(
                  (current) => ({
                    ...current,

                    title:
                      event.target.value
                  })
                )
              }
            />
          </label>

          <label className="field">
            <span>
              Learning goal
            </span>

            <textarea
              value={
                trackerForm.goal
              }
              placeholder="What should be achieved across these sessions?"
              onChange={(event) =>
                setTrackerForm(
                  (current) => ({
                    ...current,

                    goal:
                      event.target.value
                  })
                )
              }
            />
          </label>

          <button
            className="primary-button full"
            type="submit"
            disabled={
              savingTracker ||
              eligibleSessions.length ===
                0
            }
          >
            <PlusCircle size={18} />

            {savingTracker
              ? "Creating..."
              : "Create Tracker"}
          </button>

          {eligibleSessions.length ===
          0 ? (
            <p
              className="form-note"
              style={{
                margin: 0
              }}
            >
              All accepted sessions
              already have trackers, or
              there are no accepted
              sessions yet.
            </p>
          ) : null}
        </form>

        <section className="portfolio-feed">
          <div className="feed-heading">
            <h2>
              Learning Progress
            </h2>

            <span>
              {trackers.length} total
            </span>
          </div>

          {loading ? (
            <p>
              Loading progress...
            </p>
          ) : null}

          {!loading &&
          trackers.length === 0 ? (
            <div className="empty-state">
              <TrendingUp size={30} />

              <strong>
                No progress trackers yet
              </strong>

              <span>
                Create one from an
                accepted SkillSwap
                session.
              </span>
            </div>
          ) : null}

          {trackers.map(
            (tracker) => {
              const milestoneForm =
                getMilestoneForm(
                  tracker.id
                );

              return (
                <article
                  className="progress-card"
                  key={tracker.id}
                >
                  <div className="progress-card-heading">
                    <div>
                      <span className="match-label">
                        {tracker.status}
                      </span>

                      <h3>
                        {tracker.title ||
                          `${tracker.skillName} Learning Progress`}
                      </h3>

                      <p>
                        {tracker.goal ||
                          "No learning goal added yet."}
                      </p>
                    </div>

                    <strong className="progress-percentage">
                      {
                        tracker.progressPercentage
                      }
                      %
                    </strong>
                  </div>

                  <div className="progress-bar-shell">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${tracker.progressPercentage}%`
                      }}
                    />
                  </div>

                  <div className="progress-card-stats">
                    <span>
                      {
                        tracker.completedMilestones
                      }{" "}
                      /{" "}
                      {
                        tracker.totalMilestones
                      }{" "}
                      milestones
                    </span>

                    <span>
                      {
                        tracker.completedSessions
                      }{" "}
                      /{" "}
                      {
                        tracker.totalSessions
                      }{" "}
                      sessions completed
                    </span>
                  </div>

                  <div className="milestone-list">
                    {tracker.milestones
                      .length ===
                    0 ? (
                      <div className="empty-state">
                        <span>
                          No milestones
                          yet. Add the
                          first learning
                          milestone below.
                        </span>
                      </div>
                    ) : (
                      tracker.milestones.map(
                        (
                          milestone
                        ) => (
                          <div
                            className={`milestone-row ${
                              milestone.completed
                                ? "completed"
                                : ""
                            }`}
                            key={
                              milestone._id
                            }
                          >
                            <button
                              className="milestone-toggle"
                              type="button"
                              disabled={
                                processingId ===
                                milestone._id
                              }
                              onClick={() =>
                                handleToggleMilestone(
                                  tracker.id,
                                  milestone._id
                                )
                              }
                              aria-label={
                                milestone.completed
                                  ? "Mark milestone incomplete"
                                  : "Mark milestone complete"
                              }
                            >
                              {milestone.completed ? (
                                <CheckCircle2
                                  size={22}
                                />
                              ) : (
                                <Circle
                                  size={22}
                                />
                              )}
                            </button>

                            <div className="milestone-copy">
                              <strong>
                                {
                                  milestone.title
                                }
                              </strong>

                              {milestone.description ? (
                                <span>
                                  {
                                    milestone.description
                                  }
                                </span>
                              ) : null}

                              <small>
                                {formatDate(
                                  milestone.targetDate
                                )}
                              </small>
                            </div>

                            <button
                              className="ghost-button danger milestone-delete"
                              type="button"
                              disabled={
                                processingId ===
                                milestone._id
                              }
                              onClick={() =>
                                handleDeleteMilestone(
                                  tracker.id,
                                  milestone._id
                                )
                              }
                              aria-label="Delete milestone"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <form
                    className="milestone-form"
                    onSubmit={(event) =>
                      handleAddMilestone(
                        event,
                        tracker.id
                      )
                    }
                  >
                    <h4>
                      Add Milestone
                    </h4>

                    <label className="field">
                      <span>
                        Milestone title
                      </span>

                      <input
                        type="text"
                        value={
                          milestoneForm.title
                        }
                        placeholder="Create wireframes"
                        onChange={(
                          event
                        ) =>
                          updateMilestoneForm(
                            tracker.id,
                            "title",
                            event.target
                              .value
                          )
                        }
                        required
                      />
                    </label>

                    <label className="field">
                      <span>
                        Description
                      </span>

                      <textarea
                        value={
                          milestoneForm.description
                        }
                        placeholder="What should be learned or completed?"
                        onChange={(
                          event
                        ) =>
                          updateMilestoneForm(
                            tracker.id,
                            "description",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <label className="field">
                      <span>
                        Target date
                      </span>

                      <input
                        type="date"
                        value={
                          milestoneForm.targetDate
                        }
                        onChange={(
                          event
                        ) =>
                          updateMilestoneForm(
                            tracker.id,
                            "targetDate",
                            event.target
                              .value
                          )
                        }
                      />
                    </label>

                    <button
                      className="ghost-button"
                      type="submit"
                      disabled={
                        processingId ===
                        tracker.id
                      }
                    >
                      <PlusCircle
                        size={16}
                      />

                      {processingId ===
                      tracker.id
                        ? "Adding..."
                        : "Add Milestone"}
                    </button>
                  </form>
                </article>
              );
            }
          )}
        </section>
      </div>
    </div>
  );
}

export default SessionProgressPage;