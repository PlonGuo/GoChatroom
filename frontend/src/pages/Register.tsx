import { Card, Typography } from 'antd';

const { Title } = Typography;

export const Register = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Register</Title>
        <p style={{ textAlign: 'center' }}>Registration form will be implemented here</p>
      </Card>
    </div>
  );
};
