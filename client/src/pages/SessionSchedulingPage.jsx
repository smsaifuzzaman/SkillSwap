import {
  CalendarPlus,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Mail,
  MapPin,
  Trash2,
  UserRound
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  createSession,
  deleteSession,
  getSessions,
  syncSessionCalendar,
  updateSessionStatus
} from "../api/sessionApi.js";

const emptyForm = {
  skillName: "",
  partnerName: "",
  partnerId: "",
  sessionDate: "",
  sessionHour: "09",
  sessionMinute: "00",
  durationMinutes: "60",
  format: "Online",
  meetingLink: "",
  location: "",
  reminderEmail: "",
  notes: "",
  preferenceNotes: ""
};

const durationOptions = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240];
const hourOptions = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minuteOptions = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createInitialForm(overrides = {}) {
  return {
    ...emptyForm,
    sessionDate: getTodayInputValue(),
    ...overrides
  };
}

function formatDateTime(value) {
  if (!value) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function SessionSchedulingPage({ user, token, draft, onDraftApplied }) {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(() => createInitialForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCalendarId, setSyncingCalendarId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSessions() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");
        const data = await getSessions(token);
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err.message || "Failed to load sessions.");
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [token]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    setForm((currentForm) =>
      createInitialForm({
        ...currentForm,
        ...draft,
        sessionDate: currentForm.sessionDate || getTodayInputValue()
      })
    );
    onDraftApplied?.();
  }, [draft, onDraftApplied]);

  const upcomingCount = useMemo(
    () => sessions.filter((session) => ["Pending", "Accepted"].includes(session.status)).length,
    [sessions]
  );

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await createSession(token, {
        ...form,
        scheduledFor: `${form.sessionDate}T${form.sessionHour}:${form.sessionMinute}`,
        durationMinutes: Number(form.durationMinutes)
      });

      setSessions((currentSessions) =>
        [...currentSessions, data.session].sort((a, b) => {
          return new Date(a.scheduledFor) - new Date(b.scheduledFor);
        })
      );
      setForm(createInitialForm());
      setSuccess(data.message || "Session request sent.");
    } catch (err) {
      setError(err.message || "Failed to request session.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(sessionId, status) {
    try {
      setError("");
      const currentSession = sessions.find((session) => session.id === sessionId);
      const data = await updateSessionStatus(
        token,
        sessionId,
        status,
        currentSession?.preferenceNotes || ""
      );
      setSessions((currentSessions) =>
        currentSessions.map((session) => (session.id === sessionId ? data.session : session))
      );
    } catch (err) {
      setError(err.message || "Failed to update session.");
    }
  }

  function handlePreferenceDraft(sessionId, preferenceNotes) {
    setSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId ? { ...session, preferenceNotes } : session
      )
    );
  }

  async function handlePreferenceSave(session) {
    try {
      setError("");
      const data = await updateSessionStatus(
        token,
        session.id,
        session.preferenceNotes ? "Change Requested" : session.status,
        session.preferenceNotes || ""
      );
      setSessions((currentSessions) =>
        currentSessions.map((currentSession) =>
          currentSession.id === session.id ? data.session : currentSession
        )
      );
    } catch (err) {
      setError(err.message || "Failed to save preference.");
    }
  }

  async function handleCancelRequest(session) {
    await handleStatusChange(session.id, "Cancelled");
  }

  async function handleDelete(sessionId) {
    try {
      setError("");
      await deleteSession(token, sessionId);
      setSessions((currentSessions) => currentSessions.filter((session) => session.id !== sessionId));
    } catch (err) {
      setError(err.message || "Failed to delete session.");
    }
  }

  async function handleCalendarSync(session) {
    try {
      setError("");
      setSuccess("");
      setSyncingCalendarId(session.id);

      const data = await syncSessionCalendar(token, session.id);

      setSessions((currentSessions) =>
        currentSessions.map((currentSession) =>
          currentSession.id === session.id ? data.session : currentSession
        )
      );
      setSuccess(data.message || "Session synced with Google Calendar.");

      if (data.googleCalendarHtmlLink) {
        window.open(data.googleCalendarHtmlLink, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      setError(err.message || "Failed to sync with Google Calendar.");
    } finally {
      setSyncingCalendarId("");
    }
  }

  return (
    <div className="portfolio-page scheduling-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Calendar integration</p>
          <h1>Schedule Sessions</h1>
        </div>

        <div className="portfolio-stat">
          <CalendarPlus size={32} />
          <strong>{upcomingCount}</strong>
          <span>pending or accepted</span>
        </div>
      </div>

      <div className="scheduling-layout">
        <form className="portfolio-form scheduling-form" onSubmit={handleSubmit}>
          <h2>New request</h2>

          {error ? <p className="form-error">{error}</p> : null}
          {success ? <p className="form-note">{success}</p> : null}

          <label className="field">
            <span>Skill</span>
            <input
              type="text"
              value={form.skillName}
              placeholder="React basics"
              onChange={(event) => updateField("skillName", event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Session partner</span>
            <input
              type="text"
              value={form.partnerName}
              placeholder="Ayesha Rahman"
              onChange={(event) => updateField("partnerName", event.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              min={getTodayInputValue()}
              value={form.sessionDate}
              onChange={(event) => updateField("sessionDate", event.target.value)}
              required
            />
          </label>

          <div className="time-dial-row">
            <label className="field">
              <span>Hour</span>
              <select
                className="wheel-select"
                size="5"
                value={form.sessionHour}
                onChange={(event) => updateField("sessionHour", event.target.value)}
                required
              >
                {hourOptions.map((hour) => (
                  <option value={hour} key={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Minute</span>
              <select
                className="wheel-select"
                size="5"
                value={form.sessionMinute}
                onChange={(event) => updateField("sessionMinute", event.target.value)}
                required
              >
                {minuteOptions.map((minute) => (
                  <option value={minute} key={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Duration</span>
              <select
                className="wheel-select duration-wheel"
                size="5"
                value={form.durationMinutes}
                onChange={(event) => updateField("durationMinutes", event.target.value)}
                required
              >
                {durationOptions.map((duration) => (
                  <option value={duration} key={duration}>
                    {duration} min
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="two-column">
            <label className="field">
              <span>Format</span>
              <select
                value={form.format}
                onChange={(event) => updateField("format", event.target.value)}
                required
              >
                <option>Online</option>
                <option>Offline</option>
                <option>Hybrid</option>
              </select>
            </label>

            <label className="field">
              <span>Real calendar email</span>
              <input
                type="email"
                value={form.reminderEmail}
                placeholder="real.email@gmail.com"
                onChange={(event) => updateField("reminderEmail", event.target.value)}
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Meeting link</span>
            <input
              type="url"
              value={form.meetingLink}
              placeholder="https://meet.google.com/... optional"
              onChange={(event) => updateField("meetingLink", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Location</span>
            <input
              type="text"
              value={form.location}
              placeholder="Campus library, online, or leave empty"
              onChange={(event) => updateField("location", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={form.notes}
              placeholder="Topics to cover, prep work, or materials. Optional."
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </label>

          <label className="field">
            <span>Your preference</span>
            <textarea
              value={form.preferenceNotes}
              placeholder="Optional changes you prefer before the other user accepts."
              onChange={(event) => updateField("preferenceNotes", event.target.value)}
            />
          </label>

          <button className="primary-button full" type="submit" disabled={saving}>
            <CalendarPlus size={18} />
            {saving ? "Sending request..." : "Request session"}
          </button>
        </form>

        <section className="portfolio-feed scheduling-feed">
          <div className="feed-heading">
            <h2>Session timeline</h2>
            <span>{sessions.length} total</span>
          </div>

          {loading ? <p>Loading sessions...</p> : null}

          {!loading && sessions.length === 0 ? (
            <div className="empty-state">
              <CalendarPlus size={30} />
              <strong>No sessions requested yet</strong>
              <span>Create your first request. It will stay pending until the other user accepts.</span>
            </div>
          ) : null}

          {sessions.map((session) => (
            <article className="session-card" key={session.id}>
              <div className="session-card-top">
                <div>
                  <span className="match-label">
                    {session.viewerRole === "recipient" ? "Incoming request" : "Your request"} - {session.status}
                  </span>
                  <h3>{session.skillName}</h3>
                </div>

                {session.viewerRole === "recipient" ? (
                  <select
                    aria-label="Session status"
                    value={session.status}
                    onChange={(event) => handleStatusChange(session.id, event.target.value)}
                  >
                    <option>Pending</option>
                    <option>Accepted</option>
                    <option>Change Requested</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                ) : (
                  <span 
                    className={`status-pill ${
                       session.status === "Accepted" ? "accepted" : ""
                    }`}
                  >
                    {session.status}
                  </span>
                
                )}
              </div>

              <div className="session-meta-grid">
                <span>
                  <Clock size={16} />
                  {formatDateTime(session.scheduledFor)} - {session.durationMinutes} mins
                </span>
                <span>
                  <UserRound size={16} />
                  {session.viewerRole === "recipient"
                    ? `Requested by ${session.requesterName}`
                    : `Requested from ${session.partnerName}`}
                </span>
                <span>
                  <Mail size={16} />
                  {session.reminderEmail}
                </span>
                <span>
                  <MapPin size={16} />
                  {session.meetingLink || session.location || session.format}
                </span>
              </div>

              {session.notes ? <p>{session.notes}</p> : null}

              <div className="calendar-sync-status">
                <CalendarPlus size={16} />
                Google Calendar: {session.googleCalendarSyncStatus || "Not Synced"}
                {session.googleCalendarSyncError ? ` - ${session.googleCalendarSyncError}` : ""}
              </div>

              <label className="field session-preference-field">
                <span>Preference or change request</span>
                <textarea
                  value={session.preferenceNotes || ""}
                  placeholder={
                    session.viewerRole === "recipient"
                      ? "Suggest a different time, format, link, location, or note here."
                      : "The requested user can suggest changes here."
                  }
                  readOnly={session.viewerRole !== "recipient"}
                  onChange={(event) => handlePreferenceDraft(session.id, event.target.value)}
                />
              </label>

              <div className="portfolio-actions">
                <button
                  className="primary-button small"
                  type="button"
                  onClick={() => handleCalendarSync(session)}
                  disabled={syncingCalendarId === session.id}
                >
                  <LinkIcon size={16} />
                  {syncingCalendarId === session.id ? "Syncing..." : "Sync Google Calendar"}
                </button>

                {session.viewerRole === "recipient" ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => handlePreferenceSave(session)}
                  >
                    Save preference
                  </button>
                ) : null}

                {session.viewerRole === "requester" ? (
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => handleCancelRequest(session)}
                  >
                    Cancel request
                  </button>
                ) : null}

                {session.ownerId === user?.id ? (
                  <button
                    className="ghost-button danger"
                    type="button"
                    onClick={() => handleDelete(session.id)}
                    aria-label="Delete session"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                ) : null}
              </div>

              {session.status === "Completed" ? (
                <div className="session-complete">
                  <CheckCircle2 size={16} />
                  Marked complete
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default SessionSchedulingPage;
