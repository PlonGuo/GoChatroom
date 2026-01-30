import { List, Avatar, Typography, Badge, Empty, Popconfirm, Button, message } from 'antd';
import { UserOutlined, TeamOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setCurrentSession, deleteSession } from '../store/sessionSlice';
import type { Session } from '../types';

const { Text } = Typography;

interface SessionListProps {
  onSelectSession?: (session: Session) => void;
}

export const SessionList = ({ onSelectSession }: SessionListProps) => {
  const dispatch = useAppDispatch();
  const { sessions, currentSession, isLoading } = useAppSelector((state) => state.session);

  const handleSelectSession = (session: Session) => {
    dispatch(setCurrentSession(session));
    onSelectSession?.(session);
  };

  const handleDeleteSession = async (sessionId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await dispatch(deleteSession(sessionId)).unwrap();
      message.success('Conversation deleted');
    } catch (error) {
      message.error(error as string);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (sessions.length === 0 && !isLoading) {
    return <Empty description="No conversations yet" />;
  }

  return (
    <List
      loading={isLoading}
      dataSource={sessions}
      renderItem={(session) => {
        const isSelected = currentSession?.id === session.id;
        const isGroup = session.type === 'group';

        return (
          <List.Item
            onClick={() => handleSelectSession(session)}
            style={{
              cursor: 'pointer',
              backgroundColor: isSelected ? '#e6f7ff' : undefined,
              padding: '12px 16px',
              borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
            }}
            actions={[
              <Popconfirm
                key="delete"
                title="Delete conversation"
                description="This will only remove it from your list"
                onConfirm={(e) => handleDeleteSession(session.id, e as unknown as React.MouseEvent)}
                onCancel={(e) => e?.stopPropagation()}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge dot={session.unread_count > 0} offset={[-4, 4]}>
                  <Avatar
                    src={session.avatar}
                    icon={isGroup ? <TeamOutlined /> : <UserOutlined />}
                    style={{ backgroundColor: isGroup ? '#52c41a' : '#1890ff' }}
                  />
                </Badge>
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong ellipsis style={{ maxWidth: 150 }}>
                    {session.name}
                  </Text>
                  {session.last_message_time && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(session.last_message_time)}
                    </Text>
                  )}
                </div>
              }
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" ellipsis style={{ maxWidth: 150 }}>
                    {session.last_message || 'No messages yet'}
                  </Text>
                  {session.unread_count > 0 && (
                    <Badge count={session.unread_count} size="small" style={{ marginLeft: 8 }} />
                  )}
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};
