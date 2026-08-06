import { BriefcaseBusiness, CalendarDays, LayoutDashboard, Sparkles, Star } from "lucide-react";
import React from "react";
import { memberFeatures } from "../data/memberFeatures.js";

const featureIcons = {
  "ai-matching": Sparkles,
  "session-scheduling": CalendarDays,
  "portfolio-showcase": BriefcaseBusiness,
  "trust-reviews": Star
};

function SideNav({ view, setView }) {
  return (
    <aside className="side-nav" aria-label="Feature navigation">
      <div className="side-nav-title">
        <span>SkillSwap</span>
        <strong>Workspace</strong>
      </div>

      <button
        className={`side-nav-item ${view === "dashboard" ? "active" : ""}`}
        type="button"
        onClick={() => setView("dashboard")}
      >
        <LayoutDashboard size={19} />
        Dashboard
      </button>

      <div className="side-nav-divider" />

      {memberFeatures.map((feature) => {
        const Icon = featureIcons[feature.id];

        return (
          <button
            className={`side-nav-item ${view === feature.id ? "active" : ""}`}
            type="button"
            key={feature.id}
            onClick={() => setView(feature.id)}
          >
            <Icon size={19} />
            {feature.title}
          </button>
        );
      })}
    </aside>
  );
}

export default SideNav;
