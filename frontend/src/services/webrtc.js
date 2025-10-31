export function createPeerConnection({ onTrack, onIceCandidate }) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  pc.onicecandidate = (e) => {
    if (e.candidate && onIceCandidate) onIceCandidate(e.candidate);
  };

  pc.ontrack = (e) => {
    if (onTrack) onTrack(e.streams[0]);
  };

  return pc;
}

export async function addLocalStream(pc, stream) {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream);
  }
}

export async function createAndSetLocalOffer(pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAndSetLocalAnswer(pc) {
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function setRemoteSdp(pc, sdp, type) {
  await pc.setRemoteDescription(new RTCSessionDescription({ type, sdp }));
}

export async function addRemoteIceCandidate(pc, candidate) {
  try {
    await pc.addIceCandidate(candidate);
  } catch {}
}

