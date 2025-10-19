import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  RobotOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/analysis',
      icon: <ExperimentOutlined />,
      label: '分析执行',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '分析报告',
    },
    {
      type: 'divider',
    },
    {
      key: 'news-matcher',
      icon: <ExperimentOutlined />,
      label: '新闻匹配系统',
      children: [
        {
          key: '/news-matcher/center',
          label: '匹配中心',
        },
        {
          key: '/news-matcher/news-browser',
          label: '新闻浏览',
        },
        {
          key: '/news-matcher/results',
          label: '匹配结果',
        },
        {
          key: '/news-matcher/llm-correction',
          label: 'LLM智能矫正',
        },
        {
          key: '/news-matcher/monitor',
          label: '系统监控',
        },
      ],
    },
    {
      key: '/agents',
      icon: <RobotOutlined />,
      label: 'Agent管理',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
      children: [
        {
          key: '/analytics/performance',
          label: '性能监控',
        },
        {
          key: '/analytics/accuracy',
          label: '准确性分析',
        },
        {
          key: '/analytics/trends',
          label: '趋势分析',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      width={240}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)'
      }}
      trigger={
        <div 
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      }
    >
      <div 
        style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {!collapsed && (
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
            📊 Stock AI
          </div>
        )}
        {collapsed && (
          <div style={{ color: '#fff', fontSize: 20 }}>
            📊
          </div>
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={['agents', 'analytics']}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 0,
          background: '#fff',
          height: 'calc(100vh - 112px)',
          overflowY: 'auto'
        }}
      />
    </Sider>
  );
};

export default Sidebar;