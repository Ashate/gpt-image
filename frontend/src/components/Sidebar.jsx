import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { conversationsApi } from '../utils/api';

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function Sidebar({ conversations, onConversationsChange, onNewChat }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await conversationsApi.delete(id);
      onConversationsChange((prev) => prev.filter((c) => c.id !== id));
      if (String(conversationId) === String(id)) {
        navigate('/');
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  // Group conversations by date
  const grouped = conversations.reduce((acc, conv) => {
    const label = formatDate(conv.updated_at);
    if (!acc[label]) acc[label] = [];
    acc[label].push(conv);
    return acc;
  }, {});

  const avatarLetter = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">ImageGen AI</span>
        </div>
      </div>

      <div className="sidebar-new-chat">
        <button className="btn-new-chat" onClick={onNewChat}>
          <IconPlus />
          New image session
        </button>
      </div>

      <div className="sidebar-conversations">
        {Object.keys(grouped).length === 0 ? (
          <div style={{ padding: '20px 12px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No conversations yet.<br />Start generating!
          </div>
        ) : (
          Object.entries(grouped).map(([label, convs]) => (
            <div key={label}>
              <div className="sidebar-section-label">{label}</div>
              {convs.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/c/${conv.id}`}
                  className={`conv-item ${String(conversationId) === String(conv.id) ? 'active' : ''}`}
                >
                  <span className="conv-item-text" title={conv.title}>{conv.title}</span>
                  <div className="conv-item-actions">
                    <button
                      className="conv-action-btn delete"
                      onClick={(e) => handleDelete(e, conv.id)}
                      title="Delete"
                    >
                      <IconTrash />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          ))
        )}
      </div>

      <div className="sidebar-footer" ref={dropdownRef}>
        {showUserMenu && (
          <div className="user-dropdown">
            <button className="dropdown-item danger" onClick={handleLogout}>
              <IconLogout />
              Log out
            </button>
          </div>
        )}
        <button className="user-menu" onClick={() => setShowUserMenu((v) => !v)}>
          <div className="user-avatar">{avatarLetter}</div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
