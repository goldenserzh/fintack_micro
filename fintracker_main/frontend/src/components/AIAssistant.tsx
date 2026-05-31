import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getSessions, createSession, getSession, deleteSession, sendMessage,
  ChatSessionSummary, ChatSessionFull,
} from '../api';
import { useAuth } from '../context/AuthContext';

const SUGGESTIONS = [
  'Как я могу сократить расходы?',
  'Анализ моих трат за месяц',
  'Советы по достижению цели',
  'Где я трачу больше всего?',
];

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Сегодня';
  if (diffDays === 1) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export default function AIAssistant() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSessionFull | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getSessions(user.user_id);
      setSessions(data);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, loading]);

  const openSession = async (sessionId: number) => {
    if (!user) return;
    setLoadingSession(true);
    setError(null);
    try {
      const s = await getSession(user.user_id, sessionId);
      setActiveSession(s);
      setShowSessions(false);
    } catch { setError('Не удалось загрузить чат'); }
    finally { setLoadingSession(false); }
  };

  const handleNewChat = async () => {
    if (!user) return;
    setLoadingSession(true);
    setError(null);
    try {
      const s = await createSession(user.user_id);
      setSessions(prev => [{ session_id: s.session_id, title: s.title, created_at: s.created_at }, ...prev]);
      setActiveSession(s);
      setShowSessions(false);
    } catch { setError('Не удалось создать чат'); }
    finally { setLoadingSession(false); }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteSession(user.user_id, sessionId);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (activeSession?.session_id === sessionId) setActiveSession(null);
    } catch { /* ignore */ }
  };

  const send = async (text: string, sessionOverride?: ChatSessionFull) => {
    const sess = sessionOverride ?? activeSession;
    if (!user || !text.trim() || loading || !sess) return;
    const trimmed = text.trim();
    setInput('');
    setLoading(true);
    setError(null);

    const optimisticMsg = { message_id: Date.now(), role: 'user', content: trimmed, created_at: new Date().toISOString() };
    setActiveSession(prev =>
      prev ? { ...prev, messages: [...prev.messages, optimisticMsg] }
           : { ...sess, messages: [...sess.messages, optimisticMsg] }
    );

    try {
      const result = await sendMessage(user.user_id, sess.session_id, trimmed);
      const replyMsg = { message_id: Date.now() + 1, role: 'assistant', content: result.reply, created_at: new Date().toISOString() };
      setActiveSession(prev => prev ? { ...prev, messages: [...prev.messages, replyMsg] } : prev);

      if (result.title) {
        setSessions(prev => prev.map(s =>
          s.session_id === sess.session_id ? { ...s, title: result.title! } : s
        ));
        setActiveSession(prev => prev ? { ...prev, title: result.title! } : prev);
      }
    } catch {
      setError('Не удалось получить ответ. Проверьте соединение или ключ API.');
      setActiveSession(prev => prev ? { ...prev, messages: prev.messages.slice(0, -1) } : prev);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div className="card ai-assistant">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">✨</div>
        <div style={{ flex: 1 }}>
          <div className="ai-title">ИИ-советник</div>
          <div className="ai-subtitle">
            {activeSession ? activeSession.title : 'Выберите или создайте чат'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            className="ai-icon-btn"
            title="История чатов"
            onClick={() => setShowSessions(v => !v)}
          >
            ☰
          </button>
          <button
            className="ai-icon-btn ai-icon-btn-primary"
            title="Новый чат"
            onClick={handleNewChat}
            disabled={loadingSession}
          >
            +
          </button>
        </div>
      </div>

      {/* Sessions panel */}
      {showSessions && (
        <div className="ai-sessions-panel">
          {sessions.length === 0 ? (
            <div className="ai-sessions-empty">Нет чатов — нажмите «+»</div>
          ) : (
            sessions.map(s => (
              <div
                key={s.session_id}
                className={`ai-session-item ${activeSession?.session_id === s.session_id ? 'ai-session-active' : ''}`}
                onClick={() => openSession(s.session_id)}
              >
                <span className="ai-session-icon">💬</span>
                <div className="ai-session-info">
                  <span className="ai-session-title">{s.title || 'Новый чат'}</span>
                  <span className="ai-session-date">{formatSessionDate(s.created_at)}</span>
                </div>
                <button
                  className="ai-session-del"
                  onClick={e => handleDeleteSession(s.session_id, e)}
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="ai-messages">
        {!activeSession && !loadingSession && (
          <div className="ai-welcome">
            <p className="ai-welcome-text">Создайте новый чат или выберите существующий из истории.</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="ai-suggestion"
                  onClick={async () => {
                    if (!user) return;
                    setLoadingSession(true);
                    try {
                      const sess = await createSession(user.user_id);
                      setSessions(prev => [{ session_id: sess.session_id, title: sess.title, created_at: sess.created_at }, ...prev]);
                      setActiveSession(sess);
                      await send(s, sess);
                    } finally {
                      setLoadingSession(false);
                    }
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingSession && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-msg-avatar">✨</div>
            <div className="ai-msg-bubble ai-typing"><span /><span /><span /></div>
          </div>
        )}

        {activeSession?.messages.map(msg => (
          <div key={msg.message_id} className={`ai-msg ai-msg-${msg.role}`}>
            {msg.role === 'assistant' && <div className="ai-msg-avatar">✨</div>}
            <div className="ai-msg-bubble">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div className="ai-msg ai-msg-assistant">
            <div className="ai-msg-avatar">✨</div>
            <div className="ai-msg-bubble ai-typing"><span /><span /><span /></div>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ margin: '0.5rem 0 0' }}>{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ai-input-row">
        <textarea
          className="ai-input"
          placeholder={activeSession ? 'Спросите о финансах...' : 'Создайте чат чтобы начать...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading || !activeSession}
        />
        <button
          className="ai-send-btn"
          onClick={() => send(input)}
          disabled={loading || !input.trim() || !activeSession}
          title="Отправить"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
