import React, { useState } from "react";
import { PlusCircle } from "lucide-react";
import { addSkill } from "../api/skillApi";
import Field from "../components/Field";

const AddSkill = ({ token }) => {
  const [form, setForm] = useState({
    skillName: "",
    type: "teach",
    proficiency: "Beginner",
    sessionDuration: 60,
    preferredFormat: "Online",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: name === "sessionDuration" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    setError("");

    try {
      setLoading(true);
      await addSkill(token, form);
      alert("Skill Added Successfully!");
      setForm({
        skillName: "",
        type: "teach",
        proficiency: "Beginner",
        sessionDuration: 60,
        preferredFormat: "Online",
        description: "",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add skill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
      <div className="portfolio-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1>Add New Skill</h1>
          <p>Share what you can teach or tell the community what you want to learn next.</p>
        </div>
      </div>

      <div className="portfolio-layout">
        <form className="portfolio-form" onSubmit={handleSubmit}>
          <div className="feed-heading">
            <span>Skill Details</span>
          </div>

          <Field
            label="Skill Name"
            placeholder="e.g. Advanced React Patterns"
            value={form.skillName}
            onChange={(val) => handleChange("skillName", val)}
          />

          <div className="two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <label className="field">
              <span>Skill Type</span>
              <select
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              >
                <option value="teach">I Can Teach</option>
                <option value="learn">I Want To Learn</option>
              </select>
            </label>

            <label className="field">
              <span>Proficiency</span>
              <select
                value={form.proficiency}
                onChange={(e) => handleChange("proficiency", e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </label>
          </div>

          <div className="two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field
              label="Session Duration (Minutes)"
              type="number"
              value={form.sessionDuration}
              onChange={(val) => handleChange("sessionDuration", val)}
            />

            <label className="field">
              <span>Preferred Format</span>
              <select
                value={form.preferredFormat}
                onChange={(e) => handleChange("preferredFormat", e.target.value)}
              >
                <option>Online</option>
                <option>Offline</option>
                <option>Hybrid</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Description</span>
            <textarea
              placeholder="Briefly describe what this skill covers..."
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </label>

          {error && <p className="form-error" style={{ color: "var(--coral)" }}>{error}</p>}

          <button className="primary-button full" type="submit" disabled={loading}>
            <PlusCircle size={18} />
            {loading ? "Saving..." : "Save Skill"}
          </button>
        </form>
        
        <div className="portfolio-stat" style={{ alignSelf: "start" }}>
          <strong>Tips for Success</strong>
          <span style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            - Be specific about what you know.
            <br />
            - Accurate proficiency levels lead to better matches.
            <br />
            - A good description sets expectations.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddSkill;