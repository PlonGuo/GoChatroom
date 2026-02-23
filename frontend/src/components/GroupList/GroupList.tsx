import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Avatar, Button, Empty, Popconfirm, Typography, Tag, App } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchMyGroups, leaveGroup, dissolveGroup } from '../../store/groupSlice';
import { createGroupSession } from '../../store/sessionSlice';

const { Text } = Typography;

export const GroupList = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { myGroups, isLoading } = useAppSelector((state) => state.group);
  const { user } = useAppSelector((state) => state.auth);
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  useEffect(() => {
    dispatch(fetchMyGroups());
  }, [dispatch]);

  const handleStartChat = async (group: { uuid: string; name: string; avatar: string }) => {
    try {
      await dispatch(createGroupSession({
        uuid: group.uuid,
        name: group.name,
        avatar: group.avatar,
      })).unwrap();
      navigate('/');
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleLeave = async (uuid: string) => {
    try {
      await dispatch(leaveGroup(uuid)).unwrap();
      message.success('Left group');
    } catch (error) {
      message.error(error as string);
    }
  };

  const handleDissolve = async (uuid: string) => {
    try {
      await dispatch(dissolveGroup(uuid)).unwrap();
      message.success('Group dissolved');
    } catch (error) {
      message.error(error as string);
    }
  };

  if (myGroups.length === 0 && !isLoading) {
    return (
      <Empty
        description={
          <Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
            No groups yet
          </Text>
        }
      />
    );
  }

  return (
    <List
      loading={isLoading}
      dataSource={myGroups}
      renderItem={(group) => {
        const isOwner = group.ownerId === user?.uuid;

        return (
          <List.Item
            actions={[
              <Button
                key="chat"
                type="link"
                onClick={() => handleStartChat(group)}
              >
                Chat
              </Button>,
              isOwner ? (
                <Popconfirm
                  key="dissolve"
                  title="Dissolve group"
                  description="This will permanently dissolve the group for all members."
                  onConfirm={() => handleDissolve(group.uuid)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger size="small">
                    Dissolve
                  </Button>
                </Popconfirm>
              ) : (
                <Popconfirm
                  key="leave"
                  title="Leave group"
                  description="Are you sure you want to leave this group?"
                  onConfirm={() => handleLeave(group.uuid)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger size="small">
                    Leave
                  </Button>
                </Popconfirm>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={group.avatar}
                  icon={<TeamOutlined />}
                  style={{ backgroundColor: isCyberpunk ? '#00f0ff' : '#1890ff' }}
                />
              }
              title={<Text style={{ color: isCyberpunk ? '#ffffff' : undefined }}>{group.name}</Text>}
              description={
                <Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#e0e0e0' : undefined }}>
                  <Tag>{group.memberCnt} members</Tag>
                  {isOwner && <Tag color="gold">Owner</Tag>}
                </Text>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};
