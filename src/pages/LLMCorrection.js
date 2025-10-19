import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Form,
  Tabs,
  Progress,
  Alert,
  Statistic,
  Tag,
  Space,
  Typography,
  Table,
  message,
  Modal,
  Switch,
  Slider,
  InputNumber,
  Descriptions,
  Badge,
  Tooltip,
  Spin,
  Empty
} from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const LLMCorrection = () => {
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [correctionResults, setCorrectionResults] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [stats, setStats] = useState({
    totalCorrections: 0,
    successRate: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    todayCorrections: 0
  });
  const [settings, setSettings] = useState({
    confidenceThreshold: 0.7,
    batchSize: 5,
    enableAutoCorrection: true,
    maxRetries: 3
  });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [validationResults, setValidationResults] = useState([]);
  const [processingLogs, setProcessingLogs] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentCorrections();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/llm-stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('获取LLM统计数据失败:', error);
    }
  };

  const fetchRecentCorrections = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/recent-corrections');
      const result = await response.json();
      
      if (result.success) {
        setBatchResults(result.data);
      }
    } catch (error) {
      console.error('获取最近矫正记录失败:', error);
    }
  };

  const handleSingleCorrection = async (values) => {
    if (!values.newsContent) {
      message.warning('请输入新闻内容');
      return;
    }

    setLoading(true);
    setCorrectionResults(null);
    setProcessingLogs([]);

    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/llm-correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: values.newsContent,
          title: values.newsTitle,
          confidenceThreshold: settings.confidenceThreshold,
          originalMatches: values.originalMatches ? JSON.parse(values.originalMatches) : undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCorrectionResults(result.data);
        setProcessingLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          message: 'LLM矫正完成'
        }]);
        message.success('LLM智能矫正完成！');
      } else {
        message.error(result.error || '矫正失败');
        setProcessingLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          type: 'error',
          message: result.error || '矫正失败'
        }]);
      }
    } catch (error) {
      console.error('LLM矫正失败:', error);
      message.error('矫正请求失败');
      setProcessingLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: '网络请求失败'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchCorrection = async (values) => {
    setLoading(true);
    setBatchResults([]);
    setProcessingLogs([]);

    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/llm-batch-correct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daysBack: values.daysBack || 7,
          batchSize: settings.batchSize,
          confidenceThreshold: settings.confidenceThreshold,
          limit: values.limit,
          onlyUnmatched: values.onlyUnmatched
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setBatchResults(result.data.results);
        setProcessingLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          message: `批量矫正完成，处理了 ${result.data.processed} 条记录`
        }]);
        message.success(`批量矫正完成！处理了 ${result.data.processed} 条记录`);
      } else {
        message.error(result.error || '批量矫正失败');
        setProcessingLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          type: 'error',
          message: result.error || '批量矫正失败'
        }]);
      }
    } catch (error) {
      console.error('批量矫正失败:', error);
      message.error('批量矫正请求失败');
      setProcessingLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: '网络请求失败'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (values) => {
    if (!values.newsContent || !values.companyName) {
      message.warning('请输入新闻内容和公司名称');
      return;
    }

    setLoading(true);
    setValidationResults([]);

    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/llm-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: values.newsContent,
          companyName: values.companyName,
          title: values.newsTitle
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setValidationResults([result.data]);
        message.success('验证完成！');
      } else {
        message.error(result.error || '验证失败');
      }
    } catch (error) {
      console.error('验证失败:', error);
      message.error('验证请求失败');
    } finally {
      setLoading(false);
    }
  };

  const renderCorrectionResult = (result) => {
    if (!result) return null;

    return (
      <Card title="矫正结果" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="矫正状态" 
              value={result.applied ? "已应用" : "未应用"}
              valueStyle={{ color: result.applied ? '#3f8600' : '#cf1322' }}
              prefix={result.applied ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="置信度" 
              value={result.confidence}
              precision={1}
              suffix="%"
              valueStyle={{ color: result.confidence > 70 ? '#3f8600' : '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="处理时间" 
              value={result.processing_time}
              precision={2}
              suffix="s"
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="匹配数量" 
              value={result.corrected_matches?.length || 0}
              prefix={<ExperimentOutlined />}
            />
          </Col>
        </Row>

        <Descriptions title="矫正详情" style={{ marginTop: 16 }} column={1}>
          <Descriptions.Item label="矫正说明">
            <Paragraph>{result.reasoning}</Paragraph>
          </Descriptions.Item>
        </Descriptions>

        {result.corrected_matches && result.corrected_matches.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Title level={5}>矫正后的匹配结果</Title>
            <Table
              dataSource={result.corrected_matches}
              columns={[
                {
                  title: '股票代码',
                  dataIndex: 'stock_id',
                  key: 'stock_id',
                  render: (text) => <Tag color="blue">{text}</Tag>
                },
                {
                  title: '公司名称',
                  dataIndex: 'stock_name',
                  key: 'stock_name',
                },
                {
                  title: '矫正分数',
                  dataIndex: 'corrected_score',
                  key: 'corrected_score',
                  render: (score) => (
                    <Progress 
                      percent={Math.min(score, 100)} 
                      size="small" 
                      format={() => score.toFixed(1)}
                    />
                  )
                },
                {
                  title: '原始分数',
                  dataIndex: 'original_score',
                  key: 'original_score',
                  render: (score) => (
                    <Text type="secondary">{score?.toFixed(1) || 'N/A'}</Text>
                  )
                },
                {
                  title: '矫正类型',
                  dataIndex: 'correction_type',
                  key: 'correction_type',
                  render: (type) => {
                    const colorMap = {
                      'enhanced': 'green',
                      'reduced': 'orange',
                      'removed': 'red',
                      'added': 'blue'
                    };
                    return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
                  }
                }
              ]}
              size="small"
              pagination={false}
              rowKey="stock_id"
            />
          </div>
        )}
      </Card>
    );
  };

  const batchColumns = [
    {
      title: '新闻标题',
      dataIndex: 'news_title',
      key: 'news_title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '矫正状态',
      dataIndex: 'applied',
      key: 'applied',
      width: 100,
      render: (applied) => (
        <Badge 
          status={applied ? 'success' : 'default'}
          text={applied ? '已应用' : '未应用'}
        />
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (confidence) => (
        <Progress 
          percent={confidence} 
          size="small" 
          format={() => `${confidence.toFixed(1)}%`}
        />
      ),
    },
    {
      title: '处理时间',
      dataIndex: 'processing_time',
      key: 'processing_time',
      width: 100,
      render: (time) => `${time.toFixed(2)}s`,
    },
    {
      title: '矫正数量',
      dataIndex: 'corrected_matches',
      key: 'corrected_matches',
      width: 100,
      render: (matches) => matches?.length || 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            Modal.info({
              title: '矫正详情',
              content: (
                <div>
                  <Descriptions column={1}>
                    <Descriptions.Item label="矫正说明">
                      {record.reasoning}
                    </Descriptions.Item>
                  </Descriptions>
                  {record.corrected_matches && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>矫正结果:</Text>
                      <div style={{ marginTop: 8 }}>
                        {record.corrected_matches.map((match, index) => (
                          <Tag key={index} color="blue" style={{ margin: 2 }}>
                            {match.stock_name} ({match.corrected_score.toFixed(1)})
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
              width: 600
            });
          }}
        >
          详情
        </Button>
      ),
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
                  <RobotOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  LLM智能矫正
                </Title>
                <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
                  使用大语言模型智能矫正新闻匹配结果，提高匹配准确性和可信度
                </Paragraph>
              </Col>
              <Col>
                <Space>
                  <Button 
                    icon={<SettingOutlined />} 
                    onClick={() => setSettingsVisible(true)}
                  >
                    设置
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                      fetchStats();
                      fetchRecentCorrections();
                    }}
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
            <Col span={5}>
              <Card>
                <Statistic
                  title="总矫正次数"
                  value={stats.totalCorrections}
                  prefix={<RobotOutlined />}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card>
                <Statistic
                  title="成功率"
                  value={stats.successRate}
                  precision={1}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card>
                <Statistic
                  title="平均置信度"
                  value={stats.avgConfidence}
                  precision={1}
                  suffix="%"
                  prefix={<BulbOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均处理时间"
                  value={stats.avgProcessingTime}
                  precision={2}
                  suffix="s"
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card>
                <Statistic
                  title="今日矫正"
                  value={stats.todayCorrections}
                  prefix={<ExperimentOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* 主要功能区 */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="single">
              <TabPane tab="单条矫正" key="single">
                <Form form={form} layout="vertical" onFinish={handleSingleCorrection}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="新闻标题"
                        name="newsTitle"
                      >
                        <Input placeholder="请输入新闻标题（可选）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="矫正设置">
                        <Space>
                          <Tag color="blue">
                            置信度阈值: {settings.confidenceThreshold}
                          </Tag>
                          <Tag color={settings.enableAutoCorrection ? 'green' : 'default'}>
                            自动矫正: {settings.enableAutoCorrection ? '开启' : '关闭'}
                          </Tag>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="新闻内容"
                    name="newsContent"
                    rules={[{ required: true, message: '请输入新闻内容' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="请输入要矫正的新闻内容..."
                      showCount
                      maxLength={5000}
                    />
                  </Form.Item>

                  <Form.Item
                    label="原始匹配结果（可选）"
                    name="originalMatches"
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="请输入原始匹配结果的JSON格式数据（可选）"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<PlayCircleOutlined />}
                        loading={loading}
                        disabled={loading}
                      >
                        开始矫正
                      </Button>
                      {loading && (
                        <Button 
                          icon={<StopOutlined />}
                          onClick={() => setLoading(false)}
                        >
                          停止
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>

                {renderCorrectionResult(correctionResults)}
              </TabPane>

              <TabPane tab="批量矫正" key="batch">
                <Form form={batchForm} layout="vertical" onFinish={handleBatchCorrection}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="时间范围（天）"
                        name="daysBack"
                        initialValue={7}
                      >
                        <InputNumber min={1} max={365} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="处理限制"
                        name="limit"
                      >
                        <InputNumber min={1} placeholder="最大处理数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="仅处理未匹配"
                        name="onlyUnmatched"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<PlayCircleOutlined />}
                        loading={loading}
                        disabled={loading}
                      >
                        开始批量矫正
                      </Button>
                      {loading && (
                        <Button 
                          icon={<StopOutlined />}
                          onClick={() => setLoading(false)}
                        >
                          停止处理
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>

                {batchResults.length > 0 && (
                  <Card title="批量矫正结果" style={{ marginTop: 16 }}>
                    <Table
                      dataSource={batchResults}
                      columns={batchColumns}
                      size="small"
                      pagination={{ pageSize: 10 }}
                      rowKey="id"
                    />
                  </Card>
                )}
              </TabPane>

              <TabPane tab="单项验证" key="validation">
                <Alert
                  message="单项验证功能"
                  description="验证特定公司与新闻内容的相关性，用于测试LLM判断能力"
                  type="info"
                  style={{ marginBottom: 16 }}
                />
                
                <Form layout="vertical" onFinish={handleValidation}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="新闻标题"
                        name="newsTitle"
                      >
                        <Input placeholder="请输入新闻标题（可选）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="公司名称"
                        name="companyName"
                        rules={[{ required: true, message: '请输入公司名称' }]}
                      >
                        <Input placeholder="请输入要验证的公司名称" />
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="新闻内容"
                    name="newsContent"
                    rules={[{ required: true, message: '请输入新闻内容' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="请输入新闻内容..."
                      showCount
                      maxLength={5000}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<ExperimentOutlined />}
                      loading={loading}
                      disabled={loading}
                    >
                      开始验证
                    </Button>
                  </Form.Item>
                </Form>

                {validationResults.length > 0 && (
                  <Card title="验证结果" style={{ marginTop: 16 }}>
                    {validationResults.map((result, index) => (
                      <div key={index}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic 
                              title="相关性" 
                              value={result.relevance ? "相关" : "不相关"}
                              valueStyle={{ color: result.relevance ? '#3f8600' : '#cf1322' }}
                              prefix={result.relevance ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="置信度" 
                              value={result.confidence}
                              precision={1}
                              suffix="%"
                              valueStyle={{ color: result.confidence > 70 ? '#3f8600' : '#faad14' }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic 
                              title="处理时间" 
                              value={result.processing_time}
                              precision={2}
                              suffix="s"
                            />
                          </Col>
                        </Row>
                        <Descriptions title="验证详情" style={{ marginTop: 16 }} column={1}>
                          <Descriptions.Item label="验证说明">
                            <Paragraph>{result.reasoning}</Paragraph>
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    ))}
                  </Card>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* 处理日志 */}
        {processingLogs.length > 0 && (
          <Col span={24}>
            <Card title="处理日志">
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {processingLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <Text type="secondary">[{log.time}]</Text>
                    <Text type={log.type === 'error' ? 'danger' : 'default'} style={{ marginLeft: 8 }}>
                      {log.message}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* 设置弹窗 */}
      <Modal
        title="LLM矫正设置"
        visible={settingsVisible}
        onOk={() => setSettingsVisible(false)}
        onCancel={() => setSettingsVisible(false)}
        width={600}
      >
        <Form layout="vertical" initialValues={settings}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="启用自动矫正">
                <Switch 
                  checked={settings.enableAutoCorrection}
                  onChange={(checked) => setSettings(prev => ({ ...prev, enableAutoCorrection: checked }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大重试次数">
                <InputNumber
                  min={1}
                  max={10}
                  value={settings.maxRetries}
                  onChange={(value) => setSettings(prev => ({ ...prev, maxRetries: value }))}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={`置信度阈值: ${settings.confidenceThreshold}`}>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={settings.confidenceThreshold}
              onChange={(value) => setSettings(prev => ({ ...prev, confidenceThreshold: value }))}
            />
          </Form.Item>

          <Form.Item label="批处理大小">
            <InputNumber
              min={1}
              max={20}
              value={settings.batchSize}
              onChange={(value) => setSettings(prev => ({ ...prev, batchSize: value }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LLMCorrection;