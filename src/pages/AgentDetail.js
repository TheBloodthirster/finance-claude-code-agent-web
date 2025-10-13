import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Tag, 
  Row, 
  Col,
  Descriptions,
  Alert,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Select
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  CodeOutlined,
  FileTextOutlined,
  RobotOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AgentDetail = () => {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [agentContent, setAgentContent] = useState('');
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testForm] = Form.useForm();
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    loadAgentDetail();
  }, [agentName]);

  const loadAgentDetail = async () => {
    setLoading(true);
    try {
      // 获取Agent基本信息
      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) {
        throw new Error('获取Agent列表失败');
      }
      const agents = await agentsResponse.json();
      const currentAgent = agents.find(a => a.name === agentName);
      
      if (!currentAgent) {
        throw new Error('Agent不存在');
      }
      
      setAgent(currentAgent);

      // 获取Agent详细内容
      const contentResponse = await fetch(`/api/agents/${agentName}/content`);
      if (!contentResponse.ok) {
        throw new Error('获取Agent内容失败');
      }
      const contentData = await contentResponse.json();
      setAgentContent(contentData.content);

    } catch (error) {
      console.error('加载Agent详情失败:', error);
      message.error('加载Agent详情失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAgent = async (values) => {
    setTestRunning(true);
    try {
      const response = await fetch(`/api/agents/${agentName}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: values.company,
          testMode: true,
          customPrompt: values.customPrompt
        }),
      });

      if (!response.ok) {
        throw new Error('Agent测试失败');
      }

      const result = await response.json();
      
      if (result.success) {
        message.success(`${agent.displayName} 测试成功`);
        setTestModalVisible(false);
        testForm.resetFields();
      } else {
        message.warning(`测试完成，但有警告: ${result.message}`);
      }
    } catch (error) {
      message.error(`测试失败: ${error.message}`);
    } finally {
      setTestRunning(false);
    }
  };

  const getAgentIcon = (agentType) => {
    const iconMap = {
      'management-analysis': '👥',
      'business-model': '🏢',
      'competition-strategy': '⚔️',
      'valuation-hype': '💰',
      'equity-distribution': '📊'
    };
    return iconMap[agentType] || '🤖';
  };

  const getAgentColor = (color) => {
    const colorMap = {
      'blue': '#1890ff',
      'green': '#52c41a',
      'red': '#ff4d4f',
      'orange': '#fa8c16',
      'purple': '#722ed1'
    };
    return colorMap[color] || '#1890ff';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Alert
          message="Agent不存在"
          description="请检查Agent名称是否正确"
          type="error"
          showIcon
        />
        <Button 
          style={{ marginTop: 16 }}
          onClick={() => navigate('/agents')}
        >
          返回Agent列表
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 头部操作栏 */}
      <Card className="card-shadow" style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/agents')}
              >
                返回Agent列表
              </Button>
              <div style={{ marginLeft: 16 }}>
                <Space>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      backgroundColor: getAgentColor(agent.color),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: '#fff'
                    }}
                  >
                    {getAgentIcon(agent.type)}
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {agent.displayName}
                    </Title>
                    <Space>
                      <Tag color={agent.color}>{agent.type}</Tag>
                      <Tag color={agent.hasPythonFile ? 'success' : 'error'}>
                        {agent.hasPythonFile ? 'Python文件存在' : 'Python文件缺失'}
                      </Tag>
                    </Space>
                  </div>
                </Space>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space>
              <Button 
                icon={<ExperimentOutlined />}
                onClick={() => setTestModalVisible(true)}
                disabled={!agent.hasPythonFile}
              >
                测试Agent
              </Button>
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => navigate(`/analysis?agent=${agent.name}`)}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                运行分析
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Agent信息 */}
        <Col xs={24} lg={8}>
          <Card title="Agent信息" className="card-shadow" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Agent类型">
                <Tag color={agent.color}>{agent.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="显示名称">
                {agent.displayName}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={agent.enabled ? 'success' : 'default'}>
                  {agent.enabled ? '已启用' : '已禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Python文件">
                <Tag color={agent.hasPythonFile ? 'success' : 'error'}>
                  {agent.hasPythonFile ? '存在' : '缺失'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="工具权限">
                {agent.allowedTools.length} 个工具
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="允许的工具" className="card-shadow">
            <Space wrap>
              {agent.allowedTools.map(tool => (
                <Tag key={tool} size="small" color="geekblue">
                  {tool}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Agent配置内容 */}
        <Col xs={24} lg={16}>
          <Card 
            title="Agent配置" 
            className="card-shadow"
            extra={
              <Space>
                <Tag icon={<FileTextOutlined />} color="blue">
                  {agent.name}.md
                </Tag>
                <Tag icon={<CodeOutlined />} color="green">
                  {agent.name}.py
                </Tag>
              </Space>
            }
          >
            <div className="markdown-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children, ...props }) => (
                    <h1 {...props} style={{ color: '#262626', borderBottom: '2px solid #f0f0f0', paddingBottom: 10 }}>
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 {...props} style={{ color: '#262626', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginTop: 32 }}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 {...props} style={{ color: '#262626', marginTop: 24 }}>
                      {children}
                    </h3>
                  ),
                  code: ({ inline, children, ...props }) => (
                    inline ? (
                      <code 
                        {...props}
                        style={{
                          background: '#f6f8fa',
                          padding: '2px 4px',
                          borderRadius: 3,
                          fontSize: '0.9em'
                        }}
                      >
                        {children}
                      </code>
                    ) : (
                      <pre 
                        style={{
                          background: '#f6f8fa',
                          padding: 16,
                          borderRadius: 6,
                          overflow: 'auto'
                        }}
                      >
                        <code {...props}>{children}</code>
                      </pre>
                    )
                  )
                }}
              >
                {agentContent}
              </ReactMarkdown>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 测试Agent模态框 */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            测试 {agent.displayName}
          </Space>
        }
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="测试说明"
          description="这将使用测试数据运行Agent，验证其配置和Python代码是否正常工作"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form
          form={testForm}
          layout="vertical"
          onFinish={handleTestAgent}
          initialValues={{
            company: '测试公司',
            customPrompt: ''
          }}
        >
          <Form.Item
            name="company"
            label="测试公司名称"
            rules={[{ required: true, message: '请输入测试公司名称' }]}
          >
            <Input placeholder="例如: 紫金黄金国际" />
          </Form.Item>

          <Form.Item
            name="customPrompt"
            label="自定义提示词（可选）"
          >
            <TextArea
              rows={4}
              placeholder="可以添加特定的测试要求或提示词"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={testRunning}
                icon={<PlayCircleOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                开始测试
              </Button>
              <Button onClick={() => setTestModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AgentDetail;