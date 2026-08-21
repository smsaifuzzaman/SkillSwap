import React, { useEffect, useState } from "react";
import { getInbox } from "../api/chatApi.js";
import { Search, MessageSquare, ChevronRight } from "lucide-react";

export default function InboxPage({ user, token, setView, setSelectedUserId }) {
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadInbox() {
      try {
        setLoading(true);
        const data = await getInbox(token);
        setInbox(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInbox();
  }, [token]);

  const filteredInbox = inbox.filter((chat) =>
    chat.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openChat = (userId) => {
    setSelectedUserId(userId);
    setView("chat");
  };

  return (
    <div className="portfolio-page">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--cream)' }}>
            <MessageSquare size={28} color="var(--lavender)" /> Inbox
          </h1>
        </div>

        <div className="team-setup-grid" style={{ 
          background: 'rgba(18, 14, 40, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          marginBottom: '2rem'
        }}>
          
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
            <Search size={20} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none', transition: 'color 0.3s ease' }} id="inbox-search-icon" />
            <input
              type="text"
              placeholder="Search your conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                boxSizing: 'border-box',
                borderRadius: '2.5rem',
                padding: '1.2rem 1.5rem 1.2rem 3.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '1rem',
                color: 'var(--cream)',
                outline: 'none',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                e.target.style.border = '1px solid var(--lavender)';
                e.target.style.boxShadow = '0 0 20px rgba(180, 139, 241, 0.2)';
                document.getElementById('inbox-search-icon').style.color = 'var(--lavender)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.2)';
                document.getElementById('inbox-search-icon').style.color = 'var(--muted)';
              }}
            />
          </div>

          {/* Inbox List */}
          {loading ? (
            <p className="text-muted" style={{ textAlign: 'center' }}>Loading conversations...</p>
          ) : error ? (
            <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>
          ) : filteredInbox.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
              {searchQuery ? "No conversations match your search." : "You have no conversations yet. Visit Community Search to find people!"}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredInbox.map((chat) => (
                <div 
                  key={chat.user.id} 
                  onClick={() => openChat(chat.user.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    padding: '1.25rem', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ 
                    width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--lavender), var(--coral))', 
                    color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '1.2rem', fontWeight: 'bold'
                  }}>
                    {chat.user.name.charAt(0)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {chat.user.name}
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        {new Date(chat.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: chat.unreadCount > 0 ? '#fff' : 'var(--muted)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: chat.unreadCount > 0 ? '600' : 'normal' }}>
                      {chat.lastMessage}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <div style={{ 
                      background: 'var(--coral)', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold',
                      padding: '0.2rem 0.5rem', borderRadius: '1rem', marginLeft: '0.5rem'
                    }}>
                      {chat.unreadCount} New
                    </div>
                  )}
                  
                  <ChevronRight size={20} color="var(--muted)" style={{ marginLeft: '0.5rem' }} />
                </div>
              ))}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
