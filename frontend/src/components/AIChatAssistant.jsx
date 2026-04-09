import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import './AIChatAssistant.css';

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¡Hola! Soy tu Tutor IA. ¿Tienes alguna duda sobre el temario o alguna pregunta que no comprendas? ¡Pregúntame lo que quieras!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await api.askAIChat(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, he tenido un problema conectando con mi cerebro. Inténtalo de nuevo en un momento.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-chat-wrapper ${isOpen ? 'open' : ''}`}>
      {/* Chat Window */}
      <div className="ai-chat-window card-glass">
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <span className="ai-chat-icon">🤖</span>
            <div>
                <strong>Tutor IA</strong>
                <span className="ai-chat-status">En línea</span>
            </div>
          </div>
          <button className="ai-chat-close" onClick={() => setIsOpen(false)}>×</button>
        </div>

        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              <div className="ai-message-bubble">
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="ai-message assistant">
                <div className="ai-message-bubble loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            </div>
          )}
        </div>

        <form className="ai-chat-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Escribe tu duda aquí..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? '...' : '→'}
          </button>
        </form>
      </div>

      {/* Floating Button */}
      <button className="ai-chat-trigger" onClick={() => setIsOpen(!isOpen)} title="Pregunta a la IA">
        <span className="trigger-icon">{isOpen ? '💬' : '🤖'}</span>
        {!isOpen && <span className="trigger-badge">Tutor</span>}
      </button>
    </div>
  );
}
