import { LogIn, LogOut, UserPlus, Bell, MessageSquare } from "lucide-react";
import React, { useState, useEffect } from "react";
import { getNotifications } from "../api/notificationApi.js";

function Header({ user, token, initials, setView, onLogout }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user && token) {
      getNotifications(token)
        .then((data) => {
          setUnreadCount(data.filter((n) => !n.isRead).length);
        })
        .catch((err) => console.error("Failed to load unread count", err));
    } else {
      setUnreadCount(0);
    }
  }, [user, token]);

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => setView(user ? "dashboard" : "landing")}>
        <span className="brand-mark">S</span>
        <span>SkillSwap</span>
      </button>

      <nav className="nav-actions" aria-label="Primary">
        {user ? (
          <>
            <button 
              className="ghost-button" 
              type="button" 
              onClick={() => setView("inbox")}
              style={{ position: "relative" }}
              title="Inbox"
            >
              <MessageSquare size={20} />
            </button>
            <button 
              className="ghost-button" 
              type="button" 
              onClick={() => setView("notifications")}
              style={{ position: "relative" }}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge" style={{
                  position: "absolute",
                  top: "0px",
                  right: "-2px",
                  background: "var(--accent)",
                  color: "#000",
                  borderRadius: "50%",
                  padding: "0.1rem 0.35rem",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  minWidth: "18px",
                  textAlign: "center"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="user-pill" title={user.email}>
              <span>{initials}</span>
              {user.name}
            </span>
            <button className="ghost-button" type="button" onClick={onLogout}>
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          <>
            <button className="ghost-button" type="button" onClick={() => setView("login")}>
              <LogIn size={18} />
              Login
            </button>
            <button className="primary-button small" type="button" onClick={() => setView("signup")}>
              <UserPlus size={18} />
              Sign up
            </button>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
