import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '../../hooks';
import { webrtcService, soundService } from '../../services';
import type { CallState } from '../../services';
import { VideoCall } from '../VideoCall';
import { IncomingCallModal } from '../IncomingCallModal';

interface CallerInfo {
  name?: string;
  avatar?: string;
}

export const GlobalVideoCall = () => {
  const { token, user } = useAppSelector((state) => state.auth);
  const { sessions } = useAppSelector((state) => state.session);
  const [callState, setCallState] = useState<CallState>(webrtcService.getState());
  const [callerInfo, setCallerInfo] = useState<CallerInfo>({});

  // Find caller info from sessions list when receiving a call
  const findCallerInfo = useCallback(
    (remoteUserId: string | null): CallerInfo => {
      if (!remoteUserId) return {};

      // Search through sessions to find the caller
      const session = sessions.find((s) => s.receiveId === remoteUserId);
      if (session) {
        return {
          name: session.receiveName,
          avatar: session.avatar,
        };
      }

      return {};
    },
    [sessions]
  );

  // WebRTC connection for video calls - stays active across all pages
  // IMPORTANT: Only depends on token and user.uuid to prevent reconnection when sessions change
  useEffect(() => {
    if (!token || !user?.uuid) return;

    console.log('[GlobalVideoCall] Initializing WebRTC connection for user:', user.uuid);

    // Connect to WebRTC signaling server
    webrtcService.connect(token, user.uuid).catch((error) => {
      console.error('[GlobalVideoCall] Failed to connect to WebRTC signaling:', error);
    });

    const unsubStateChange = webrtcService.onStateChange((state) => {
      console.log('[GlobalVideoCall] Call state changed:', {
        isInCall: state.isInCall,
        isCalling: state.isCalling,
        isReceivingCall: state.isReceivingCall,
        remoteUserId: state.remoteUserId,
        hasLocalStream: !!state.localStream,
        hasRemoteStream: !!state.remoteStream,
      });
      setCallState(state);
    });

    return () => {
      console.log('[GlobalVideoCall] Cleaning up WebRTC connection');
      unsubStateChange();
      webrtcService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.uuid]);

  // Separate effect to update caller info when call state or sessions change
  useEffect(() => {
    if (callState.isReceivingCall && callState.remoteUserId) {
      const info = findCallerInfo(callState.remoteUserId);
      console.log('[GlobalVideoCall] Updated caller info:', info);
      setCallerInfo(info);
    }
  }, [callState.isReceivingCall, callState.remoteUserId, findCallerInfo]);


  // Play/stop ringtone when receiving a call
  useEffect(() => {
    if (callState.isReceivingCall) {
      console.log('[GlobalVideoCall] Starting ringtone');
      soundService.startRingtone();
    } else {
      soundService.stopRingtone();
    }

    return () => {
      soundService.stopRingtone();
    };
  }, [callState.isReceivingCall]);

  const handleCloseVideoCall = () => {
    setCallState(webrtcService.getState());
  };

  return (
    <>
      {/* Video Call UI - shows during active call or while calling */}
      {(callState.isInCall || callState.isCalling) && (
        <VideoCall onClose={handleCloseVideoCall} />
      )}

      {/* Incoming Call Modal - shows when receiving a call */}
      <IncomingCallModal
        visible={callState.isReceivingCall}
        callerName={callerInfo.name}
        callerAvatar={callerInfo.avatar}
      />
    </>
  );
};
