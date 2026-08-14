import React, { useEffect, useState } from "react";
import { Zap, Clock, Video, MapPin, Star } from "lucide-react";
import { getFeaturedSkills } from "../api/skillApi";

export default function FeaturedSkillsPage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatured();
  }, []);

  async function loadFeatured() {
    try {
      setLoading(true);
      const data = await getFeaturedSkills();
      setFeatured(data.skills || []);
    } catch (err) {
      console.error("Failed to load featured skills", err);
    } finally {
      setLoading(false);
    }
  }

  function getDaysLeft(date) {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}d left` : "Ending soon";
  }

  return (
    <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">High-Visibility Marketplace</p>
          <h1>Featured Skill Listings</h1>
          <p>Explore active 7-day boosted skill listings from mentors across SkillSwap.</p>
        </div>
        <div className="portfolio-stat">
          <Zap size={32} />
          <strong>{featured.length}</strong>
          <span>Actively Featured</span>
        </div>
      </div>

      {loading ? (
        <p>Loading featured skills...</p>
      ) : featured.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <Zap size={34} color="var(--cream)" />
          <strong>No active featured listings right now.</strong>
          <span>Boost any teaching skill from your "My Skills" page to feature it here!</span>
        </div>
      ) : (
        <div className="match-grid" style={{ marginTop: "2rem" }}>
          {featured.map((skill) => (
            <article className="match-card" key={skill._id} style={{ border: "1px solid rgba(242, 195, 130, 0.45)" }}>
              <div className="match-card-top">
                <div>
                  <span className="match-label" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <Zap size={14} fill="var(--cream)" /> 7-Day Boosted ({getDaysLeft(skill.boostExpiresAt)})
                  </span>
                  <h2>{skill.skillName}</h2>
                  <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>By {skill.owner?.name || "SkillSwap Mentor"}</span>
                </div>
              </div>

              <div className="tag-row">
                <span>{skill.proficiency}</span>
                <span>{skill.preferredFormat}</span>
                <span>{skill.sessionDuration} mins</span>
              </div>

              <p>{skill.description || "Mentor offering 1-on-1 practical skill exchange."}</p>

              <div className="match-meta">
                <span><Video size={16} /> {skill.preferredFormat}</span>
                <span><Clock size={16} /> {skill.sessionDuration} min</span>
                <span><MapPin size={16} /> {skill.owner?.location || "Online"}</span>
                <span><Star size={16} /> {skill.owner?.rating ? `${skill.owner.rating}/5` : "5.0/5"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}