import { Modal, Form, Input, App } from 'antd';
import { useAppDispatch } from '../../hooks';
import { createGroup, fetchMyGroups } from '../../store/groupSlice';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateGroupModal = ({ open, onClose }: CreateGroupModalProps) => {
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(createGroup({ name: values.name, notice: values.notice })).unwrap();
      message.success('Group created');
      form.resetFields();
      onClose();
      dispatch(fetchMyGroups());
    } catch (error) {
      if (typeof error === 'string') {
        message.error(error);
      }
    }
  };

  return (
    <Modal
      title="Create Group"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      okText="Create"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Group Name"
          rules={[{ required: true, message: 'Please enter a group name' }]}
        >
          <Input placeholder="Enter group name" maxLength={50} />
        </Form.Item>
        <Form.Item name="notice" label="Notice (optional)">
          <Input.TextArea rows={2} placeholder="Group notice" maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
