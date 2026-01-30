import { useEffect, useRef, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import {
  PhoneOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { webrtcService } from '../services';
import type { CallState } from '../services';

const { Text } = Typography;

interface VideoCallProps {
  onClose: () => void;
}

export const VideoCall = ({ onClose }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callState, setCallState] = useState<CallState>(webrtcService.getState());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  useEffect(() => {
    const unsubscribe = webrtcService.onStateChange((state) => {
      setCallState(state);

      if (localVideoRef.current && state.localStream) {
        localVideoRef.current.srcObject = state.localStream;
      }

      if (remoteVideoRef.current && state.remoteStream) {
        remoteVideoRef.current.srcObject = state.remoteStream;
      }

      if (!state.isInCall && !state.isCalling && !state.isReceivingCall) {
        onClose();
      }
    });

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
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Remote Video (Full Screen) */}
      <div style={{ flex: 1, position: 'relative' }}>
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
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
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
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        }}
      >
        <Space size="large">
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
