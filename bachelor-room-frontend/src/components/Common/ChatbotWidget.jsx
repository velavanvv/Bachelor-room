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

const MOBILE_BREAKPOINT = 768;
const MOBILE_DOCK_OFFSET = 112;
const FAB_MARGIN = 16;
const FAB_WIDTH = 176;
const FAB_HEIGHT = 52;

const ChatbotWidget = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([starterMessage]);
  const [loading, setLoading] = useState(false);
  const [fabPosition, setFabPosition] = useState({ x: FAB_MARGIN, y: MOBILE_DOCK_OFFSET });
  const [isDragging, setIsDragging] = useState(false);
  const endRef = useRef(null);
  const dragStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: FAB_MARGIN,
    originY: MOBILE_DOCK_OFFSET,
    moved: false,
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const clampFabPosition = (x, y) => {
    if (typeof window === 'undefined') {
      return { x: FAB_MARGIN, y: MOBILE_DOCK_OFFSET };
    }

    const maxX = Math.max(FAB_MARGIN, window.innerWidth - FAB_WIDTH - FAB_MARGIN);
    const maxY = Math.max(MOBILE_DOCK_OFFSET, window.innerHeight - FAB_HEIGHT - FAB_MARGIN);

    return {
      x: Math.min(Math.max(x, FAB_MARGIN), maxX),
      y: Math.min(Math.max(y, MOBILE_DOCK_OFFSET), maxY),
    };
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const syncFabPosition = () => {
      if (typeof window === 'undefined') {
        return;
      }

      const nextPosition = isMobile
        ? clampFabPosition(window.innerWidth - FAB_WIDTH - FAB_MARGIN, MOBILE_DOCK_OFFSET)
        : { x: FAB_MARGIN, y: FAB_MARGIN };

      setFabPosition((current) => {
        if (!isMobile) {
          return nextPosition;
        }

        return clampFabPosition(current.x || nextPosition.x, current.y || nextPosition.y);
      });
    };

    syncFabPosition();
    window.addEventListener('resize', syncFabPosition);
    return () => window.removeEventListener('resize', syncFabPosition);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setIsDragging(false);
    }
  }, [isMobile]);

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

  const handlePointerDown = (event) => {
    if (!isMobile) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: fabPosition.x,
      originY: fabPosition.y,
      moved: false,
    };

    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    if (!isMobile || !isDragging || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    const movedEnough = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;

    if (movedEnough) {
      dragStateRef.current.moved = true;
    }

    setFabPosition(
      clampFabPosition(
        dragStateRef.current.originX - deltaX,
        dragStateRef.current.originY - deltaY
      )
    );
  };

  const handlePointerUp = (event) => {
    if (!isMobile || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const moved = dragStateRef.current.moved;
    setIsDragging(false);
    dragStateRef.current.pointerId = null;

    if (!moved) {
      setIsOpen((current) => !current);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+7.5rem)] right-4 z-40 flex h-[min(32rem,calc(100vh-10rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b120f]/95 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:bottom-24">
          <div className="flex items-center justify-between border-b border-white/10 bg-emerald-500/10 px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-white">Room Assistant</p>
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (!isMobile) {
            setIsOpen((current) => !current);
          }
        }}
        style={
          isMobile
            ? {
                right: `${fabPosition.x}px`,
                bottom: `${fabPosition.y}px`,
              }
            : undefined
        }
        className={`fixed z-40 flex items-center gap-3 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 ${
          isMobile
            ? 'touch-none select-none'
            : 'bottom-6 right-4'
        } ${isDragging ? 'scale-105 shadow-[0_28px_70px_rgba(16,185,129,0.45)]' : ''}`}
      >
        <FiMessageCircle size={18} />
        <span>Ask Assistant</span>
      </button>
    </>
  );
};

export default ChatbotWidget;
