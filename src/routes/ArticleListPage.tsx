import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PaginatedArticles } from '@shared/types';
import { ArticleCard } from '../components/ArticleCard';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

const DEFAULT_PAGE_SIZE = 10;

export const ArticleListPage = () => {
  const { state, setListData } = useInitialData();
  const { getArticles } = useArticlesApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = useMemo(() => Number(searchParams.get('page') ?? '1') || 1, [searchParams]);
  const pageSize = useMemo(
    () => Number(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE,
    [searchParams]
  );
  const tag = useMemo(() => searchParams.get('tag') ?? undefined, [searchParams]);

  const listData: PaginatedArticles | undefined = state.view === 'list' ? state.listData : undefined;

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles({ page, pageSize, tag });
        if (!ignore) {
          setListData(data);
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

    const isInitialMatch =
      listData &&
      listData.meta.page === page &&
      listData.meta.pageSize === pageSize &&
      (tag ? listData.items.some((item) => item.tags.some((articleTag) => articleTag.slug === tag)) : true);

    if (!isInitialMatch) {
      load();
    }

    return () => {
      ignore = true;
    };
  }, [getArticles, listData, page, pageSize, setListData, tag]);

  const handleChangePage = (nextPage: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(nextPage));
      params.set('pageSize', String(pageSize));
      return params;
    });
  };

  const handleSelectTag = (tagSlug?: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (tagSlug) {
        params.set('tag', tagSlug);
      } else {
        params.delete('tag');
      }
      params.set('page', '1');
       params.set('pageSize', String(pageSize));
      return params;
    });
  };

  const renderList = () => {
    if (loading && !listData) {
      return <p>正在加载文章...</p>;
    }

    if (error) {
      return <p>出现错误：{error}</p>;
    }

    if (!listData || listData.items.length === 0) {
      return <p>暂无文章，去创建一篇吧。</p>;
    }

    return (
      <>
        {listData.items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
        <div className="pagination">
          <button
            className="button"
            type="button"
            disabled={listData.meta.page <= 1 || loading}
            onClick={() => handleChangePage(listData.meta.page - 1)}
          >
            上一页
          </button>
          <span>
            第 {listData.meta.page} / {listData.meta.totalPages} 页
          </span>
          <button
            className="button"
            type="button"
            disabled={listData.meta.page >= listData.meta.totalPages || loading}
            onClick={() => handleChangePage(listData.meta.page + 1)}
          >
            下一页
          </button>
        </div>
      </>
    );
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <button className="button" type="button" onClick={() => handleSelectTag(undefined)}>
            全部标签
          </button>
        </div>
        <div>
          <span>每页 {pageSize} 条</span>
        </div>
      </div>
      {renderList()}
    </main>
  );
};
