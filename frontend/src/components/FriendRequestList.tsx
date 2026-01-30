import { List, Avatar, Button, Empty, Space, message, Typography } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks';
import { acceptFriendRequest, rejectFriendRequest } from '../store/contactSlice';

const { Text } = Typography;

export const FriendRequestList = () => {
  const dispatch = useAppDispatch();
  const { friendRequests, isLoading } = useAppSelector((state) => state.contact);

  const handleAccept = async (applyId: number) => {
    try {
      await dispatch(acceptFriendRequest(applyId)).unwrap();
      message.success('Friend request accepted');
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleReject = async (applyId: number) => {
    try {
      await dispatch(rejectFriendRequest(applyId)).unwrap();
      message.success('Friend request rejected');
    } catch (error) {
      message.error(error as string);
    }
  };

  if (friendRequests.length === 0 && !isLoading) {
    return <Empty description="No friend requests" />;
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
              onClick={() => handleAccept(request.id)}
            >
              Accept
            </Button>,
            <Button
              key="reject"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(request.id)}
            >
              Reject
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar
                src={request.from_user?.avatar}
                icon={!request.from_user?.avatar && <UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
            }
            title={request.from_user?.nickname || 'Unknown User'}
            description={
              <Space direction="vertical" size={0}>
                <Text type="secondary">{request.from_user?.email}</Text>
                {request.message && <Text italic>"{request.message}"</Text>}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );
};
