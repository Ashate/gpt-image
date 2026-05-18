import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { imagesApi, conversationsApi } from '../utils/api';
import Sidebar from '../components/Sidebar';
import Message from '../components/Message';

const SUGGESTIONS = [
  { label: 'A neon cyberpunk cityscape', sub: 'at night with rain reflections' },
  { label: 'A majestic mountain landscape', sub: 'with golden hour lighting' },
  { label: 'An underwater coral reef', sub: 'vibrant colors, tropical fish' },
  { label: 'A cozy coffee shop interior', sub: 'warm lighting, autumn vibes' },
];

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconStars = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

export default function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentConvId, setCurrentConvId] = useState(conversationId || null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    try {
      const { data } = await conversationsApi.list();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Load conversations failed', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    const id = conversationId || null;
    setCurrentConvId(id);

    if (!id) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    conversationsApi
      .getMessages(id)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => {
        navigate('/');
      })
      .finally(() => setLoadingMessages(false));
  }, [conversationId, navigate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestion = (s) => {
    setInput(`${s.label} ${s.sub}`);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    navigate('/');
    setMessages([]);
    setCurrentConvId(null);
    setInput('');
  };

  const handleSubmit = async () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsGenerating(true);

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const { data } = await imagesApi.generate({
        prompt,
        conversationId: currentConvId,
        size,
      });

      // Navigate to conversation if new
      if (!currentConvId || String(currentConvId) !== String(data.conversationId)) {
        setCurrentConvId(data.conversationId);
        navigate(`/c/${data.conversationId}`, { replace: true });
        await loadConversations();
      }

      // Add assistant response with image
      const assistantMsg = {
        id: data.assistantMessageId,
        role: 'assistant',
        content: `Here's your generated image for: "${prompt}"`,
        image_url: data.imageUrl,
        image_prompt: prompt,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => {
        // Replace temp user message with real one
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const realUserMsg = {
          id: data.userMessageId,
          role: 'user',
          content: prompt,
          created_at: new Date().toISOString(),
        };
        return [...filtered, realUserMsg, assistantMsg];
      });

      // Refresh conversation list to update title/timestamp
      loadConversations();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to generate image. Please try again.';

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        {
          id: `temp-user-${Date.now() + 1}`,
          role: 'user',
          content: prompt,
          created_at: new Date().toISOString(),
        },
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const isEmpty = messages.length === 0 && !loadingMessages;

  return (
    <div className="chat-layout">
      <Sidebar
        conversations={conversations}
        onConversationsChange={setConversations}
        onNewChat={handleNewChat}
      />

      <main className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <span className="chat-header-title">
            {currentConvId ? 'Image generation' : 'New session'}
          </span>
          <div className="model-badge">
            <div className="model-dot" />
            gpt-image-1
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          <div className="messages-inner">
            {loadingMessages ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <div className="spinner" />
              </div>
            ) : isEmpty ? (
              <div className="welcome-screen">
                <div className="welcome-icon">
                  <IconStars />
                </div>
                <h2 className="welcome-title">What shall we create?</h2>
                <p className="welcome-subtitle">
                  Describe any image you can imagine and watch AI bring it to life. Every image is saved to your account.
                </p>
                <div className="welcome-suggestions">
                  {SUGGESTIONS.map((s, i) => (
                    <div
                      key={i}
                      className="suggestion-card"
                      onClick={() => handleSuggestion(s)}
                    >
                      <div className="suggestion-card-label">{s.label}</div>
                      <div className="suggestion-card-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <Message key={msg.id} message={msg} />)
            )}

            {isGenerating && (
              <div className="message-group message-enter">
                <div className="message-row assistant">
                  <div className="msg-avatar assistant">✦</div>
                  <div className="msg-content">
                    <div className="msg-bubble assistant">
                      <div className="generating-text">
                        <div className="typing-indicator">
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                          <div className="typing-dot" />
                        </div>
                        Generating your image...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-wrapper">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                className="chat-input"
                placeholder="Describe the image you want to create..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isGenerating}
              />
              <div className="input-controls">
                <select
                  className="size-select"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isGenerating}
                  title="Image size"
                >
                  <option value="1024x1024">1024×1024</option>
                  <option value="1792x1024">1792×1024</option>
                  <option value="1024x1792">1024×1792</option>
                </select>
                <button
                  className="btn-send"
                  onClick={handleSubmit}
                  disabled={!input.trim() || isGenerating}
                  title="Generate image (Enter)"
                >
                  <IconSend />
                </button>
              </div>
            </div>
            <div className="input-footer">
              Press Enter to generate · Shift+Enter for new line · Images saved to your account
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
