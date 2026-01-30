import { Layout, Menu } from 'antd';
import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: '/',
      icon: <MessageOutlined />,
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
    <Sider
      width={200}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};
