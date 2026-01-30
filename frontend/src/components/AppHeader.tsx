import { Layout, Avatar, Dropdown, Typography, Space } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';
import { ThemeToggle } from './ThemeToggle';

const { Header } = Layout;
const { Text } = Typography;

export const AppHeader = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);

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

  const isCyberpunk = mode === 'cyberpunk';

  return (
    <Header
      style={{
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text
        strong
        style={{
          fontSize: 18,
          color: isCyberpunk ? '#00f0ff' : undefined,
        }}
        className={isCyberpunk ? 'cyberpunk-text-glow' : ''}
      >
        GoChatroom
      </Text>
      <Space>
        <ThemeToggle />
        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar
              src={user?.avatar}
              icon={!user?.avatar && <UserOutlined />}
            />
            <Text>{user?.nickname || 'User'}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};
