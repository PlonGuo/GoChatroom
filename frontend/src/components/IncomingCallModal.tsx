import { Modal, Avatar, Typography, Flex, Button } from 'antd';
import { PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useAppSelector } from '../hooks';
import { webrtcService } from '../services';

const { Title, Text } = Typography;

interface IncomingCallModalProps {
  visible: boolean;
  callerName?: string;
  callerAvatar?: string;
}

export const IncomingCallModal = ({ visible, callerName, callerAvatar }: IncomingCallModalProps) => {
  const { mode } = useAppSelector((state) => state.theme);
  const isCyberpunk = mode === 'cyberpunk';

  const handleAccept = () => {
    webrtcService.acceptCall();
  };

  const handleReject = () => {
    webrtcService.rejectCall();
  };

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      width={300}
      styles={{
        body: { textAlign: 'center', padding: 24 },
      }}
    >
      <Flex vertical align="center" gap="large">
        <Avatar
          src={callerAvatar}
          icon={!callerAvatar && <UserOutlined />}
          size={80}
          style={{
            backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff',
            border: isCyberpunk ? '2px solid rgba(0, 240, 255, 0.5)' : undefined,
            boxShadow: isCyberpunk ? '0 0 20px rgba(0, 240, 255, 0.3)' : undefined,
          }}
        />
        <div>
          <Title level={4} style={{ margin: 0, color: isCyberpunk ? '#ffffff' : undefined }}>
            {callerName || 'Someone'}
          </Title>
          <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            is calling you...
          </Text>
        </div>
        <Flex gap="large">
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
            onClick={handleReject}
            style={{
              boxShadow: isCyberpunk ? '0 0 15px rgba(255, 0, 110, 0.4)' : undefined,
            }}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PhoneOutlined />}
            onClick={handleAccept}
            style={{
              backgroundColor: isCyberpunk ? '#00ff9f' : '#52c41a',
              borderColor: isCyberpunk ? '#00ff9f' : '#52c41a',
              boxShadow: isCyberpunk ? '0 0 15px rgba(0, 255, 159, 0.4)' : undefined,
            }}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};
