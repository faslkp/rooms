export function createRoomWebSocket({ baseWsUrl, roomId, token, onMessage, onOpen, onClose, onError }) {
  const url = `${baseWsUrl.replace(/\/$/, '')}/ws/chat/${roomId}/?token=${encodeURIComponent(token)}`;
  let socket = new WebSocket(url);

  socket.onopen = () => { onOpen && onOpen(); };
  socket.onclose = (e) => { onClose && onClose(e); };
  socket.onerror = (e) => { onError && onError(e); };
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage && onMessage(data);
    } catch {}
  };

  const sendJson = (obj) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(obj));
    }
  };

  const close = () => {
    try { socket.close(); } catch {}
  };

  return { sendJson, close, socket };
}

