import React, { useEffect, useState } from "react";
import { getMyTeam, createTeam, joinTeam, removeMember } from "../api/teamApi.js";
import { createSession, joinGroupSession } from "../api/sessionApi.js";
import { Users, UserMinus, KeySquare, PlusCircle, CheckCircle, Clock, ShieldPlus, LogIn, ChevronRight } from "lucide-react";

export default function TeamWorkspacePage({ user, token, setView }) {
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Create/Join State
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showForms, setShowForms] = useState(false);
  
  // Group Meeting Form State
  const [showGroupSwapForm, setShowGroupSwapForm] = useState(false);
  const [groupSkillName, setGroupSkillName] = useState("");
  const [groupDate, setGroupDate] = useState("");
  const [groupDuration, setGroupDuration] = useState(60);

  useEffect(() => {
    loadTeams();
  }, [token]);

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");
      const data = await getMyTeam(token);
      setTeams(data.teams || []);
      setSessions(data.sessions || []);
      
      if (data.teams && data.teams.length > 0 && !activeTeamId) {
        setActiveTeamId(data.teams[0]._id);
      }
      
      if (!data.teams || data.teams.length === 0) {
        setShowForms(true);
      }
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
      setTeamName("");
      loadTeams();
      setShowForms(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoinTeam(e) {
    e.preventDefault();
    try {
      await joinTeam(token, inviteCode);
      setInviteCode("");
      loadTeams();
      setShowForms(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(teamId, userId) {
    if (!window.confirm("Remove this member?")) return;
    try {
      await removeMember(token, teamId, userId);
      loadTeams();
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
        teamId: activeTeamId,
        scheduledFor: groupDate,
        durationMinutes: groupDuration,
        reminderEmail: user.email
      });
      setShowGroupSwapForm(false);
      loadTeams();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoinSwap(sessionId) {
    try {
      await joinGroupSession(token, sessionId);
      loadTeams();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="portfolio-page"><p>Loading workspace...</p></div>;

  const activeTeam = teams.find(t => t._id === activeTeamId);
  const activeTeamSessions = sessions.filter(s => s.teamId === activeTeamId);

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Collaboration</p>
          <h1>Team Workspaces</h1>
          <p>Join teams to participate in group swaps, or create your own teams.</p>
        </div>
        <Users size={48} className="text-muted" />
      </div>
      
      {error && <p className="form-error">{error}</p>}

      {teams.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {teams.map(team => (
            <button 
              key={team._id}
              onClick={() => { setActiveTeamId(team._id); setShowForms(false); }}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: activeTeamId === team._id && !showForms ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: activeTeamId === team._id && !showForms ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--surface)',
                color: 'var(--text)',
                cursor: 'pointer',
                fontWeight: activeTeamId === team._id && !showForms ? 600 : 400
              }}
            >
              {team.name}
            </button>
          ))}
          <button 
            onClick={() => { setActiveTeamId(null); setShowForms(true); }}
            className="ghost-button small"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={16} /> Join or Create Another Team
          </button>
        </div>
      )}

      {showForms || teams.length === 0 ? (
        <div className="team-setup-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
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
      ) : activeTeam ? (
        <>
          <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{activeTeam.name}</h2>
                <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Active Workspace</p>
              </div>
              {activeTeam.admin === user.id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-light)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px dashed var(--border)' }}>
                  <KeySquare size={16} className="text-muted" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Invite Code:</span>
                  <strong style={{ letterSpacing: '1px' }}>{activeTeam.inviteCode}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
              {/* Members Sidebar */}
              <div className="team-members">
                <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  Members ({activeTeam.members.length})
                </h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {activeTeam.members.map(m => (
                    <li key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{m.name} {m._id === activeTeam.admin ? '(Admin)' : ''}</div>
                        </div>
                      </div>
                      {activeTeam.admin === user.id && m._id !== activeTeam.admin && (
                        <button className="ghost-button danger small" onClick={() => handleRemoveMember(activeTeam._id, m._id)}>
                          <UserMinus size={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Group Meetings Area */}
              <div className="team-activity">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>Group Meetings</h3>
                  {activeTeam.admin === user.id && (
                    <button className="primary-button small" onClick={() => setShowGroupSwapForm(!showGroupSwapForm)}>
                      <PlusCircle size={16} /> {showGroupSwapForm ? "Cancel" : "New Group Meeting"}
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
                    <button type="submit" className="primary-button">Schedule Group Meeting</button>
                  </form>
                )}

                {activeTeamSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                    <p style={{ color: 'var(--muted)', margin: 0 }}>No group swaps scheduled yet for {activeTeam.name}.</p>
                  </div>
                ) : (
                  <div className="public-reviews-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {activeTeamSessions.map(s => {
                      const isParticipating = s.participants.some(p => p._id === user.id);
                      return (
                        <article key={s._id} className="public-review-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="public-review-header" style={{ marginBottom: 0 }}>
                            <div>
                              <strong style={{ fontSize: '1.1rem' }}>{s.skillName}</strong>
                              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Clock size={14} /> {new Date(s.scheduledFor).toLocaleString()}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Users size={14} /> {s.participants.length} / {s.maxParticipants} joined
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="review-card-foot actions-foot" style={{ marginTop: 0 }}>
                            {isParticipating ? (
                              <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 600, padding: '0.5rem 1rem', background: 'rgba(99, 230, 165, 0.1)', borderRadius: '2rem' }}>
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
        </>
      ) : null}
    </div>
  );
}
