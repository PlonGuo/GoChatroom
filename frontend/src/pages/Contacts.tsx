import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Badge, App } from 'antd';
import { TeamOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { ContactList, FriendRequestList, UserSearch } from '../components';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchContacts, fetchFriendRequests } from '../store/contactSlice';
import { createPrivateSession } from '../store/sessionSlice';
import type { Contact } from '../types';

export const Contacts = () => {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { friendRequests } = useAppSelector((state) => state.contact);

  useEffect(() => {
    dispatch(fetchContacts());
    dispatch(fetchFriendRequests());
  }, [dispatch]);

  const handleStartChat = async (contact: Contact) => {
    try {
      await dispatch(createPrivateSession({
        uuid: contact.uuid,
        nickname: contact.nickname,
        avatar: contact.avatar,
      })).unwrap();
      navigate('/');
    } catch (error) {
      message.error(error as string);
    }
  };

  const tabItems = [
    {
      key: 'contacts',
      label: (
        <span>
          <TeamOutlined />
          Contacts
        </span>
      ),
      children: <ContactList onStartChat={handleStartChat} />,
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
