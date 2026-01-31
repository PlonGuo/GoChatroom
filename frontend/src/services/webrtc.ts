import { getICEServers, type ICEServer } from '../api/webrtcApi';

type SignalingHandler = (data: SignalingData) => void;

interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  from: string;
  to: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
}

interface CallState {
  isInCall: boolean;
  isCalling: boolean;
  isReceivingCall: boolean;
  remoteUserId: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private signalingHandlers: SignalingHandler[] = [];
  private stateChangeHandlers: ((state: CallState) => void)[] = [];
  private currentUserId: string = '';
  private remoteUserId: string | null = null;
  private isInCall = false;
  private isCalling = false;
  private isReceivingCall = false;
  private pendingIceCandidates: RTCIceCandidateInit[] = []; // Queue for ICE candidates that arrive before peer connection

  // Default fallback STUN servers
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  async connect(token: string, userId: string) {
    this.currentUserId = userId;

    // Fetch ICE servers from backend
    try {
      const servers = await getICEServers();
      this.iceServers = servers.map((server: ICEServer) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      }));
      console.log('Loaded ICE servers:', this.iceServers);
    } catch (error) {
      console.warn('Failed to fetch ICE servers, using defaults:', error);
    }

    // Use WSS in production, WS in development
    const baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = baseUrl.startsWith('http')
      ? baseUrl.replace(/^http/, wsProtocol.replace(':', ''))
      : baseUrl.startsWith('ws')
      ? baseUrl
      : `${wsProtocol}//${window.location.host}`;

    const fullWsUrl = `${wsUrl}/ws/rtc?token=${token}`;
    console.log('Connecting to WebRTC signaling:', fullWsUrl);

    this.ws = new WebSocket(fullWsUrl);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SignalingData;
        this.handleSignalingMessage(data);
      } catch (error) {
        console.error('Failed to parse WebRTC signaling message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebRTC signaling error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebRTC signaling disconnected');
      this.cleanup();
    };
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async handleSignalingMessage(data: SignalingData) {
    this.signalingHandlers.forEach((handler) => handler(data));

    switch (data.type) {
      case 'call-request':
        this.isReceivingCall = true;
        this.remoteUserId = data.from;
        this.notifyStateChange();
        break;

      case 'call-accepted':
        await this.startCall();
        break;

      case 'call-rejected':
      case 'call-ended':
        this.endCall();
        break;

      case 'offer':
        await this.handleOffer(data.payload as RTCSessionDescriptionInit);
        break;

      case 'answer':
        await this.handleAnswer(data.payload as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(data.payload as RTCIceCandidateInit);
        break;
    }
  }

  async initiateCall(targetUserId: string) {
    this.remoteUserId = targetUserId;
    this.isCalling = true;
    this.notifyStateChange();

    this.sendSignaling({
      type: 'call-request',
      from: this.currentUserId,
      to: targetUserId,
    });
  }

  async acceptCall() {
    if (!this.remoteUserId) return;

    this.isReceivingCall = false;
    this.notifyStateChange();

    // Prepare local media stream but DON'T create an offer
    // The caller (User A) will send the offer, we just need to be ready
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to get media stream:', error);
      this.cleanup();
      return;
    }

    // Tell the caller we accepted - they will send the offer
    this.sendSignaling({
      type: 'call-accepted',
      from: this.currentUserId,
      to: this.remoteUserId,
    });
  }

  rejectCall() {
    if (!this.remoteUserId) return;

    this.sendSignaling({
      type: 'call-rejected',
      from: this.currentUserId,
      to: this.remoteUserId,
    });

    this.cleanup();
    this.notifyStateChange();
  }

  endCall() {
    if (this.remoteUserId) {
      this.sendSignaling({
        type: 'call-ended',
        from: this.currentUserId,
        to: this.remoteUserId,
      });
    }

    this.cleanup();
    this.notifyStateChange();
  }

  private async startCall() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.notifyStateChange();
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.remoteUserId) {
          this.sendSignaling({
            type: 'ice-candidate',
            from: this.currentUserId,
            to: this.remoteUserId,
            payload: event.candidate.toJSON(),
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', this.peerConnection?.connectionState);
        const state = this.peerConnection?.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.endCall();
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
      };

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendSignaling({
        type: 'offer',
        from: this.currentUserId,
        to: this.remoteUserId!,
        payload: offer,
      });

      this.isInCall = true;
      this.isCalling = false;
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to start call:', error);
      this.cleanup();
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    try {
      // Get media stream if we don't have one yet (fallback for edge cases)
      if (!this.localStream) {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      // Create peer connection if needed
      if (!this.peerConnection) {
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });

        this.peerConnection.ontrack = (event) => {
          this.remoteStream = event.streams[0];
          this.notifyStateChange();
        };

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.remoteUserId) {
            this.sendSignaling({
              type: 'ice-candidate',
              from: this.currentUserId,
              to: this.remoteUserId,
              payload: event.candidate.toJSON(),
            });
          }
        };

        this.peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', this.peerConnection?.connectionState);
          const state = this.peerConnection?.connectionState;
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            this.endCall();
          }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', this.peerConnection?.iceConnectionState);
        };
      }

      // Only set remote description if we're in a state that can accept an offer
      const signalingState = this.peerConnection.signalingState;
      if (signalingState !== 'stable' && signalingState !== 'have-local-offer') {
        console.warn(`Cannot handle offer in signaling state: ${signalingState}`);
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush any ICE candidates that arrived before we were ready
      await this.flushPendingIceCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignaling({
        type: 'answer',
        from: this.currentUserId,
        to: this.remoteUserId!,
        payload: answer,
      });

      this.isInCall = true;
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    try {
      if (!this.peerConnection) {
        console.warn('No peer connection to handle answer');
        return;
      }

      // Only accept answer if we're waiting for one (have-local-offer state)
      const signalingState = this.peerConnection.signalingState;
      if (signalingState !== 'have-local-offer') {
        console.warn(`Cannot handle answer in signaling state: ${signalingState}`);
        return;
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));

      // Flush any ICE candidates that arrived before we were ready
      await this.flushPendingIceCandidates();
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      // Queue ICE candidates if peer connection isn't ready yet
      if (!this.peerConnection || !this.peerConnection.remoteDescription) {
        console.log('Queuing ICE candidate (peer connection not ready)');
        this.pendingIceCandidates.push(candidate);
        return;
      }
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  private async flushPendingIceCandidates() {
    if (!this.peerConnection) return;

    console.log(`Flushing ${this.pendingIceCandidates.length} pending ICE candidates`);
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error);
      }
    }
    this.pendingIceCandidates = [];
  }

  private sendSignaling(data: SignalingData) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.remoteUserId = null;
    this.isInCall = false;
    this.isCalling = false;
    this.isReceivingCall = false;
    this.pendingIceCandidates = [];
  }

  private notifyStateChange() {
    const state: CallState = {
      isInCall: this.isInCall,
      isCalling: this.isCalling,
      isReceivingCall: this.isReceivingCall,
      remoteUserId: this.remoteUserId,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
    };
    this.stateChangeHandlers.forEach((handler) => handler(state));
  }

  onStateChange(handler: (state: CallState) => void) {
    this.stateChangeHandlers.push(handler);
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter((h) => h !== handler);
    };
  }

  onSignaling(handler: SignalingHandler) {
    this.signalingHandlers.push(handler);
    return () => {
      this.signalingHandlers = this.signalingHandlers.filter((h) => h !== handler);
    };
  }

  getState(): CallState {
    return {
      isInCall: this.isInCall,
      isCalling: this.isCalling,
      isReceivingCall: this.isReceivingCall,
      remoteUserId: this.remoteUserId,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
    };
  }

  toggleAudio(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  toggleVideo(enabled: boolean) {
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }
}

export const webrtcService = new WebRTCService();
export type { CallState, SignalingData };
