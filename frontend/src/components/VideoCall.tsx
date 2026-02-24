import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Space, Typography, Avatar } from 'antd';
import {
  PhoneOutlined,
  AudioMutedOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  StopOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '../hooks';
import { webrtcService } from '../services';
import type { CallState } from '../services';

const { Text } = Typography;

const ERROR_MESSAGES: Record<string, string> = {
  peer_not_connected: 'User is offline',
  peer_unavailable: 'User is unreachable',
};

interface VideoCallProps {
  onClose: () => void;
}

export const VideoCall = ({ onClose }: VideoCallProps) => {
  const { mode } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callState, setCallState] = useState<CallState>(webrtcService.getState());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state for mini window
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isCyberpunk = mode === 'cyberpunk';

  // Initialize position to bottom-right on first minimize
  useEffect(() => {
    if (isMinimized && position.x === -1) {
      setPosition({
        x: window.innerWidth - 340,
        y: window.innerHeight - 220,
      });
    }
  }, [isMinimized, position.x]);

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

      if (!state.isInCall && !state.isCalling && !state.isReceivingCall && !state.errorReason) {
        onClose();
      }
    });

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

  // Drag handlers for mini window
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!isMinimized) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 180, e.clientY - dragOffset.current.y)),
      });
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMinimized]);

  // Error state overlay
  if (callState.errorReason) {
    const errorText = ERROR_MESSAGES[callState.errorReason] || 'Call failed';
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
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 77, 79, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOutlined
            style={{
              fontSize: 28,
              color: '#ff4d4f',
              transform: 'rotate(135deg)',
            }}
          />
        </div>
        <Text style={{ color: '#fff', fontSize: 20 }}>{errorText}</Text>
      </div>
    );
  }

  // Mini window mode
  if (isMinimized) {
    return (
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: 320,
          height: 180,
          borderRadius: 12,
          overflow: 'hidden',
          zIndex: 999,
          cursor: isDragging.current ? 'grabbing' : 'grab',
          boxShadow: isCyberpunk
            ? '0 0 24px rgba(0, 240, 255, 0.4)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          border: isCyberpunk ? '2px solid rgba(0, 240, 255, 0.5)' : '2px solid rgba(255,255,255,0.1)',
          backgroundColor: '#000',
        }}
      >
        {/* Remote video */}
        {callState.remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
            <Text style={{ color: '#fff', fontSize: 14 }}>
              {callState.isCalling ? 'Calling...' : 'Connecting...'}
            </Text>
          </div>
        )}

        {/* Mini controls overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'center',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          }}
        >
          <Space size="small">
            <Button
              type={isAudioEnabled ? 'default' : 'primary'}
              danger={!isAudioEnabled}
              shape="circle"
              size="small"
              icon={isAudioEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
              onClick={(e) => { e.stopPropagation(); handleToggleAudio(); }}
            />
            <Button
              type={isVideoEnabled ? 'default' : 'primary'}
              danger={!isVideoEnabled}
              shape="circle"
              size="small"
              icon={isVideoEnabled ? <VideoCameraOutlined /> : <StopOutlined />}
              onClick={(e) => { e.stopPropagation(); handleToggleVideo(); }}
            />
            <Button
              type="primary"
              danger
              shape="circle"
              size="small"
              icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
              onClick={(e) => { e.stopPropagation(); handleEndCall(); }}
            />
            <Button
              shape="circle"
              size="small"
              icon={<ArrowsAltOutlined />}
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
            />
          </Space>
        </div>
      </div>
    );
  }

  // Full-screen mode
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
            {isVideoEnabled ? (
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
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: isCyberpunk ? '#0a0e1a' : '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Avatar
                  src={user?.avatar}
                  icon={!user?.avatar && <UserOutlined />}
                  size={48}
                  style={{
                    backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff',
                  }}
                />
                <Text style={{ color: '#999', fontSize: 12 }}>Camera Off</Text>
              </div>
            )}
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
          <Button
            shape="circle"
            size="large"
            icon={<ShrinkOutlined />}
            onClick={() => setIsMinimized(true)}
          />
        </Space>
      </div>
    </div>
  );
};
