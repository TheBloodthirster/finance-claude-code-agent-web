import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  List, 
  Avatar, 
  Button, 
  Switch, 
  Typography, 
  Space, 
  Tag, 
  Row, 
  Col,
  Modal,
  Descriptions,
  Alert,
  message,
  Spin,
  Tooltip,
  Badge,
  Tabs,
  Divider,
  Input,
  Select
} from 'antd';
import {
  RobotOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  EyeOutlined,
  CodeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  BugOutlined,
  ApiOutlined
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Agent详情页面组件
const AgentDetail = () => {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [agentContent, setAgentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [testInput, setTestInput] = useState('紫金黄金国际');
  const [testResult, setTestResult] = useState('');
  const [runResult, setRunResult] = useState('');

  useEffect(() => {
    if (agentName) {
      loadAgentDetail();
    }
  }, [agentName]);

  const loadAgentDetail = async () => {
    setLoading(true);
    try {
      // 获取Agent列表找到当前Agent
      const agentsResponse = await fetch('/api/agents');
      if (!agentsResponse.ok) throw new Error('获取Agent列表失败');
      const agents = await agentsResponse.json();
      const currentAgent = agents.find(a => a.name === agentName);
      
      if (!currentAgent) {
        throw new Error('Agent不存在');
      }
      
      setAgent(currentAgent);

      // 获取Agent内容
      const contentResponse = await fetch(`/api/agents/${agentName}/content`);
      if (!contentResponse.ok) throw new Error('获取Agent内容失败');
      const contentData = await contentResponse.json();
      setAgentContent(contentData.content);
    } catch (error) {
      message.error('加载Agent详情失败: ' + error.message);
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAgent = async () => {
    if (!testInput.trim()) {
      message.warning('请输入测试公司名称');
      return;
    }

    setTestLoading(true);
    setTestResult('');
    
    try {
      const response = await fetch(`/api/agents/${agentName}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company: testInput.trim(),
          testMode: true 
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult(JSON.stringify(result, null, 2));
        message.success('Agent测试完成');
      } else {
        setTestResult(`错误: ${result.error || '测试失败'}`);
        message.error('Agent测试失败');
      }
    } catch (error) {
      setTestResult(`错误: ${error.message}`);
      message.error('Agent测试失败: ' + error.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunAgent = async () => {
    if (!testInput.trim()) {
      message.warning('请输入公司名称');
      return;
    }

    setRunLoading(true);
    setRunResult('');
    
    try {
      const response = await fetch(`/api/agents/${agentName}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company: testInput.trim(),
          runMode: true 
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setRunResult(JSON.stringify(result, null, 2));
        message.success('Agent运行完成');
      } else {
        setRunResult(`错误: ${result.error || '运行失败'}`);
        message.error('Agent运行失败');
      }
    } catch (error) {
      setRunResult(`错误: ${error.message}`);
      message.error('Agent运行失败: ' + error.message);
    } finally {
      setRunLoading(false);
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
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert message="Agent不存在" type="error" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/agents')}
          style={{ marginBottom: 16 }}
        >
          返回Agent列表
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <Avatar
            size={48}
            style={{
              backgroundColor: getAgentColor(agent.color),
              fontSize: 20
            }}
          >
            {getAgentIcon(agent.type)}
          </Avatar>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              {agent.displayName}
            </Title>
            <Space>
              <Tag color={agent.color}>{agent.type}</Tag>
              <Badge status={agent.enabled ? "success" : "default"} text={agent.enabled ? "已启用" : "已禁用"} />
            </Space>
          </div>
        </div>
        
        <Text type="secondary">{agent.description}</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Tabs
            defaultActiveKey="config"
            items={[
              {
                key: 'config',
                label: '配置详情',
                children: (
                  <Card className="card-shadow">
                    <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
                      <Descriptions.Item label="Agent名称" span={2}>
                        {agent.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="状态">
                        <Switch
                          checked={agent.enabled}
                          checkedChildren="启用"
                          unCheckedChildren="禁用"
                          onChange={(checked) => {
                            // 这里可以调用切换API
                            message.info(`${checked ? '启用' : '禁用'} ${agent.displayName}`);
                          }}
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label="Agent类型" span={2}>
                        <Tag color={agent.color}>{agent.type}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Python文件">
                        <Badge 
                          status={agent.hasPythonFile ? "success" : "error"} 
                          text={agent.hasPythonFile ? "存在" : "不存在"} 
                        />
                      </Descriptions.Item>
                      <Descriptions.Item label="使用场景" span={3}>
                        {agent.whenToUse}
                      </Descriptions.Item>
                      <Descriptions.Item label="允许工具" span={3}>
                        <Space wrap>
                          {agent.allowedTools?.map(tool => (
                            <Tag key={tool} size="small">{tool}</Tag>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left">配置文件内容</Divider>
                    <div className="markdown-content" style={{ maxHeight: '600px', overflow: 'auto' }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {agentContent}
                      </ReactMarkdown>
                    </div>
                  </Card>
                )
              },
              {
                key: 'test',
                label: '测试运行',
                children: (
                  <Card className="card-shadow">
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                      <div>
                        <Text strong>测试输入</Text>
                        <Input
                          placeholder="请输入测试公司名称，如：紫金黄金国际"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          style={{ marginTop: 8 }}
                          onPressEnter={handleTestAgent}
                        />
                      </div>

                      <Space>
                        <Button
                          type="primary"
                          icon={<BugOutlined />}
                          loading={testLoading}
                          onClick={handleTestAgent}
                          disabled={!agent.enabled}
                        >
                          语法测试
                        </Button>
                        <Button
                          icon={<ThunderboltOutlined />}
                          loading={runLoading}
                          onClick={handleRunAgent}
                          disabled={!agent.enabled}
                          style={{
                            background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                            border: 'none',
                            color: 'white'
                          }}
                        >
                          运行Agent
                        </Button>
                      </Space>

                      {testResult && (
                        <div>
                          <Text strong>测试结果</Text>
                          <TextArea
                            value={testResult}
                            rows={8}
                            readOnly
                            style={{ marginTop: 8, fontFamily: 'monospace' }}
                          />
                        </div>
                      )}

                      {runResult && (
                        <div>
                          <Text strong>运行结果</Text>
                          <TextArea
                            value={runResult}
                            rows={8}
                            readOnly
                            style={{ marginTop: 8, fontFamily: 'monospace' }}
                          />
                        </div>
                      )}
                    </Space>
                  </Card>
                )
              }
            ]}
          />
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Agent信息" className="card-shadow" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>配置文件:</Text>
                <Text code>{agent.name}.md</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Python文件:</Text>
                <Text code>{agent.name}.py</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>文件状态:</Text>
                <Badge 
                  status={agent.hasPythonFile ? "success" : "error"} 
                  text={agent.hasPythonFile ? "完整" : "缺失Python文件"} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>工具数量:</Text>
                <Text strong>{agent.allowedTools?.length || 0}</Text>
              </div>
            </Space>
          </Card>

          <Card title="快速操作" className="card-shadow">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<ApiOutlined />}
                block
                onClick={() => {
                  // 跳转到API文档或工具说明
                  message.info('功能开发中...');
                }}
              >
                查看API文档
              </Button>
              
              <Button 
                icon={<CodeOutlined />}
                block
                onClick={() => {
                  // 查看Python源码
                  message.info('功能开发中...');
                }}
              >
                查看源码
              </Button>
              
              <Button 
                icon={<SettingOutlined />}
                block
                onClick={() => {
                  // 编辑配置
                  message.info('功能开发中...');
                }}
              >
                编辑配置
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// 主Agent管理页面组件
const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentContent, setAgentContent] = useState('');
  const [agentStatus, setAgentStatus] = useState({});

  useEffect(() => {
    loadAgents();
    loadAgentStatus();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('获取Agent列表失败');
      }
      const agentsData = await response.json();
      setAgents(agentsData);
    } catch (error) {
      console.error('加载Agent列表失败:', error);
      message.error('加载Agent列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/status');
      if (response.ok) {
        const statusData = await response.json();
        setAgentStatus(statusData);
      }
    } catch (error) {
      console.error('加载Agent状态失败:', error);
    }
  };

  const handleViewDetails = async (agent) => {
    try {
      const response = await fetch(`/api/agents/${agent.name}/content`);
      if (!response.ok) {
        throw new Error('获取Agent详情失败');
      }
      const data = await response.json();
      setAgentContent(data.content);
      setSelectedAgent(agent);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('获取Agent详情失败: ' + error.message);
    }
  };

  const handleToggleAgent = async (agent, enabled) => {
    try {
      const response = await fetch(`/api/agents/${agent.name}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('切换Agent状态失败');
      }

      // 更新本地状态
      setAgents(prev => prev.map(a => 
        a.name === agent.name ? { ...a, enabled } : a
      ));

      message.success(`${agent.displayName} 已${enabled ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('切换Agent状态失败: ' + error.message);
    }
  };

  const handleTestAgent = async (agent) => {
    try {
      message.loading(`正在测试 ${agent.displayName}...`, 0);
      
      const response = await fetch(`/api/agents/${agent.name}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company: '测试公司',
          testMode: true 
        }),
      });

      message.destroy();

      if (!response.ok) {
        throw new Error('Agent测试失败');
      }

      const result = await response.json();
      
      if (result.success) {
        message.success(`${agent.displayName} 测试成功`);
      } else {
        message.warning(`${agent.displayName} 测试完成，但有警告: ${result.message}`);
      }
    } catch (error) {
      message.destroy();
      message.error(`${agent.displayName} 测试失败: ${error.message}`);
    }
  };

  const getAgentStatusBadge = (agentName) => {
    const status = agentStatus[agentName];
    if (!status) return <Badge status="default" text="未知" />;
    
    switch (status.status) {
      case 'running':
        return <Badge status="processing" text="运行中" />;
      case 'idle':
        return <Badge status="success" text="空闲" />;
      case 'error':
        return <Badge status="error" text="错误" />;
      default:
        return <Badge status="default" text="未知" />;
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

  return (
    <Routes>
      <Route path="/" element={<AgentList />} />
      <Route path="/:agentName" element={<AgentDetail />} />
    </Routes>
  );
};

// Agent列表页面组件
const AgentList = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentContent, setAgentContent] = useState('');
  const [agentStatus, setAgentStatus] = useState({});

  useEffect(() => {
    loadAgents();
    loadAgentStatus();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('获取Agent列表失败');
      }
      const agentsData = await response.json();
      setAgents(agentsData);
    } catch (error) {
      console.error('加载Agent列表失败:', error);
      message.error('加载Agent列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentStatus = async () => {
    try {
      const response = await fetch('/api/agents/status');
      if (response.ok) {
        const statusData = await response.json();
        setAgentStatus(statusData);
      }
    } catch (error) {
      console.error('加载Agent状态失败:', error);
    }
  };

  const handleViewDetails = async (agent) => {
    navigate(`/agents/${agent.name}`);
  };

  const handleToggleAgent = async (agent, enabled) => {
    try {
      const response = await fetch(`/api/agents/${agent.name}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('切换Agent状态失败');
      }

      // 更新本地状态
      setAgents(prev => prev.map(a => 
        a.name === agent.name ? { ...a, enabled } : a
      ));

      message.success(`${agent.displayName} 已${enabled ? '启用' : '禁用'}`);
    } catch (error) {
      message.error('切换Agent状态失败: ' + error.message);
    }
  };

  const handleTestAgent = async (agent) => {
    try {
      message.loading(`正在测试 ${agent.displayName}...`, 0);
      
      const response = await fetch(`/api/agents/${agent.name}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          company: '测试公司',
          testMode: true 
        }),
      });

      message.destroy();

      if (!response.ok) {
        throw new Error('Agent测试失败');
      }

      const result = await response.json();
      
      if (result.success) {
        message.success(`${agent.displayName} 测试成功`);
      } else {
        message.warning(`${agent.displayName} 测试完成，但有警告: ${result.message}`);
      }
    } catch (error) {
      message.destroy();
      message.error(`${agent.displayName} 测试失败: ${error.message}`);
    }
  };

  const getAgentStatusBadge = (agentName) => {
    const status = agentStatus[agentName];
    if (!status) return <Badge status="default" text="未知" />;
    
    switch (status.status) {
      case 'running':
        return <Badge status="processing" text="运行中" />;
      case 'idle':
        return <Badge status="success" text="空闲" />;
      case 'error':
        return <Badge status="error" text="错误" />;
      default:
        return <Badge status="default" text="未知" />;
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

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          🤖 Agent管理
        </Title>
        <Text type="secondary">
          管理和配置股票分析SubAgent，控制各个分析模块的运行状态
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Agent列表 */}
        <Col xs={24} lg={16}>
          <Card 
            title="Agent列表" 
            className="card-shadow"
            extra={
              <Space>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={loadAgents}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Spin spinning={loading}>
              <List
                itemLayout="horizontal"
                dataSource={agents}
                renderItem={agent => (
                  <List.Item
                    actions={[
                      <Tooltip title="查看详情">
                        <Button 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewDetails(agent)}
                        />
                      </Tooltip>,
                      <Tooltip title="快速测试">
                        <Button 
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleTestAgent(agent)}
                          disabled={!agent.enabled}
                        />
                      </Tooltip>,
                      <Tooltip title="运行Agent">
                        <Button 
                          icon={<ThunderboltOutlined />}
                          onClick={() => navigate(`/agents/${agent.name}`)}
                          disabled={!agent.enabled}
                          style={{
                            background: agent.enabled ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' : undefined,
                            border: 'none',
                            color: agent.enabled ? 'white' : undefined
                          }}
                        />
                      </Tooltip>,
                      <Switch
                        checked={agent.enabled}
                        onChange={(checked) => handleToggleAgent(agent, checked)}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size={48}
                          style={{
                            backgroundColor: getAgentColor(agent.color),
                            fontSize: 20
                          }}
                        >
                          {getAgentIcon(agent.type)}
                        </Avatar>
                      }
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>
                            {agent.displayName}
                          </span>
                          <Tag color={agent.color}>{agent.type}</Tag>
                          {getAgentStatusBadge(agent.name)}
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text>{agent.description}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <FileTextOutlined style={{ marginRight: 4 }} />
                              配置文件: {agent.name}.md
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 16 }}>
                              <CodeOutlined style={{ marginRight: 4 }} />
                              Python文件: {agent.name}.py
                            </Text>
                          </div>
                          {agent.whenToUse && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              使用场景: {agent.whenToUse.substring(0, 100)}...
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Spin>
          </Card>
        </Col>

        {/* 系统状态 */}
        <Col xs={24} lg={8}>
          <Card title="系统状态" className="card-shadow" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>总Agent数量:</Text>
                <Text strong>{agents.length}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>已启用:</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {agents.filter(a => a.enabled).length}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>已禁用:</Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {agents.filter(a => !a.enabled).length}
                </Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>运行中:</Text>
                <Text strong style={{ color: '#1890ff' }}>
                  {Object.values(agentStatus).filter(s => s.status === 'running').length}
                </Text>
              </div>
            </Space>
          </Card>

          <Card title="快速操作" className="card-shadow">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />}
                block
                onClick={() => {
                  agents.forEach(agent => {
                    if (!agent.enabled) {
                      handleToggleAgent(agent, true);
                    }
                  });
                }}
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  border: 'none'
                }}
              >
                启用所有Agent
              </Button>
              
              <Button 
                icon={<ExclamationCircleOutlined />}
                block
                onClick={() => {
                  agents.forEach(agent => {
                    if (agent.enabled) {
                      handleToggleAgent(agent, false);
                    }
                  });
                }}
              >
                禁用所有Agent
              </Button>
              
              <Button 
                icon={<PlayCircleOutlined />}
                block
                onClick={() => {
                  const enabledAgents = agents.filter(a => a.enabled);
                  enabledAgents.forEach(agent => {
                    handleTestAgent(agent);
                  });
                }}
              >
                测试所有启用的Agent
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default AgentManagement;