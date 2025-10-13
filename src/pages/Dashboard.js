import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Progress, 
  List, 
  Avatar, 
  Button, 
  Typography,
  Space,
  Tag,
  Timeline
} from 'antd';
import {
  ExperimentOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAnalyses: 156,
    completedToday: 8,
    successRate: 94.2,
    avgDuration: 12.5
  });

  const [recentAnalyses, setRecentAnalyses] = useState([
    {
      id: 1,
      company: '紫金黄金国际',
      status: 'completed',
      duration: '15分钟',
      time: '2小时前',
      accuracy: 96
    },
    {
      id: 2,
      company: '泡泡玛特',
      status: 'completed',
      duration: '18分钟',
      time: '4小时前',
      accuracy: 94
    },
    {
      id: 3,
      company: '比亚迪',
      status: 'running',
      duration: '进行中',
      time: '刚刚',
      accuracy: null
    }
  ]);

  const [performanceData] = useState([
    { name: '周一', analyses: 12, accuracy: 94 },
    { name: '周二', analyses: 15, accuracy: 96 },
    { name: '周三', analyses: 8, accuracy: 92 },
    { name: '周四', analyses: 18, accuracy: 95 },
    { name: '周五', analyses: 22, accuracy: 97 },
    { name: '周六', analyses: 16, accuracy: 93 },
    { name: '周日', analyses: 10, accuracy: 94 }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#52c41a';
      case 'running': return '#1890ff';
      case 'failed': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'running': return '进行中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          📊 仪表盘
        </Title>
        <Text type="secondary">
          实时监控股票分析Agent的运行状态和性能指标
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card success">
            <Statistic
              title="总分析次数"
              value={stats.totalAnalyses}
              prefix={<ExperimentOutlined />}
              suffix="次"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                较上月增长 23%
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card info">
            <Statistic
              title="今日完成"
              value={stats.completedToday}
              prefix={<CheckCircleOutlined />}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                较昨日增长 12%
              </Text>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card warning">
            <Statistic
              title="成功率"
              value={stats.successRate}
              prefix={<TrophyOutlined />}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={stats.successRate} 
                size="small" 
                showInfo={false}
                strokeColor="#faad14"
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card error">
            <Statistic
              title="平均耗时"
              value={stats.avgDuration}
              prefix={<ClockCircleOutlined />}
              suffix="分钟"
              precision={1}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <FallOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                较上周减少 8%
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 性能趋势图 */}
        <Col xs={24} lg={16}>
          <Card 
            title="本周分析趋势" 
            className="card-shadow"
            extra={
              <Space>
                <Tag color="blue">分析次数</Tag>
                <Tag color="green">准确率</Tag>
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="analyses" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#52c41a" 
                  strokeWidth={2}
                  dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* 最近分析 */}
        <Col xs={24} lg={8}>
          <Card 
            title="最近分析" 
            className="card-shadow"
            extra={
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                新建分析
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={recentAnalyses}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          backgroundColor: getStatusColor(item.status),
                          color: '#fff'
                        }}
                      >
                        {item.company.charAt(0)}
                      </Avatar>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.company}</span>
                        <Tag color={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={4}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          耗时: {item.duration} • {item.time}
                        </Text>
                        {item.accuracy && (
                          <Progress 
                            percent={item.accuracy} 
                            size="small" 
                            format={percent => `${percent}%`}
                            strokeColor="#52c41a"
                          />
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 系统状态 */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Agent状态" className="card-shadow">
            <Timeline
              items={[
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>管理层分析Agent</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        运行正常 • 最后执行: 2分钟前
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>商业模式研究Agent</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        运行正常 • 最后执行: 5分钟前
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>竞争格局分析Agent</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        执行中 • 预计完成: 3分钟后
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>估值分析Agent</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        运行正常 • 最后执行: 8分钟前
                      </Text>
                    </div>
                  ),
                },
                {
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>股权分布研究Agent</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        运行正常 • 最后执行: 10分钟前
                      </Text>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="快速操作" className="card-shadow">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<ExperimentOutlined />}
                block
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 48
                }}
              >
                开始新的股票分析
              </Button>
              
              <Button 
                size="large" 
                icon={<FileTextOutlined />}
                block
                style={{ height: 40 }}
              >
                查看分析报告
              </Button>
              
              <Button 
                size="large" 
                icon={<ClockCircleOutlined />}
                block
                style={{ height: 40 }}
              >
                查看执行历史
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;