import React from 'react';
import { Layout, Typography, Space, Badge, Avatar, Dropdown } from 'antd';
import { 
  BellOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  QuestionCircleOutlined 
} from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header = () => {
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: '帮助中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <AntHeader 
      style={{ 
        background: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          股票分析Agent
        </Title>
        <div 
          style={{ 
            marginLeft: 16,
            padding: '4px 12px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 12,
            fontWeight: 500
          }}
        >
          AI驱动
        </div>
      </div>
      
      <Space size="large">
        <Badge count={3} size="small">
          <BellOutlined 
            style={{ 
              fontSize: 18, 
              color: '#666',
              cursor: 'pointer',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1890ff'}
            onMouseLeave={(e) => e.target.style.color = '#666'}
          />
        </Badge>
        
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                marginRight: 8
              }}
            />
            <span style={{ color: '#262626', fontSize: 14 }}>管理员</span>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};

export default Header;