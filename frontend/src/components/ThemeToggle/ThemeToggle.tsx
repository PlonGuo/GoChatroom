import { Button, Tooltip } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTheme } from '../../store/themeSlice';

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((state) => state.theme);

  const isCyberpunk = mode === 'cyberpunk';

  return (
    <Tooltip title={isCyberpunk ? 'Switch to Light Mode' : 'Switch to Cyberpunk Mode'}>
      <Button
        type="text"
        icon={isCyberpunk ? <BulbFilled /> : <BulbOutlined />}
        onClick={() => dispatch(toggleTheme())}
        style={{
          color: isCyberpunk ? '#00f0ff' : '#1677ff',
          fontSize: 18,
        }}
        className="transition-colors"
      />
    </Tooltip>
  );
};
