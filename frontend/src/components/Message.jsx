import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconZoom = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

function Lightbox({ src, onClose }) {
  return (
    <div className="lightbox" onClick={onClose}>
      <img
        className="lightbox-img"
        src={src}
        alt="Generated"
        onClick={(e) => e.stopPropagation()}
      />
      <button className="lightbox-close" onClick={onClose}>×</button>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message }) {
  const { user } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isUser = message.role === 'user';

  const avatarLetter = isUser
    ? (user?.username?.charAt(0).toUpperCase() || 'U')
    : '✦';

  const handleDownload = async () => {
    try {
      const res = await fetch(message.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagegen-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(message.image_url, '_blank');
    }
  };

  return (
    <div className={`message-group message-enter`}>
      <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
        <div className={`msg-avatar ${isUser ? 'user' : 'assistant'}`}>
          {avatarLetter}
        </div>
        <div className="msg-content">
          {message.content && (
            <div className={`msg-bubble ${isUser ? 'user' : 'assistant'}`}>
              {message.content}
            </div>
          )}

          {message.image_url && (
            <div className="msg-image-wrapper">
              <img
                className="msg-image"
                src={message.image_url}
                alt={message.image_prompt || 'Generated image'}
                onClick={() => setLightboxOpen(true)}
                loading="lazy"
              />
              <div className="msg-image-actions">
                <button className="btn-image-action" onClick={() => setLightboxOpen(true)}>
                  <IconZoom /> View full size
                </button>
                <button className="btn-image-action" onClick={handleDownload}>
                  <IconDownload /> Download
                </button>
              </div>
            </div>
          )}

          <div className="msg-timestamp">{formatTime(message.created_at)}</div>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox src={message.image_url} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
