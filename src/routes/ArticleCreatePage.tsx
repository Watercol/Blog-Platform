import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message, Modal, Spin, Alert } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, RobotOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ArticleStatus } from '@shared/types';
import { useArticlesApi } from '../hooks/useArticlesApi';
import { aiWriterService, type AIWritingRequest } from '../services/aiWriterService';

// 文章创建表单字段定义
interface FormValues {
  title: string;
  excerpt?: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: Dayjs;
  authorName: string;
  authorEmail: string;
}

/**
 * 文章创建页面组件
 * 功能：提供创建新文章的完整表单界面
 * 包含：作者信息、文章内容、标签、状态和发布时间等字段
 */
export const ArticleCreatePage = () => {
  const navigate = useNavigate();
  const { createArticle } = useArticlesApi();
  const [form] = Form.useForm<FormValues>();
  
  // 监听文章状态变化，用于条件渲染
  const status = Form.useWatch('status', form) as ArticleStatus | undefined;
  const isPublished = status === 'published';
  
  // 提交状态管理
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // AI写作相关状态
  const [aiWriting, setAiWriting] = useState(false);
  const [aiRequirements, setAiRequirements] = useState('');
  const [aiGeneratedContent, setAiGeneratedContent] = useState<string | null>(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  /**
   * 副作用：当文章状态不是"已发布"时，清空发布时间字段
   * 避免草稿状态下设置发布时间
   */
  useEffect(() => {
    if (status !== 'published') {
      form.setFieldsValue({ publishedAt: undefined });
    }
  }, [form, status]);

  /**
   * 表单提交处理函数
   * 处理文章创建逻辑，包括数据验证、API调用和导航
   */
  const handleFinish = async (values: FormValues) => {
    // 清理标签数据：去除空格并过滤空值
    const tags = values.tags.map((tag) => tag.trim()).filter(Boolean);

    try {
      setSubmitting(true);
      
      // 调用创建文章API
      const response = await createArticle({
        title: values.title.trim(),
        excerpt: values.excerpt?.trim() || undefined,
        content: values.content,
        tags,
        status: values.status,
        publishedAt:
          values.status === 'published'
            ? values.publishedAt?.format('YYYY-MM-DD HH:mm:ss') ?? null
            : null,
        authorName: values.authorName,
        authorEmail: values.authorEmail
      });
      
      // 创建成功，显示消息并导航到文章列表页
      messageApi.success('文章创建成功');
      navigate('/', { replace: true });
    } catch (error) {
      // 错误处理：显示具体的错误信息
      const messageText = error instanceof Error ? error.message : '创建文章失败';
      messageApi.error(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * 表单验证失败处理函数
   * 当表单验证不通过时显示错误提示
   */
  const handleFinishFailed = () => {
    messageApi.error('请检查表单填写是否完整');
  };

  /**
   * 打开AI写作模态框
   */
  const handleOpenAIWriting = () => {
    const title = form.getFieldValue('title');
    const tags = form.getFieldValue('tags') || [];
    
    if (!title) {
      messageApi.warning('请先填写文章标题');
      return;
    }
    
    setAiRequirements('');
    setAiGeneratedContent(null);
    setAiError(null);
    setAiModalVisible(true);
  };

  /**
   * 生成AI内容
   */
  const handleGenerateContent = async () => {
    if (!aiRequirements.trim()) {
      messageApi.warning('请输入写作要求');
      return;
    }

    const title = form.getFieldValue('title');
    const tags = form.getFieldValue('tags') || [];

    const request: AIWritingRequest = {
      title: title.trim(),
      tags: tags.map((tag: string) => tag.trim()).filter(Boolean),
      requirements: aiRequirements.trim(),
      language: '中文'
    };

    try {
      setAiWriting(true);
      setAiError(null);
      
      // 检查API是否配置，如果没有配置则使用模拟数据
      const response = aiWriterService.isConfigured() 
        ? await aiWriterService.generateContent(request)
        : await aiWriterService.generateMockContent(request);
      
      if (response.success) {
        setAiGeneratedContent(response.content);
        if (!aiWriterService.isConfigured()) {
          messageApi.info('当前使用演示模式，请配置OpenAI API密钥以使用真实AI写作功能');
        }
      } else {
        setAiError(response.error || '生成内容失败');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '生成内容时发生错误');
    } finally {
      setAiWriting(false);
    }
  };

  /**
   * 使用AI生成的内容
   */
  const handleUseAIContent = () => {
    if (aiGeneratedContent) {
      form.setFieldValue('content', aiGeneratedContent);
      setAiModalVisible(false);
      messageApi.success('AI生成的内容已填入表单');
    }
  };

  /**
   * 关闭AI模态框
   */
  const handleCloseAIModal = () => {
    setAiModalVisible(false);
    setAiGeneratedContent(null);
    setAiError(null);
  };

  return (
    <Space orientation="vertical" size={24} style={{ width: '100%' }}>
      {contextHolder}
      
      {/* 页面标题区域 */}
      <Space align="center" size={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          创建新文章
        </Typography.Title>
        <Typography.Text type="secondary">请完善文章信息后提交。</Typography.Text>
      </Space>

      {/* 文章创建表单 */}
      <Card>
        <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{ status: 'draft', tags: [] }}
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
        >
          {/* 作者信息区域 */}
          <Space size={24} style={{ width: '100%' }} wrap>
            <Form.Item
              label="作者姓名"
              name="authorName"
              rules={[{ required: true, message: '请输入作者姓名' }]}
              style={{ flex: '1 1 200px' }}
            >
              <Input placeholder="例如：张三" />
            </Form.Item>
            <Form.Item
              label="作者邮箱"
              name="authorEmail"
              rules={[
                { required: true, message: '请输入作者邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
              style={{ flex: '1 1 200px' }}
            >
              <Input placeholder="例如：zhangsan@example.com" />
            </Form.Item>
          </Space>

          {/* 文章基本信息区域 */}
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item 
            label="摘要" 
            name="excerpt"
          >
            <Input.TextArea rows={3} placeholder="用于列表页展示的简短摘要" />
          </Form.Item>

          <Form.Item
            label="正文内容"
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
            extra={
              <div style={{ marginTop: '8px' }}>
                <Button 
                  type="dashed" 
                  icon={<RobotOutlined />} 
                  onClick={handleOpenAIWriting}
                  size="small"
                >
                  AI智能写作
                </Button>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                  让AI根据标题、标签和您的需求自动生成文章内容
                </span>
              </div>
            }
          >
            <Input.TextArea rows={12} placeholder="支持 HTML 内容" />
          </Form.Item>

          {/* 标签管理区域 */}
          <Form.Item
            label="标签"
            name="tags"
            extra="输入后回车即可添加标签，亦可使用逗号自动分隔"
          >
            <Select mode="tags" tokenSeparators={[',']} placeholder="添加标签" />
          </Form.Item>

          {/* 文章状态和发布时间区域 */}
          <Space size={24} style={{ width: '100%' }} wrap>
            <Form.Item
              label="状态"
              name="status"
              rules={[{ required: true, message: '请选择文章状态' }]}
              style={{ flex: '1 1 220px' }}
            >
              <Select
                options={[
                  { value: 'draft', label: '草稿' },
                  { value: 'published', label: '已发布' }
                ]}
              />
            </Form.Item>

            <Form.Item
              label="发布时间"
              name="publishedAt"
              style={{ flex: '1 1 240px' }}
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                disabled={!isPublished}
                placeholder={isPublished ? '留空则使用当前时间' : '仅在发布状态下生效'}
              />
            </Form.Item>
          </Space>

          {/* 表单操作按钮区域 */}
          <Form.Item>
            <Space size={12}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={submitting}
              >
                创建文章
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} disabled={submitting}>
                返回
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* AI写作模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RobotOutlined style={{ color: '#1890ff' }} />
            <span>AI智能写作助手</span>
          </div>
        }
        open={aiModalVisible}
        onCancel={handleCloseAIModal}
        width={800}
        footer={[
          <Button key="cancel" onClick={handleCloseAIModal}>
            取消
          </Button>,
          <Button 
            key="generate" 
            type="primary" 
            icon={<RobotOutlined />} 
            loading={aiWriting}
            onClick={handleGenerateContent}
            disabled={!aiRequirements.trim()}
          >
            生成内容
          </Button>,
          <Button 
            key="use" 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={handleUseAIContent}
            disabled={!aiGeneratedContent}
          >
            使用此内容
          </Button>
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 当前信息展示 */}
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <div><strong>标题：</strong>{form.getFieldValue('title') || '未填写'}</div>
            <div><strong>标签：</strong>{form.getFieldValue('tags')?.join(', ') || '未设置'}</div>
          </div>

          {/* 写作要求输入 */}
          <div>
            <div style={{ marginBottom: '8px', fontWeight: '500' }}>写作要求：</div>
            <Input.TextArea
              rows={3}
              placeholder="请详细描述您希望AI生成的内容要求，例如：文章风格、重点内容、目标读者等..."
              value={aiRequirements}
              onChange={(e) => setAiRequirements(e.target.value)}
              disabled={aiWriting}
            />
          </div>

          {/* 错误提示 */}
          {aiError && (
            <Alert 
              title="AI写作错误" 
              description={aiError} 
              type="error" 
              showIcon 
              closable
              onClose={() => setAiError(null)}
            />
          )}

          {/* 生成内容预览 */}
          {aiGeneratedContent && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '500' }}>生成的内容预览：</div>
              <div 
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '12px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  backgroundColor: '#fafafa',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {aiGeneratedContent}
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {aiWriting && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" tip="AI正在创作中，请稍候..." />
            </div>
          )}

          {/* API配置提示 */}
          {!aiWriterService.isConfigured() && (
            <Alert
              title="演示模式"
              description="当前使用演示数据。要使用真实的AI写作功能，请在.env文件中设置VITE_OPENAI_API_KEY环境变量。"
              type="info"
              showIcon
            />
          )}
        </div>
      </Modal>
    </Space>
  );
};