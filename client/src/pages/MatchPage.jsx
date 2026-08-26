import React, { useEffect, useState } from "react";
import { UsersRound, Sparkles } from "lucide-react";
import { sendMatchRequest } from "../api/matchApi";
import { getMatches } from "../api/skillApi";

const MatchPage = ({ token, showAlternativeOnly = false }) => {
  const [loading, setLoading] = useState(true);
  const [directMatches, setDirectMatches] = useState([]);
  const [partialMatches, setPartialMatches] = useState([]);
  const [exploreMatches, setExploreMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMatches() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getMatches(token);
        setDirectMatches(data.directMatches || []);
        setPartialMatches(data.partialMatches || []);
        setExploreMatches(data.exploreMatches || []);
      } catch (err) {
        console.error("Failed to load matches", err);
        setError("Could not load your matches. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [token]);

  if (loading) {
    return (
      <section className="dashboard-page" style={{ paddingTop: "2rem" }}>
        <p>Finding the best matches for you...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page" style={{ paddingTop: "2rem" }}>
        <p className="error-message">{error}</p>
      </section>
    );
  }

  return (
    <section className="dashboard-page" style={{ paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div className="dashboard-hero" style={{ marginBottom: "2rem" }}>
        <div>
          <p className="eyebrow">{showAlternativeOnly ? "Alternative Skills" : "AI-Powered Skill Matching"}</p>
          <h1>{showAlternativeOnly ? "Discover Alternative Matches" : "Your Skill Matches"}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gap: "2rem" }}>
        {/* Direct Matches Section */}
        {!showAlternativeOnly && directMatches.length > 0 ? (
          <div>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <UsersRound size={24} /> Direct Matches
            </h2>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
              These users want to learn what you teach and teach what you want to learn!
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {directMatches.map((user) => (
                <MatchCard key={user.id} user={user} type="direct" token={token} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Partial Matches Section */}
        {!showAlternativeOnly && directMatches.length === 0 && (
          <div style={{ background: "rgba(255,107,107,0.1)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,107,107,0.2)" }}>
            <h2 style={{ color: "var(--coral)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Sparkles size={24} /> No direct matches found.
            </h2>
            <p>
              Here are some partial matches. <strong>To find more matches, consider adding more skills you can teach!</strong>
            </p>
          </div>
        )}

        {partialMatches.length > 0 && (
          <div style={{ marginTop: (!showAlternativeOnly && directMatches.length > 0) ? "2rem" : "1rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Sparkles size={24} /> Alternative Skill Finder (Partial Matches)
            </h2>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
              These users have skills you want to learn, or want to learn skills you teach.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {partialMatches.map((user) => (
                <MatchCard key={user.id} user={user} type="partial" token={token} />
              ))}
            </div>
          </div>
        )}

        {/* Explore Matches Section (for alternative skills view) */}
        {showAlternativeOnly && exploreMatches.length > 0 && partialMatches.length === 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Sparkles size={24} /> Explore Alternative Profiles
            </h2>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>
              We couldn't find any partial matches based on your current skills. 
              Here are some other users you can connect with! Add their skills to your profile to match with them.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {exploreMatches.map((user) => (
                <MatchCard key={user.id} user={user} type="explore" token={token} />
              ))}
            </div>
          </div>
        )}

        {directMatches.length === 0 && partialMatches.length === 0 && exploreMatches.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", background: "rgba(255,255,255,0.05)", borderRadius: "1rem" }}>
            <h3>No matches yet!</h3>
            <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
              We couldn't find anyone who matches your skills right now.
              Try adding more teaching and learning skills to expand your network.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

// Helper component for displaying a user card
function MatchCard({ user, type, token }) {
  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
  const [status, setStatus] = useState("idle"); // idle, loading, sent, error
  const [errorMsg, setErrorMsg] = useState("");
  
  const getSkillNames = (skills) => {
    if (!skills || !Array.isArray(skills)) return "None specified";
    if (skills.length === 0) return "None specified";
    return skills.map(s => s.skillName || s).join(", ");
  };

  const handleConnect = async () => {
    try {
      setStatus("loading");
      await sendMatchRequest(token, user.id || user._id);
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to send request");
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "1rem",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <img
          src={user.profilePhoto ? `${backendUrl}${user.profilePhoto}` : "https://via.placeholder.com/60"}
          alt={user.name}
          style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
        />
        <div>
          <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{user.name}</h3>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
            {type === "direct" && "🌟 Direct Match"}
            {type === "partial" && "✨ Partial Match"}
            {type === "explore" && "🧭 Alternative Profile"}
          </span>
        </div>
      </div>
      
      <div style={{ fontSize: "0.9rem" }}>
        {user.bio ? (
          <p style={{ color: "var(--muted)", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            "{user.bio}"
          </p>
        ) : null}

        <div style={{ marginBottom: "0.5rem" }}>
          <strong>They Teach:</strong>{" "}
          <span style={{ color: "var(--muted)" }}>
            {getSkillNames(user.teachingSkills)}
          </span>
        </div>
        
        <div style={{ marginBottom: (type === "partial" || type === "explore") ? "1rem" : "0" }}>
          <strong>They Want to Learn:</strong>{" "}
          <span style={{ color: "var(--muted)" }}>
            {getSkillNames(user.learningSkills)}
          </span>
        </div>

        {(type === "partial" || type === "explore") && (user.missingToTeach?.length > 0 || user.missingToLearn?.length > 0) && (
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "1rem", borderRadius: "0.5rem", borderLeft: "3px solid var(--coral)" }}>
            <strong style={{ display: "block", marginBottom: "0.5rem", color: "var(--coral)" }}>💡 Alternative Skills to Match:</strong>
            
            {user.missingToTeach?.length > 0 && (
              <div style={{ marginBottom: "0.5rem" }}>
                Consider teaching: <strong>{getSkillNames(user.missingToTeach)}</strong>
              </div>
            )}
            
            {user.missingToLearn?.length > 0 && (
              <div>
                Consider learning: <strong>{getSkillNames(user.missingToLearn)}</strong>
              </div>
            )}
          </div>
        )}
      </div>
      
      {status === "error" && (
        <p style={{ color: "var(--coral)", fontSize: "0.85rem", margin: "0" }}>{errorMsg}</p>
      )}
      
      <button 
        className="primary-button" 
        style={{ 
          marginTop: "auto", 
          opacity: status === "sent" ? 0.7 : 1,
          cursor: status === "sent" || status === "loading" ? "not-allowed" : "pointer" 
        }}
        onClick={handleConnect}
        disabled={status === "sent" || status === "loading"}
      >
        {status === "loading" ? "Sending..." : status === "sent" ? "Request Sent" : "Connect"}
      </button>
    </div>
  );
}

export default MatchPage;
