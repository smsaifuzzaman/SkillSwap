import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  LogIn,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import React from "react";

function LandingPage({ user, setView }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Peer-to-peer learning without course fees</p>
        <h1>Swap the skill you know for the skill you want.</h1>
        <p className="hero-text">
          SkillSwap connects learners, teachers, and project teams through skill profiles, trusted swap
          requests, scheduling, portfolios, and reviews.
        </p>

        <div className="hero-actions">
          {user ? (
            <a className="primary-button" href="#dashboard-preview">
              <Sparkles size={18} />
              View demo space
            </a>
          ) : (
            <>
              <button className="primary-button" type="button" onClick={() => setView("signup")}>
                <UserPlus size={18} />
                Create account
              </button>
              <button className="ghost-button strong" type="button" onClick={() => setView("login")}>
                <LogIn size={18} />
                Login
              </button>
            </>
          )}
        </div>
      </div>

      <div className="hero-panel" id="dashboard-preview" aria-label="SkillSwap demo dashboard preview">
        <div className="phone-frame">
          <div className="phone-top">
            <span>Match board</span>
            <ShieldCheck size={18} />
          </div>
          <div className="match-score">
            <span>92%</span>
            <p>compatibility</p>
          </div>
          <div className="task-card warm">
            <div>
              <strong>Teach React basics</strong>
              <span>Offered by you</span>
            </div>
            <ArrowRight size={20} />
          </div>
          <div className="task-card cool">
            <div>
              <strong>Learn UI prototyping</strong>
              <span>Wanted skill</span>
            </div>
            <BookOpen size={20} />
          </div>
          <div className="session-strip">
            <CalendarCheck size={18} />
            <span>Next swap: Friday, 7:30 PM</span>
          </div>
        </div>

        <div className="illustration-card top">
          <Users size={46} />
          <span>Group skills</span>
        </div>
        <div className="illustration-card bottom">
          <MessageCircle size={46} />
          <span>Live planning</span>
        </div>
      </div>
    </section>
  );
}

export default LandingPage;
