import { useEffect } from 'react';
import { Card, Tabs, Badge } from 'antd';
import { TeamOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { ContactList, FriendRequestList, UserSearch } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchContacts, fetchFriendRequests } from '../store/contactSlice';

export const Contacts = () => {
  const dispatch = useAppDispatch();
  const { friendRequests } = useAppSelector((state) => state.contact);

  useEffect(() => {
    dispatch(fetchContacts());
    dispatch(fetchFriendRequests());
  }, [dispatch]);

  const tabItems = [
    {
      key: 'contacts',
      label: (
        <span>
          <TeamOutlined />
          Contacts
        </span>
      ),
      children: <ContactList />,
    },
    {
      key: 'requests',
      label: (
        <Badge count={friendRequests.length} size="small" offset={[8, 0]}>
          <span>
            <UserAddOutlined />
            Friend Requests
          </span>
        </Badge>
      ),
      children: <FriendRequestList />,
    },
    {
      key: 'search',
      label: (
        <span>
          <SearchOutlined />
          Find Friends
        </span>
      ),
      children: <UserSearch />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs defaultActiveKey="contacts" items={tabItems} />
      </Card>
    </div>
  );
};
