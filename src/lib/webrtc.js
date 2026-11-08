// Peer-to-peer call session using WebRTC.
// Signaling travels through the call server; media flows directly between peers.

import { sendSignal } from './callSocket';

const RTC_CONFIG = {
  iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
};

export class CallSession {
  constructor({ sessionId, role, peerUser, mode, callbacks }) {
    this.sessionId = sessionId;
    this.role = role; // 'caller' | 'callee'
    this.peerUser = peerUser;
    this.mode = mode; // 'video' | 'audio'
    this.callbacks = callbacks || {};
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingIce = [];
  }

  // Media with graceful fallback: video request -> audio-only fallback
  async acquireLocalMedia() {
    const wantVideo = this.mode === 'video';
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: wantVideo,
        audio: true,
      });
    } catch (err) {
      if (wantVideo) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          this.mode = 'audio'; // camera unavailable — continue as voice call
        } catch {
          throw new Error('Microphone/camera not available. Check browser permissions.');
        }
      } else {
        throw new Error('Microphone not available. Check browser permissions.');
      }
    }
  }

  setupPeer() {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => this.pc.addTrack(track, this.localStream));
    }
    this.pc.ontrack = (e) => {
      this.remoteStream = e.streams[0];
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({
          type: 'ice',
          to: this.peerUser.id,
          sessionId: this.sessionId,
          candidate: JSON.stringify(e.candidate),
        });
      }
    };
    this.pc.onconnectionstatechange = () => {
      const st = this.pc?.connectionState;
      if (st === 'connected') this.callbacks.onConnected?.();
      if (st === 'failed' || st === 'closed') this.callbacks.onFailed?.();
    };
  }

  async createAndSendOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    sendSignal({
      type: 'sdp',
      to: this.peerUser.id,
      sessionId: this.sessionId,
      sdp: { type: offer.type, sdp: offer.sdp },
    });
  }

  async handleSignal(msg) {
    if (!this.pc) return;
    if (msg.type === 'sdp' && msg.sdp) {
      if (msg.sdp.type === 'offer') {
        await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await this.flushIce();
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        sendSignal({
          type: 'sdp',
          to: this.peerUser.id,
          sessionId: this.sessionId,
          sdp: { type: answer.type, sdp: answer.sdp },
        });
      } else {
        await this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        await this.flushIce();
      }
    } else if (msg.type === 'ice' && msg.candidate) {
      if (!this.pc.remoteDescription) {
        this.pendingIce.push(msg.candidate);
      } else {
        try {
          await this.pc.addIceCandidate(JSON.parse(msg.candidate));
        } catch {
          // stale / duplicate candidates are safe to ignore
        }
      }
    }
  }

  async flushIce() {
    for (const c of this.pendingIce.splice(0)) {
      try {
        await this.pc.addIceCandidate(JSON.parse(c));
      } catch {
        // ignore
      }
    }
  }

  toggleMic(on) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = on));
  }

  toggleCam(on) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = on));
  }

  hangUp(notifyPeer = true) {
    if (notifyPeer) {
      sendSignal({ type: 'call-end', to: this.peerUser.id, sessionId: this.sessionId });
    }
    try {
      this.pc?.close();
    } catch {
      // ignore
    }
    this.pc = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
  }
}
