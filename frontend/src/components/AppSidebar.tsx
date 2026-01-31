import { Layout, Menu, Badge } from 'antd';
import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';

const { Sider } = Layout;

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessions } = useAppSelector((state) => state.session);
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  // Calculate total unread messages
  const totalUnread = sessions.reduce((sum, session) => sum + (session.unreadCount || 0), 0);

  const menuItems = [
    {
      key: '/',
      icon: (
        <Badge count={totalUnread} size="small" offset={[10, 0]} color={isCyberpunk ? '#ff006e' : undefined}>
          <MessageOutlined />
        </Badge>
      ),
      label: 'Messages',
    },
    {
      key: '/contacts',
      icon: <TeamOutlined />,
      label: 'Contacts',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider width={200} theme="dark">
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};
