import React from "react";

function AuthLayout({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">SkillSwap access</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </div>
    </section>
  );
}

export default AuthLayout;
