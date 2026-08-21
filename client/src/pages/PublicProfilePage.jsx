import React, { useEffect, useState } from "react";
import { getUserProfile } from "../api/userApi.js";
import { sendMatchRequest, getMatches } from "../api/matchApi.js";
import { MapPin, User, Mail, Shield, MessageSquare, Briefcase, ChevronLeft, BookOpen, Sparkles } from "lucide-react";

export default function PublicProfilePage({ token, userId, setView }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchStatus, setMatchStatus] = useState(null); // null, "pending", "accepted", "rejected"
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const [data, matches] = await Promise.all([
          getUserProfile(token, userId),
          getMatches(token)
        ]);
        setProfile(data);
        
        // Find if a match exists between current user and this profile
        const existingMatch = matches.find(m => 
          (m.requester._id === userId || m.requester.id === userId || m.recipient._id === userId || m.recipient.id === userId)
        );
        if (existingMatch) {
          setMatchStatus(existingMatch.status);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) loadUser();
  }, [userId, token]);

  const handleRequestMatch = async () => {
    try {
      setActionLoading(true);
      await sendMatchRequest(token, userId);
      setMatchStatus("pending");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="portfolio-page"><p className="text-muted">Loading profile...</p></div>;
  }

  if (error || !profile) {
    return (
      <div className="portfolio-page">
        <p className="form-error">{error || "User not found"}</p>
        <button className="ghost-button" onClick={() => setView("community-search")} style={{ marginTop: '1rem' }}>
          <ChevronLeft size={16} /> Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="portfolio-page">
      <button className="ghost-button" onClick={() => setView("community-search")} style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> Back to Search
      </button>

      <div className="team-setup-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '2rem',
        background: 'rgba(18, 14, 40, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1.5rem',
        padding: '3rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--lavender), var(--coral))', 
            color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem',
            boxShadow: '0 10px 25px rgba(180, 139, 241, 0.4)'
          }}>
            {profile.name.charAt(0)}
          </div>
          
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #fff, #b48bf1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {profile.name}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--muted)', fontSize: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> {profile.location || "Location not specified"}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#63e6a5' }}><Shield size={16} /> Trust Score: {profile.trustScore || "0"}</span>
          </div>

          <div style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
            {profile.bio || "This user hasn't added a bio yet. Say hi and get to know them!"}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="primary-button" onClick={() => setView("chat")}>
              <MessageSquare size={18} /> Message {profile.name.split(' ')[0]}
            </button>
            {matchStatus === "accepted" ? (
              <button className="ghost-button" disabled style={{ border: '1px solid #63e6a5', color: '#63e6a5' }}>
                <Sparkles size={18} /> Matched!
              </button>
            ) : matchStatus === "pending" ? (
              <button className="ghost-button" disabled style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                Request Sent
              </button>
            ) : (
              <button 
                className="ghost-button" 
                style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }} 
                onClick={handleRequestMatch}
                disabled={actionLoading}
              >
                {actionLoading ? "Sending..." : "Request Match"}
              </button>
            )}
          </div>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '1rem 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cream)', marginBottom: '1rem', fontSize: '1.3rem' }}>
              <Briefcase size={20} color="var(--lavender)" /> Offered Skills
            </h3>
            {/* Note: since offeredSkills isn't strictly defined on the model in this context, we will gracefully handle it or just use desiredSkills for demonstration */}
            {(!profile.expertise || profile.expertise.length === 0) ? (
              <p className="text-muted">No skills listed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {profile.expertise.map((skill, i) => (
                  <span key={i} style={{ padding: '0.5rem 1rem', background: 'rgba(180, 139, 241, 0.15)', border: '1px solid rgba(180, 139, 241, 0.3)', borderRadius: '999px', color: '#b48bf1', fontSize: '0.9rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cream)', marginBottom: '1rem', fontSize: '1.3rem' }}>
              <BookOpen size={20} color="var(--coral)" /> Desired Skills
            </h3>
            {(!profile.desiredSkills || profile.desiredSkills.length === 0) ? (
              <p className="text-muted">No desired skills listed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {profile.desiredSkills.map((skill, i) => (
                  <span key={i} style={{ padding: '0.5rem 1rem', background: 'rgba(238, 119, 85, 0.15)', border: '1px solid rgba(238, 119, 85, 0.3)', borderRadius: '999px', color: '#ee7755', fontSize: '0.9rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
