import { useEffect, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import {
  PhoneOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../hooks';
import { webrtcService } from '../services';
import type { CallState } from '../services';

const { Text } = Typography;

interface VideoCallProps {
  onClose: () => void;
}

export const VideoCall = ({ onClose }: VideoCallProps) => {
  const { mode } = useAppSelector((state) => state.theme);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callState, setCallState] = useState<CallState>(webrtcService.getState());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const isCyberpunk = mode === 'cyberpunk';

  // Set video sources when streams change
  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  useEffect(() => {
    const unsubscribe = webrtcService.onStateChange((state) => {
      setCallState(state);

      if (!state.isInCall && !state.isCalling && !state.isReceivingCall) {
        onClose();
      }
    });

    // Set initial state
    const initialState = webrtcService.getState();
    if (localVideoRef.current && initialState.localStream) {
      localVideoRef.current.srcObject = initialState.localStream;
    }
    if (remoteVideoRef.current && initialState.remoteStream) {
      remoteVideoRef.current.srcObject = initialState.remoteStream;
    }

    return () => {
      unsubscribe();
    };
  }, [onClose]);

  const handleEndCall = () => {
    webrtcService.endCall();
  };

  const handleToggleAudio = () => {
    const newState = !isAudioEnabled;
    setIsAudioEnabled(newState);
    webrtcService.toggleAudio(newState);
  };

  const handleToggleVideo = () => {
    const newState = !isVideoEnabled;
    setIsVideoEnabled(newState);
    webrtcService.toggleVideo(newState);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000',
        zIndex: 1000,
      }}
    >
      {/* Remote Video (Full Screen) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {callState.remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18 }}>
              {callState.isCalling ? 'Calling...' : 'Connecting...'}
            </Text>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {callState.localStream && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 200,
              height: 150,
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: isCyberpunk
                ? '0 0 20px rgba(0, 240, 255, 0.4)'
                : '0 4px 12px rgba(0,0,0,0.3)',
              border: isCyberpunk ? '2px solid rgba(0, 240, 255, 0.5)' : undefined,
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'center',
          background: isCyberpunk
            ? 'linear-gradient(transparent, rgba(10, 14, 26, 0.9))'
            : 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          pointerEvents: 'none',
        }}
      >
        <Space size="large" style={{ pointerEvents: 'auto' }}>
          <Button
            type={isAudioEnabled ? 'default' : 'primary'}
            danger={!isAudioEnabled}
            shape="circle"
            size="large"
            icon={isAudioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
            onClick={handleToggleAudio}
          />
          <Button
            type={isVideoEnabled ? 'default' : 'primary'}
            danger={!isVideoEnabled}
            shape="circle"
            size="large"
            icon={isVideoEnabled ? <VideoCameraOutlined /> : <StopOutlined />}
            onClick={handleToggleVideo}
          />
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
            onClick={handleEndCall}
          />
        </Space>
      </div>
    </div>
  );
};
