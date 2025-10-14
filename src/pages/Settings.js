import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Typography, 
  Divider,
  Row,
  Col,
  message,
  Space,
  Alert
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  FolderOutlined,
  ApiOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values) => {
    setLoading(true);
    try {
      // 模拟保存设置
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('设置已重置');
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          ⚙️ 系统设置
        </Title>
        <Text type="secondary">
          配置股票分析Agent的运行参数和系统选项
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          reportsPath: process.env.REACT_APP_REPORTS_PATH || '/path/to/finance-claude-code-agent-reports',
          agentPath: process.env.REACT_APP_AGENT_PATH || '/path/to/finance-claude-code-agent',
          autoSave: true,
          autoGitCommit: true,
          githubRepo: 'https://github.com/quantagent/finance-claude-code-agent-reports.git',
          maxConcurrentAnalyses: 3,
          analysisTimeout: 30,
          logLevel: 'info',
          enableNotifications: true,
          emailNotifications: false,
          webhookUrl: ''
        }}
      >
        <Row gutter={[24, 24]}>
          {/* 路径配置 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <FolderOutlined />
                  路径配置
                </Space>
              } 
              className="card-shadow"
            >
              <Form.Item
                name="reportsPath"
                label="报告输出路径"
                rules={[{ required: true, message: '请输入报告输出路径' }]}
              >
                <Input placeholder="报告文件保存的目录路径" />
              </Form.Item>

              <Form.Item
                name="agentPath"
                label="Agent项目路径"
                rules={[{ required: true, message: '请输入Agent项目路径' }]}
              >
                <Input placeholder="股票分析Agent项目的根目录" />
              </Form.Item>

              <Form.Item
                name="githubRepo"
                label="GitHub仓库地址"
              >
                <Input placeholder="用于自动提交报告的Git仓库地址" />
              </Form.Item>
            </Card>
          </Col>

          {/* 执行配置 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <SettingOutlined />
                  执行配置
                </Space>
              } 
              className="card-shadow"
            >
              <Form.Item
                name="maxConcurrentAnalyses"
                label="最大并发分析数"
                rules={[{ required: true, message: '请输入最大并发分析数' }]}
              >
                <Select>
                  <Option value={1}>1个</Option>
                  <Option value={2}>2个</Option>
                  <Option value={3}>3个</Option>
                  <Option value={5}>5个</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="analysisTimeout"
                label="分析超时时间（分钟）"
                rules={[{ required: true, message: '请输入超时时间' }]}
              >
                <Select>
                  <Option value={15}>15分钟</Option>
                  <Option value={30}>30分钟</Option>
                  <Option value={60}>60分钟</Option>
                  <Option value={120}>120分钟</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="logLevel"
                label="日志级别"
              >
                <Select>
                  <Option value="debug">Debug</Option>
                  <Option value="info">Info</Option>
                  <Option value="warning">Warning</Option>
                  <Option value="error">Error</Option>
                </Select>
              </Form.Item>
            </Card>
          </Col>

          {/* 自动化配置 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <ApiOutlined />
                  自动化配置
                </Space>
              } 
              className="card-shadow"
            >
              <Form.Item
                name="autoSave"
                label="自动保存报告"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="autoGitCommit"
                label="自动Git提交"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Alert
                message="自动化提示"
                description="启用自动Git提交后，每次分析完成都会自动将报告提交到配置的GitHub仓库"
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>

          {/* 通知配置 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <BellOutlined />
                  通知配置
                </Space>
              } 
              className="card-shadow"
            >
              <Form.Item
                name="enableNotifications"
                label="启用通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="emailNotifications"
                label="邮件通知"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="webhookUrl"
                label="Webhook URL"
              >
                <Input placeholder="分析完成后的回调地址（可选）" />
              </Form.Item>
            </Card>
          </Col>

          {/* Agent配置 */}
          <Col xs={24}>
            <Card 
              title="Agent配置" 
              className="card-shadow"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    name="managementAnalysisEnabled"
                    label="管理层分析"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    name="businessModelEnabled"
                    label="商业模式研究"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    name="competitionAnalysisEnabled"
                    label="竞争格局分析"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    name="valuationAnalysisEnabled"
                    label="估值分析"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <Form.Item
                    name="equityAnalysisEnabled"
                    label="股权分布研究"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 高级配置 */}
          <Col xs={24}>
            <Card title="高级配置" className="card-shadow">
              <Form.Item
                name="customPrompt"
                label="自定义提示词"
              >
                <TextArea
                  rows={4}
                  placeholder="可以在这里添加自定义的分析提示词，用于增强分析效果"
                />
              </Form.Item>

              <Form.Item
                name="apiKeys"
                label="API密钥配置"
              >
                <TextArea
                  rows={3}
                  placeholder="配置外部API密钥，如金融数据API等（JSON格式）"
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 操作按钮 */}
        <Row justify="end">
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                保存设置
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default Settings;