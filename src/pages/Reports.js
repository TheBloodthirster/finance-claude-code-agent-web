import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Typography,
  Row,
  Col,
  Empty,
  Spin,
  message
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchText, statusFilter, dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // 从后端API获取真实报告数据
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('获取报告列表失败');
      }
      const reportsData = await response.json();
      setReports(reportsData);
    } catch (error) {
      console.error('加载报告列表失败:', error);
      message.error('加载报告列表失败: ' + error.message);
      // 如果API失败，显示空列表
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(report => 
        report.company.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // 日期范围过滤
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(report => {
        const reportDate = moment(report.date);
        return reportDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }

    setFilteredReports(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'processing': return '进行中';
      case 'failed': return '失败';
      default: return '未知';
    }
  };

  const handleViewReport = (report) => {
    if (report.status === 'completed') {
      navigate(`/reports/${encodeURIComponent(report.company)}/${report.date.replace(/-/g, '')}`);
    } else {
      message.warning('报告尚未完成，无法查看');
    }
  };

  const handleDownloadReport = async (report) => {
    if (report.status !== 'completed') {
      message.warning('报告尚未完成，无法下载');
      return;
    }

    try {
      // 这里应该调用后端API下载报告
      message.success('报告下载已开始');
    } catch (error) {
      message.error('下载失败');
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          📄 分析报告
        </Title>
        <Text type="secondary">
          查看和管理所有股票分析报告
        </Text>
      </div>

      {/* 过滤器 */}
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Search
              placeholder="搜索公司名称"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="状态筛选"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="completed">已完成</Option>
              <Option value="processing">进行中</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          
          <Col xs={24} md={8}>
            <Space>
              <Button 
                icon={<SearchOutlined />}
                onClick={() => filterReports()}
              >
                搜索
              </Button>
              <Button 
                onClick={() => {
                  setSearchText('');
                  setStatusFilter('all');
                  setDateRange(null);
                }}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 报告列表 */}
      <Card className="card-shadow">
        <Spin spinning={loading}>
          {filteredReports.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无报告数据"
              style={{ padding: '48px 0' }}
            >
              <Button 
                type="primary" 
                onClick={() => navigate('/analysis')}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                创建新分析
              </Button>
            </Empty>
          ) : (
            <List
              itemLayout="vertical"
              size="large"
              dataSource={filteredReports}
              renderItem={report => (
                <List.Item
                  key={report.id}
                  actions={[
                    <Button
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewReport(report)}
                      disabled={report.status !== 'completed'}
                    >
                      查看报告
                    </Button>,
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadReport(report)}
                      disabled={report.status !== 'completed'}
                    >
                      下载
                    </Button>
                  ]}
                  extra={
                    <div style={{ textAlign: 'center', minWidth: 120 }}>
                      <Avatar
                        size={64}
                        style={{
                          background: report.status === 'completed' 
                            ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                            : report.status === 'processing'
                            ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                            : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                          color: '#fff',
                          fontSize: 24,
                          marginBottom: 8
                        }}
                        icon={<FileTextOutlined />}
                      />
                      <div>
                        <Tag color={getStatusColor(report.status)}>
                          {getStatusText(report.status)}
                        </Tag>
                      </div>
                    </div>
                  }
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 18, fontWeight: 600 }}>
                          {report.company}
                        </span>
                        <Tag icon={<CalendarOutlined />} color="blue">
                          {report.date}
                        </Tag>
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <div>
                          <Text strong>分析类型: </Text>
                          <Space wrap>
                            {report.analysisTypes.map(type => (
                              <Tag key={type} color="geekblue" style={{ margin: '2px 4px 2px 0' }}>
                                {type}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                        
                        <Row gutter={24}>
                          <Col span={8}>
                            <Text type="secondary">执行时间: </Text>
                            <Text>{report.duration}</Text>
                          </Col>
                          {report.accuracy && (
                            <Col span={8}>
                              <Text type="secondary">准确率: </Text>
                              <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                                {report.accuracy}%
                              </Text>
                            </Col>
                          )}
                          {report.fileSize && (
                            <Col span={8}>
                              <Text type="secondary">文件大小: </Text>
                              <Text>{report.fileSize}</Text>
                            </Col>
                          )}
                        </Row>
                        
                        {report.path && (
                          <div>
                            <Text type="secondary">
                              <FolderOutlined style={{ marginRight: 4 }} />
                              {report.path}
                            </Text>
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default Reports;