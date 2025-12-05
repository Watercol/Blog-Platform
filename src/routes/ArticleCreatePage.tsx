import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Dayjs } from 'dayjs';
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import type { ArticleStatus } from '@shared/types';
import { useArticlesApi } from '../hooks/useArticlesApi';

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

export const ArticleCreatePage = () => {
  const navigate = useNavigate();
  const { createArticle } = useArticlesApi();
  const [form] = Form.useForm<FormValues>();
  const status = Form.useWatch('status', form) as ArticleStatus | undefined;
  const isPublished = status === 'published';
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (status !== 'published') {
      form.setFieldsValue({ publishedAt: undefined });
    }
  }, [form, status]);

  const handleFinish = async (values: FormValues) => {
    const tags = values.tags.map((tag) => tag.trim()).filter(Boolean);

    try {
      setSubmitting(true);
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
      messageApi.success('文章创建成功');
      navigate(`/articles/${response.slug}`);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '创建文章失败';
      messageApi.error(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishFailed = () => {
    messageApi.error('请检查表单填写是否完整');
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {contextHolder}
      <Space align="center" size={16}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          创建新文章
        </Typography.Title>
        <Typography.Text type="secondary">请完善文章信息后提交。</Typography.Text>
      </Space>
      <Card>
          <Form<FormValues>
          form={form}
          layout="vertical"
          initialValues={{ status: 'draft', tags: [] }}
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
        >
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

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item label="自定义 Slug" name="slug" tooltip="可留空，系统将根据标题生成">
            <Input placeholder="例如：my-first-post" />
          </Form.Item>

          <Form.Item label="摘要" name="excerpt">
            <Input.TextArea rows={3} placeholder="用于列表页展示的简短摘要" />
          </Form.Item>

          <Form.Item
            label="正文内容"
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
          >
            <Input.TextArea rows={12} placeholder="支持 HTML 内容" />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
            extra="输入后回车即可添加标签，亦可使用逗号自动分隔"
          >
            <Select mode="tags" tokenSeparators={[',']} placeholder="添加标签" />
          </Form.Item>

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
