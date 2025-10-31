import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPeerConnection,
  addLocalStream,
  createAndSetLocalOffer,
  createAndSetLocalAnswer,
  setRemoteSdp,
  addRemoteIceCandidate,
} from '../webrtc';

describe('WebRTC service', () => {
  let mockPeerConnection;
  let mockStream;

  beforeEach(() => {
    mockPeerConnection = null;
    mockStream = {
      getTracks: vi.fn(() => [
        { kind: 'audio', enabled: true },
        { kind: 'video', enabled: true },
      ]),
    };

    // Mock RTCPeerConnection
    global.RTCPeerConnection = class MockRTCPeerConnection {
      constructor(config) {
        this.config = config;
        this.localDescription = null;
        this.remoteDescription = null;
        this.iceConnectionState = 'new';
        this.onicecandidate = null;
        this.ontrack = null;
        this._senders = [];
        mockPeerConnection = this;
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
    };

    global.RTCSessionDescription = class MockRTCSessionDescription {
      constructor(description) {
        this.type = description.type;
        this.sdp = description.sdp;
      }
    };
  });

  it('creates RTCPeerConnection with STUN servers', () => {
    const onTrack = vi.fn();
    const onIceCandidate = vi.fn();

    const pc = createPeerConnection({ onTrack, onIceCandidate });

    expect(mockPeerConnection).toBeTruthy();
    expect(mockPeerConnection.config.iceServers).toBeDefined();
    expect(mockPeerConnection.config.iceServers[0].urls).toContain('stun:');
    // ontrack should be set (might be wrapped, so check it's a function)
    expect(typeof mockPeerConnection.ontrack).toBe('function');
    expect(mockPeerConnection.onicecandidate).toBeTruthy();
  });

  it('adds local stream tracks to peer connection', async () => {
    const pc = createPeerConnection({
      onTrack: () => {},
      onIceCandidate: () => {},
    });

    await addLocalStream(pc, mockStream);

    expect(mockPeerConnection._senders.length).toBeGreaterThan(0);
  });

  it('creates and sets local offer', async () => {
    const pc = createPeerConnection({
      onTrack: () => {},
      onIceCandidate: () => {},
    });

    const offer = await createAndSetLocalOffer(pc);

    expect(offer.type).toBe('offer');
    expect(offer.sdp).toBe('mock-offer-sdp');
    expect(mockPeerConnection.localDescription).toBeTruthy();
    expect(mockPeerConnection.localDescription.type).toBe('offer');
  });

  it('creates and sets local answer', async () => {
    const pc = createPeerConnection({
      onTrack: () => {},
      onIceCandidate: () => {},
    });

    const answer = await createAndSetLocalAnswer(pc);

    expect(answer.type).toBe('answer');
    expect(answer.sdp).toBe('mock-answer-sdp');
    expect(mockPeerConnection.localDescription).toBeTruthy();
    expect(mockPeerConnection.localDescription.type).toBe('answer');
  });

  it('sets remote SDP', async () => {
    const pc = createPeerConnection({
      onTrack: () => {},
      onIceCandidate: () => {},
    });

    const remoteSdp = 'remote-sdp-content';
    const sdpType = 'offer';

    await setRemoteSdp(pc, remoteSdp, sdpType);

    expect(mockPeerConnection.remoteDescription).toBeTruthy();
    expect(mockPeerConnection.remoteDescription.type).toBe(sdpType);
    expect(mockPeerConnection.remoteDescription.sdp).toBe(remoteSdp);
  });

  it('adds remote ICE candidate', async () => {
    const pc = createPeerConnection({
      onTrack: () => {},
      onIceCandidate: () => {},
    });

    const candidate = {
      candidate: 'candidate:1',
      sdpMLineIndex: 0,
    };

    // Should not throw error
    await expect(addRemoteIceCandidate(pc, candidate)).resolves.not.toThrow();
  });
});

