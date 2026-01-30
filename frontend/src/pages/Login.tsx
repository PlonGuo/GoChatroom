import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { loginAsync, clearError } from '../store/authSlice';
import type { LoginRequest } from '../types';

const { Title, Text } = Typography;

export const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const [form] = Form.useForm();

  const isCyberpunk = mode === 'cyberpunk';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const onFinish = async (values: LoginRequest) => {
    await dispatch(loginAsync(values));
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen"
      style={{
        background: isCyberpunk
          ? 'linear-gradient(135deg, #0a0e1a 0%, #131825 100%)'
          : '#f0f2f5'
      }}
    >
      <Card className={`w-100 ${isCyberpunk ? 'glass-card cyberpunk' : 'glass-card light'}`}>
        <Space orientation="vertical" size="large" className="w-full">
          <div className="text-center">
            <Title
              level={2}
              className={`mb-2 ${isCyberpunk ? 'cyberpunk-text-glow' : ''}`}
              style={{ color: isCyberpunk ? '#00f0ff' : undefined }}
            >
              GoChatroom
            </Title>
            <Text type="secondary">Sign in to your account</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => dispatch(clearError())}
            />
          )}

          <Form form={form} name="login" onFinish={onFinish} layout="vertical" requiredMark={false}>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type="secondary">
              Don't have an account? <Link to="/register">Sign up</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};
