import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { App, Button, Card, Popconfirm, Result, Skeleton, Tag, Typography, Form, Input, Switch, Space, message as antdMessage } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

const { TextArea } = Input;
const { Title, Text } = Typography;

// 文章编辑表单字段定义
interface ArticleEditForm {
  title: string;
  summary: string; // 修复：改为summary以匹配表单字段名
  content: string;
  slug: string;
}

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { state, setDetailData } = useInitialData();
  const { getArticleBySlug, removeArticles, updateArticle } = useArticlesApi();
  const [form] = Form.useForm();

  // 优先使用缓存数据
  const detail = state.view === 'detail' && state.detailData?.slug === slug
    ? state.detailData : undefined;

  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false); // 编辑模式状态
  const [saving, setSaving] = useState(false); // 保存状态

  useEffect(() => {
    if (!slug) return;
    
    // 如果有缓存，无需重复请求
    if (detail) {
      setLoading(false);
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);

    getArticleBySlug(slug)
      .then((data) => {
        if (!ignore) setDetailData(data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : '加载文章失败');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [slug, detail, getArticleBySlug, setDetailData]);

  // 进入编辑模式
  const handleEdit = () => {
    if (!detail) return;
    
    // 填充表单数据
    form.setFieldsValue({
      title: detail.title,
      summary: detail.excerpt, // 修复：保持summary字段名
      content: detail.content,
      slug: detail.slug
    });
    setEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    form.resetFields();
    setEditing(false);
  };

  // 保存编辑
  const handleSaveEdit = async (values: ArticleEditForm) => {
    if (!detail) return;
    
    try {
      setSaving(true);
      
      // 调用更新API，包含必填的tags、status和作者信息字段
      await updateArticle(detail.id, {
        title: values.title,
        excerpt: values.summary, // 修复：使用summary字段
        content: values.content,
        slug: values.slug,
        tags: detail.tags.map(tag => tag.name), // 使用原有的标签
        status: detail.status || 'published', // 使用原有的状态或默认值
        authorName: detail.author, // 使用原有的作者名
        authorEmail: 'unknown@example.com' // 提供默认邮箱以满足验证要求
      });
      
      // 更新本地缓存数据
      const updatedDetail = {
        ...detail,
        title: values.title,
        excerpt: values.summary, // 修复：更新excerpt字段
        content: values.content,
        slug: values.slug,
        updatedAt: new Date().toISOString() // 更新最后修改时间
      };
      setDetailData(updatedDetail);
      
      message.success('文章更新成功');
      setEditing(false);
      
      // 如果slug发生变化，需要重新导航
      if (values.slug !== detail.slug) {
        navigate(`/articles/${values.slug}`, { replace: true });
      }
    } catch (err) {
      antdMessage.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    try {
      setDeleting(true);
      await removeArticles([detail.id], true);
      message.success('文章已删除');
      navigate('/', { replace: true });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  if (!slug) {
    return (
      <Result
        status="warning"
        title="缺少文章标识"
        subTitle="参数错误，缺少有效的文章标识。"
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  if (loading && !detail) {
    return (
      <Card bordered={false}>
        <Skeleton active paragraph={{ rows: 6 }} title />
      </Card>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载文章失败"
        subTitle={error}
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  if (!detail) {
    return (
      <Result
        status="404"
        title="未找到文章"
        subTitle="文章可能已删除或尚未发布。"
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* 顶部操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回上一页
        </Button>
        
        <Space>
          {editing ? (
            <Space>
              <Button 
                icon={<CloseOutlined />} 
                onClick={handleCancelEdit}
                disabled={saving}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={saving}
                onClick={() => form.submit()}
              >
                保存
              </Button>
            </Space>
          ) : (
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={handleEdit}
              >
                编辑文章
              </Button>
              <Popconfirm
                title="确定要删除这篇文章吗？"
                description="删除后无法恢复。"
                onConfirm={handleDelete}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true, loading: deleting }}
              >
                <Button danger icon={<DeleteOutlined />} loading={deleting}>
                  删除文章
                </Button>
              </Popconfirm>
            </Space>
          )}
        </Space>
      </div>

      {/* 文章内容区域 */}
      <Card>
        {editing ? (
          // 编辑模式：显示表单
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveEdit}
            disabled={saving}
          >
            <Form.Item
              label="文章标题"
              name="title"
              rules={[
                { required: true, message: '请输入文章标题' },
                { min: 1, max: 200, message: '标题长度在1-200个字符之间' }
              ]}
            >
              <Input placeholder="请输入文章标题" />
            </Form.Item>

            <Form.Item
              label="文章摘要"
              name="summary"
              rules={[
                { required: true, message: '请输入文章摘要' },
                { min: 1, max: 500, message: '摘要长度在1-500个字符之间' }
              ]}
            >
              <TextArea 
                rows={3} 
                placeholder="请输入文章摘要" 
                showCount 
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              label="文章内容"
              name="content"
              rules={[
                { required: true, message: '请输入文章内容' },
                { min: 1, message: '文章内容不能为空' }
              ]}
            >
              <TextArea 
                rows={15} 
                placeholder="请输入文章内容（支持HTML格式）" 
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>

            <Form.Item
              label="文章标识（Slug）"
              name="slug"
              rules={[
                { required: true, message: '请输入文章标识' },
                { pattern: /^[a-z0-9-]+$/, message: 'Slug只能包含小写字母、数字和连字符' },
                { min: 1, max: 100, message: 'Slug长度在1-100个字符之间' }
              ]}
              extra="文章的唯一标识，用于URL中，只能包含小写字母、数字和连字符"
            >
              <Input placeholder="请输入文章标识" />
            </Form.Item>
          </Form>
        ) : (
          // 查看模式：显示文章内容
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                {detail.title}
              </Title>
              <Text type="secondary">
                作者：{detail.author}
                {detail.publishedAt
                  ? ` · 发布于 ${dayjs(detail.publishedAt).format('YYYY年MM月DD日')}`
                  : ''}
                {detail.updatedAt && detail.updatedAt !== detail.publishedAt
                  ? ` · 最后更新于 ${dayjs(detail.updatedAt).format('YYYY年MM月DD日 HH:mm')}`
                  : ''}
                · 阅读量 {detail.viewCount}
              </Text>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {detail.tags.map((tag) => (
                <Tag key={tag.id}>
                  <Link to={`/?tag=${tag.slug}`}>#{tag.name}</Link>
                </Tag>
              ))}
            </div>

            {detail.excerpt && (
              <Card type="inner" title="文章摘要">
                <Text>{detail.excerpt}</Text>
              </Card>
            )}

            <div
              style={{ lineHeight: 1.7, color: '#1f2933' }}
              dangerouslySetInnerHTML={{ __html: detail.content }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};