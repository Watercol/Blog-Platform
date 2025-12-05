import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { App, Button, Card, Popconfirm, Result, Skeleton, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { state, setDetailData } = useInitialData();
  const { getArticleBySlug, removeArticles } = useArticlesApi();

  // 优先使用缓存数据
  const detail = state.view === 'detail' && state.detailData?.slug === slug
    ? state.detailData : undefined;

  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回上一页
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
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <Typography.Title level={2} style={{ margin: 0, marginBottom: 8 }}>
              {detail.title}
            </Typography.Title>
            <Typography.Text type="secondary">
              作者：{detail.author}
              {detail.publishedAt
                ? ` · 发布于 ${dayjs(detail.publishedAt).format('YYYY年MM月DD日')}`
                : ''}
              · 阅读量 {detail.viewCount}
            </Typography.Text>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {detail.tags.map((tag) => (
              <Tag key={tag.id}>
                <Link to={`/?tag=${tag.slug}`}>#{tag.name}</Link>
              </Tag>
            ))}
          </div>

          <div
            style={{ lineHeight: 1.7, color: '#1f2933' }}
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />
        </div>
      </Card>
    </div>
  );
};
