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
  Pagination,
  message,
  Tooltip,
  Badge,
  Empty,
  Spin,
  Modal,
  Form
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TagOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const NewsBrowser = () => {
  const [loading, setLoading] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    keyword: '',
    dateRange: null,
    source: '',
    category: '',
    hasMatches: ''
  });
  const [stats, setStats] = useState({
    totalNews: 0,
    todayNews: 0,
    matchedNews: 0,
    sources: []
  });

  useEffect(() => {
    fetchNewsData();
    fetchStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [newsData, filters]);

  const fetchNewsData = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/news-matcher/news?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();
      
      if (result.success) {
        setNewsData(result.data.news);
        setPagination(prev => ({
          ...prev,
          current: page,
          total: result.data.total
        }));
      } else {
        message.error(result.error || '获取新闻数据失败');
      }
    } catch (error) {
      console.error('获取新闻数据失败:', error);
      message.error('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...newsData];

    // 关键词过滤
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(keyword) ||
        item.content?.toLowerCase().includes(keyword) ||
        item.source?.toLowerCase().includes(keyword)
      );
    }

    // 日期范围过滤
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(item => {
        const newsDate = moment(item.publish_time);
        return newsDate.isBetween(start, end, 'day', '[]');
      });
    }

    // 来源过滤
    if (filters.source) {
      filtered = filtered.filter(item => item.source === filters.source);
    }

    // 分类过滤
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // 匹配状态过滤
    if (filters.hasMatches) {
      if (filters.hasMatches === 'matched') {
        filtered = filtered.filter(item => item.stock_matches && item.stock_matches.length > 0);
      } else if (filters.hasMatches === 'unmatched') {
        filtered = filtered.filter(item => !item.stock_matches || item.stock_matches.length === 0);
      }
    }

    setFilteredData(filtered);
  };

  const handleViewNews = (record) => {
    setSelectedNews(record);
    setDrawerVisible(true);
  };

  const handleTableChange = (pagination) => {
    fetchNewsData(pagination.current, pagination.pageSize);
  };

  const handleExport = () => {
    // 导出功能实现
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `news_data_${moment().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('数据导出成功');
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
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
              {record.source} • {moment(record.publish_time).format('MM-DD HH:mm')}
            </Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: '内容预览',
      dataIndex: 'content',
      key: 'content',
      width: 250,
      ellipsis: true,
      render: (content) => (
        <Paragraph 
          ellipsis={{ rows: 2, expandable: false }} 
          style={{ margin: 0, fontSize: '13px' }}
        >
          {content}
        </Paragraph>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source) => <Tag color="blue">{source}</Tag>,
    },
    {
      title: '发布时间',
      dataIndex: 'publish_time',
      key: 'publish_time',
      width: 120,
      render: (time) => (
        <div>
          <div>{moment(time).format('MM-DD')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {moment(time).format('HH:mm')}
          </Text>
        </div>
      ),
      sorter: (a, b) => moment(a.publish_time).unix() - moment(b.publish_time).unix(),
    },
    {
      title: '匹配状态',
      key: 'matches',
      width: 120,
      render: (_, record) => {
        const stockMatches = record.stock_matches?.length || 0;
        const industryMatches = record.industry_matches?.length || 0;
        
        if (stockMatches === 0 && industryMatches === 0) {
          return <Badge status="default" text="未匹配" />;
        }
        
        return (
          <Space direction="vertical" size={2}>
            {stockMatches > 0 && (
              <Badge status="success" text={`股票: ${stockMatches}`} />
            )}
            {industryMatches > 0 && (
              <Badge status="processing" text={`行业: ${industryMatches}`} />
            )}
          </Space>
        );
      },
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
            onClick={() => handleViewNews(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const renderNewsDetail = () => {
    if (!selectedNews) return null;

    return (
      <div>
        <Descriptions title="新闻详情" bordered column={2}>
          <Descriptions.Item label="标题" span={2}>
            {selectedNews.title}
          </Descriptions.Item>
          <Descriptions.Item label="来源">
            <Tag color="blue">{selectedNews.source}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            <Space>
              <CalendarOutlined />
              {moment(selectedNews.publish_time).format('YYYY-MM-DD HH:mm:ss')}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {selectedNews.category ? (
              <Tag color="green">{selectedNews.category}</Tag>
            ) : (
              <Text type="secondary">未分类</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="链接">
            {selectedNews.url ? (
              <Button 
                type="link" 
                icon={<LinkOutlined />}
                href={selectedNews.url}
                target="_blank"
              >
                查看原文
              </Button>
            ) : (
              <Text type="secondary">无链接</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Card title="新闻内容" style={{ marginTop: 16 }}>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
            {selectedNews.content}
          </Paragraph>
        </Card>

        {/* 股票匹配结果 */}
        {selectedNews.stock_matches && selectedNews.stock_matches.length > 0 && (
          <Card title="股票匹配结果" style={{ marginTop: 16 }}>
            <Space wrap>
              {selectedNews.stock_matches.map((match, index) => (
                <Tag key={index} color="blue">
                  {match.stock_name} ({match.stock_id}) - {match.score?.toFixed(1)}
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* 行业匹配结果 */}
        {selectedNews.industry_matches && selectedNews.industry_matches.length > 0 && (
          <Card title="行业匹配结果" style={{ marginTop: 16 }}>
            <Space wrap>
              {selectedNews.industry_matches.map((match, index) => (
                <Tag key={index} color="purple">
                  {match.industry} - {(match.score * 100).toFixed(1)}%
                </Tag>
              ))}
            </Space>
          </Card>
        )}

        {/* LLM矫正信息 */}
        {selectedNews.llm_correction && (
          <Card title="LLM智能矫正" style={{ marginTop: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="矫正状态">
                <Badge 
                  status={selectedNews.llm_correction.applied ? 'success' : 'default'}
                  text={selectedNews.llm_correction.applied ? '已应用' : '未应用'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                {(selectedNews.llm_correction.confidence * 100).toFixed(1)}%
              </Descriptions.Item>
              <Descriptions.Item label="矫正说明">
                {selectedNews.llm_correction.reasoning}
              </Descriptions.Item>
            </Descriptions>
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
                  <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  新闻数据浏览
                </Title>
                <Text type="secondary">
                  浏览和查看系统获取的新闻数据，支持多维度筛选和搜索
                </Text>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExport}
                  >
                    导出数据
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchNewsData()}
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
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                    {stats.totalNews.toLocaleString()}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>总新闻数</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                    {stats.todayNews.toLocaleString()}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>今日新增</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                    {stats.matchedNews.toLocaleString()}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>已匹配</div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                    {stats.sources?.length || 0}
                  </div>
                  <div style={{ color: '#666', marginTop: 4 }}>新闻源</div>
                </div>
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
                  placeholder="搜索标题或内容"
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
                  placeholder="选择来源"
                  style={{ width: '100%' }}
                  value={filters.source}
                  onChange={(value) => setFilters(prev => ({ ...prev, source: value }))}
                  allowClear
                >
                  {stats.sources?.map(source => (
                    <Option key={source} value={source}>{source}</Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="匹配状态"
                  style={{ width: '100%' }}
                  value={filters.hasMatches}
                  onChange={(value) => setFilters(prev => ({ ...prev, hasMatches: value }))}
                  allowClear
                >
                  <Option value="matched">已匹配</Option>
                  <Option value="unmatched">未匹配</Option>
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

        {/* 新闻列表 */}
        <Col span={24}>
          <Card title={`新闻列表 (${filteredData.length})`}>
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
                    description="暂无新闻数据"
                  />
                )
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 新闻详情抽屉 */}
      <Drawer
        title="新闻详情"
        placement="right"
        width={800}
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
      >
        {renderNewsDetail()}
      </Drawer>
    </div>
  );
};

export default NewsBrowser;