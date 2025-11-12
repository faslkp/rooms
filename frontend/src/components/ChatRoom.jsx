import { useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { createRoomWebSocket } from '../services/ws';

export default function ChatRoom({ roomId, token, wsBase = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000') }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [wsError, setWsError] = useState(null);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/rooms/${roomId}/messages/`);
        if (mounted) setMessages(res.data.results || []);
      } catch (e) {
        console.warn('Failed loading history', e);
      }
    })();
    return () => { mounted = false; };
  }, [roomId]);

  useEffect(() => {
    setIsOpen(false);
    setWsError(null);
    const ws = createRoomWebSocket({
      baseWsUrl: wsBase,
      roomId,
      token,
      onOpen: () => {
        setIsOpen(true);
        console.log('WS connected');
        setWsError(null);
      },
      onClose: (e) => {
        setIsOpen(false);
        console.log('WS closed', e?.code, e?.reason);
      },
      onError: (e) => {
        setWsError('WebSocket error');
        console.error('WS error', e);
      },
      onMessage: (data) => {
        if (data?.content && data?.user) {
          setMessages((prev) => [...prev, data]);
        }
      },
    });
    wsRef.current = ws;
    return () => { ws.close(); };
  }, [roomId, token, wsBase]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !isOpen) return;
    try {
      wsRef.current?.sendJson({ content: text });
      setInput('');
    } catch (e) {
      console.error('Send failed', e);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="flex flex-col max-h-[300px] w-full min-w-0 overflow-hidden">
      {(!isOpen || wsError) && (
        <div className="flex-shrink-0 mb-2 space-y-2">
          {!isOpen && (
            <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1">
              Connecting to room chat...
            </div>
          )}
          {wsError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
              {wsError}
            </div>
          )}
        </div>
      )}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white border rounded p-3 space-y-2 [&::-webkit-scrollbar]:hidden" 
        style={{ 
          maxHeight: '100%',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {messages.map((m) => (
          <div key={m.id ?? Math.random()} className="text-sm break-words">
            <span className="font-medium">{m.user?.name || m.user?.email}:</span>{' '}
            <span>{m.content}</span>
            <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">{m.created_at && new Date(m.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">No messages yet.</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex-shrink-0 mt-3 flex gap-2 min-w-0">
        <input
          className="flex-1 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
          placeholder={isOpen ? 'Type a message' : 'Waiting for connection...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={!isOpen}
        />
        <button
          onClick={sendMessage}
          disabled={!isOpen}
          className="rounded bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
