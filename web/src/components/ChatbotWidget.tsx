import { FormEvent, useState } from 'react';
import { sendChatbotMessage } from '../api/api';

const initialMessages = [
  { role: 'bot', text: 'Xin chào! Mình là trợ lý tìm phòng trọ. Bạn cần hỗ trợ gì?' }
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [history, setHistory] = useState<any[]>([]); // Lưu lịch sử chat dạng [role, text]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleOpen = () => setOpen((current) => !current);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const trimmed = message.trim();
    if (!trimmed) return;

    const userMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      // Gọi API với message và history
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: trimmed, history })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, { role: 'bot', text: data.reply }]);
      
      // Cập nhật history mới từ server trả về
      if (data.history) {
        setHistory(data.history);
      }
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
