import { useEffect, useRef } from 'react';
import { Spin, Empty, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks';
import type { Message } from '../types';

const { Text } = Typography;

interface ChatBoxProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatBox = ({ messages, isLoading }: ChatBoxProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="No messages yet. Say hi!" />
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {messages.map((message) => {
        const isSelf = message.sender_uuid === user?.uuid;

        return (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: isSelf ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <Avatar
              src={message.sender?.avatar}
              icon={!message.sender?.avatar && <UserOutlined />}
              style={{ backgroundColor: isSelf ? '#1890ff' : '#87d068', flexShrink: 0 }}
              size="small"
            />
            <div
              style={{
                maxWidth: '60%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSelf ? 'flex-end' : 'flex-start',
              }}
            >
              {!isSelf && (
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
                  {message.sender?.nickname}
                </Text>
              )}
              <div
                style={{
                  background: isSelf ? '#1890ff' : '#f0f0f0',
                  color: isSelf ? '#fff' : '#000',
                  padding: '8px 12px',
                  borderRadius: 12,
                  borderTopLeftRadius: isSelf ? 12 : 4,
                  borderTopRightRadius: isSelf ? 4 : 12,
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </div>
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4 }}>
                {formatTime(message.created_at)}
              </Text>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
