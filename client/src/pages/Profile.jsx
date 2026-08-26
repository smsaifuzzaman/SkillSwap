import React, { useEffect, useState } from "react";
import { Edit2, Save, Plus, X, Star, Camera } from "lucide-react";
import { getProfile, updateProfile, uploadProfilePhoto } from "../api/profileApi";

const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "";
import Field from "../components/Field";

const Profile = ({ token }) => {
  const [editing, setEditing] = useState(false);
  const [desiredSkill, setDesiredSkill] = useState("");
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    availability: "Anytime",
    preferredFormat: "Online",
    desiredSkills: [],
    rating: 0,
    totalSwaps: 0,
  });

  useEffect(() => {
    async function loadProfile() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await getProfile(token);
        setProfile(data.user);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [token]);

  function handleChange(name, value) {
    setProfile({
      ...profile,
      [name]: value,
    });
  }

  function handleAddDesiredSkill() {
    if (!desiredSkill.trim()) return;
    setProfile({
      ...profile,
      desiredSkills: [...(profile.desiredSkills || []), desiredSkill],
    });
    setDesiredSkill("");
  }

  function handleDeleteSkill(index) {
    setProfile({
      ...profile,
      desiredSkills: profile.desiredSkills.filter((_, i) => i !== index),
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      let finalProfile = { ...profile };
      
      // If there is un-added text in the input, add it automatically before saving
      if (desiredSkill.trim()) {
        finalProfile.desiredSkills = [...(profile.desiredSkills || []), desiredSkill.trim()];
        setProfile(finalProfile);
        setDesiredSkill("");
      }
      
      await updateProfile(token, finalProfile);
      alert("Profile Updated Successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await uploadProfilePhoto(token, file);
      setProfile(data.user);
      alert("Photo uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    }
  }

  if (loading) {
    return (
      <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="portfolio-page" style={{ paddingTop: "2rem" }}>
      <div className="portfolio-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1>My Profile</h1>
          <p>Keep your contact details, bio, and availability up to date.</p>
        </div>
        <div style={{ alignSelf: "end" }}>
          {!editing ? (
            <button className="primary-button" onClick={() => setEditing(true)}>
              <Edit2 size={18} /> Edit Profile
            </button>
          ) : (
            <button className="ghost-button strong" onClick={() => setEditing(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="portfolio-layout">
        <form className="portfolio-form" onSubmit={handleSave}>
          <div className="feed-heading">
            <span>Basic Information</span>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", alignItems: "center" }}>
            <label style={{ position: "relative", cursor: "pointer", display: "inline-block" }}>
              <img
                src={profile.profilePhoto ? `${backendUrl}${profile.profilePhoto}` : "https://via.placeholder.com/120"}
                alt="Profile"
                style={{ width: "90px", height: "90px", borderRadius: "2rem", border: "2px solid rgba(255,255,255,0.1)", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", bottom: "-5px", right: "-5px", background: "var(--cream)", color: "var(--ink)", borderRadius: "50%", padding: "0.4rem", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                <Camera size={16} />
              </div>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </label>
            <div style={{ flex: 1 }}>
              {editing ? (
                <Field
                  label="Name"
                  value={profile.name}
                  onChange={(val) => handleChange("name", val)}
                  required
                />
              ) : (
                <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.6rem" }}>{profile.name}</h2>
              )}
              {!editing && <span style={{ color: "var(--muted)" }}>{profile.email}</span>}
            </div>
          </div>

          <label className="field">
            <span>Bio</span>
            {editing ? (
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Tell others a bit about yourself..."
              />
            ) : (
              <div className="form-note" style={{ minHeight: "4rem" }}>
                {profile.bio || "No bio added yet."}
              </div>
            )}
          </label>

          <div className="two-column" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            {editing ? (
              <Field
                label="Location"
                value={profile.location}
                onChange={(val) => handleChange("location", val)}
              />
            ) : (
              <div className="field">
                <span>Location</span>
                <strong>{profile.location || "Not specified"}</strong>
              </div>
            )}

            {editing ? (
               <label className="field">
                 <span>Availability</span>
                 <select value={profile.availability} onChange={(e) => handleChange("availability", e.target.value)}>
                   <option>Weekdays</option>
                   <option>Weekends</option>
                   <option>Anytime</option>
                 </select>
               </label>
            ) : (
              <div className="field">
                <span>Availability</span>
                <strong>{profile.availability}</strong>
              </div>
            )}

            {editing ? (
               <label className="field">
                 <span>Preferred Format</span>
                 <select value={profile.preferredFormat} onChange={(e) => handleChange("preferredFormat", e.target.value)}>
                   <option>Online</option>
                   <option>Offline</option>
                   <option>Hybrid</option>
                 </select>
               </label>
            ) : (
              <div className="field">
                <span>Preferred Format</span>
                <strong>{profile.preferredFormat}</strong>
              </div>
            )}
          </div>

          <div className="feed-heading" style={{ marginTop: "2rem" }}>
            <span>Broad Interests (Tags)</span>
          </div>

          {editing && (
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDesiredSkill(); } }}>
                <Field
                  label="Add an interest"
                  placeholder="e.g. Machine Learning"
                  value={desiredSkill}
                  onChange={setDesiredSkill}
                />
              </div>
              <button type="button" className="ghost-button" onClick={handleAddDesiredSkill} style={{ minHeight: "2.85rem" }}>
                <Plus size={18} /> Add
              </button>
            </div>
          )}

          <div className="tag-row">
            {(profile.desiredSkills || []).length === 0 ? (
              <span style={{ opacity: 0.5 }}>No broad interests added.</span>
            ) : (
              profile.desiredSkills.map((skill, index) => (
                <span key={index} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  {skill}
                  {editing && (
                    <button type="button" style={{ background: "transparent", color: "var(--coral)", padding: 0 }} onClick={() => handleDeleteSkill(index)}>
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))
            )}
          </div>

          {editing && (
            <div style={{ marginTop: "2rem" }}>
              <button className="primary-button full" type="submit">
                <Save size={18} /> Save Changes
              </button>
            </div>
          )}
        </form>

        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          <div className="portfolio-stat">
            <Star size={32} />
            <strong>{profile.rating.toFixed(1)}</strong>
            <span>Community Rating</span>
          </div>
          <div className="portfolio-stat">
            <strong>{profile.totalSwaps}</strong>
            <span>Total Swaps Completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
