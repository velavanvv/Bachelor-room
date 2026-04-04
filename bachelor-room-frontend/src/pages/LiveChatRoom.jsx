import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiArrowLeft, FiRefreshCw, FiSend } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { apiService, CHAT_ROOM_WS_URL } from '../services/api';

const ROOM_ID = 'main-room';

const formatTimestamp = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));

const LiveChatRoom = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const endRef = useRef(null);

  const title = useMemo(() => 'Room Live Chat', []);

  useEffect(() => {
    loadMessages();

    return () => {
      shouldReconnectRef.current = false;
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    connectSocket();

    return () => {
      shouldReconnectRef.current = false;
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appendMessage = (message) => {
    setMessages((current) => {
      if (current.some((item) => item.id === message.id)) {
        return current;
      }

      return [...current, message];
    });
  };

  const loadMessages = async () => {
    setLoading(true);

    try {
      const response = await apiService.getChatRoomMessages(ROOM_ID, 60);
      setMessages(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load chat history.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleReconnect = () => {
    if (!shouldReconnectRef.current) {
      return;
    }

    window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = window.setTimeout(() => {
      if (user) {
        connectSocket();
      }
    }, 2500);
  };

  const connectSocket = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    shouldReconnectRef.current = true;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
      return;
    }

    const socketUrl = `${CHAT_ROOM_WS_URL}?token=${encodeURIComponent(token)}&room=${encodeURIComponent(ROOM_ID)}`;
    const socket = new WebSocket(socketUrl);

    setConnectionState('connecting');
    socketRef.current = socket;

    socket.onopen = () => {
      window.clearTimeout(reconnectTimerRef.current);
      setConnectionState('connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'chat-message' && payload.message) {
          appendMessage(payload.message);
        }

        if (payload.type === 'error') {
          toast.error(payload.message || 'Chat connection error.');
        }
      } catch (error) {
        console.error('Failed to parse chat message:', error);
      }
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (!shouldReconnectRef.current) {
        return;
      }

      setConnectionState('disconnected');
      scheduleReconnect();
    };

    socket.onerror = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      setConnectionState('disconnected');
    };
  };

  const sendMessage = () => {
    const content = input.trim();

    if (!content) {
      return;
    }

    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast.error('Live chat is reconnecting. Please try again in a moment.');
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'chat-message',
        content,
      })
    );
    setInput('');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_25%),linear-gradient(180deg,_#07110d_0%,_#091512_40%,_#030505_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/room"
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FiArrowLeft size={16} />
              Back to rooms
            </Link>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="mt-2 text-sm text-emerald-100/70">
              Chat with everyone in the house in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                connectionState === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : connectionState === 'connecting'
                    ? 'bg-amber-500/20 text-amber-200'
                    : 'bg-red-500/20 text-red-200'
              }`}
            >
              {connectionState}
            </span>
            <button
              type="button"
              onClick={loadMessages}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <FiRefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-sm text-white/70">
              Signed in as <span className="font-semibold text-white">{user?.name}</span>
            </p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-5 py-4 text-sm text-white/70">
                No messages yet. Start the room conversation.
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user?.id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[1.75rem] px-4 py-3 shadow-lg ${
                        isCurrentUser
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-white/8 text-white'
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                        <span>{message.user?.name || 'Unknown'}</span>
                        <span className={isCurrentUser ? 'text-slate-800/70' : 'text-white/45'}>
                          {message.user?.role || 'member'}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                      <p className={`mt-2 text-[11px] ${isCurrentUser ? 'text-slate-800/70' : 'text-white/45'}`}>
                        {formatTimestamp(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 px-4 py-4 sm:px-6">
            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Send a message to the room..."
                className="min-h-[56px] flex-1 resize-none rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={connectionState !== 'connected'}
                className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveChatRoom;
