import { Typography } from 'antd';

const { Title } = Typography;

export const Home = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Welcome to GoChatroom</Title>
      <p>Select a conversation to start chatting</p>
    </div>
  );
};
