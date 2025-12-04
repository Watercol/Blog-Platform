import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Button, Card, Result, Skeleton, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ArticleDetail } from '@shared/types';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state, setDetailData } = useInitialData();
  const { getArticleBySlug } = useArticlesApi();
  const [loading, setLoading] = useState(() => {
    if (!slug) {
      return false;
    }
    if (state.view !== 'detail' || !state.detailData) {
      return true;
    }
    return state.detailData.slug !== slug;
  });
  const [error, setError] = useState<string | null>(null);

  const detail: ArticleDetail | undefined = useMemo(() => {
    if (state.view !== 'detail' || !state.detailData) {
      return undefined;
    }
    if (slug && state.detailData.slug === slug) {
      return state.detailData;
    }
    return undefined;
  }, [slug, state]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    let ignore = false;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticleBySlug(slug);
        if (!ignore) {
          setDetailData(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : '加载文章失败');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    if (!detail) {
      fetchDetail();
    }

    return () => {
      ignore = true;
    };
  }, [detail, getArticleBySlug, setDetailData, slug]);

  if (!slug) {
    return (
      <Result
        status="warning"
        title="缺少文章标识"
        subTitle="参数错误，缺少有效的文章标识。"
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回首页</Button>
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
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回首页</Button>
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
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>返回首页</Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        返回上一页
      </Button>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Typography.Title level={2}>{detail.title}</Typography.Title>
            <Typography.Text type="secondary">
              作者：{detail.author}
              {detail.publishedAt
                ? ` · 发布于 ${dayjs(detail.publishedAt).format('YYYY年MM月DD日')}`
                : ''}
              · 阅读量 {detail.viewCount}
            </Typography.Text>
          </div>
          <Space size={[8, 8]} wrap>
            {detail.tags.map((tag) => (
              <Tag key={tag.id}>
                <Link to={`/?tag=${tag.slug}`}>#{tag.name}</Link>
              </Tag>
            ))}
          </Space>
          <div
            style={{ lineHeight: 1.7, color: '#1f2933' }}
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />
        </Space>
      </Card>
    </Space>
  );
};
