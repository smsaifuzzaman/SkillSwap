import {
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
  Star,
  User,
  BookOpen,
  PlusCircle,
  Zap,
  TrendingUp
} from "lucide-react";
import React from "react";
import { memberFeatures } from "../data/memberFeatures.js";

const featureIcons = {
  "ai-matching": Sparkles,
  "session-scheduling": CalendarDays,
  "session-progress": TrendingUp,
  "portfolio-showcase": BriefcaseBusiness,
  "trust-reviews": Star,
};

function SideNav({ view, setView }) {
  return (
    <aside className="side-nav">
      <div className="side-nav-brand">
        <h2>SkillSwap</h2>
        <span>Workspace</span>
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

      <button
        className={`side-nav-item ${view === "profile" ? "active" : ""}`}
        type="button"
        onClick={() => setView("profile")}
      >
        <User size={19} />
        Profile
      </button>

      <button
        className={`side-nav-item ${view === "my-skills" ? "active" : ""}`}
        type="button"
        onClick={() => setView("my-skills")}
      >
        <BookOpen size={19} />
        My Skills
      </button>

      <button
        className={`side-nav-item ${view === "featured-skills" ? "active" : ""}`}
        type="button"
        onClick={() => setView("featured-skills")}
      >
        <Zap size={19} />
        Featured Listings
      </button>

      <button
        className={`side-nav-item ${view === "add-skill" ? "active" : ""}`}
        type="button"
        onClick={() => setView("add-skill")}
      >
        <PlusCircle size={19} />
        Add Skill
      </button>

      <button
        className={`side-nav-item ${view === "alternative-skills" ? "active" : ""}`}
        type="button"
        onClick={() => setView("alternative-skills")}
      >
        <Sparkles size={19} />
        Alternative Skills
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
            {Icon ? <Icon size={19} /> : null}
            {feature.title}
          </button>
        );
      })}
    </aside>
  );
}

export default SideNav;