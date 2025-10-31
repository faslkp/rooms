import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoomWebSocket } from '../ws';

describe('WebSocket service', () => {
  let mockWebSocket;

  beforeEach(() => {
    mockWebSocket = null;
    // Reset WebSocket mock with helper methods
    global.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 0; // CONNECTING
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this._sentMessages = [];
        mockWebSocket = this;
      }

      send(data) {
        this._sentMessages.push(data);
      }

      close() {
        this.readyState = 3; // CLOSED
        if (this.onclose) {
          this.onclose({ code: 1000, reason: 'Closed' });
        }
      }

      // Helper methods for testing
      _simulateOpen() {
        this.readyState = 1; // OPEN
        if (this.onopen) {
          this.onopen();
        }
      }

      _simulateMessage(data) {
        if (this.onmessage) {
          this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
        }
      }

      _simulateError(error) {
        if (this.onerror) {
          this.onerror(error);
        }
      }

      _simulateClose(event) {
        this.readyState = 3; // CLOSED
        if (this.onclose) {
          this.onclose(event || { code: 1000, reason: 'Closed' });
        }
      }
    };

    WebSocket.CONNECTING = 0;
    WebSocket.OPEN = 1;
    WebSocket.CLOSING = 2;
    WebSocket.CLOSED = 3;
  });

  it('creates WebSocket with correct URL and token', () => {
    const baseWsUrl = 'ws://localhost:8000';
    const roomId = 1;
    const token = 'test-token';

    const socket = createRoomWebSocket({
      baseWsUrl,
      roomId,
      token,
      onMessage: () => {},
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
    });

    expect(mockWebSocket).toBeTruthy();
    expect(mockWebSocket.url).toContain(`/ws/chat/${roomId}/`);
    expect(mockWebSocket.url).toContain('token=');
  });

  it('calls onOpen when WebSocket opens', () => {
    const onOpen = vi.fn();

    createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onOpen,
      onMessage: () => {},
      onClose: () => {},
      onError: () => {},
    });

    mockWebSocket._simulateOpen();

    expect(onOpen).toHaveBeenCalled();
  });

  it('calls onMessage when receiving messages', () => {
    const onMessage = vi.fn();
    const testData = { type: 'chat-message', content: 'Hello' };

    createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onMessage,
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
    });

    mockWebSocket._simulateMessage(testData);

    expect(onMessage).toHaveBeenCalledWith(testData);
  });

  it('calls onError when WebSocket error occurs', () => {
    const onError = vi.fn();
    const error = new Error('WebSocket error');

    createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onError,
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
    });

    mockWebSocket._simulateError(error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('calls onClose when WebSocket closes', () => {
    const onClose = vi.fn();

    createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onClose,
      onOpen: () => {},
      onMessage: () => {},
      onError: () => {},
    });

    mockWebSocket._simulateClose({ code: 1000, reason: 'Normal closure' });

    expect(onClose).toHaveBeenCalled();
  });

  it('sendJson sends JSON data when WebSocket is open', () => {
    const socket = createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onMessage: () => {},
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
    });

    mockWebSocket.readyState = WebSocket.OPEN;
    const testData = { type: 'chat-message', content: 'Hello' };

    socket.sendJson(testData);

    expect(mockWebSocket._sentMessages.length).toBe(1);
    expect(JSON.parse(mockWebSocket._sentMessages[0])).toEqual(testData);
  });

  it('sendJson does not send when WebSocket is not open', () => {
    const socket = createRoomWebSocket({
      baseWsUrl: 'ws://localhost:8000',
      roomId: 1,
      token: 'test-token',
      onMessage: () => {},
      onOpen: () => {},
      onClose: () => {},
      onError: () => {},
    });

    mockWebSocket.readyState = WebSocket.CLOSED;
    const testData = { type: 'chat-message', content: 'Hello' };

    socket.sendJson(testData);

    expect(mockWebSocket._sentMessages.length).toBe(0);
  });
});

