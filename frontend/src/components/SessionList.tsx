import { List, Avatar, Typography, Badge, Empty, Popconfirm, Button, message } from 'antd';
import { UserOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  const handleSelectSession = (session: Session) => {
    dispatch(setCurrentSession(session));
    onSelectSession?.(session);
  };

  const handleDeleteSession = async (sessionUuid: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await dispatch(deleteSession(sessionUuid)).unwrap();
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
    return (
      <Empty
        description={
          <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            No conversations yet
          </Text>
        }
      />
    );
  }

  return (
    <List
      loading={isLoading}
      dataSource={sessions}
      renderItem={(session) => {
        const isSelected = currentSession?.uuid === session.uuid;

        // Theme-aware item styles
        const getItemStyle = () => {
          if (isCyberpunk) {
            return {
              cursor: 'pointer',
              backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.1)' : undefined,
              padding: '12px 16px',
              borderLeft: isSelected ? '3px solid #00f0ff' : '3px solid transparent',
              boxShadow: isSelected ? '0 0 10px rgba(0, 240, 255, 0.2)' : undefined,
            };
          } else {
            return {
              cursor: 'pointer',
              backgroundColor: isSelected ? '#e6f7ff' : undefined,
              padding: '12px 16px',
              borderLeft: isSelected ? '3px solid #1677ff' : '3px solid transparent',
            };
          }
        };

        return (
          <List.Item
            onClick={() => handleSelectSession(session)}
            style={getItemStyle()}
            className={isCyberpunk && !isSelected ? 'cyberpunk-glow-hover transition-all' : 'transition-all'}
            actions={[
              <Popconfirm
                key="delete"
                title="Delete conversation"
                description="This will only remove it from your list"
                onConfirm={(e) => handleDeleteSession(session.uuid, e as unknown as React.MouseEvent)}
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
                <Badge
                  dot={session.unreadCount > 0}
                  offset={[-4, 4]}
                  color={isCyberpunk ? '#ff006e' : undefined}
                >
                  <Avatar
                    src={session.avatar}
                    icon={<UserOutlined />}
                  />
                </Badge>
              }
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong ellipsis style={{ maxWidth: 150, color: isCyberpunk ? '#ffffff' : undefined }}>
                    {session.receiveName}
                  </Text>
                  {session.lastMessageAt && (
                    <Text type={isCyberpunk ? undefined : 'secondary'} style={{ fontSize: 12, color: isCyberpunk ? '#e0e0e0' : undefined }}>
                      {formatTime(session.lastMessageAt)}
                    </Text>
                  )}
                </div>
              }
              description={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type={isCyberpunk ? undefined : 'secondary'} ellipsis style={{ maxWidth: 150, color: isCyberpunk ? '#e0e0e0' : undefined }}>
                    {session.lastMessage || 'No messages yet'}
                  </Text>
                  {session.unreadCount > 0 && (
                    <Badge
                      count={session.unreadCount}
                      size="small"
                      style={{ marginLeft: 8 }}
                      color={isCyberpunk ? '#ff006e' : undefined}
                    />
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
