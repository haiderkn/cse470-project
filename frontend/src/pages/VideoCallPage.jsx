import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import './VideoCallPage.css';

// 1-to-1 video call using WebRTC. The backend only helps the two browsers find
// each other (signaling); audio and video go directly between them, encrypted.

// Used only if the backend can't be asked for STUN/TURN settings.
const FALLBACK_ICE = [{ urls: 'stun:stun.l.google.com:19302' }];
const ROOM_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const STATUS_TEXT = {
  idle: '',
  waiting: 'Waiting for the other person to join this room…',
  connecting: 'Connecting…',
  connected: 'Connected',
  full: 'This room already has two people. Try a different room name.',
  'invalid-room': 'Room names can use letters, numbers, - and _ only (up to 64 characters).',
  'media-error': 'Camera or microphone blocked. Allow access in your browser and try again.',
  error: 'Could not reach the call server. Check that the backend is running.',
  failed: 'The connection dropped. Hang up and join again.',
};

// Same backend address rule as api/client.js: VITE_API_URL if set, otherwise the Vite proxy.
function signalingUrl(room) {
  const path = `/ws/video-call/${encodeURIComponent(room)}`;
  const base = import.meta.env.VITE_API_URL;
  if (base) return base.replace(/\/$/, '').replace(/^http/, 'ws') + path; // http→ws, https→wss
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}${path}`;
}

export default function VideoCallPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [room, setRoom] = useState(searchParams.get('room') ?? '');
  const [inCall, setInCall] = useState(false);
  const [status, setStatus] = useState('idle');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null); // RTCPeerConnection
  const wsRef = useRef(null); // WebSocket to the backend
  const streamRef = useRef(null); // our camera + mic
  const iceServersRef = useRef(FALLBACK_ICE);
  const pendingCandidates = useRef([]); // ICE candidates that arrive early

  // Show our own camera once the call screen is on the page
  useEffect(() => {
    if (inCall && localVideoRef.current && streamRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
    }
  }, [inCall]);

  // Leaving the page (e.g. clicking another link) ends the call and turns the camera off
  useEffect(() => () => cleanup(), []);

  function send(message) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }

  function createPeerConnection() {
    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));

    pc.onicecandidate = (event) => {
      if (event.candidate) send({ type: 'ice-candidate', candidate: event.candidate });
    };
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setStatus('connected');
      if (pc.connectionState === 'failed') setStatus('failed');
    };

    pcRef.current = pc;
    return pc;
  }

  async function flushPendingCandidates() {
    for (const candidate of pendingCandidates.current) {
      await pcRef.current.addIceCandidate(candidate);
    }
    pendingCandidates.current = [];
  }

  function closePeer() {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidates.current = [];
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }

  async function handleSignal(message) {
    switch (message.type) {
      // Someone joined our room: we make the offer
      case 'peer-joined': {
        setStatus('connecting');
        closePeer();
        const pc = createPeerConnection();
        await pc.setLocalDescription(await pc.createOffer());
        send({ type: 'offer', sdp: pc.localDescription });
        break;
      }
      // We joined second: answer the offer
      case 'offer': {
        setStatus('connecting');
        closePeer();
        const pc = createPeerConnection();
        await pc.setRemoteDescription(message.sdp);
        await flushPendingCandidates();
        await pc.setLocalDescription(await pc.createAnswer());
        send({ type: 'answer', sdp: pc.localDescription });
        break;
      }
      case 'answer': {
        await pcRef.current?.setRemoteDescription(message.sdp);
        await flushPendingCandidates();
        break;
      }
      case 'ice-candidate': {
        const pc = pcRef.current;
        if (pc && pc.remoteDescription) await pc.addIceCandidate(message.candidate);
        else pendingCandidates.current.push(message.candidate);
        break;
      }
      case 'peer-left': {
        closePeer();
        setStatus('waiting');
        break;
      }
      case 'room-full':
      case 'invalid-room': {
        cleanup();
        setStatus(message.type === 'room-full' ? 'full' : 'invalid-room');
        break;
      }
      default:
        break;
    }
  }

  async function joinCall(e) {
    e.preventDefault();
    const roomName = room.trim().replace(/\s+/g, '-');
    if (!ROOM_PATTERN.test(roomName)) {
      setStatus('invalid-room');
      return;
    }

    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      setStatus('media-error');
      return;
    }

    setRoom(roomName);
    setSearchParams({ room: roomName }); // makes the page URL shareable
    setInCall(true);
    setStatus('waiting');
    setMicOn(true);
    setCamOn(true);

    // STUN/TURN settings from the backend; falls back to STUN only
    try {
      iceServersRef.current = await api('/api/video-call/ice-servers');
    } catch {
      iceServersRef.current = FALLBACK_ICE;
    }

    const ws = new WebSocket(signalingUrl(roomName));
    wsRef.current = ws;
    ws.onmessage = (event) => handleSignal(JSON.parse(event.data)).catch(console.error);
    ws.onerror = () => setStatus('error');
  }

  function cleanup() {
    wsRef.current?.close();
    wsRef.current = null;
    closePeer();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setInCall(false);
  }

  function hangUp() {
    cleanup();
    setStatus('idle');
  }

  function toggleMic() {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCam() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link and send it to the other person:', window.location.href);
    }
  }

  if (!inCall) {
    return (
      <div>
        <h1>Video call</h1>
        <form className="card" onSubmit={joinCall}>
          <h2>Join a room</h2>
          <p className="muted vc-lead">
            Choose a room name and share it with one other person. When they join the same
            room, you'll be connected directly.
          </p>
          <input
            placeholder="Room name, e.g. team-standup"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            maxLength={64}
            required
          />
          <button className="btn" type="submit" disabled={!room.trim()}>
            Join call
          </button>
        </form>
        {STATUS_TEXT[status] && <p className="error">{STATUS_TEXT[status]}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="vc-call-head">
        <h1>Room: {room}</h1>
        <span className={`vc-status${status === 'connected' ? ' vc-status-ok' : ''}`}>
          {STATUS_TEXT[status]}
        </span>
      </div>

      <div className="vc-stage">
        <video ref={remoteVideoRef} className="vc-remote" autoPlay playsInline />
        {status !== 'connected' && <div className="vc-remote-empty">{STATUS_TEXT[status]}</div>}
        <video
          ref={localVideoRef}
          className={`vc-local${camOn ? '' : ' vc-off'}`}
          autoPlay
          playsInline
          muted
        />
      </div>

      <div className="vc-controls">
        <button className="btn btn-ghost" onClick={toggleMic} aria-pressed={!micOn}>
          {micOn ? 'Mute' : 'Unmute'}
        </button>
        <button className="btn btn-ghost" onClick={toggleCam} aria-pressed={!camOn}>
          {camOn ? 'Stop video' : 'Start video'}
        </button>
        <button className="btn btn-ghost" onClick={copyInviteLink}>
          {copied ? 'Link copied' : 'Copy invite link'}
        </button>
        <button className="btn btn-danger" onClick={hangUp}>
          Hang up
        </button>
      </div>
    </div>
  );
}
