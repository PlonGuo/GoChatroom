import { useState } from 'react';
import { Card, Form, Input, Button, Avatar, Typography, Divider, message, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setUser, logout } from '../store/authSlice';
import * as userApi from '../api/userApi';

const { Title, Text } = Typography;

interface ProfileFormValues {
  nickname: string;
  avatar?: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const isCyberpunk = mode === 'cyberpunk';

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    setIsLoading(true);
    try {
      const updatedUser = await userApi.updateProfile(values);
      dispatch(setUser(updatedUser));
      message.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    try {
      await userApi.changePassword(values.currentPassword, values.newPassword);
      message.success('Password changed successfully. Please login again.');
      dispatch(logout());
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    profileForm.setFieldsValue({
      nickname: user?.nickname,
      avatar: user?.avatar,
    });
    setIsEditingProfile(true);
  };

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Card className={isCyberpunk ? 'glass-card cyberpunk' : ''}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar
            src={user?.avatar}
            icon={!user?.avatar && <UserOutlined />}
            size={100}
            style={{
              backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff',
              marginBottom: 16,
              border: isCyberpunk ? '2px solid rgba(0, 240, 255, 0.5)' : undefined,
              boxShadow: isCyberpunk ? '0 0 20px rgba(0, 240, 255, 0.3)' : undefined,
            }}
          />
          <Title level={3} style={{ marginBottom: 4, color: isCyberpunk ? '#ffffff' : undefined }}>
            {user?.nickname}
          </Title>
          <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            {user?.email}
          </Text>
        </div>

        <Divider>Profile Information</Divider>

        {isEditingProfile ? (
          <Form form={profileForm} layout="vertical" onFinish={handleProfileSubmit}>
            <Form.Item
              name="nickname"
              label="Nickname"
              rules={[
                { required: true, message: 'Please enter your nickname' },
                { min: 2, message: 'Nickname must be at least 2 characters' },
                { max: 20, message: 'Nickname must be at most 20 characters' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nickname" />
            </Form.Item>

            <Form.Item
              name="avatar"
              label="Avatar URL"
              rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Avatar URL (optional)" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditingProfile(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
                Nickname
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined style={{ color: isCyberpunk ? '#00f0ff' : '#1890ff' }} />
                <Text strong style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{user?.nickname}</Text>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
                Email
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined style={{ color: isCyberpunk ? '#00f0ff' : '#1890ff' }} />
                <Text strong style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{user?.email}</Text>
              </div>
            </div>
            <Button icon={<EditOutlined />} onClick={handleEditProfile}>
              Edit Profile
            </Button>
          </div>
        )}

        <Divider>Change Password</Divider>

        {isChangingPassword ? (
          <Form form={passwordForm} layout="vertical" onFinish={handlePasswordSubmit}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter your new password' },
                { min: 6, message: 'Password must be at least 6 characters' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  Change Password
                </Button>
                <Button
                  onClick={() => {
                    setIsChangingPassword(false);
                    passwordForm.resetFields();
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Button icon={<LockOutlined />} onClick={() => setIsChangingPassword(true)}>
            Change Password
          </Button>
        )}
      </Card>
    </div>
  );
};
