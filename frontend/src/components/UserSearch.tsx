import { useState } from 'react';
import { Input, List, Avatar, Button, Empty, message, Modal, Form, Typography } from 'antd';
import { UserOutlined, UserAddOutlined, SearchOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { searchUsers, sendFriendRequest, clearSearchResults } from '../store/contactSlice';
import type { User } from '../types';

const { Search } = Input;
const { TextArea } = Input;
const { Text } = Typography;

export const UserSearch = () => {
  const dispatch = useAppDispatch();
  const { searchResults, isLoading, contacts } = useAppSelector((state) => state.contact);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const isCyberpunk = mode === 'cyberpunk';

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      dispatch(clearSearchResults());
      return;
    }
    await dispatch(searchUsers(value));
  };

  const handleAddFriend = (user: User) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!selectedUser) return;
    const values = await form.validateFields();
    try {
      await dispatch(sendFriendRequest({ uuid: selectedUser.uuid, message: values.message })).unwrap();
      message.success('Friend request sent');
      setModalOpen(false);
      form.resetFields();
      setSelectedUser(null);
      setSearchQuery('');
    } catch (error) {
      message.error(error as string);
    }
  };

  const isContact = (uuid: string) => contacts.some((c) => c.uuid === uuid);

  return (
    <>
      <Search
        placeholder="Search users by email or nickname"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={<SearchOutlined />}
        loading={isLoading}
        allowClear
        onClear={() => dispatch(clearSearchResults())}
      />

      {searchResults.length > 0 && (
        <List
          style={{ marginTop: 16 }}
          dataSource={searchResults}
          renderItem={(user) => {
            const isSelf = user.uuid === currentUser?.uuid;
            const alreadyContact = isContact(user.uuid);

            return (
              <List.Item
                actions={[
                  <Button
                    key="add"
                    type="primary"
                    size="small"
                    icon={<UserAddOutlined />}
                    disabled={isSelf || alreadyContact}
                    onClick={() => handleAddFriend(user)}
                  >
                    {isSelf ? 'You' : alreadyContact ? 'Friend' : 'Add'}
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={user.avatar}
                      icon={!user.avatar && <UserOutlined />}
                      style={{ backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff' }}
                    />
                  }
                  title={<Text style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{user.nickname}</Text>}
                  description={<Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#e0e0e0' : undefined }}>{user.email}</Text>}
                />
              </List.Item>
            );
          }}
        />
      )}

      {searchQuery && searchResults.length === 0 && !isLoading && (
        <Empty description="No users found" style={{ marginTop: 16 }} />
      )}

      <Modal
        title={`Add ${selectedUser?.nickname} as friend`}
        open={modalOpen}
        onOk={handleSendRequest}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        okText="Send Request"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="message" label="Message (optional)">
            <TextArea rows={3} placeholder="Say something about yourself..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
