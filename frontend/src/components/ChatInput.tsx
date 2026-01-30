import { useState } from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks';

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <Space.Compact style={{ width: '100%' }}>
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message... (Press Enter to send)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={disabled}
          style={{ borderRadius: '8px 0 0 8px' }}
          className="transition-all"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          style={{
            height: 'auto',
            borderRadius: '0 8px 8px 0',
            boxShadow: isCyberpunk ? '0 0 15px rgba(0, 240, 255, 0.5)' : undefined,
          }}
          className="transition-all"
        >
          Send
        </Button>
      </Space.Compact>
    </div>
  );
};
