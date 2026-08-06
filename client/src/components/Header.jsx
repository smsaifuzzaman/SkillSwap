import { LogIn, LogOut, UserPlus } from "lucide-react";
import React from "react";

function Header({ user, initials, setView, onLogout }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => setView(user ? "dashboard" : "landing")}>
        <span className="brand-mark">S</span>
        <span>SkillSwap</span>
      </button>

      <nav className="nav-actions" aria-label="Primary">
        {user ? (
          <>
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
