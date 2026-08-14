import React, { useEffect, useState } from "react";
import { Trash2, BookOpen, GraduationCap, Zap, RefreshCw, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { getSkills, deleteSkill, boostSkillListing, renewSkillListingBoost } from "../api/skillApi";

const MySkills = ({ token }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    async function fetchSkills() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getSkills(token);
        setSkills(data);
      } catch (error) {
        console.error("Failed to load skills", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSkills();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      await deleteSkill(token, id);
      setSkills((currentSkills) => currentSkills.filter((skill) => skill._id !== id));
      showToast("Skill deleted successfully.");
    } catch (error) {
      console.error("Failed to delete skill", error);
      showToast(error.message || "Failed to delete skill");
    }
  };

  const handleBoost = async (id, skillName) => {
    try {
      const res = await boostSkillListing(token, id, 5.0);
      showToast(res.message || `"${skillName}" is now boosted for 7 days!`);
      const data = await getSkills(token);
      setSkills(data);
    } catch (error) {
      showToast(error.message || "Failed to boost skill");
    }
  };

  const handleRenew = async (id, skillName) => {
    try {
      const res = await renewSkillListingBoost(token, id);
      showToast(res.message || `Boost renewed for "${skillName}" (+7 days)!`);
      const data = await getSkills(token);
      setSkills(data);
    } catch (error) {
      showToast(error.message || "Failed to renew boost");
    }
  };

  function showToast(msg) {
    setActionMessage(msg);
    window.setTimeout(() => setActionMessage(""), 4500);
  }

  function getBoostInfo(skill) {
    if (!skill.isBoosted || !skill.boostExpiresAt) {
      return { status: "INACTIVE", label: "Not Boosted", color: "var(--muted)" };
    }

    const diff = new Date(skill.boostExpiresAt).getTime() - new Date().getTime();
    if (diff <= 0) {
      return { status: "EXPIRED", label: "Boost Expired", color: "var(--coral)" };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    if (days === 0 && hours <= 24) {
      return { status: "EXPIRING_SOON", label: `Expiring Soon (${hours}h left)`, color: "#f59e0b" };
    }

    return { status: "ACTIVE", label: `Active (${days}d ${hours}h left)`, color: "#10b981" };
  }

  if (loading) {
    return (
      <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
        <p>Loading skills...</p>
      </div>
    );
  }

  const teachingSkills = skills.filter((skill) => skill.type === "teach");
  const learningSkills = skills.filter((skill) => skill.type === "learn");
  const boostedCount = teachingSkills.filter((skill) => {
    const boost = getBoostInfo(skill);
    return boost.status === "ACTIVE" || boost.status === "EXPIRING_SOON";
  }).length;

  return (
    <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
      <div className="portfolio-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <p className="eyebrow">Skill Management & Visibility</p>
          <h1>My Skills</h1>
          <p>Manage your listings, activate 7-day visibility boosts, and monitor expiry notifications.</p>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: "0.9rem 1.2rem",
            background: "rgba(242, 195, 130, 0.15)",
            border: "1px solid rgba(242, 195, 130, 0.6)",
            borderRadius: "0.8rem",
            color: "var(--cream)",
            marginBottom: "1.5rem",
            fontWeight: "700"
          }}
        >
          {actionMessage}
        </div>
      )}

      <div className="portfolio-layout">
        <div>
          <div className="feed-heading">
            <h2>Skills I Can Teach ({teachingSkills.length})</h2>
          </div>

          {teachingSkills.length === 0 ? (
            <div className="empty-state">
              <span>You haven't listed any teaching skills yet.</span>
            </div>
          ) : (
            teachingSkills.map((skill) => {
              const boost = getBoostInfo(skill);
              const isBoostActive = boost.status === "ACTIVE" || boost.status === "EXPIRING_SOON";

              return (
                <div
                  className="portfolio-card"
                  key={skill._id}
                  style={{
                    border: isBoostActive ? "1px solid rgba(242, 195, 130, 0.6)" : "1px solid var(--line)",
                    background: isBoostActive ? "rgba(242, 195, 130, 0.05)" : "rgba(18, 14, 40, 0.7)"
                  }}
                >
                  <div className="portfolio-image-fallback" style={{ color: isBoostActive ? "var(--cream)" : "var(--lavender)" }}>
                    <GraduationCap size={44} />
                  </div>
                  <div className="portfolio-card-body">
                    <div className="portfolio-card-top">
                      <h3>{skill.skillName}</h3>
                      {isBoostActive && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "999px",
                            background: "linear-gradient(135deg, var(--cream), var(--coral))",
                            color: "#17102b",
                            fontWeight: "900",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          <Zap size={12} fill="#17102b" /> FEATURED
                        </span>
                      )}
                    </div>

                    <div className="tag-row">
                      <span>{skill.proficiency}</span>
                      <span>{skill.sessionDuration} Mins</span>
                      <span>{skill.preferredFormat}</span>
                    </div>

                    {skill.description && <p>{skill.description}</p>}

                    <div style={{ margin: "0.85rem 0 0.5rem", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                      {boost.status === "ACTIVE" && <CheckCircle size={15} color="#10b981" />}
                      {boost.status === "EXPIRING_SOON" && <AlertCircle size={15} color="#f59e0b" />}
                      {boost.status === "EXPIRED" && <Clock size={15} color="var(--coral)" />}
                      <span style={{ color: boost.color, fontWeight: "700" }}>
                        Boost: {boost.label}
                      </span>
                    </div>

                    <div className="portfolio-actions" style={{ marginTop: "1rem", flexWrap: "wrap", gap: "0.6rem" }}>
                      {!isBoostActive ? (
                        <button className="primary-button small" type="button" onClick={() => handleBoost(skill._id, skill.skillName)}>
                          <Zap size={15} /> Boost for 7 Days ($5)
                        </button>
                      ) : (
                        <button
                          className="ghost-button small"
                          type="button"
                          onClick={() => handleRenew(skill._id, skill.skillName)}
                          style={{ borderColor: "rgba(242, 195, 130, 0.4)", color: "var(--cream)" }}
                        >
                          <RefreshCw size={15} /> Renew Boost (+7 Days)
                        </button>
                      )}

                      <button className="ghost-button danger small" type="button" onClick={() => handleDelete(skill._id)}>
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="feed-heading" style={{ marginTop: "3rem" }}>
            <h2>Skills I Want To Learn ({learningSkills.length})</h2>
          </div>

          {learningSkills.length === 0 ? (
            <div className="empty-state">
              <span>You haven't listed any learning skills yet.</span>
            </div>
          ) : (
            learningSkills.map((skill) => (
              <div className="portfolio-card" key={skill._id}>
                <div className="portfolio-image-fallback">
                  <BookOpen size={44} />
                </div>
                <div className="portfolio-card-body">
                  <div className="portfolio-card-top">
                    <h3>{skill.skillName}</h3>
                  </div>
                  <div className="tag-row">
                    <span>{skill.proficiency}</span>
                    <span>{skill.sessionDuration} Mins</span>
                    <span>{skill.preferredFormat}</span>
                  </div>
                  {skill.description && <p>{skill.description}</p>}
                  <div className="portfolio-actions" style={{ marginTop: "1rem" }}>
                    <button className="ghost-button danger small" type="button" onClick={() => handleDelete(skill._id)}>
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          <div className="portfolio-stat">
            <Zap size={32} />
            <strong>{boostedCount}</strong>
            <span>Active Boosted Skills</span>
          </div>

          <div className="portfolio-stat">
            <BookOpen size={32} />
            <strong>{skills.length}</strong>
            <span>Total Skills Tracked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MySkills;