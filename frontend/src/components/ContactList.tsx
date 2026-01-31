import { List, Avatar, Button, Empty, Popconfirm, message, Typography } from 'antd';
import { UserOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';

const { Text } = Typography;
import { useAppDispatch, useAppSelector } from '../hooks';
import { deleteContact } from '../store/contactSlice';
import type { Contact } from '../types';

interface ContactListProps {
  onStartChat?: (contact: Contact) => void;
}

export const ContactList = ({ onStartChat }: ContactListProps) => {
  const dispatch = useAppDispatch();
  const { contacts, isLoading } = useAppSelector((state) => state.contact);
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  const handleDelete = async (contactUuid: string) => {
    try {
      await dispatch(deleteContact(contactUuid)).unwrap();
      message.success('Contact deleted');
    } catch (error) {
      message.error(error as string);
    }
  };

  if (contacts.length === 0 && !isLoading) {
    return (
      <Empty
        description={
          <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            No contacts yet
          </Text>
        }
      />
    );
  }

  return (
    <List
      loading={isLoading}
      dataSource={contacts}
      renderItem={(contact) => (
        <List.Item
          actions={[
            <Button
              key="chat"
              type="text"
              icon={<MessageOutlined />}
              onClick={() => onStartChat?.(contact)}
            />,
            <Popconfirm
              key="delete"
              title="Delete contact"
              description="Are you sure you want to delete this contact?"
              onConfirm={() => handleDelete(contact.uuid)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                src={contact.avatar}
                icon={!contact.avatar && <UserOutlined />}
                style={{ backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff' }}
              />
            }
            title={<Text style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{contact.nickname}</Text>}
            description={<Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#e0e0e0' : undefined }}>{contact.signature}</Text>}
          />
        </List.Item>
      )}
    />
  );
};
