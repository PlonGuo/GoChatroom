import { Layout, Avatar, Dropdown, Typography, Space } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';

const { Header } = Layout;
const { Text } = Typography;

export const AppHeader = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Text strong style={{ fontSize: 18 }}>
        GoChatroom
      </Text>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar
            src={user?.avatar}
            icon={!user?.avatar && <UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
          <Text>{user?.nickname || 'User'}</Text>
        </Space>
      </Dropdown>
    </Header>
  );
};
