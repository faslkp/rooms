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
  const [pendingOfferSdp, setPendingOfferSdp] = useState(null);
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
          if (hasOffer && !localStream) {
            setHasOffer(false);
            setPendingOfferSdp(null);
          } else {
            cleanupPeer();
          }
          return;
        }

        if (data?.type === 'webrtc-offer' && data?.sdp) {
          console.log('[RTC] received offer');
          setHasOffer(true);
          setPendingOfferSdp(data.sdp);
        } else if (data?.type === 'webrtc-answer' && data?.sdp) {
          console.log('[RTC] received answer');
          try {
            await ensurePeer();
            await setRemoteSdp(pcRef.current, data.sdp, 'answer');
          } catch (e) {
            console.warn('[RTC] setRemote answer failed', e);
          }
        } else if (data?.type === 'webrtc-ice-candidate' && data?.candidate) {
          if (pcRef.current) {
            try {
              await addRemoteIceCandidate(pcRef.current, data.candidate);
            } catch (e) {
              console.warn('[RTC] add ICE failed', e);
            }
          }
        }
      },
    });
    wsRef.current = ws;
    return () => {
      ws.close();
      cleanupPeer();
    };
  }, [roomId, token, wsBase]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    } else if (!localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

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
      localStream.getAudioTracks().forEach((t) => { t.enabled = !muted; });
      localStream.getVideoTracks().forEach((t) => { t.enabled = !cameraOff; });
      if (localVideoRef.current && localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      await addLocalStream(pc, localStream);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
    setPendingOfferSdp(null);
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
    console.log('[RTC] answering call');
    if (!hasOffer || !pendingOfferSdp) return;
    
    await ensurePeer();
    
    try {
      await setRemoteSdp(pcRef.current, pendingOfferSdp, 'offer');
      const answer = await createAndSetLocalAnswer(pcRef.current);
      wsRef.current?.sendJson({ type: 'webrtc-answer', sdp: answer.sdp, sender_id: myUserId });
      setHasOffer(false);
      setPendingOfferSdp(null);
      console.log('[RTC] sent answer');
    } catch (e) {
      console.warn('[RTC] answer failed', e);
    }
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

  function declineCall() {
    wsRef.current?.sendJson({ type: 'webrtc-hangup', sender_id: myUserId });
    setHasOffer(false);
    setPendingOfferSdp(null);
  }

  return (
    <div className="bg-white border rounded p-3 flex flex-col min-w-0 overflow-hidden md:overflow-hidden overflow-y-auto md:overflow-y-hidden h-full md:h-full">
      {hasOffer && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between min-w-0 gap-2 flex-shrink-0">
          <span className="text-sm font-medium text-blue-900 truncate">Incoming call...</span>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={answerCall} className="rounded bg-green-600 text-white px-4 py-2 hover:bg-green-700">Answer</button>
            <button onClick={declineCall} className="rounded bg-red-600 text-white px-4 py-2 hover:bg-red-700">Decline</button>
          </div>
        </div>
      )}
      {(localStream || remoteStream) && (
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 min-w-0 overflow-hidden md:overflow-hidden md:flex-1 max-h-[200px] md:max-h-none">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full bg-black rounded object-cover min-h-[150px]" />
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full bg-black rounded object-cover min-h-[150px]" />
        </div>
      )}

      <div className="flex gap-2 mt-3 flex-wrap min-w-0 flex-shrink-0">
        <button onClick={startCall} disabled={hasOffer} className="rounded bg-green-600 text-white px-3 py-2 hover:bg-green-700 disabled:opacity-50">Start Call</button>
        {!hasOffer && (
          <>
            <button onClick={toggleMute} disabled={!localStream} className="rounded bg-gray-200 px-3 py-2 disabled:opacity-50">{muted ? 'Unmute' : 'Mute'}</button>
            <button onClick={toggleCamera} disabled={!localStream} className="rounded bg-gray-200 px-3 py-2 disabled:opacity-50">{cameraOff ? 'Camera On' : 'Camera Off'}</button>
            <button onClick={endCall} disabled={!localStream && !remoteStream} className="rounded bg-red-600 text-white px-3 py-2 hover:bg-red-700 disabled:opacity-50">End</button>
          </>
        )}
      </div>
    </div>
  );
}
