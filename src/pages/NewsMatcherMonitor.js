import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Alert,
  Badge,
  Tooltip,
  Timeline,
  Descriptions,
  Empty,
  Spin,
  Select,
  DatePicker
} from 'antd';
import {
  MonitorOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  RobotOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const NewsMatcherMonitor = () => {
  const [loading, setLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    status: 'running',
    uptime: 0,
    lastUpdate: null,
    activeTasks: 0,
    queueSize: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    processingSpeed: 0,
    avgProcessingTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    networkLatency: 0
  });
  const [databaseStatus, setDatabaseStatus] = useState({
    mysql: { status: 'connected', responseTime: 0 },
    milvus: { status: 'connected', responseTime: 0 },
    totalRecords: 0,
    todayRecords: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [matchingStats, setMatchingStats] = useState({
    totalMatches: 0,
    stockMatches: 0,
    industryMatches: 0,
    llmCorrections: 0,
    successRate: 0,
    avgScore: 0
  });
  const [chartData, setChartData] = useState({
    hourlyProcessing: [],
    matchTypeDistribution: [],
    performanceTrend: []
  });

  useEffect(() => {
    fetchSystemStatus();
    fetchPerformanceMetrics();
    fetchDatabaseStatus();
    fetchRecentActivities();
    fetchErrorLogs();
    fetchMatchingStats();
    fetchChartData();

    // 设置定时刷新
    const interval = setInterval(() => {
      fetchSystemStatus();
      fetchPerformanceMetrics();
      fetchDatabaseStatus();
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/system-status');
      const result = await response.json();
      
      if (result.success) {
        setSystemStatus(result.data);
      }
    } catch (error) {
      console.error('获取系统状态失败:', error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/performance');
      const result = await response.json();
      
      if (result.success) {
        setPerformanceMetrics(result.data);
      }
    } catch (error) {
      console.error('获取性能指标失败:', error);
    }
  };

  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/database-status');
      const result = await response.json();
      
      if (result.success) {
        setDatabaseStatus(result.data);
      }
    } catch (error) {
      console.error('获取数据库状态失败:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/recent-activities');
      const result = await response.json();
      
      if (result.success) {
        setRecentActivities(result.data);
      }
    } catch (error) {
      console.error('获取最近活动失败:', error);
    }
  };

  const fetchErrorLogs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/error-logs');
      const result = await response.json();
      
      if (result.success) {
        setErrorLogs(result.data);
      }
    } catch (error) {
      console.error('获取错误日志失败:', error);
    }
  };

  const fetchMatchingStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/matching-stats');
      const result = await response.json();
      
      if (result.success) {
        setMatchingStats(result.data);
      }
    } catch (error) {
      console.error('获取匹配统计失败:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/chart-data');
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('获取图表数据失败:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'connected':
        return '#52c41a';
      case 'warning':
        return '#faad14';
      case 'error':
      case 'disconnected':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'connected':
        return '已连接';
      case 'warning':
        return '警告';
      case 'error':
        return '错误';
      case 'disconnected':
        return '断开连接';
      default:
        return '未知';
    }
  };

  const errorColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
      render: (time) => moment(time).format('MM-DD HH:mm:ss'),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        const colorMap = {
          'ERROR': 'red',
          'WARNING': 'orange',
          'INFO': 'blue'
        };
        return <Tag color={colorMap[level] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module) => <Tag color="purple">{module}</Tag>,
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <MonitorOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  系统监控
                </Title>
                <Text type="secondary">
                  实时监控新闻匹配系统的运行状态、性能指标和处理情况
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                      setLoading(true);
                      Promise.all([
                        fetchSystemStatus(),
                        fetchPerformanceMetrics(),
                        fetchDatabaseStatus(),
                        fetchRecentActivities(),
                        fetchErrorLogs(),
                        fetchMatchingStats()
                      ]).finally(() => setLoading(false));
                    }}
                    loading={loading}
                  >
                    刷新
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 系统状态概览 */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="系统状态"
                  value={getStatusText(systemStatus.status)}
                  valueStyle={{ color: getStatusColor(systemStatus.status) }}
                  prefix={
                    systemStatus.status === 'running' ? 
                    <CheckCircleOutlined /> : 
                    <CloseCircleOutlined />
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="运行时间"
                  value={Math.floor(systemStatus.uptime / 3600)}
                  suffix="小时"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="活跃任务"
                  value={systemStatus.activeTasks}
                  prefix={<ThunderboltOutlined />}
                  valueStyle={{ color: systemStatus.activeTasks > 0 ? '#1890ff' : '#d9d9d9' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="队列大小"
                  value={systemStatus.queueSize}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ color: systemStatus.queueSize > 10 ? '#faad14' : '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* 性能指标 */}
        <Col span={12}>
          <Card title={<><BarChartOutlined /> 性能指标</>}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text>CPU使用率</Text>
                  <Progress 
                    percent={performanceMetrics.cpuUsage} 
                    strokeColor={performanceMetrics.cpuUsage > 80 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text>内存使用率</Text>
                  <Progress 
                    percent={performanceMetrics.memoryUsage} 
                    strokeColor={performanceMetrics.memoryUsage > 80 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text>磁盘使用率</Text>
                  <Progress 
                    percent={performanceMetrics.diskUsage} 
                    strokeColor={performanceMetrics.diskUsage > 90 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text>网络延迟</Text>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                    {performanceMetrics.networkLatency}ms
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 数据库状态 */}
        <Col span={12}>
          <Card title={<><DatabaseOutlined /> 数据库状态</>}>
            <Row gutter={16}>
              <Col span={12}>
                <Descriptions title="MySQL" column={1} size="small">
                  <Descriptions.Item label="状态">
                    <Badge 
                      status={databaseStatus.mysql.status === 'connected' ? 'success' : 'error'}
                      text={getStatusText(databaseStatus.mysql.status)}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="响应时间">
                    {databaseStatus.mysql.responseTime}ms
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions title="Milvus" column={1} size="small">
                  <Descriptions.Item label="状态">
                    <Badge 
                      status={databaseStatus.milvus.status === 'connected' ? 'success' : 'error'}
                      text={getStatusText(databaseStatus.milvus.status)}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="响应时间">
                    {databaseStatus.milvus.responseTime}ms
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="总记录数"
                  value={databaseStatus.totalRecords}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日新增"
                  value={databaseStatus.todayRecords}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 匹配统计 */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="总匹配数"
                  value={matchingStats.totalMatches}
                  prefix={<ExperimentOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="股票匹配"
                  value={matchingStats.stockMatches}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="行业匹配"
                  value={matchingStats.industryMatches}
                  prefix={<PieChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="LLM矫正"
                  value={matchingStats.llmCorrections}
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="成功率"
                  value={matchingStats.successRate}
                  precision={1}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均分数"
                  value={matchingStats.avgScore}
                  precision={1}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* 最近活动 */}
        <Col span={12}>
          <Card title="最近活动" extra={
            <Button size="small" onClick={fetchRecentActivities}>
              刷新
            </Button>
          }>
            {recentActivities.length > 0 ? (
              <Timeline size="small">
                {recentActivities.map((activity, index) => (
                  <Timeline.Item 
                    key={index}
                    color={activity.type === 'error' ? 'red' : activity.type === 'warning' ? 'orange' : 'blue'}
                  >
                    <div>
                      <Text strong>{activity.action}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {moment(activity.timestamp).format('MM-DD HH:mm:ss')} • {activity.details}
                      </Text>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="暂无活动记录" />
            )}
          </Card>
        </Col>

        {/* 处理性能 */}
        <Col span={12}>
          <Card title="处理性能">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="处理速度"
                  value={performanceMetrics.processingSpeed}
                  suffix="条/分钟"
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均处理时间"
                  value={performanceMetrics.avgProcessingTime}
                  precision={2}
                  suffix="秒"
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
            
            {performanceMetrics.processingSpeed < 10 && (
              <Alert
                message="处理速度较慢"
                description="当前处理速度低于正常水平，建议检查系统资源使用情况"
                type="warning"
                style={{ marginTop: 16 }}
                showIcon
              />
            )}
          </Card>
        </Col>

        {/* 错误日志 */}
        <Col span={24}>
          <Card title={<><WarningOutlined /> 错误日志</> } extra={
            <Button size="small" onClick={fetchErrorLogs}>
              刷新
            </Button>
          }>
            {errorLogs.length > 0 ? (
              <Table
                dataSource={errorLogs}
                columns={errorColumns}
                size="small"
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            ) : (
              <Empty description="暂无错误日志" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewsMatcherMonitor;