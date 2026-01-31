import { List, Avatar, Button, Empty, message, Typography } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { acceptFriendRequest, rejectFriendRequest, fetchContacts } from '../store/contactSlice';

const { Text } = Typography;

export const FriendRequestList = () => {
  const dispatch = useAppDispatch();
  const { friendRequests, isLoading } = useAppSelector((state) => state.contact);
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  const handleAccept = async (uuid: string) => {
    try {
      await dispatch(acceptFriendRequest(uuid)).unwrap();
      // Refresh contacts list to show the newly added friend
      await dispatch(fetchContacts());
      message.success('Friend request accepted');
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleReject = async (uuid: string) => {
    try {
      await dispatch(rejectFriendRequest(uuid)).unwrap();
      message.success('Friend request rejected');
    } catch (error) {
      message.error(error as string);
    }
  };

  if (friendRequests.length === 0 && !isLoading) {
    return (
      <Empty
        description={
          <Text type={isCyberpunk ? undefined : "secondary"} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            No friend requests
          </Text>
        }
      />
    );
  }

  return (
    <List
      loading={isLoading}
      dataSource={friendRequests}
      renderItem={(request) => (
        <List.Item
          actions={[
            <Button
              key="accept"
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAccept(request.uuid)}
            >
              Accept
            </Button>,
            <Button
              key="reject"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(request.uuid)}
            >
              Reject
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                src={request.userAvatar}
                icon={!request.userAvatar && <UserOutlined />}
                style={{ backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff' }}
              />
            }
            title={<Text style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{request.userName || 'Unknown User'}</Text>}
            description={
              <>
                {request.message && <Text italic style={{ color: isCyberpunk ? '#e0e0e0' : undefined }}>"{request.message}"</Text>}
                <br />
                <Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#e0e0e0' : undefined }}>{request.createdAt}</Text>
              </>
            }
          />
        </List.Item>
      )}
    />
  );
};
