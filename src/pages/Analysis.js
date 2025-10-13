import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Steps, 
  Progress, 
  Typography, 
  Space, 
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  message,
  Statistic
} from 'antd';
import {
  PlayCircleOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined
} from '@ant-design/icons';
import io from 'socket.io-client';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Analysis = () => {
  const [form] = Form.useForm();
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [socket, setSocket] = useState(null);

  const analysisTypes = [
    { value: 'management-analysis', label: '管理层分析', description: '分析公司管理层构成、背景和能力' },
    { value: 'business-model', label: '商业模式研究', description: '研究公司核心商业模式和盈利结构' },
    { value: 'competition-strategy', label: '竞争格局与战略研究', description: '分析行业竞争格局和公司战略' },
    { value: 'valuation-hype', label: '估值与市场炒作因素研究', description: '评估公司估值水平和市场炒作潜力' },
    { value: 'equity-distribution', label: '股权分布研究', description: '分析公司股权结构和分布情况' }
  ];

  const steps = [
    {
      title: '准备阶段',
      description: '初始化分析环境',
      icon: <ClockCircleOutlined />
    },
    {
      title: '执行分析',
      description: '运行选定的分析Agent',
      icon: <RobotOutlined />
    },
    {
      title: '生成报告',
      description: '整合分析结果并生成报告',
      icon: <CheckCircleOutlined />
    }
  ];

  useEffect(() => {
    // 初始化Socket连接
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('analysis-progress', (data) => {
      setProgress(data.progress);
      setCurrentStep(data.step);
      addLog(data.message, data.type || 'info');
    });

    newSocket.on('analysis-complete', (data) => {
      setIsRunning(false);
      setAnalysisResult(data);
      setProgress(100);
      setCurrentStep(2);
      addLog('分析完成！', 'success');
      message.success('股票分析已完成！');
    });

    newSocket.on('analysis-error', (data) => {
      setIsRunning(false);
      addLog(`分析失败: ${data.error}`, 'error');
      message.error('分析过程中出现错误');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { 
      id: Date.now(), 
      message, 
      type, 
      timestamp 
    }]);
  };

  const handleSubmit = async (values) => {
    if (!socket) {
      message.error('连接未建立，请刷新页面重试');
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);
    setProgress(0);
    setLogs([]);
    setAnalysisResult(null);

    addLog(`开始分析 ${values.company}`, 'info');
    addLog(`选择的分析类型: ${values.analysisTypes.map(type => 
      analysisTypes.find(t => t.value === type)?.label
    ).join(', ')}`, 'info');

    // 发送分析请求到后端
    socket.emit('start-analysis', {
      company: values.company,
      analysisTypes: values.analysisTypes,
      saveReport: true
    });
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'finish';
    if (stepIndex === currentStep) return isRunning ? 'process' : 'wait';
    return 'wait';
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          🚀 股票分析执行
        </Title>
        <Text type="secondary">
          选择公司和分析类型，启动AI驱动的股票分析流程
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 分析配置 */}
        <Col xs={24} lg={8}>
          <Card title="分析配置" className="card-shadow">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                analysisTypes: ['management-analysis', 'business-model']
              }}
            >
              <Form.Item
                name="company"
                label="公司名称"
                rules={[{ required: true, message: '请输入公司名称' }]}
              >
                <Input 
                  placeholder="例如: 紫金黄金国际"
                  size="large"
                  disabled={isRunning}
                />
              </Form.Item>

              <Form.Item
                name="analysisTypes"
                label="分析类型"
                rules={[{ required: true, message: '请选择至少一种分析类型' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="选择要执行的分析类型"
                  size="large"
                  disabled={isRunning}
                >
                  {analysisTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{type.label}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          {type.description}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isRunning}
                  icon={isRunning ? <LoadingOutlined /> : <PlayCircleOutlined />}
                  style={{
                    background: isRunning 
                      ? '#1890ff' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: 48
                  }}
                >
                  {isRunning ? '分析进行中...' : '开始分析'}
                </Button>
              </Form.Item>
            </Form>

            {isRunning && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  message="分析进行中"
                  description="请耐心等待，分析过程可能需要几分钟时间"
                  type="info"
                  showIcon
                />
              </div>
            )}
          </Card>
        </Col>

        {/* 执行进度 */}
        <Col xs={24} lg={16}>
          <Card title="执行进度" className="card-shadow">
            <Steps
              current={currentStep}
              items={steps.map((step, index) => ({
                ...step,
                status: getStepStatus(index)
              }))}
              style={{ marginBottom: 24 }}
            />

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>总体进度</Text>
                <Text>{progress}%</Text>
              </div>
              <Progress 
                percent={progress} 
                status={isRunning ? 'active' : progress === 100 ? 'success' : 'normal'}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
              />
            </div>

            {/* 实时日志 */}
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                执行日志
              </Title>
              <div className="log-output" style={{ maxHeight: 300, overflowY: 'auto' }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#666', textAlign: 'center', padding: 20 }}>
                    等待开始分析...
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className={`log-line ${log.type}`}>
                      <span className="log-timestamp">[{log.timestamp}]</span>
                      <span>{getLogIcon(log.type)} {log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 分析结果 */}
      {analysisResult && (
        <Card 
          title="分析结果" 
          className="card-shadow slide-up" 
          style={{ marginTop: 24 }}
          extra={
            <Space>
              <Tag color="success">分析完成</Tag>
              <Button type="primary" size="small">
                查看详细报告
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="分析维度"
                  value={analysisResult.summary?.total_analyses || 0}
                  suffix="个"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="成功完成"
                  value={analysisResult.summary?.successful_analyses || 0}
                  suffix="个"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="执行时间"
                  value={analysisResult.duration || 0}
                  suffix="分钟"
                  precision={1}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <div>
            <Title level={5}>总体评估</Title>
            <Paragraph>
              {analysisResult.overall_assessment || '分析已完成，请查看详细报告获取更多信息。'}
            </Paragraph>
          </div>

          {analysisResult.investment_recommendations && (
            <div>
              <Title level={5}>投资建议</Title>
              <ul>
                {analysisResult.investment_recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Analysis;