import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Form,
  Tabs,
  Progress,
  Alert,
  Statistic,
  Tag,
  Space,
  Divider,
  Typography,
  Table,
  message,
  Modal,
  Switch,
  Slider,
  InputNumber
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  SettingOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import io from 'socket.io-client';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const NewsMatcherCenter = () => {
  const [form] = Form.useForm();
  const [socket, setSocket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);
  const [stats, setStats] = useState({
    totalNews: 0,
    processedNews: 0,
    matchedStocks: 0,
    matchedIndustries: 0,
    processingTime: 0
  });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [settings, setSettings] = useState({
    enableLLMCorrection: true,
    minScore: 15.0,
    industryMinScore: 0.6,
    batchSize: 100,
    llmConfidenceThreshold: 0.7,
    enableIndustryMatching: true
  });

  useEffect(() => {
    // 初始化Socket连接
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // 监听匹配进度
    newSocket.on('news-match-progress', (data) => {
      setProgress(data.progress);
      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        type: data.type || 'info',
        message: data.message
      }]);
    });

    // 监听匹配完成
    newSocket.on('news-match-complete', (data) => {
      setIsProcessing(false);
      setProgress(100);
      setResults(data);
      setStats(prev => ({
        ...prev,
        processedNews: data.processedCount,
        matchedStocks: data.stockMatches,
        matchedIndustries: data.industryMatches,
        processingTime: data.duration
      }));
      message.success('新闻匹配完成！');
    });

    // 监听匹配错误
    newSocket.on('news-match-error', (data) => {
      setIsProcessing(false);
      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        type: 'error',
        message: data.error
      }]);
      message.error('匹配过程出现错误');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSingleMatch = async (values) => {
    if (!values.newsText) {
      message.warning('请输入新闻内容');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setResults(null);

    try {
      const response = await fetch('http://localhost:3001/api/news-matcher/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: values.newsText,
          title: values.newsTitle,
          enableLLMCorrection: settings.enableLLMCorrection,
          minScore: settings.minScore,
          industryMinScore: settings.industryMinScore,
          llmConfidenceThreshold: settings.llmConfidenceThreshold,
          enableIndustryMatching: settings.enableIndustryMatching
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result.data);
        setProgress(100);
        message.success('单条新闻匹配完成！');
      } else {
        message.error(result.error || '匹配失败');
      }
    } catch (error) {
      console.error('单条匹配失败:', error);
      message.error('匹配请求失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchProcess = (values) => {
    if (!socket) {
      message.error('Socket连接未建立');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    setResults(null);

    const taskData = {
      mode: 'batch',
      daysBack: values.daysBack || 7,
      batchSize: settings.batchSize,
      minScore: settings.minScore,
      industryMinScore: settings.industryMinScore,
      enableLLMCorrection: settings.enableLLMCorrection,
      llmConfidenceThreshold: settings.llmConfidenceThreshold,
      enableIndustryMatching: settings.enableIndustryMatching,
      contentFilter: values.contentFilter,
      limit: values.limit
    };

    socket.emit('start-news-match', taskData);
    setCurrentTask(taskData);
  };

  const handleStopProcess = () => {
    if (socket && currentTask) {
      socket.emit('stop-news-match', { taskId: currentTask.taskId });
      setIsProcessing(false);
      setCurrentTask(null);
      message.info('已停止处理');
    }
  };

  const renderStockMatches = (matches) => {
    if (!matches || matches.length === 0) return <Text type="secondary">无匹配结果</Text>;

    const columns = [
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
        title: '匹配分数',
        dataIndex: 'score',
        key: 'score',
        render: (score) => (
          <Progress 
            percent={Math.min(score, 100)} 
            size="small" 
            format={() => score.toFixed(1)}
          />
        )
      },
      {
        title: '匹配方式',
        dataIndex: 'source',
        key: 'source',
        render: (source) => {
          const colorMap = {
            'regex_match': 'green',
            'semantic_match': 'blue',
            'trie_match': 'orange'
          };
          return <Tag color={colorMap[source] || 'default'}>{source}</Tag>;
        }
      }
    ];

    return (
      <Table 
        dataSource={matches} 
        columns={columns} 
        size="small" 
        pagination={false}
        rowKey="stock_id"
      />
    );
  };

  const renderIndustryMatches = (matches) => {
    if (!matches || matches.length === 0) return <Text type="secondary">无匹配结果</Text>;

    const columns = [
      {
        title: '行业',
        dataIndex: 'industry',
        key: 'industry',
        render: (text) => <Tag color="purple">{text}</Tag>
      },
      {
        title: '匹配分数',
        dataIndex: 'score',
        key: 'score',
        render: (score) => (
          <Progress 
            percent={Math.min(score * 100, 100)} 
            size="small" 
            format={() => (score * 100).toFixed(1) + '%'}
          />
        )
      },
      {
        title: '匹配类型',
        dataIndex: 'match_type',
        key: 'match_type',
        render: (type) => {
          const colorMap = {
            'keyword': 'green',
            'semantic': 'blue',
            'hybrid': 'orange'
          };
          return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
        }
      },
      {
        title: '关键词',
        dataIndex: 'keywords',
        key: 'keywords',
        render: (keywords) => (
          <Space size={[0, 4]} wrap>
            {keywords && keywords.map((keyword, index) => (
              <Tag key={index} size="small">{keyword}</Tag>
            ))}
          </Space>
        )
      }
    ];

    return (
      <Table 
        dataSource={matches} 
        columns={columns} 
        size="small" 
        pagination={false}
        rowKey="industry"
      />
    );
  };

  const renderLLMCorrection = (correction) => {
    if (!correction) return null;

    return (
      <Card size="small" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="LLM矫正状态" 
              value={correction.applied ? "已应用" : "未应用"}
              valueStyle={{ color: correction.applied ? '#3f8600' : '#cf1322' }}
              prefix={correction.applied ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="置信度" 
              value={correction.confidence}
              precision={2}
              suffix="%"
              valueStyle={{ color: correction.confidence > 70 ? '#3f8600' : '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="处理时间" 
              value={correction.processing_time}
              precision={2}
              suffix="s"
            />
          </Col>
          <Col span={6}>
            <Button 
              type="link" 
              icon={<InfoCircleOutlined />}
              onClick={() => {
                Modal.info({
                  title: 'LLM矫正详情',
                  content: correction.reasoning,
                  width: 600
                });
              }}
            >
              查看详情
            </Button>
          </Col>
        </Row>
      </Card>
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
                  <ExperimentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  新闻匹配中心
                </Title>
                <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
                  智能新闻分析系统，基于向量语义搜索和LLM智能矫正，自动识别新闻中的股票公司和相关行业
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
                    onClick={() => window.location.reload()}
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
                <Statistic
                  title="总新闻数"
                  value={stats.totalNews}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已处理"
                  value={stats.processedNews}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="股票匹配"
                  value={stats.matchedStocks}
                  prefix={<ExperimentOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="行业匹配"
                  value={stats.matchedIndustries}
                  prefix={<RobotOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* 主要功能区 */}
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="single">
              <TabPane tab="单条匹配" key="single">
                <Form form={form} layout="vertical" onFinish={handleSingleMatch}>
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
                      <Form.Item label="匹配模式">
                        <Space>
                          <Tag color={settings.enableIndustryMatching ? 'green' : 'default'}>
                            行业匹配: {settings.enableIndustryMatching ? '开启' : '关闭'}
                          </Tag>
                          <Tag color={settings.enableLLMCorrection ? 'blue' : 'default'}>
                            LLM矫正: {settings.enableLLMCorrection ? '开启' : '关闭'}
                          </Tag>
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>
                  
                  <Form.Item
                    label="新闻内容"
                    name="newsText"
                    rules={[{ required: true, message: '请输入新闻内容' }]}
                  >
                    <TextArea 
                      rows={6} 
                      placeholder="请输入要匹配的新闻内容..."
                      showCount
                      maxLength={5000}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<PlayCircleOutlined />}
                        loading={isProcessing}
                        disabled={isProcessing}
                      >
                        开始匹配
                      </Button>
                      {isProcessing && (
                        <Button 
                          icon={<StopOutlined />}
                          onClick={handleStopProcess}
                        >
                          停止
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane tab="批量处理" key="batch">
                <Form layout="vertical" onFinish={handleBatchProcess}>
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
                        label="内容过滤"
                        name="contentFilter"
                      >
                        <Input placeholder="过滤关键词（可选）" />
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
                  </Row>

                  <Form.Item>
                    <Space>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        icon={<PlayCircleOutlined />}
                        loading={isProcessing}
                        disabled={isProcessing}
                      >
                        开始批量处理
                      </Button>
                      {isProcessing && (
                        <Button 
                          icon={<StopOutlined />}
                          onClick={handleStopProcess}
                        >
                          停止处理
                        </Button>
                      )}
                    </Space>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* 处理进度 */}
        {isProcessing && (
          <Col span={24}>
            <Card title="处理进度">
              <Progress 
                percent={progress} 
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 16, maxHeight: 200, overflowY: 'auto' }}>
                {logs.map((log, index) => (
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

        {/* 匹配结果 */}
        {results && (
          <Col span={24}>
            <Card title="匹配结果">
              <Tabs defaultActiveKey="stocks">
                <TabPane tab={`股票匹配 (${results.stock_matches?.length || 0})`} key="stocks">
                  {renderStockMatches(results.stock_matches)}
                </TabPane>
                <TabPane tab={`行业匹配 (${results.industry_matches?.length || 0})`} key="industries">
                  {renderIndustryMatches(results.industry_matches)}
                </TabPane>
                {results.llm_correction && (
                  <TabPane tab="LLM矫正" key="llm">
                    {renderLLMCorrection(results.llm_correction)}
                  </TabPane>
                )}
              </Tabs>
            </Card>
          </Col>
        )}
      </Row>

      {/* 设置弹窗 */}
      <Modal
        title="匹配设置"
        visible={settingsVisible}
        onOk={() => setSettingsVisible(false)}
        onCancel={() => setSettingsVisible(false)}
        width={600}
      >
        <Form layout="vertical" initialValues={settings}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="启用LLM智能矫正">
                <Switch 
                  checked={settings.enableLLMCorrection}
                  onChange={(checked) => setSettings(prev => ({ ...prev, enableLLMCorrection: checked }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="启用行业匹配">
                <Switch 
                  checked={settings.enableIndustryMatching}
                  onChange={(checked) => setSettings(prev => ({ ...prev, enableIndustryMatching: checked }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={`股票匹配最小分数: ${settings.minScore}`}>
            <Slider
              min={5}
              max={50}
              step={0.5}
              value={settings.minScore}
              onChange={(value) => setSettings(prev => ({ ...prev, minScore: value }))}
            />
          </Form.Item>

          <Form.Item label={`行业匹配最小分数: ${settings.industryMinScore}`}>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={settings.industryMinScore}
              onChange={(value) => setSettings(prev => ({ ...prev, industryMinScore: value }))}
            />
          </Form.Item>

          <Form.Item label={`LLM置信度阈值: ${settings.llmConfidenceThreshold}`}>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={settings.llmConfidenceThreshold}
              onChange={(value) => setSettings(prev => ({ ...prev, llmConfidenceThreshold: value }))}
            />
          </Form.Item>

          <Form.Item label="批处理大小">
            <InputNumber
              min={10}
              max={1000}
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

export default NewsMatcherCenter;