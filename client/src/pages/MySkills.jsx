import React, { useEffect, useState } from "react";
import { Trash2, BookOpen, GraduationCap } from "lucide-react";
import { getSkills, deleteSkill } from "../api/skillApi";

const MySkills = ({ token }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setSkills(skills.filter((skill) => skill._id !== id));
    } catch (error) {
      console.error("Failed to delete skill", error);
      alert("Failed to delete skill");
    }
  };

  if (loading) {
    return (
      <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
        <p>Loading skills...</p>
      </div>
    );
  }

  const teachingSkills = skills.filter(s => s.type === "teach");
  const learningSkills = skills.filter(s => s.type === "learn");

  return (
    <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
      <div className="portfolio-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1>My Skills</h1>
          <p>Manage the skills you offer and the ones you are currently looking to learn.</p>
        </div>
      </div>

      <div className="portfolio-layout">
        <div>
          <div className="feed-heading">
            <h2>Skills I Can Teach</h2>
          </div>
          {teachingSkills.length === 0 ? (
            <div className="empty-state">
              <span>You haven't listed any teaching skills yet.</span>
            </div>
          ) : (
            teachingSkills.map((skill) => (
              <div className="portfolio-card" key={skill._id}>
                <div className="portfolio-image-fallback">
                  <GraduationCap size={48} />
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
                  <div className="portfolio-actions" style={{ marginTop: "1rem", justifyContent: "flex-start" }}>
                    <button className="ghost-button danger small" onClick={() => handleDelete(skill._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="feed-heading" style={{ marginTop: "3rem" }}>
            <h2>Skills I Want To Learn</h2>
          </div>
          {learningSkills.length === 0 ? (
            <div className="empty-state">
              <span>You haven't listed any learning skills yet.</span>
            </div>
          ) : (
            learningSkills.map((skill) => (
              <div className="portfolio-card" key={skill._id}>
                <div className="portfolio-image-fallback">
                  <BookOpen size={48} />
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
                  <div className="portfolio-actions" style={{ marginTop: "1rem", justifyContent: "flex-start" }}>
                    <button className="ghost-button danger small" onClick={() => handleDelete(skill._id)}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
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