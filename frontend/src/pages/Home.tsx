import { useEffect, useState } from 'react';
import { Card, Typography, Empty, Badge } from 'antd';
import { MessageOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { SessionList, ChatBox, ChatInput } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchSessions, fetchMessages, addMessage } from '../store/sessionSlice';
import { websocketService } from '../services/websocket';

const { Title, Text } = Typography;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const { currentSession, messages, isLoadingMessages } = useAppSelector((state) => state.session);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      websocketService.connect(token);

      const unsubMessage = websocketService.onMessage((message) => {
        dispatch(addMessage(message));
      });

      const unsubConnect = websocketService.onConnect(() => {
        setIsConnected(true);
      });

      const unsubDisconnect = websocketService.onDisconnect(() => {
        setIsConnected(false);
      });

      return () => {
        unsubMessage();
        unsubConnect();
        unsubDisconnect();
        websocketService.disconnect();
      };
    }
  }, [token, dispatch]);

  useEffect(() => {
    if (currentSession) {
      dispatch(fetchMessages({ sessionId: currentSession.id }));
    }
  }, [currentSession, dispatch]);

  const handleSendMessage = (content: string) => {
    if (currentSession) {
      websocketService.sendMessage(currentSession.id, content);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      {/* Session List */}
      <Card
        style={{
          width: 320,
          height: '100%',
          borderRadius: 0,
          overflow: 'auto',
        }}
        bodyStyle={{ padding: 0 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <MessageOutlined style={{ marginRight: 8 }} />
              Messages
            </span>
            <Badge
              status={isConnected ? 'success' : 'error'}
              text={
                <Text type="secondary" style={{ fontSize: 12 }}>
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
              bodyStyle={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
                overflow: 'hidden',
              }}
              title={currentSession.name}
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
              background: '#fafafa',
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} type="secondary">
                    Welcome to GoChatroom
                  </Title>
                  <Text type="secondary">Select a conversation to start chatting</Text>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
