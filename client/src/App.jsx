import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, signupUser } from "./api/authApi.js";
import Header from "./components/Header.jsx";
import SideNav from "./components/SideNav.jsx";
import Toast from "./components/Toast.jsx";
import { memberFeatures } from "./data/memberFeatures.js";
import AiMatchingPage from "./pages/AiMatchingPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import FeaturePage from "./pages/FeaturePage.jsx";
import FeaturedSkillsPage from "./pages/FeaturedSkillsPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MatchPage from "./pages/MatchPage";
import PortfolioShowcasePage from "./pages/PortfolioShowcasePage.jsx";
import Profile from "./pages/Profile";
import AddSkill from "./pages/AddSkill";
import MySkills from "./pages/MySkills";
import SessionProgressPage from "./pages/SessionProgressPage.jsx";
import SessionSchedulingPage from "./pages/SessionSchedulingPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import { parseError } from "./utils/errors.js";

function App() {
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("skillswap_token"));
  const [status, setStatus] = useState({ type: "", message: "" });
  const [schedulingDraft, setSchedulingDraft] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!token) {
        return;
      }

      try {
        const data = await getCurrentUser(token);
        setUser(data.user);
        setView((currentView) => (currentView === "landing" ? "dashboard" : currentView));
      } catch (error) {
        localStorage.removeItem("skillswap_token");
        setToken(null);
        setUser(null);
        setStatus({ type: "error", message: parseError(error) });
      }
    }

    loadProfile();
  }, [token]);

  useEffect(() => {
    if (!status.message) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setStatus({ type: "", message: "" });
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [status.message]);

  const initials = useMemo(() => {
    if (!user?.name) {
      return "SS";
    }

    return user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [user]);

  async function handleAuth(action, payload) {
    setStatus({ type: "", message: "" });

    const data = action === "signup" ? await signupUser(payload) : await loginUser(payload);

    localStorage.setItem("skillswap_token", data.token);
    setToken(data.token);
    setUser(data.user);
    setView("dashboard");
    setStatus({
      type: "success",
      message: action === "signup" ? "Account created. Welcome to SkillSwap." : "Welcome back."
    });
  }

  function handleLogout() {
    localStorage.removeItem("skillswap_token");
    setToken(null);
    setUser(null);
    setView("landing");
    setStatus({ type: "success", message: "You have been logged out." });
  }

  function handleScheduleFromMatch(match) {
    setSchedulingDraft({
      skillName: match.learningSkill.skillName,
      partnerName: match.teacher.name,
      partnerId: match.teacher.id,
      durationMinutes: String(match.teacherSkill.sessionDuration || 60),
      format: match.teacherSkill.preferredFormat || match.teacher.preferredFormat || "Online",
      location: match.teacher.location || "",
      notes: `Requested from AI match: ${match.teacher.name} can teach ${match.teacherSkill.skillName}.`
    });
    setView("session-scheduling");
  }

  const selectedFeature = memberFeatures.find((feature) => feature.id === view);

  return (
    <div className="app-shell">
      <div className="background-grid" />
      <Header user={user} initials={initials} setView={setView} onLogout={handleLogout} />
      <Toast status={status} />

      <main className={user ? "app-main with-sidebar" : "app-main"}>
        {user ? <SideNav view={view === "landing" ? "dashboard" : view} setView={setView} /> : null}

        <div className={user ? "content-panel" : undefined}>
          {view === "landing" && !user ? (
            <LandingPage user={user} setView={setView} />
          ) : null}

          {view === "dashboard" || (view === "landing" && user) ? (
            <DashboardPage user={user} />
          ) : null}

          {view === "portfolio-showcase" ? (
            <PortfolioShowcasePage token={token} />
          ) : null}

          {view === "ai-matching" ? (
            <AiMatchingPage token={token} onScheduleSession={handleScheduleFromMatch} />
          ) : null}

          {view === "session-scheduling" ? (
            <SessionSchedulingPage
              user={user}
              token={token}
              draft={schedulingDraft}
              onDraftApplied={() => setSchedulingDraft(null)}
            />
          ) : null}

          {view === "session-progress" ? (
            <SessionProgressPage token={token} />
          ) : null}

          {view === "profile" ? (
            <Profile user={user} token={token} />
          ) : null}

          {view === "my-skills" ? (
            <MySkills token={token} />
          ) : null}

          {view === "featured-skills" ? (
            <FeaturedSkillsPage />
          ) : null}

          {view === "add-skill" ? (
            <AddSkill token={token} />
          ) : null}

          {view === "alternative-skills" ? (
            <MatchPage token={token} showAlternativeOnly={true} />
          ) : null}

          {selectedFeature &&
            ![
              "ai-matching",
              "session-scheduling",
              "session-progress",
              "portfolio-showcase",
              "profile",
              "my-skills",
              "add-skill",
              "featured-skills",
              "alternative-skills"
            ].includes(view) ? (
              <FeaturePage feature={selectedFeature} />
            ) : null}

          {view === "login" ? (
            <LoginPage
              onSubmit={(payload) => handleAuth("login", payload)}
              setView={setView}
            />
          ) : null}

          {view === "signup" ? (
            <SignupPage
              onSubmit={(payload) => handleAuth("signup", payload)}
              setView={setView}
            />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
