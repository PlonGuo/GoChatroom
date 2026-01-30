import { Modal, Avatar, Typography, Space, Button } from 'antd';
import { PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { webrtcService } from '../services';

const { Title, Text } = Typography;

interface IncomingCallModalProps {
  visible: boolean;
  callerName?: string;
  callerAvatar?: string;
}

export const IncomingCallModal = ({ visible, callerName, callerAvatar }: IncomingCallModalProps) => {
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
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Avatar
          src={callerAvatar}
          icon={!callerAvatar && <UserOutlined />}
          size={80}
          style={{ backgroundColor: '#1890ff' }}
        />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {callerName || 'Someone'}
          </Title>
          <Text type="secondary">is calling you...</Text>
        </div>
        <Space size="large">
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />}
            onClick={handleReject}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<PhoneOutlined />}
            onClick={handleAccept}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          />
        </Space>
      </Space>
    </Modal>
  );
};
