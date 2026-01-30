import { Card, Typography } from 'antd';

const { Title } = Typography;

export const Login = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
        <p style={{ textAlign: 'center' }}>Login form will be implemented here</p>
      </Card>
    </div>
  );
};
