import { UsersRound } from "lucide-react";
import React from "react";

function DashboardPage({ user }) {
  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">SkillSwap workspace</p>
          <h1>Welcome, {user?.name?.split(" ")[0] || "SkillSwapper"}.</h1>
        </div>

        <div className="dashboard-summary" aria-label="Project summary">
          <UsersRound size={28} />
          <strong>Build your learning network</strong>
          <span>Discover peers, showcase your skills, plan sessions, and grow trust through real exchanges.</span>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
