import { UsersRound, ShieldCheck, Star, Award, Zap, BookOpen, Clock, Users, ArrowRight } from "lucide-react";
import React from "react";

function DashboardPage({ user, setView }) {
  const firstName = user?.name?.split(" ")[0] || "SkillSwapper";
  const learningCount = user?.learningSkills?.length || 0;
  const teachingCount = user?.teachingSkills?.length || 0;
  const totalSwaps = user?.totalSwaps || 0;
  const trustScore = user?.trustScore || 0;
  const rating = user?.rating || 0;

  return (
    <section className="dashboard-page" style={{ padding: "2rem 0", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Hero Section */}
      <div className="dashboard-hero" style={{ 
        background: "linear-gradient(rgba(18, 14, 40, 0.75), rgba(18, 14, 40, 0.9)), url('/dashboard_bg_user.png')", 
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "1px solid rgba(180, 139, 241, 0.2)", 
        borderRadius: "1.25rem", 
        padding: "3rem", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: "2rem", 
        flexWrap: "wrap",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}>
        <div>
          <p className="eyebrow" style={{ color: "var(--primary)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>SkillSwap Workspace</p>
          <h1 style={{ fontSize: "2.5rem", margin: "0.5rem 0 1rem", letterSpacing: "-1px" }}>Welcome back, {firstName}! 👋</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", lineHeight: 1.6 }}>
            Ready to learn something new today? Discover peers, share your knowledge, and find the perfect skill swap matches in your community.
          </p>
        </div>

        <div className="dashboard-summary" style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(180, 139, 241, 0.3)", backdropFilter: "blur(10px)", borderRadius: "1rem", padding: "1.5rem", maxWidth: "350px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", color: "var(--primary)" }}>
            <UsersRound size={28} />
            <strong style={{ fontSize: "1.2rem", color: "var(--text)" }}>Build your network</strong>
          </div>
          <span style={{ color: "var(--text-secondary)", display: "block", lineHeight: 1.5 }}>
            Discover peers, showcase your skills, plan sessions, and grow trust through real exchanges.
          </span>
          <button onClick={() => setView?.("community-search")} className="ghost-button" style={{ marginTop: "1rem", color: "var(--primary)", padding: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            Explore Community <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ background: "rgba(99, 230, 165, 0.15)", color: "#63e6a5", padding: "0.75rem", borderRadius: "0.75rem" }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Trust Score</span>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text)" }}>{trustScore}</div>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ background: "rgba(180, 139, 241, 0.15)", color: "#b48bf1", padding: "0.75rem", borderRadius: "0.75rem" }}>
            <Star size={28} />
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Community Rating</span>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text)" }}>{rating.toFixed(1)} <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 400 }}>/ 5.0</span></div>
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ background: "rgba(255, 184, 108, 0.15)", color: "#ffb86c", padding: "0.75rem", borderRadius: "0.75rem" }}>
            <Award size={28} />
          </div>
          <div>
            <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>Completed Swaps</span>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem", color: "var(--text)" }}>{totalSwaps}</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          
          {/* Action Card 1 */}
          <button 
            onClick={() => setView?.("ai-matching")}
            style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "1rem" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ background: "var(--surface-light)", padding: "0.75rem", borderRadius: "50%", width: "fit-content", color: "var(--text)" }}>
              <Zap size={24} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Find AI Matches</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>Discover users who want to learn what you teach and vice versa.</p>
            </div>
          </button>

          {/* Action Card 2 */}
          <button 
            onClick={() => setView?.("my-skills")}
            style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "1rem" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ background: "var(--surface-light)", padding: "0.75rem", borderRadius: "50%", width: "fit-content", color: "var(--text)" }}>
              <BookOpen size={24} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Update My Skills</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>Add more teaching or learning skills to improve your match rate.</p>
            </div>
          </button>

          {/* Action Card 3 */}
          <button 
            onClick={() => setView?.("session-scheduling")}
            style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "1rem" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ background: "var(--surface-light)", padding: "0.75rem", borderRadius: "50%", width: "fit-content", color: "var(--text)" }}>
              <Clock size={24} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Schedule a Session</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>Set up a time to swap skills with one of your matches.</p>
            </div>
          </button>

          {/* Action Card 4 */}
          <button 
            onClick={() => setView?.("team")}
            style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.5rem", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "1rem" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ background: "var(--surface-light)", padding: "0.75rem", borderRadius: "50%", width: "fit-content", color: "var(--text)" }}>
              <Users size={24} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Team Workspaces</h3>
              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>Join groups to participate in multi-person group skill swaps.</p>
            </div>
          </button>

        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
