import { FormEvent, useState } from 'react';
import { sendChatbotMessage } from '../api/api';

const initialMessages = [
  { role: 'bot', text: 'Xin chào! Mình là trợ lý tìm phòng trọ. Bạn cần hỗ trợ gì?' }
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleOpen = () => setOpen((current) => !current);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmed = message.trim();
    if (!trimmed) {
      setError('Nhập tin nhắn để gửi nhé');
      return;
    }

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await sendChatbotMessage(trimmed);
      setMessages((prev) => [...prev, { role: 'bot', text: response.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi gửi tin nhắn');
      setMessages((prev) => [...prev, { role: 'bot', text: 'Xin lỗi, mình hiện không trả lời được. Vui lòng thử lại sau.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot-widget-container">
      {open ? (
        <div className="chatbot-panel">
          <div className="chatbot-panel-header">
            <div>
              <strong>Chat trợ lý</strong>
              <div className="chatbot-panel-subtitle">Hỏi mình về phòng trọ, giá và liên hệ</div>
            </div>
            <button className="chatbot-close-button" type="button" onClick={toggleOpen}>
              ✕
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`chatbot-message ${item.role === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'}`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <form className="chatbot-input-area" onSubmit={handleSubmit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={loading}
            />
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi'}
            </button>
          </form>
          {error ? <div className="chatbot-error">{error}</div> : null}
        </div>
      ) : null}

      <button type="button" className="chatbot-fab" onClick={toggleOpen}>
        💬
      </button>
    </div>
  );
}
