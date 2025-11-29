import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ArticleDetail } from '@shared/types';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

export const ArticleDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state, setDetailData } = useInitialData();
  const { getArticleBySlug } = useArticlesApi();
  const [loading, setLoading] = useState(false);
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
      <main>
        <p>参数错误，缺少文章标识。</p>
        <button className="button" type="button" onClick={() => navigate('/')}>返回列表</button>
      </main>
    );
  }

  if (loading && !detail) {
    return (
      <main>
        <p>正在加载文章...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <p>出现错误：{error}</p>
        <button className="button" type="button" onClick={() => navigate('/')}>返回列表</button>
      </main>
    );
  }

  if (!detail) {
    return (
      <main>
        <p>未找到文章。</p>
        <button className="button" type="button" onClick={() => navigate('/')}>返回列表</button>
      </main>
    );
  }

  return (
    <main>
      <button className="button" type="button" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        返回上一页
      </button>
      <div className="detail-content">
        <header>
          <h1>{detail.title}</h1>
          <div className="article-meta" style={{ marginBottom: '1rem' }}>
            <span>作者：{detail.author}</span>
            {detail.publishedAt ? <span> · 发布于 {dayjs(detail.publishedAt).format('YYYY年MM月DD日')}</span> : null}
            <span> · 阅读量 {detail.viewCount}</span>
          </div>
          <div>
            {detail.tags.map((tag) => (
              <Link key={tag.id} className="tag-pill" to={`/?tag=${tag.slug}`}>
                #{tag.name}
              </Link>
            ))}
          </div>
        </header>
        <article dangerouslySetInnerHTML={{ __html: detail.content }} />
      </div>
    </main>
  );
};
