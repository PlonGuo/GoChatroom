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

// Constants
const CALL_TIMEOUT_MS = 30000; // 30 seconds timeout for unanswered calls
const ICE_RESTART_DELAY_MS = 2000; // 2 seconds delay before ICE restart attempt

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
  private callTimeoutId: ReturnType<typeof setTimeout> | null = null; // Timeout for unanswered calls
  private iceRestartAttempts = 0;
  private maxIceRestartAttempts = 3;

  // Default fallback STUN servers
  private iceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  async connect(token: string, userId: string) {
    this.currentUserId = userId;
    console.log('[WebRTC] connect() called with userId:', userId);

    // Fetch ICE servers from backend
    try {
      const servers = await getICEServers();
      this.iceServers = servers.map((server: ICEServer) => ({
        urls: server.urls,
        username: server.username,
        credential: server.credential,
      }));
      console.log('[WebRTC] Loaded ICE servers:', this.iceServers);
    } catch (error) {
      console.warn('[WebRTC] Failed to fetch ICE servers, using defaults:', error);
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
    console.log('[WebRTC] Connecting to signaling server:', fullWsUrl);

    this.ws = new WebSocket(fullWsUrl);

    this.ws.onopen = () => {
      console.log('[WebRTC] Signaling WebSocket CONNECTED, readyState:', this.ws?.readyState);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SignalingData;
        console.log('[WebRTC] Received signaling message:', data.type, 'from:', data.from);
        this.handleSignalingMessage(data);
      } catch (error) {
        console.error('[WebRTC] Failed to parse signaling message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebRTC] Signaling WebSocket ERROR:', error);
    };

    this.ws.onclose = (event) => {
      console.log('[WebRTC] Signaling WebSocket CLOSED, code:', event.code, 'reason:', event.reason);
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
    console.log('[WebRTC] handleSignalingMessage:', data.type, {
      from: data.from,
      to: data.to,
      hasPayload: !!data.payload,
    });

    this.signalingHandlers.forEach((handler) => handler(data));

    switch (data.type) {
      case 'call-request':
        console.log('[WebRTC] Received call-request from:', data.from);
        this.isReceivingCall = true;
        this.remoteUserId = data.from;
        this.notifyStateChange();
        break;

      case 'call-accepted':
        console.log('[WebRTC] Call accepted by remote user, starting call...');
        this.clearCallTimeout(); // Call was answered, clear timeout
        await this.startCall();
        break;

      case 'call-rejected':
        console.log('[WebRTC] Call rejected by remote user');
        this.clearCallTimeout(); // Call was rejected, clear timeout
        this.handleRemoteCallEnded(); // Use handleRemoteCallEnded to avoid sending call-ended back
        break;

      case 'call-ended':
        console.log('[WebRTC] Call ended by remote user');
        this.handleRemoteCallEnded();
        break;

      case 'offer':
        console.log('[WebRTC] Received offer from:', data.from);
        await this.handleOffer(data.payload as RTCSessionDescriptionInit);
        break;

      case 'answer':
        console.log('[WebRTC] Received answer from:', data.from);
        await this.handleAnswer(data.payload as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        console.log('[WebRTC] Received ICE candidate from:', data.from);
        await this.handleIceCandidate(data.payload as RTCIceCandidateInit);
        break;
    }
  }

  async initiateCall(targetUserId: string) {
    console.log('[WebRTC] initiateCall() called for:', targetUserId);

    // Check if WebSocket is connected
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('[WebRTC] Cannot initiate call - WebSocket not connected');
      return;
    }

    // Check if already in a call
    if (this.isInCall || this.isCalling || this.isReceivingCall) {
      console.warn('[WebRTC] Cannot initiate call - already in call state');
      return;
    }

    this.remoteUserId = targetUserId;
    this.isCalling = true;
    this.notifyStateChange();

    // Request media FIRST to handle permission popup before signaling starts
    // This ensures any browser permission dialogs are resolved before the call flow
    try {
      console.log('[WebRTC] Pre-requesting user media for caller...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('[WebRTC] Caller media obtained successfully');
      this.setupTrackEndedHandlers(this.localStream);
    } catch (error) {
      console.error('[WebRTC] Failed to get media for initiating call:', error);
      this.cleanup();
      this.notifyStateChange();
      return;
    }

    console.log('[WebRTC] Sending call-request to:', targetUserId);
    this.sendSignaling({
      type: 'call-request',
      from: this.currentUserId,
      to: targetUserId,
    });

    // Start timeout for unanswered call
    this.startCallTimeout();
  }

  private startCallTimeout() {
    this.clearCallTimeout();
    console.log(`[WebRTC] Starting call timeout (${CALL_TIMEOUT_MS / 1000}s)`);
    this.callTimeoutId = setTimeout(() => {
      if (this.isCalling) {
        console.log('[WebRTC] Call timeout - no answer received');
        this.handleCallTimeout();
      }
    }, CALL_TIMEOUT_MS);
  }

  private clearCallTimeout() {
    if (this.callTimeoutId) {
      clearTimeout(this.callTimeoutId);
      this.callTimeoutId = null;
      console.log('[WebRTC] Call timeout cleared');
    }
  }

  private handleCallTimeout() {
    console.log('[WebRTC] Handling call timeout - ending unanswered call');
    // Notify the callee that we're canceling (in case they see the call but haven't answered)
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

  // Setup track ended handlers to detect device disconnection
  private setupTrackEndedHandlers(stream: MediaStream) {
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log(`[WebRTC] Track ended: ${track.kind} (device may have been disconnected)`);
        // Check if all tracks are ended
        const allTracksEnded = stream.getTracks().every((t) => t.readyState === 'ended');
        if (allTracksEnded) {
          console.log('[WebRTC] All tracks ended - ending call');
          this.endCall();
        } else {
          // Only one track ended (e.g., camera unplugged but mic still works)
          console.log('[WebRTC] Some tracks still active');
          this.notifyStateChange();
        }
      };
    });
  }

  // Attempt ICE restart when connection fails (e.g., network switch)
  private async attemptIceRestart() {
    if (!this.peerConnection || !this.isInCall) {
      console.log('[WebRTC] Cannot restart ICE - no active call');
      return;
    }

    if (this.iceRestartAttempts >= this.maxIceRestartAttempts) {
      console.log(`[WebRTC] Max ICE restart attempts (${this.maxIceRestartAttempts}) reached - ending call`);
      this.endCall();
      return;
    }

    this.iceRestartAttempts++;
    console.log(`[WebRTC] Attempting ICE restart (attempt ${this.iceRestartAttempts}/${this.maxIceRestartAttempts})`);

    try {
      // Create a new offer with iceRestart flag
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);

      console.log('[WebRTC] ICE restart offer created, sending to remote');
      this.sendSignaling({
        type: 'offer',
        from: this.currentUserId,
        to: this.remoteUserId!,
        payload: offer,
      });
    } catch (error) {
      console.error('[WebRTC] ICE restart failed:', error);
      // If restart fails, try again after delay or give up
      if (this.iceRestartAttempts < this.maxIceRestartAttempts) {
        setTimeout(() => this.attemptIceRestart(), ICE_RESTART_DELAY_MS);
      } else {
        this.endCall();
      }
    }
  }

  // Handle ICE connection state changes
  private handleIceConnectionStateChange() {
    if (!this.peerConnection) return;

    const state = this.peerConnection.iceConnectionState;
    console.log('[WebRTC] ICE connection state changed:', state);

    switch (state) {
      case 'disconnected':
        // Connection temporarily lost - might recover automatically
        console.log('[WebRTC] ICE disconnected - waiting for recovery...');
        // Set a timeout to attempt restart if it doesn't recover
        setTimeout(() => {
          if (this.peerConnection?.iceConnectionState === 'disconnected') {
            console.log('[WebRTC] Still disconnected after timeout - attempting ICE restart');
            this.attemptIceRestart();
          }
        }, ICE_RESTART_DELAY_MS);
        break;

      case 'failed':
        // Connection failed - need to restart ICE
        console.log('[WebRTC] ICE failed - attempting restart');
        this.attemptIceRestart();
        break;

      case 'connected':
      case 'completed':
        // Connection established/recovered - reset restart counter
        console.log('[WebRTC] ICE connected - resetting restart attempts');
        this.iceRestartAttempts = 0;
        break;

      case 'closed':
        console.log('[WebRTC] ICE closed');
        break;
    }
  }

  async acceptCall() {
    console.log('[WebRTC] acceptCall() called');
    console.log('[WebRTC] Current state:', {
      remoteUserId: this.remoteUserId,
      currentUserId: this.currentUserId,
      wsReadyState: this.ws?.readyState,
      wsReadyStateText: this.getReadyStateText(this.ws?.readyState),
      isReceivingCall: this.isReceivingCall,
      isInCall: this.isInCall,
      isCalling: this.isCalling,
    });

    // Guard: Check if WebSocket is connected
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('[WebRTC] acceptCall() failed: WebSocket not connected');
      this.cleanup();
      this.notifyStateChange();
      return;
    }

    // Guard: Check if we're actually receiving a call
    if (!this.isReceivingCall) {
      console.error('[WebRTC] acceptCall() failed: not receiving a call');
      return;
    }

    if (!this.remoteUserId) {
      console.error('[WebRTC] acceptCall() failed: no remoteUserId');
      this.cleanup();
      this.notifyStateChange();
      return;
    }

    // Store remoteUserId before any async operations
    const targetUserId = this.remoteUserId;

    this.isReceivingCall = false;
    this.notifyStateChange();
    console.log('[WebRTC] Set isReceivingCall to false');

    // Prepare local media stream but DON'T create an offer
    // The caller (User A) will send the offer, we just need to be ready
    try {
      console.log('[WebRTC] Requesting user media (video + audio)...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('[WebRTC] Got local media stream:', {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length,
      });
      this.setupTrackEndedHandlers(this.localStream);
      this.notifyStateChange();
    } catch (error) {
      console.error('[WebRTC] Failed to get media stream:', error);
      this.cleanup();
      return;
    }

    // Tell the caller we accepted - they will send the offer
    // Use targetUserId captured before async operations to prevent race conditions
    console.log('[WebRTC] Sending call-accepted to:', targetUserId);
    this.sendSignaling({
      type: 'call-accepted',
      from: this.currentUserId,
      to: targetUserId,
    });
  }

  private getReadyStateText(state: number | undefined): string {
    switch (state) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  rejectCall() {
    console.log('[WebRTC] rejectCall() called');

    if (!this.remoteUserId) {
      console.warn('[WebRTC] rejectCall() - no remoteUserId, just cleaning up');
      this.cleanup();
      this.notifyStateChange();
      return;
    }

    const targetUserId = this.remoteUserId;
    console.log('[WebRTC] Sending call-rejected to:', targetUserId);

    this.sendSignaling({
      type: 'call-rejected',
      from: this.currentUserId,
      to: targetUserId,
    });

    this.cleanup();
    this.notifyStateChange();
  }

  endCall() {
    console.log('[WebRTC] endCall() called by local user');
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

  // Called when remote user ends the call - does NOT send call-ended back (prevents ping-pong)
  private handleRemoteCallEnded() {
    console.log('[WebRTC] handleRemoteCallEnded() - remote user ended the call');
    this.cleanup();
    this.notifyStateChange();
  }

  private async startCall() {
    console.log('[WebRTC] startCall() - Creating offer as caller');
    try {
      // Get media if we don't have it (should already have it from initiateCall)
      if (!this.localStream) {
        console.log('[WebRTC] Requesting user media (fallback)...');
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log('[WebRTC] Got local media stream (fallback)');
        this.setupTrackEndedHandlers(this.localStream);
      } else {
        console.log('[WebRTC] Using existing local media stream');
      }

      console.log('[WebRTC] Creating RTCPeerConnection with ICE servers:', this.iceServers);
      this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

      this.localStream.getTracks().forEach((track) => {
        console.log('[WebRTC] Adding track to peer connection:', track.kind);
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.peerConnection.ontrack = (event) => {
        console.log('[WebRTC] Received remote track:', event.track.kind);
        this.remoteStream = event.streams[0];
        this.notifyStateChange();
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.remoteUserId) {
          console.log('[WebRTC] Got local ICE candidate, sending to remote');
          this.sendSignaling({
            type: 'ice-candidate',
            from: this.currentUserId,
            to: this.remoteUserId,
            payload: event.candidate.toJSON(),
          });
        } else if (!event.candidate) {
          console.log('[WebRTC] ICE gathering complete');
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state changed:', this.peerConnection?.connectionState);
        const state = this.peerConnection?.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.endCall();
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        this.handleIceConnectionStateChange();
      };

      this.peerConnection.onicegatheringstatechange = () => {
        console.log('[WebRTC] ICE gathering state:', this.peerConnection?.iceGatheringState);
      };

      this.peerConnection.onsignalingstatechange = () => {
        console.log('[WebRTC] Signaling state:', this.peerConnection?.signalingState);
      };

      console.log('[WebRTC] Creating offer...');
      const offer = await this.peerConnection.createOffer();
      console.log('[WebRTC] Offer created, setting local description...');
      await this.peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] Local description set, sending offer to:', this.remoteUserId);

      this.sendSignaling({
        type: 'offer',
        from: this.currentUserId,
        to: this.remoteUserId!,
        payload: offer,
      });

      this.isInCall = true;
      this.isCalling = false;
      this.notifyStateChange();
      console.log('[WebRTC] startCall() complete, waiting for answer...');
    } catch (error) {
      console.error('[WebRTC] startCall() FAILED:', error);
      this.cleanup();
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    console.log('[WebRTC] handleOffer() - Processing offer from caller');
    console.log('[WebRTC] Current state:', {
      hasLocalStream: !!this.localStream,
      hasPeerConnection: !!this.peerConnection,
      remoteUserId: this.remoteUserId,
    });

    try {
      // Get media stream if we don't have one yet (fallback for edge cases)
      if (!this.localStream) {
        console.log('[WebRTC] No local stream, requesting media...');
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log('[WebRTC] Got local media stream');
        this.setupTrackEndedHandlers(this.localStream);
      }

      // Create peer connection if needed
      if (!this.peerConnection) {
        console.log('[WebRTC] Creating new RTCPeerConnection');
        this.peerConnection = new RTCPeerConnection({ iceServers: this.iceServers });

        this.localStream.getTracks().forEach((track) => {
          console.log('[WebRTC] Adding track to peer connection:', track.kind);
          this.peerConnection!.addTrack(track, this.localStream!);
        });

        this.peerConnection.ontrack = (event) => {
          console.log('[WebRTC] Received remote track:', event.track.kind);
          this.remoteStream = event.streams[0];
          this.notifyStateChange();
        };

        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.remoteUserId) {
            console.log('[WebRTC] Got local ICE candidate, sending to remote');
            this.sendSignaling({
              type: 'ice-candidate',
              from: this.currentUserId,
              to: this.remoteUserId,
              payload: event.candidate.toJSON(),
            });
          }
        };

        this.peerConnection.onconnectionstatechange = () => {
          console.log('[WebRTC] Connection state:', this.peerConnection?.connectionState);
          const state = this.peerConnection?.connectionState;
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            this.endCall();
          }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
          this.handleIceConnectionStateChange();
        };

        this.peerConnection.onicegatheringstatechange = () => {
          console.log('[WebRTC] ICE gathering state:', this.peerConnection?.iceGatheringState);
        };

        this.peerConnection.onsignalingstatechange = () => {
          console.log('[WebRTC] Signaling state:', this.peerConnection?.signalingState);
        };
      }

      // Only set remote description if we're in a state that can accept an offer
      const signalingState = this.peerConnection.signalingState;
      console.log('[WebRTC] Current signaling state:', signalingState);
      if (signalingState !== 'stable' && signalingState !== 'have-local-offer') {
        console.warn(`[WebRTC] Cannot handle offer in signaling state: ${signalingState}`);
        return;
      }

      console.log('[WebRTC] Setting remote description (offer)...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set');

      // Flush any ICE candidates that arrived before we were ready
      await this.flushPendingIceCandidates();

      console.log('[WebRTC] Creating answer...');
      const answer = await this.peerConnection.createAnswer();
      console.log('[WebRTC] Answer created, setting local description...');
      await this.peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Local description set, sending answer...');

      this.sendSignaling({
        type: 'answer',
        from: this.currentUserId,
        to: this.remoteUserId!,
        payload: answer,
      });

      this.isInCall = true;
      this.notifyStateChange();
      console.log('[WebRTC] handleOffer() complete, call established');
    } catch (error) {
      console.error('[WebRTC] handleOffer() FAILED:', error);
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
    console.log('[WebRTC] sendSignaling() called:', data.type, {
      from: data.from,
      to: data.to,
      wsReadyState: this.ws?.readyState,
      wsReadyStateText: this.getReadyStateText(this.ws?.readyState),
    });

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      console.log('[WebRTC] ✓ Message sent successfully:', data.type);
    } else {
      console.error('[WebRTC] ✗ FAILED to send message - WebSocket not open!', {
        type: data.type,
        wsReadyState: this.ws?.readyState,
        wsExists: !!this.ws,
      });
    }
  }

  private cleanup() {
    console.log('[WebRTC] cleanup() called - resetting all call state');
    console.log('[WebRTC] cleanup() - previous state:', {
      hasLocalStream: !!this.localStream,
      hasPeerConnection: !!this.peerConnection,
      hasRemoteStream: !!this.remoteStream,
      remoteUserId: this.remoteUserId,
      isInCall: this.isInCall,
      isCalling: this.isCalling,
      isReceivingCall: this.isReceivingCall,
      pendingIceCandidates: this.pendingIceCandidates.length,
    });

    // Clear any pending timeouts
    this.clearCallTimeout();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log('[WebRTC] Stopping track:', track.kind);
        track.stop();
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      console.log('[WebRTC] Closing peer connection');
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.remoteUserId = null;
    this.isInCall = false;
    this.isCalling = false;
    this.isReceivingCall = false;
    this.pendingIceCandidates = [];
    this.iceRestartAttempts = 0;
    console.log('[WebRTC] cleanup() complete - all state reset');
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
