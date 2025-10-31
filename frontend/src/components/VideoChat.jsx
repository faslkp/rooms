import { useEffect, useRef, useState } from 'react';
import { createRoomWebSocket } from '../services/ws';
import { getUserIdFromToken } from '../services/auth';
import {
  createPeerConnection,
  addLocalStream,
  createAndSetLocalOffer,
  createAndSetLocalAnswer,
  setRemoteSdp,
  addRemoteIceCandidate,
} from '../services/webrtc';

export default function VideoChat({
  roomId,
  token,
  wsBase = (import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000'),
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [hasOffer, setHasOffer] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const myUserId = getUserIdFromToken(token);

  useEffect(() => {
    const ws = createRoomWebSocket({
      baseWsUrl: wsBase,
      roomId,
      token,
      onOpen: () => console.log('[RTC] WS open'),
      onClose: (e) => console.log('[RTC] WS close', e?.code, e?.reason),
      onError: (e) => console.warn('[RTC] WS error', e),
      onMessage: async (data) => {
        if (data?.sender_id && myUserId && String(data.sender_id) === String(myUserId)) return;

        if (data?.type === 'webrtc-hangup') {
          console.log('[RTC] remote hangup');
          cleanupPeer();
          return;
        }

        if (data?.type === 'webrtc-offer' && data?.sdp) {
          console.log('[RTC] received offer');
          setHasOffer(true);
          await ensurePeer();
          try {
            await setRemoteSdp(pcRef.current, data.sdp, 'offer');
            const answer = await createAndSetLocalAnswer(pcRef.current);
            wsRef.current?.sendJson({ type: 'webrtc-answer', sdp: answer.sdp, sender_id: myUserId });
            console.log('[RTC] sent answer');
          } catch (e) {
            console.warn('[RTC] setRemote offer failed', e);
          }
        } else if (data?.type === 'webrtc-answer' && data?.sdp) {
          console.log('[RTC] received answer');
          try {
            await ensurePeer();
            await setRemoteSdp(pcRef.current, data.sdp, 'answer');
          } catch (e) {
            console.warn('[RTC] setRemote answer failed', e);
          }
        } else if (data?.type === 'webrtc-ice-candidate' && data?.candidate) {
          try {
            await ensurePeer();
            await addRemoteIceCandidate(pcRef.current, data.candidate);
          } catch (e) {
            console.warn('[RTC] add ICE failed', e);
          }
        }
      },
    });
    wsRef.current = ws;
    return () => {
      ws.close();
      cleanupPeer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token, wsBase]);

  async function ensurePeer() {
    if (pcRef.current) return;
    const pc = createPeerConnection({
      onTrack: (stream) => {
        console.log('[RTC] ontrack');
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      },
      onIceCandidate: (candidate) => {
        wsRef.current?.sendJson({ type: 'webrtc-ice-candidate', candidate, sender_id: myUserId });
      },
    });
    pcRef.current = pc;

    if (localStream) {
      // Reuse existing stream and ensure tracks reflect current UI state
      localStream.getAudioTracks().forEach((t) => { t.enabled = !muted; });
      localStream.getVideoTracks().forEach((t) => { t.enabled = !cameraOff; });
      if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      await addLocalStream(pc, localStream);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      // Apply current UI state
      stream.getAudioTracks().forEach((t) => { t.enabled = !muted; });
      stream.getVideoTracks().forEach((t) => { t.enabled = !cameraOff; });
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      await addLocalStream(pc, stream);
    }
  }

  function cleanupPeer() {
    try { pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop()); } catch {}
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    try { localStream?.getTracks().forEach((t) => t.stop()); } catch {}
    setLocalStream(null);
    setRemoteStream(null);
    setHasOffer(false);
    setMuted(false);
    setCameraOff(false);
  }

  async function startCall() {
    console.log('[RTC] start call');
    await ensurePeer();
    const offer = await createAndSetLocalOffer(pcRef.current);
    wsRef.current?.sendJson({ type: 'webrtc-offer', sdp: offer.sdp, sender_id: myUserId });
    console.log('[RTC] sent offer');
  }

  async function answerCall() {
    console.log('[RTC] manual answer');
    await ensurePeer();
    const answer = await createAndSetLocalAnswer(pcRef.current);
    wsRef.current?.sendJson({ type: 'webrtc-answer', sdp: answer.sdp, sender_id: myUserId });
  }

  function toggleMute() {
    if (!localStream) return;
    const next = !muted;
    localStream.getAudioTracks().forEach((t) => { t.enabled = !next; });
    setMuted(next);
  }

  function toggleCamera() {
    if (!localStream) return;
    const next = !cameraOff;
    localStream.getVideoTracks().forEach((t) => { t.enabled = !next; });
    setCameraOff(next);
  }

  function endCall() {
    wsRef.current?.sendJson({ type: 'webrtc-hangup', sender_id: myUserId });
    cleanupPeer();
  }

  return (
    <div className="h-full bg-white border rounded p-3 flex flex-col">
      <div className="grid grid-cols-2 gap-3 flex-1">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-64 bg-black rounded" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-64 bg-black rounded" />
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={startCall} className="rounded bg-green-600 text-white px-3 py-2 hover:bg-green-700">Start Call</button>
        <button onClick={answerCall} disabled={!hasOffer} className="rounded bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 disabled:opacity-50">Answer</button>
        <button onClick={toggleMute} className="rounded bg-gray-200 px-3 py-2">{muted ? 'Unmute' : 'Mute'}</button>
        <button onClick={toggleCamera} className="rounded bg-gray-200 px-3 py-2">{cameraOff ? 'Camera On' : 'Camera Off'}</button>
        <button onClick={endCall} className="rounded bg-red-600 text-white px-3 py-2 hover:bg-red-700">End</button>
      </div>
    </div>
  );
}
