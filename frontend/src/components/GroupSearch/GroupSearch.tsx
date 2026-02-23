import { useState } from 'react';
import { Input, List, Avatar, Button, Empty, Typography, Tag, App } from 'antd';
import { TeamOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { searchGroups, clearSearchResults, joinGroup, fetchMyGroups } from '../../store/groupSlice';
import { CreateGroupModal } from '../CreateGroupModal';

const { Search } = Input;
const { Text } = Typography;

export const GroupSearch = () => {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { searchResults, isLoading, myGroups } = useAppSelector((state) => state.group);
  const { mode } = useAppSelector((state) => state.theme);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const isCyberpunk = mode === 'cyberpunk';

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      dispatch(clearSearchResults());
      return;
    }
    await dispatch(searchGroups(value));
  };

  const handleJoin = async (uuid: string) => {
    try {
      await dispatch(joinGroup(uuid)).unwrap();
      message.success('Joined group');
      dispatch(fetchMyGroups());
      setSearchQuery('');
    } catch (error) {
      message.error(error as string);
    }
  };

  const isMember = (uuid: string) => myGroups.some((g) => g.uuid === uuid);

  return (
    <>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Search
          placeholder="Search groups by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          loading={isLoading}
          allowClear
          onClear={() => dispatch(clearSearchResults())}
          style={{ flex: 1 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Create
        </Button>
      </div>

      {searchResults.length > 0 && (
        <List
          dataSource={searchResults}
          renderItem={(group) => {
            const alreadyMember = isMember(group.uuid);

            return (
              <List.Item
                actions={[
                  <Button
                    key="join"
                    type="primary"
                    size="small"
                    disabled={alreadyMember}
                    onClick={() => handleJoin(group.uuid)}
                  >
                    {alreadyMember ? 'Joined' : 'Join'}
                  </Button>,
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
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {searchQuery && searchResults.length === 0 && !isLoading && (
        <Empty
          description={
            <Text type={isCyberpunk ? undefined : 'secondary'} style={{ color: isCyberpunk ? '#ffffff' : undefined }}>
              No groups found
            </Text>
          }
        />
      )}

      <CreateGroupModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
