import { useEffect, useState } from 'react';
import { Card, Typography, Empty, Badge, Button, Tooltip } from 'antd';
import { MessageOutlined, WifiOutlined, DisconnectOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { SessionList, ChatBox, ChatInput } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchSessions, fetchMessages, clearSessionUnread } from '../store/sessionSlice';
import { websocketService } from '../services/websocket';
import { webrtcService } from '../services';

const { Title, Text } = Typography;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { currentSession, messages, isLoadingMessages } = useAppSelector((state) => state.session);
  const { mode } = useAppSelector((state) => state.theme);
  const [isConnected, setIsConnected] = useState(false);

  const isCyberpunk = mode === 'cyberpunk';

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  // Monitor WebSocket connection status (managed in AppLayout)
  useEffect(() => {
    if (!token) return;

    const unsubConnect = websocketService.onConnect(() => {
      console.log('[Home] WebSocket connected');
      setIsConnected(true);
    });

    const unsubDisconnect = websocketService.onDisconnect(() => {
      console.log('[Home] WebSocket disconnected');
      setIsConnected(false);
    });

    // Check initial connection status
    setIsConnected(websocketService.isConnected());

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [token]);

  useEffect(() => {
    if (currentSession) {
      dispatch(fetchMessages({ sessionId: currentSession.uuid }));
      // Clear unread count when opening a session
      if (currentSession.unreadCount > 0) {
        dispatch(clearSessionUnread(currentSession.uuid));
      }
    }
  }, [currentSession, dispatch]);

  const handleStartVideoCall = () => {
    if (currentSession) {
      webrtcService.initiateCall(currentSession.receiveId);
    }
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

    </>
  );
};
