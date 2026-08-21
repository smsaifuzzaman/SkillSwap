import React, { useEffect, useState, useRef } from "react";
import { getConversation, sendMessage } from "../api/chatApi.js";
import { getUserProfile } from "../api/userApi.js";
import { Send, ChevronLeft, User, Shield, ExternalLink } from "lucide-react";

export default function ChatPage({ user, token, selectedUserId, setView }) {
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function loadChat() {
      try {
        setLoading(true);
        const [userData, chatData] = await Promise.all([
          getUserProfile(token, selectedUserId),
          getConversation(token, selectedUserId)
        ]);
        setRecipient(userData);
        setMessages(chatData);
      } catch (error) {
        console.error("Failed to load chat", error);
      } finally {
        setLoading(false);
      }
    }

    if (selectedUserId) {
      loadChat();
    }
  }, [selectedUserId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const newMessage = await sendMessage(token, selectedUserId, content);
      setMessages((prev) => [...prev, newMessage]);
      setContent("");
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="portfolio-page"><p className="text-muted">Loading chat...</p></div>;
  }

  if (!recipient) {
    return (
      <div className="portfolio-page">
        <button className="ghost-button" onClick={() => setView("community-search")}>
          <ChevronLeft size={16} /> Back
        </button>
        <p className="form-error">Could not load conversation.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-page" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <button className="ghost-button" onClick={() => setView("public-profile")} style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <ChevronLeft size={16} /> Back to Profile
      </button>

      <div className="team-setup-grid" style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column', 
        background: 'rgba(18, 14, 40, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
      }}>
        
        {/* Chat Header */}
        <div 
          onClick={() => setView("public-profile")}
          style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            background: 'rgba(255,255,255,0.02)',
            cursor: 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        >
          <div style={{ 
            width: '50px', height: '50px', borderRadius: '50%', 
            background: 'linear-gradient(135deg, var(--lavender), var(--coral))', 
            color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '1.5rem', fontWeight: 'bold',
            flexShrink: 0
          }}>
            {recipient?.name?.charAt(0) || "U"}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: 'var(--cream)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {recipient?.name || "User"}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <Shield size={12} color="#63e6a5" /> Trust Score: {recipient?.trustScore || "50"}%
            </span>
          </div>
          
          <button 
            className="ghost-button small" 
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '2rem', 
              border: '1px solid rgba(255,255,255,0.2)',
              pointerEvents: 'none' // The entire header is clickable, so this is just visual
            }}
          >
            <User size={14} /> View Profile
          </button>
        </div>

        {/* Messages Area */}
        <div style={{ 
          flex: 1, 
          padding: '2rem', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          {(!messages || messages.length === 0) ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '2rem' }}>
              No messages yet. Say hi to {recipient?.name?.split(' ')?.[0] || "them"}!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.sender === user?._id || msg.sender === user?.id;
              return (
                <div key={msg._id || idx} style={{ 
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  background: isMine ? 'linear-gradient(135deg, #b48bf1, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
                  color: isMine ? 'white' : 'var(--cream)',
                  padding: '1rem 1.5rem',
                  borderRadius: '1.5rem',
                  borderBottomRightRadius: isMine ? '4px' : '1.5rem',
                  borderBottomLeftRadius: !isMine ? '4px' : '1.5rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                  {msg.content}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ 
          padding: '1.5rem 2rem', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
          display: 'flex', 
          gap: '1rem',
          background: 'rgba(0,0,0,0.2)',
          alignItems: 'center'
        }}>
          <input
            type="text"
            className="field"
            placeholder={`Message ${recipient?.name?.split(' ')?.[0] || "them"}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ 
              flex: 1, 
              margin: 0,
              borderRadius: '2rem',
              padding: '1rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '1rem',
              color: 'var(--cream)',
              outline: 'none',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
            }}
            onFocus={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)';
              e.target.style.border = '1px solid var(--lavender)';
              e.target.style.boxShadow = '0 0 15px rgba(180, 139, 241, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)';
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              e.target.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.2)';
            }}
          />
          <button 
            type="submit" 
            className="primary-button" 
            disabled={!content.trim()} 
            style={{ 
              padding: '0 2rem', 
              borderRadius: '2rem',
              height: '52px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              boxShadow: content.trim() ? '0 10px 25px rgba(255, 126, 103, 0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <Send size={18} /> Send
          </button>
        </form>

      </div>
    </div>
  );
}
