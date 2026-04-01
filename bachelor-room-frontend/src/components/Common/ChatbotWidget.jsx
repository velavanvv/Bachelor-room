import React, { useEffect, useRef, useState } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const starterMessage = {
  role: 'assistant',
  content: 'Hi, I am your Bachelor Room assistant. Ask me about expenses, contributions, wallet balance, or how to use the app.',
};

const ChatbotWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([starterMessage]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!user || location.pathname === '/login') {
    return null;
  }

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.sendChatMessage({
        message: trimmed,
        history: nextMessages.slice(-8),
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.data?.reply || 'Sorry, I could not generate a reply just now.',
        },
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Chatbot is unavailable right now.');
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I could not reply right now. Please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[32rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b120f]/95 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-emerald-500/10 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Room Assistant</p>
              <p className="text-xs text-emerald-100/70">Powered by SambaNova</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-emerald-100/70 transition hover:bg-white/10 hover:text-white"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'ml-auto bg-emerald-500 text-slate-950'
                    : 'bg-white/8 text-white'
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="max-w-[85%] rounded-2xl bg-white/8 px-4 py-3 text-sm text-white">
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about your room finances..."
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400"
      >
        <FiMessageCircle size={18} />
        <span>Ask Assistant</span>
      </button>
    </>
  );
};

export default ChatbotWidget;
