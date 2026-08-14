import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, BrainCircuit, Clock, MapPin, Star, UserRoundCheck, Video } from "lucide-react";
import { getSkillMatches } from "../api/skillApi";

function AiMatchingPage({ token, onScheduleSession }) {
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      if (!token) return;

      try {
        setLoading(true);
        setError("");
        const data = await getSkillMatches(token);
        setMatches(data.matches || []);
        setMessage(data.message || "");
      } catch (err) {
        setError(err.message || "Failed to load matches.");
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [token]);

  const bestScore = useMemo(() => {
    if (matches.length === 0) {
      return 0;
    }

    return Math.max(...matches.map((match) => match.score));
  }, [matches]);

  if (loading) {
    return (
      <div className="portfolio-page ai-matching-page">
        <p>Finding your best skill matches...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-page ai-matching-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">AI-powered skill matching</p>
          <h1>Discover Matches</h1>
          <p>
            Find members who can teach the skills you want to learn. The score is based on skill fit,
            format, proficiency, duration, and description similarity.
          </p>
        </div>

        <div className="portfolio-stat">
          <BrainCircuit size={32} />
          <strong>{bestScore}%</strong>
          <span>Best match score</span>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {matches.length === 0 ? (
        <div className="empty-state match-empty-state">
          <BrainCircuit size={34} />
          <strong>No matches found yet</strong>
          <span>{message || "Add more learning skills or wait for other members to add teachable skills."}</span>
        </div>
      ) : (
        <div className="match-grid">
          {matches.map((match) => (
            <article className="match-card" key={match.id}>
              <div className="match-card-top">
                <div>
                  <span className="match-label">Recommended teacher</span>
                  <h2>{match.teacher.name}</h2>
                </div>

                <div className="match-score-pill">
                  <strong>{match.score}%</strong>
                  <span>match</span>
                </div>
              </div>

              <div className="match-skill-pair">
                <div>
                  <BookOpen size={18} />
                  <span>You want to learn</span>
                  <strong>{match.learningSkill.skillName}</strong>
                </div>

                <div>
                  <UserRoundCheck size={18} />
                  <span>They can teach</span>
                  <strong>{match.teacherSkill.skillName}</strong>
                </div>
              </div>

              <div className="tag-row">
                <span>{match.teacherSkill.proficiency}</span>
                <span>{match.teacherSkill.preferredFormat}</span>
                <span>{match.teacherSkill.sessionDuration} mins</span>
                <span>{match.teacher.availability}</span>
              </div>

              {match.teacherSkill.description ? (
                <p>{match.teacherSkill.description}</p>
              ) : (
                <p>This member has not added a teaching description yet.</p>
              )}

              <div className="match-meta">
                <span>
                  <Video size={16} />
                  {match.teacher.preferredFormat}
                </span>
                <span>
                  <Clock size={16} />
                  {match.teacherSkill.sessionDuration} min session
                </span>
                <span>
                  <MapPin size={16} />
                  {match.teacher.location || "Location not set"}
                </span>
                <span>
                  <Star size={16} />
                  {match.teacher.rating ? `${match.teacher.rating}/5` : "New member"}
                </span>
              </div>

              <button
                className="primary-button full"
                type="button"
                onClick={() => onScheduleSession(match)}
              >
                Request Session
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AiMatchingPage;
