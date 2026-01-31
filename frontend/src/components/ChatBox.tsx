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
  const { mode } = useAppSelector((state) => state.theme);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isCyberpunk = mode === 'cyberpunk';

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
        <Empty
          description={
            <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
              No messages yet. Say hi!
            </Text>
          }
        />
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
        const isSelf = message.sendId === user?.uuid;

        // Theme-aware bubble styles
        const getBubbleStyle = () => {
          if (isCyberpunk) {
            if (isSelf) {
              return {
                background: '#00f0ff',
                color: '#0a0e1a',
                padding: '8px 12px',
                borderRadius: 12,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 4,
                wordBreak: 'break-word' as const,
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
              };
            } else {
              return {
                background: 'rgba(26, 31, 53, 0.7)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: 12,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 12,
                wordBreak: 'break-word' as const,
                border: '1px solid rgba(0, 240, 255, 0.3)',
                backdropFilter: 'blur(10px)',
              };
            }
          } else {
            return {
              background: isSelf ? '#1677ff' : '#f0f0f0',
              color: isSelf ? '#fff' : '#000',
              padding: '8px 12px',
              borderRadius: 12,
              borderTopLeftRadius: isSelf ? 12 : 4,
              borderTopRightRadius: isSelf ? 4 : 12,
              wordBreak: 'break-word' as const,
            };
          }
        };

        return (
          <div
            key={message.uuid}
            className="animate-fade-in"
            style={{
              display: 'flex',
              flexDirection: isSelf ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <Avatar
              src={message.sendAvatar}
              icon={!message.sendAvatar && <UserOutlined />}
              size="small"
              style={{ flexShrink: 0 }}
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
                <Text style={{ fontSize: 12, marginBottom: 4, color: isCyberpunk ? '#ffffff' : undefined }} type={isCyberpunk ? undefined : 'secondary'}>
                  {message.sendName}
                </Text>
              )}
              <div style={getBubbleStyle()}>
                {message.content}
              </div>
              <Text style={{ fontSize: 11, marginTop: 4, color: isCyberpunk ? 'rgba(255, 255, 255, 0.7)' : undefined }} type={isCyberpunk ? undefined : 'secondary'}>
                {formatTime(message.createdAt)}
              </Text>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
