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

  private readonly iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  connect(token: string, userId: string) {
    this.currentUserId = userId;
    const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws/rtc?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SignalingData;
        this.handleSignalingMessage(data);
      } catch (error) {
        console.error('Failed to parse WebRTC signaling message:', error);
      }
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

    this.sendSignaling({
      type: 'call-accepted',
      from: this.currentUserId,
      to: this.remoteUserId,
    });

    await this.startCall();
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
        if (this.peerConnection?.connectionState === 'disconnected') {
          this.endCall();
        }
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
      if (!this.peerConnection) {
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
      }

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
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
      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
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
