import { useEffect } from 'react';
import { Card, Typography, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { SessionList } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchSessions } from '../store/sessionSlice';

const { Title, Text } = Typography;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { currentSession } = useAppSelector((state) => state.session);

  useEffect(() => {
    dispatch(fetchSessions());
  }, [dispatch]);

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
          <span>
            <MessageOutlined style={{ marginRight: 8 }} />
            Messages
          </span>
        }
      >
        <SessionList />
      </Card>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentSession ? (
          <Card
            style={{ flex: 1, borderRadius: 0, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            title={currentSession.name}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text type="secondary">Chat functionality coming soon...</Text>
            </div>
          </Card>
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
