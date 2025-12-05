import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Empty, List, Pagination, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { PaginatedArticles, Tag } from '@shared/types';
import { ArticleCard } from '../components/ArticleCard';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

const DEFAULT_PAGE_SIZE = 10;

export const ArticleListPage = () => {
  const { state, setListData } = useInitialData();
  const { getArticles, getTags } = useArticlesApi();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const lastLoadedParams = useRef<{ page: number; pageSize: number; tag?: string } | null>(null);

  const page = useMemo(() => Number(searchParams.get('page') ?? '1') || 1, [searchParams]);
  const pageSize = useMemo(
    () => Number(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE,
    [searchParams]
  );
  const tag = useMemo(() => searchParams.get('tag') ?? undefined, [searchParams]);

  const listData: PaginatedArticles | undefined = state.view === 'list' ? state.listData : undefined;

  const tagOptions = useMemo(() => {
    const options = tags
      .map((tagItem) => ({ value: tagItem.slug, label: tagItem.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (tag && !options.some((option) => option.value === tag)) {
      options.push({ value: tag, label: tag });
    }
    return options;
  }, [tags, tag]);

  useEffect(() => {
    let ignore = false;

    const loadTags = async () => {
      try {
        setTagsLoading(true);
        const fetched = await getTags();
        if (!ignore) {
          setTags(fetched);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : '加载标签失败');
        }
      } finally {
        if (!ignore) {
          setTagsLoading(false);
        }
      }
    };

    loadTags();

    return () => {
      ignore = true;
    };
  }, [getTags]);

  useEffect(() => {
    if (listData && !lastLoadedParams.current) {
      lastLoadedParams.current = {
        page: listData.meta.page,
        pageSize: listData.meta.pageSize,
        tag
      };
    }
  }, [listData, tag]);

  useEffect(() => {
    let ignore = false;
    const paramsKey = { page, pageSize, tag };
    const matchesLast =
      !!lastLoadedParams.current &&
      lastLoadedParams.current.page === paramsKey.page &&
      lastLoadedParams.current.pageSize === paramsKey.pageSize &&
      lastLoadedParams.current.tag === paramsKey.tag;

    if (listData && matchesLast) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getArticles(paramsKey);
        if (!ignore) {
          setListData(data);
          lastLoadedParams.current = paramsKey;
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

    load();

    return () => {
      ignore = true;
    };
  }, [getArticles, listData, page, pageSize, setListData, tag]);

  const handlePaginationChange = (nextPage: number, nextPageSize?: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(nextPage));
      params.set('pageSize', String(nextPageSize ?? pageSize));
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', margin: 5 }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', height: 40 }}>
          <h2 style={{ margin: 0, width: 150, fontSize: '30px', fontWeight: 600, lineHeight: 1.35 }}>
            文章列表
          </h2>
          <Select
            allowClear
            placeholder="按标签筛选"
            style={{ width: 200 }}
            value={tag}
            onChange={handleSelectTag}
            options={tagOptions}
            loading={tagsLoading}
          />
        </div>
        <Link to="/articles/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新增文章
          </Button>
        </Link>
      </div>

      {error ? (
        <Alert type="error" title={error} showIcon />
      ) : null}

      <List
        itemLayout="vertical"
        dataSource={listData?.items ?? []}
        loading={loading && !error}
        renderItem={(article) => (
          <List.Item key={article.id}>
            <ArticleCard article={article} />
          </List.Item>
        )}
        locale={{ emptyText: <Empty description="暂无文章" /> }}
      />

      {listData && listData.meta.totalItems > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={listData.meta.page}
            pageSize={listData.meta.pageSize}
            total={listData.meta.totalItems}
            showSizeChanger={false}
            onChange={handlePaginationChange}
          />
        </div>
      ) : null}
    </div>
  );
};
