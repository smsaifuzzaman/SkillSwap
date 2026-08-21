import React, { useState } from "react";
import { searchUsers } from "../api/userApi.js";
import { Search, MapPin, BookOpen } from "lucide-react";

export default function CommunitySearchPage({ user, token, setView, setSelectedUserId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError("");
      setHasSearched(true);
      const data = await searchUsers(token, query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <p className="eyebrow">Discover</p>
          <h1>Community Search</h1>
          <p>Find new friends, mentors, and experts by name, location, or skill.</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
          <div className="vault-search" style={{ flex: 1, minHeight: '4rem', padding: '0 1.5rem', borderRadius: '1.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)' }}>
            <Search size={24} color="var(--lavender)" />
            <input 
              type="text" 
              placeholder="Search by name, skill (e.g. React), or city..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ fontSize: '1.1rem', width: '100%' }}
            />
          </div>
          <button type="submit" className="primary-button" style={{ padding: '0 2rem', borderRadius: '1.5rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        {hasSearched && !loading && results.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '4rem' }}>
            <Search size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No members found matching "{query}". Try a different skill or location!</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {results.map((resultUser) => (
            <article key={resultUser.id} className="team-setup-grid" style={{
              background: 'rgba(18, 14, 40, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.borderColor = 'rgba(180, 139, 241, 0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--lavender), var(--coral))', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {resultUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>{resultUser.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    <MapPin size={14} /> {resultUser.location || "Earth"}
                  </div>
                </div>
              </div>

              {resultUser.desiredSkills && resultUser.desiredSkills.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  {resultUser.desiredSkills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} style={{ padding: '0.3rem 0.6rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '999px', fontSize: '0.75rem', color: 'var(--cream)' }}>
                      {skill}
                    </span>
                  ))}
                  {resultUser.desiredSkills.length > 3 && (
                    <span style={{ padding: '0.3rem 0.6rem', color: 'var(--muted)', fontSize: '0.75rem' }}>+{resultUser.desiredSkills.length - 3}</span>
                  )}
                </div>
              )}

              <button 
                className="ghost-button" 
                style={{ width: '100%', justifyContent: 'center' }} 
                onClick={() => {
                  setSelectedUserId(resultUser.id);
                  setView("public-profile");
                }}
              >
                View Profile
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
