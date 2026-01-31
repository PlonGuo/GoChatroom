import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Typography, Empty, Badge, Button, Tooltip } from 'antd';
import { MessageOutlined, WifiOutlined, DisconnectOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { SessionList, ChatBox, ChatInput, VideoCall, IncomingCallModal } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchSessions, fetchMessages, addMessage } from '../store/sessionSlice';
import { fetchContacts, fetchFriendRequests } from '../store/contactSlice';
import { websocketService } from '../services/websocket';
import { webrtcService } from '../services';
import type { CallState } from '../services';
import type { Message } from '../types';

const { Title, Text } = Typography;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { token, user } = useAppSelector((state) => state.auth);
  const { sessions, currentSession, messages, isLoadingMessages } = useAppSelector((state) => state.session);
  const { mode } = useAppSelector((state) => state.theme);
  const [isConnected, setIsConnected] = useState(false);
  const [callState, setCallState] = useState<CallState>(webrtcService.getState());
  const [callerInfo, setCallerInfo] = useState<{ name?: string; avatar?: string }>({});

  const isCyberpunk = mode === 'cyberpunk';

  // Track sessions for checking if new sessions need to be fetched
  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  // Handle incoming WebSocket messages
  const handleIncomingMessage = useCallback(
    (message: Message) => {
      dispatch(addMessage(message));

      // Check if we have this session in our list
      const hasSession =
        sessionsRef.current.some((s) => s.uuid === message.sessionId) ||
        sessionsRef.current.some((s) => s.receiveId === message.sendId);

      // If message is for a session we don't have, refresh sessions
      if (!hasSession && message.sendId !== user?.uuid) {
        dispatch(fetchSessions());
      }
    },
    [dispatch, user?.uuid]
  );

  useEffect(() => {
    if (token) {
      websocketService.connect(token);

      const unsubMessage = websocketService.onMessage(handleIncomingMessage);

      // Listen for friend request events
      const unsubFriendRequest = websocketService.onEvent('friend_request', () => {
        // Refresh friend requests when a new request is received
        dispatch(fetchFriendRequests());
      });

      const unsubFriendRequestAccepted = websocketService.onEvent('friend_request_accepted', () => {
        // Refresh contacts when a friend request is accepted
        dispatch(fetchContacts());
      });

      const unsubConnect = websocketService.onConnect(() => {
        setIsConnected(true);
      });

      const unsubDisconnect = websocketService.onDisconnect(() => {
        setIsConnected(false);
      });

      return () => {
        unsubMessage();
        unsubFriendRequest();
        unsubFriendRequestAccepted();
        unsubConnect();
        unsubDisconnect();
        websocketService.disconnect();
      };
    }
  }, [token, handleIncomingMessage, dispatch]);

  useEffect(() => {
    if (currentSession) {
      dispatch(fetchMessages({ sessionId: currentSession.uuid }));
    }
  }, [currentSession, dispatch]);

  // WebRTC connection for video calls
  useEffect(() => {
    if (token && user?.uuid) {
      webrtcService.connect(token, user.uuid);

      const unsubStateChange = webrtcService.onStateChange((state) => {
        setCallState(state);
        // When receiving a call, try to get caller info from current session
        if (state.isReceivingCall && currentSession && state.remoteUserId === currentSession.receiveId) {
          setCallerInfo({
            name: currentSession.receiveName,
            avatar: currentSession.avatar,
          });
        }
      });

      return () => {
        unsubStateChange();
        webrtcService.disconnect();
      };
    }
  }, [token, user?.uuid, currentSession]);

  const handleStartVideoCall = () => {
    if (currentSession) {
      webrtcService.initiateCall(currentSession.receiveId);
    }
  };

  const handleCloseVideoCall = () => {
    setCallState(webrtcService.getState());
  };

  const handleSendMessage = (content: string) => {
    if (currentSession) {
      websocketService.sendMessage(currentSession.uuid, currentSession.receiveId, content, 0);
    }
  };

  return (
    <>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
        {/* Session List */}
        <Card
          style={{
            width: 320,
            height: '100%',
            borderRadius: 0,
            overflow: 'auto',
          }}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <MessageOutlined style={{ marginRight: 8 }} />
                Messages
              </span>
              <Badge
                status={isConnected ? 'success' : 'error'}
                text={
                  <Text
                    type={isCyberpunk ? undefined : "secondary"}
                    style={{
                      fontSize: 12,
                      color: isCyberpunk ? (isConnected ? '#00f0ff' : '#ffffff') : undefined,
                    }}
                  >
                    {isConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                  </Text>
                }
              />
            </div>
          }
        >
          <SessionList />
        </Card>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {currentSession ? (
            <>
              <Card
                style={{
                  flex: 1,
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                styles={{
                  body: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    overflow: 'hidden',
                  },
                }}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{currentSession.receiveName}</span>
                    <Tooltip title="Video Call">
                      <Button
                        type="text"
                        icon={<VideoCameraOutlined />}
                        onClick={handleStartVideoCall}
                        disabled={!isConnected}
                      />
                    </Tooltip>
                  </div>
                }
              >
                <ChatBox messages={messages} isLoading={isLoadingMessages} />
                <ChatInput onSend={handleSendMessage} disabled={!isConnected} />
              </Card>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isCyberpunk ? '#0a0e1a' : '#fafafa',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title
                      level={4}
                      type={isCyberpunk ? undefined : "secondary"}
                      style={{ color: isCyberpunk ? '#ffffff' : undefined }}
                    >
                      Welcome to GoChatroom
                    </Title>
                    <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
                      Select a conversation to start chatting
                    </Text>
                  </div>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Video Call UI */}
      {(callState.isInCall || callState.isCalling) && (
        <VideoCall onClose={handleCloseVideoCall} />
      )}

      {/* Incoming Call Modal */}
      <IncomingCallModal
        visible={callState.isReceivingCall}
        callerName={callerInfo.name}
        callerAvatar={callerInfo.avatar}
      />
    </>
  );
};
