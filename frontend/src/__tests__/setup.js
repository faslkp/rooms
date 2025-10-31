import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;
    this.onmessage = null;
    this._messages = [];
  }

  send(data) {
    this._messages.push(data);
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Closed' });
    }
  }

  // Helper methods for testing
  _simulateOpen() {
    this.readyState = WebSocket.OPEN;
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
};

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

// Mock RTCPeerConnection
global.RTCPeerConnection = class MockRTCPeerConnection {
  constructor(config) {
    this.config = config;
    this.localDescription = null;
    this.remoteDescription = null;
    this.iceConnectionState = 'new';
    this.connectionState = 'new';
    this.onicecandidate = null;
    this.ontrack = null;
    this.onconnectionstatechange = null;
    this.oniceconnectionstatechange = null;
    this._senders = [];
    this._receivers = [];
  }

  async createOffer() {
    return {
      type: 'offer',
      sdp: 'mock-offer-sdp',
    };
  }

  async createAnswer() {
    return {
      type: 'answer',
      sdp: 'mock-answer-sdp',
    };
  }

  async setLocalDescription(description) {
    this.localDescription = description;
  }

  async setRemoteDescription(description) {
    this.remoteDescription = description;
  }

  async addIceCandidate(candidate) {
    // Mock implementation
  }

  addTrack(track, stream) {
    this._senders.push({ track, stream });
  }

  getSenders() {
    return this._senders;
  }

  close() {
    this.connectionState = 'closed';
    this.iceConnectionState = 'closed';
  }

  // Helper methods for testing
  _simulateIceCandidate(candidate) {
    if (this.onicecandidate) {
      this.onicecandidate({ candidate });
    }
  }

  _simulateTrack(stream) {
    if (this.ontrack) {
      this.ontrack({ streams: [stream] });
    }
  }
};

// Mock RTCSessionDescription
global.RTCSessionDescription = class MockRTCSessionDescription {
  constructor(description) {
    this.type = description.type;
    this.sdp = description.sdp;
  }
};

// Mock navigator.mediaDevices.getUserMedia
global.navigator = {
  ...global.navigator,
  mediaDevices: {
    getUserMedia: async () => {
      // Mock MediaStream
      const stream = {
        getTracks: () => [],
        getAudioTracks: () => [],
        getVideoTracks: () => [],
      };
      return stream;
    },
  },
};

