import React, { useEffect, useState } from "react";
import { getMyTeam, createTeam, joinTeam, removeMember } from "../api/teamApi.js";
import { createSession, joinGroupSession } from "../api/sessionApi.js";
import { Users, UserMinus, KeySquare, PlusCircle, CheckCircle, Clock, ShieldPlus, LogIn } from "lucide-react";

export default function TeamWorkspacePage({ user, token, setView }) {
  const [teamData, setTeamData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Create/Join State
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  // Group Swap Form State
  const [showGroupSwapForm, setShowGroupSwapForm] = useState(false);
  const [groupSkillName, setGroupSkillName] = useState("");
  const [groupDate, setGroupDate] = useState("");
  const [groupDuration, setGroupDuration] = useState(60);

  useEffect(() => {
    loadTeam();
  }, [token]);

  async function loadTeam() {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTeam(token);
      setTeamData(data.team);
      setSessions(data.sessions);
    } catch (err) {
      if (err.message !== "You are not in a team") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      await createTeam(token, teamName);
      window.location.reload(); // Quick refresh to update user context
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoinTeam(e) {
    e.preventDefault();
    try {
      await joinTeam(token, inviteCode);
      window.location.reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(userId) {
    if (!window.confirm("Remove this member?")) return;
    try {
      await removeMember(token, userId);
      loadTeam();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateGroupSwap(e) {
    e.preventDefault();
    try {
      await createSession(token, {
        skillName: groupSkillName,
        isGroup: true,
        teamId: teamData._id,
        scheduledFor: groupDate,
        durationMinutes: groupDuration,
        reminderEmail: user.email
      });
      setShowGroupSwapForm(false);
      loadTeam();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoinSwap(sessionId) {
    try {
      await joinGroupSession(token, sessionId);
      loadTeam();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="portfolio-page"><p>Loading workspace...</p></div>;

  if (!teamData) {
    return (
      <div className="portfolio-page">
        <div className="portfolio-header">
          <div>
            <p className="eyebrow">Collaboration</p>
            <h1>Team Workspace</h1>
            <p>Join a team to participate in group swaps, or create your own team.</p>
          </div>
          <Users size={48} className="text-muted" />
        </div>
        
        {error && <p className="form-error">{error}</p>}

        <div className="team-setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
          <form className="auth-form" onSubmit={handleCreateTeam} style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(180, 139, 241, 0.15)', color: '#b48bf1', marginBottom: '1.25rem', border: '1px solid rgba(180, 139, 241, 0.3)' }}>
              <ShieldPlus size={28} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem', background: 'linear-gradient(to right, #fff, #b48bf1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create a Team</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>Start your own workspace and invite colleagues to learn together.</p>
            
            <div className="field" style={{ flex: 1 }}>
              <label>Team Name</label>
              <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)} required placeholder="e.g. Engineering Squad" style={{ width: '100%' }} />
            </div>
            <button type="submit" className="primary-button" style={{ width: '100%', marginTop: '1rem' }}>Create Workspace</button>
          </form>

          <form className="auth-form" onSubmit={handleJoinTeam} style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 230, 165, 0.15)', color: '#63e6a5', marginBottom: '1.25rem', border: '1px solid rgba(99, 230, 165, 0.3)' }}>
              <LogIn size={28} />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.75rem', background: 'linear-gradient(to right, #fff, #63e6a5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Join a Team</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>Got an invite code? Enter it below to join your team's workspace.</p>
            
            <div className="field" style={{ flex: 1 }}>
              <label>Invite Code</label>
              <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required placeholder="e.g. A1B2C3D4" style={{ width: '100%', textTransform: 'uppercase' }} />
            </div>
            <button type="submit" className="primary-button" style={{ width: '100%', marginTop: '1rem' }}>Join Workspace</button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = teamData.admin === user.id;

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{teamData.name}</h1>
          <p>Collaborate, manage group swaps, and learn together.</p>
        </div>
        {isAdmin && (
          <div className="portfolio-stat">
            <KeySquare size={32} />
            <strong>{teamData.inviteCode}</strong>
            <span>Invite Code</span>
          </div>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Members Sidebar */}
        <div className="team-members">
          <h3>Members ({teamData.members.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {teamData.members.map(m => (
              <li key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.name} {m._id === teamData.admin ? '(Admin)' : ''}</div>
                  </div>
                </div>
                {isAdmin && m._id !== teamData.admin && (
                  <button className="ghost-button danger small" onClick={() => handleRemoveMember(m._id)}>
                    <UserMinus size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Group Swaps Area */}
        <div className="team-activity">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Group Swaps</h3>
            {isAdmin && (
              <button className="primary-button small" onClick={() => setShowGroupSwapForm(!showGroupSwapForm)}>
                <PlusCircle size={16} /> {showGroupSwapForm ? "Cancel" : "New Group Swap"}
              </button>
            )}
          </div>

          {showGroupSwapForm && (
            <form className="auth-form" style={{ marginBottom: '2rem' }} onSubmit={handleCreateGroupSwap}>
              <div className="field">
                <label>Skill to Learn/Teach</label>
                <input type="text" value={groupSkillName} onChange={e => setGroupSkillName(e.target.value)} required />
              </div>
              <div className="field">
                <label>Date & Time</label>
                <input type="datetime-local" value={groupDate} onChange={e => setGroupDate(e.target.value)} required />
              </div>
              <button type="submit" className="primary-button">Schedule Group Swap</button>
            </form>
          )}

          {sessions.length === 0 ? (
            <p className="text-muted">No group swaps scheduled yet.</p>
          ) : (
            <div className="public-reviews-grid">
              {sessions.map(s => {
                const isParticipating = s.participants.some(p => p._id === user.id);
                return (
                  <article key={s._id} className="public-review-card">
                    <div className="public-review-header">
                      <div>
                        <strong>{s.skillName}</strong>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={14} /> {new Date(s.scheduledFor).toLocaleString()}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Users size={14} /> {s.participants.length} / {s.maxParticipants} joined
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="review-card-foot actions-foot" style={{ marginTop: '1rem' }}>
                      {isParticipating ? (
                        <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                          <CheckCircle size={16} /> Joined
                        </span>
                      ) : (
                        <button className="primary-button small" onClick={() => handleJoinSwap(s._id)} disabled={s.participants.length >= s.maxParticipants}>
                          Join Swap
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
