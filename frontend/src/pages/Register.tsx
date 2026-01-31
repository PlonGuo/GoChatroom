import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { registerAsync, clearError } from '../store/authSlice';
import type { RegisterRequest } from '../types';

const { Title, Text } = Typography;

interface RegisterFormValues extends RegisterRequest {
  confirmPassword: string;
}

export const Register = () => {
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

  const onFinish = async (values: RegisterFormValues) => {
    const { confirmPassword: _, ...registerData } = values;
    await dispatch(registerAsync(registerData));
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
            <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
              Create a new account
            </Text>
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

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="nickname"
              rules={[
                { required: true, message: 'Please enter your nickname' },
                { min: 2, message: 'Nickname must be at least 2 characters' },
                { max: 20, message: 'Nickname must be at most 20 characters' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nickname" size="large" />
            </Form.Item>

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
              rules={[
                { required: true, message: 'Please enter your password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
              Already have an account? <Link to="/login">Sign in</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};
