import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Space,
  Typography,
  Drawer,
  Descriptions,
  Progress,
  message,
  Tooltip,
  Badge,
  Empty,
  Spin,
  Modal,
  Tabs,
  Statistic,
  Chart
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  BarChartOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  RobotOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const MatchResults = () => {
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    keyword: '',
    dateRange: null,
    matchType: '',
    scoreRange: [0, 100],
    hasLLMCorrection: ''
  });
  const [stats, setStats] = useState({
    totalMatches: 0,
    stockMatches: 0,
    industryMatches: 0,
    avgScore: 0,
    llmCorrectionRate: 0,
    topStocks: [],
    topIndustries: []
  });
  const [chartData, setChartData] = useState({
    scoreDistribution: [],
    dailyMatches: [],
    matchTypeDistribution: []
  });

  useEffect(() => {
    fetchMatchData();
    fetchStats();
    fetchChartData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matchData, filters]);

  const fetchMatchData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/news-matcher/results?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        setMatchData(result.data.matches);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: result.data.total
        }));
      } else {
        message.error(result.error || '获取匹配结果失败');
      }
    } catch (error) {
      console.error('获取匹配结果失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/match-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
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

  const applyFilters = () => {
    let filtered = [...matchData];

    // 关键词过滤
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(item => 
        item.news_title?.toLowerCase().includes(keyword) ||
        item.stock_name?.toLowerCase().includes(keyword) ||
        item.industry?.toLowerCase().includes(keyword)
      );
    }

    // 日期范围过滤
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(item => {
        const matchDate = moment(item.process_time);
        return matchDate.isBetween(start, end, 'day', '[]');
      });
    }

    // 匹配类型过滤
    if (filters.matchType) {
      filtered = filtered.filter(item => item.match_type === filters.matchType);
    }

    // 分数范围过滤
    if (filters.scoreRange) {
      const [min, max] = filters.scoreRange;
      filtered = filtered.filter(item => {
        const score = item.match_type === 'stock' ? item.stock_score : item.industry_score * 100;
        return score >= min && score <= max;
      });
    }

    // LLM矫正过滤
    if (filters.hasLLMCorrection) {
      if (filters.hasLLMCorrection === 'yes') {
        filtered = filtered.filter(item => item.llm_correction && item.llm_correction.applied);
      } else if (filters.hasLLMCorrection === 'no') {
        filtered = filtered.filter(item => !item.llm_correction || !item.llm_correction.applied);
      }
    }

    setFilteredData(filtered);
  };

  const handleViewMatch = (record) => {
    setSelectedMatch(record);
    setDrawerVisible(true);
  };

  const handleTableChange = (pagination) => {
    fetchMatchData(pagination.current, pagination.pageSize);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `match_results_${moment().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('匹配结果导出成功');
  };

  const columns = [
    {
      title: '新闻标题',
      dataIndex: 'news_title',
      key: 'news_title',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (title, record) => (
        <Tooltip title={title}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              {title}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {moment(record.process_time).format('MM-DD HH:mm')}
            </Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '匹配类型',
      dataIndex: 'match_type',
      key: 'match_type',
      width: 100,
      render: (type) => {
        const config = {
          'stock': { color: 'blue', text: '股票匹配' },
          'industry': { color: 'purple', text: '行业匹配' }
        };
        const { color, text } = config[type] || { color: 'default', text: type };
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '股票匹配', value: 'stock' },
        { text: '行业匹配', value: 'industry' }
      ],
      onFilter: (value, record) => record.match_type === value,
    },
    {
      title: '匹配目标',
      key: 'match_target',
      width: 150,
      render: (_, record) => {
        if (record.match_type === 'stock') {
          return (
            <div>
              <Text strong>{record.stock_name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.stock_id}
              </Text>
            </div>
          );
        } else {
          return <Tag color="purple">{record.industry}</Tag>;
        }
      },
    },
    {
      title: '匹配分数',
      key: 'score',
      width: 120,
      render: (_, record) => {
        const score = record.match_type === 'stock' ? record.stock_score : record.industry_score * 100;
        const color = score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f';
        
        return (
          <div>
            <Progress 
              percent={Math.min(score, 100)} 
              size="small" 
              strokeColor={color}
              format={() => score.toFixed(1)}
            />
          </div>
        );
      },
      sorter: (a, b) => {
        const scoreA = a.match_type === 'stock' ? a.stock_score : a.industry_score * 100;
        const scoreB = b.match_type === 'stock' ? b.stock_score : b.industry_score * 100;
        return scoreA - scoreB;
      },
    },
    {
      title: '匹配方式',
      dataIndex: 'match_source',
      key: 'match_source',
      width: 100,
      render: (source) => {
        const config = {
          'regex_match': { color: 'green', text: '正则' },
          'semantic_match': { color: 'blue', text: '语义' },
          'trie_match': { color: 'orange', text: '字典树' },
          'keyword': { color: 'green', text: '关键词' },
          'hybrid': { color: 'orange', text: '混合' }
        };
        const { color, text } = config[source] || { color: 'default', text: source };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'LLM矫正',
      key: 'llm_correction',
      width: 100,
      render: (_, record) => {
        if (record.llm_correction && record.llm_correction.applied) {
          return (
            <Badge 
              status="success" 
              text={`${(record.llm_correction.confidence * 100).toFixed(0)}%`}
            />
          );
        }
        return <Badge status="default" text="未应用" />;
      },
    },
    {
      title: '处理时间',
      dataIndex: 'process_time',
      key: 'process_time',
      width: 120,
      render: (time) => (
        <div>
          <div>{moment(time).format('MM-DD')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(time).format('HH:mm')}
          </Text>
        </div>
      ),
      sorter: (a, b) => moment(a.process_time).unix() - moment(b.process_time).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewMatch(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const renderMatchDetail = () => {
    if (!selectedMatch) return null;

    return (
      <div>
        <Descriptions title="匹配详情" bordered column={2}>
          <Descriptions.Item label="新闻标题" span={2}>
            {selectedMatch.news_title}
          </Descriptions.Item>
          <Descriptions.Item label="匹配类型">
            <Tag color={selectedMatch.match_type === 'stock' ? 'blue' : 'purple'}>
              {selectedMatch.match_type === 'stock' ? '股票匹配' : '行业匹配'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="处理时间">
            {moment(selectedMatch.process_time).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          
          {selectedMatch.match_type === 'stock' ? (
            <>
              <Descriptions.Item label="股票代码">
                <Tag color="blue">{selectedMatch.stock_id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="公司名称">
                {selectedMatch.stock_name}
              </Descriptions.Item>
              <Descriptions.Item label="匹配分数">
                <Progress 
                  percent={Math.min(selectedMatch.stock_score, 100)} 
                  size="small" 
                  format={() => selectedMatch.stock_score.toFixed(1)}
                />
              </Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label="行业">
                <Tag color="purple">{selectedMatch.industry}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="匹配分数">
                <Progress 
                  percent={Math.min(selectedMatch.industry_score * 100, 100)} 
                  size="small" 
                  format={() => (selectedMatch.industry_score * 100).toFixed(1) + '%'}
                />
              </Descriptions.Item>
            </>
          )}
          
          <Descriptions.Item label="匹配方式">
            <Tag color="green">{selectedMatch.match_source}</Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* 新闻内容 */}
        <Card title="新闻内容" style={{ marginTop: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {selectedMatch.news_content}
          </Paragraph>
        </Card>

        {/* LLM矫正信息 */}
        {selectedMatch.llm_correction && (
          <Card title="LLM智能矫正" style={{ marginTop: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="矫正状态">
                <Badge 
                  status={selectedMatch.llm_correction.applied ? 'success' : 'default'}
                  text={selectedMatch.llm_correction.applied ? '已应用' : '未应用'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                {(selectedMatch.llm_correction.confidence * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {selectedMatch.llm_correction.processing_time?.toFixed(2)}s
              </Descriptions.Item>
              <Descriptions.Item label="矫正说明">
                {selectedMatch.llm_correction.reasoning}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 匹配详细信息 */}
        {selectedMatch.match_details && (
          <Card title="匹配详细信息" style={{ marginTop: 16 }}>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              {JSON.stringify(selectedMatch.match_details, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={2} style={{ margin: 0 }}>
                  <TrophyOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  匹配结果管理
                </Title>
                <Text type="secondary">
                  查看和管理新闻匹配结果，分析匹配效果和准确性
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExport}
                  >
                    导出结果
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchMatchData()}
                  >
                    刷新
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 统计信息 */}
        <Col span={24}>
          <Row gutter={16}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="总匹配数"
                  value={stats.totalMatches}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="股票匹配"
                  value={stats.stockMatches}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="行业匹配"
                  value={stats.industryMatches}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均分数"
                  value={stats.avgScore}
                  precision={1}
                  suffix="分"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="LLM矫正率"
                  value={stats.llmCorrectionRate}
                  precision={1}
                  suffix="%"
                  prefix={<RobotOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="今日匹配"
                  value={stats.todayMatches || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* 筛选器 */}
        <Col span={24}>
          <Card title={<><FilterOutlined /> 筛选条件</>}>
            <Row gutter={16}>
              <Col span={6}>
                <Search
                  placeholder="搜索新闻标题或匹配目标"
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  onSearch={() => applyFilters()}
                  allowClear
                />
              </Col>
              <Col span={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                  placeholder={['开始日期', '结束日期']}
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="匹配类型"
                  style={{ width: '100%' }}
                  value={filters.matchType}
                  onChange={(value) => setFilters(prev => ({ ...prev, matchType: value }))}
                  allowClear
                >
                  <Option value="stock">股票匹配</Option>
                  <Option value="industry">行业匹配</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="LLM矫正"
                  style={{ width: '100%' }}
                  value={filters.hasLLMCorrection}
                  onChange={(value) => setFilters(prev => ({ ...prev, hasLLMCorrection: value }))}
                  allowClear
                >
                  <Option value="yes">已矫正</Option>
                  <Option value="no">未矫正</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  onClick={applyFilters}
                  style={{ width: '100%' }}
                >
                  搜索
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 匹配结果表格 */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="list">
              <TabPane tab={`匹配列表 (${filteredData.length})`} key="list">
                <Table
                  columns={columns}
                  dataSource={filteredData}
                  loading={loading}
                  pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                  onChange={handleTableChange}
                  rowKey="id"
                  size="small"
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无匹配结果"
                      />
                    )
                  }}
                />
              </TabPane>
              
              <TabPane tab="热门股票" key="top-stocks">
                <Row gutter={16}>
                  {stats.topStocks?.map((stock, index) => (
                    <Col span={8} key={stock.stock_id} style={{ marginBottom: 16 }}>
                      <Card size="small">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#1890ff', 
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{stock.stock_name}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {stock.stock_id} • {stock.match_count} 次匹配
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </TabPane>
              
              <TabPane tab="热门行业" key="top-industries">
                <Row gutter={16}>
                  {stats.topIndustries?.map((industry, index) => (
                    <Col span={8} key={industry.industry} style={{ marginBottom: 16 }}>
                      <Card size="small">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#722ed1', 
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>{industry.industry}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {industry.match_count} 次匹配 • 平均分数 {industry.avg_score?.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* 匹配详情抽屉 */}
      <Drawer
        title="匹配详情"
        placement="right"
        width={800}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        {renderMatchDetail()}
      </Drawer>
    </div>
  );
};

export default MatchResults;