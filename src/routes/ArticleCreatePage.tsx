import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import type { ArticleStatus } from '@shared/types';
import { useArticlesApi } from '../hooks/useArticlesApi';

// 文章创建表单字段定义
interface FormValues {
  title: string;
  slug?: string;
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
        slug: values.slug?.trim() || undefined,
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
      
      // 创建成功，显示消息并导航到文章详情页
      messageApi.success('文章创建成功');
      navigate(`/articles/${response.slug}`);
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
            label="自定义 Slug" 
            name="slug" 
            tooltip="可留空，系统将根据标题生成"
          >
            <Input placeholder="例如：my-first-post" />
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
    </Space>
  );
};