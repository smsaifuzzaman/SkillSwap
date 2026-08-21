import React, { useEffect, useState } from "react";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../api/notificationApi.js";
import { respondToMatch } from "../api/matchApi.js";
import { Bell, BellOff, CalendarDays, CheckCircle2, MessageSquare, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

const typeIcons = {
  match: <Sparkles size={20} className="text-blue" />,
  chat: <MessageSquare size={20} className="text-green" />,
  session_reminder: <CalendarDays size={20} className="text-orange" />,
  trust_score: <ShieldCheck size={20} className="text-gold" />,
  summary: <CheckCircle2 size={20} className="text-purple" />,
};

function formatTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationsPage({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' or 'unread'

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getNotifications(token);
        setNotifications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleMarkAsRead(id) {
    try {
      await markAsRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  const displayedNotifications = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMatchResponse(notification, action) {
    try {
      if (!notification.relatedEntityId) return;
      await respondToMatch(token, notification.relatedEntityId, action);
      
      // Update notification locally so it reflects the choice
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id
            ? { ...n, isRead: true, message: action === "accept" ? "You accepted the match request!" : "You declined the match request." }
            : n
        )
      );
      
      if (!notification.isRead) {
        await markAsRead(token, notification._id);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  if (loading) {
    return <div className="portfolio-page"><p>Loading notifications...</p></div>;
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Stay Updated</p>
          <h1>Notifications</h1>
          <p>Your alerts, smart reminders, and weekly summaries in one place.</p>
        </div>
        <div className="portfolio-stat">
          <Bell size={32} />
          <strong>{unreadCount}</strong>
          <span>Unread Alerts</span>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="trust-tab-nav" style={{ marginBottom: '2rem' }}>
        <button
          className={`trust-tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Notifications
        </button>
        <button
          className={`trust-tab-btn ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread
          {unreadCount > 0 && <span className="tab-counter-badge">{unreadCount}</span>}
        </button>
        {unreadCount > 0 && (
          <button className="ghost-button small" style={{ marginLeft: "auto" }} onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {displayedNotifications.length === 0 ? (
        <div className="empty-state trust-empty">
          <BellOff size={34} />
          <strong>No {filter === "unread" ? "unread " : ""}notifications yet!</strong>
          <span>We'll let you know when something important happens.</span>
        </div>
      ) : (
        <div className="public-reviews-grid">
          {displayedNotifications.map((notif) => (
            <article key={notif._id} className={`public-review-card ${notif.isRead ? "read" : "unread"}`} style={{ borderLeft: notif.isRead ? 'none' : '4px solid var(--accent)' }}>
              <div className="public-review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar" style={{ background: 'var(--surface-light)' }}>
                    {typeIcons[notif.type] || <Bell size={20} />}
                  </div>
                  <div>
                    <strong>{notif.title}</strong>
                    <span className="review-role-tag">{formatTime(notif.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p className="public-review-comment" style={{ marginTop: '0.5rem' }}>{notif.message}</p>
              
              {notif.type === "match" && notif.relatedEntityId && notif.title === "New Match Request!" && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="primary-button small" onClick={() => handleMatchResponse(notif, "accept")}>
                    Accept Match
                  </button>
                  <button className="ghost-button small" onClick={() => handleMatchResponse(notif, "reject")}>
                    Decline
                  </button>
                </div>
              )}

              <div className="review-card-foot actions-foot" style={{ marginTop: '1rem' }}>
                {!notif.isRead && (
                  <button className="ghost-button small" onClick={() => handleMarkAsRead(notif._id)}>
                    <CheckCircle2 size={14} /> Mark Read
                  </button>
                )}
                <button className="ghost-button danger small" onClick={() => handleDelete(notif._id)} style={{ marginLeft: notif.isRead ? '0' : 'auto' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
