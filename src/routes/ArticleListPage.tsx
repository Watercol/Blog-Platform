import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Empty, List, Pagination, Select, Checkbox, message, Modal, Space, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { PaginatedArticles, Tag } from '@shared/types';
import { ArticleCard } from '../components/ArticleCard';
import { useInitialData } from '../state/InitialDataContext';
import { useArticlesApi } from '../hooks/useArticlesApi';

// 默认每页显示的文章数量
const DEFAULT_PAGE_SIZE = 10;

/**
 * 文章列表页面组件
 * 主要功能：
 * - 展示文章列表
 * - 支持分页浏览
 * - 按标签筛选文章
 * - 批量选择和删除文章
 * - 新增文章导航
 */
export const ArticleListPage = () => {
  // 使用初始数据上下文获取和设置列表数据
  const { state, setListData } = useInitialData();
  // 使用文章API钩子获取文章相关操作方法
  const { getArticles, getTags, removeArticles } = useArticlesApi();
  // 获取URL搜索参数和设置方法，用于分页和筛选
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [loading, setLoading] = useState(false); // 文章列表加载状态
  const [tagsLoading, setTagsLoading] = useState(false); // 标签加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [tags, setTags] = useState<Tag[]>([]); // 标签列表
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]); // 选中的文章ID列表
  const [deleteLoading, setDeleteLoading] = useState(false); // 批量删除操作进行中状态
  
  // 记录上次加载的参数，避免重复请求
  const lastLoadedParams = useRef<{ page: number; pageSize: number; tag?: string; search?: string } | null>(null);

  // 从URL参数中解析当前页码、每页数量和标签筛选条件
  const page = useMemo(() => Number(searchParams.get('page') ?? '1') || 1, [searchParams]);
  const pageSize = useMemo(
    () => Number(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE,
    [searchParams]
  );
  const tag = useMemo(() => searchParams.get('tag') ?? undefined, [searchParams]);
  const search = useMemo(() => searchParams.get('search') ?? undefined, [searchParams]);

  // 从全局状态中获取当前的文章列表数据
  const listData: PaginatedArticles | undefined = state.view === 'list' ? state.listData : undefined;

  // 生成标签选择器的选项列表
  const tagOptions = useMemo(() => {
    const options = tags
      .map((tagItem) => ({ value: tagItem.slug, label: tagItem.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
    // 如果当前URL中的标签不在标签列表中，手动添加
    if (tag && !options.some((option) => option.value === tag)) {
      options.push({ value: tag, label: tag });
    }
    return options;
  }, [tags, tag]);

  // 计算是否全选：检查当前页所有文章是否都被选中
  const isAllSelected = useMemo(() => {
    if (!listData?.items?.length) return false;
    return listData.items.every(article => selectedArticles.includes(article.id));
  }, [listData, selectedArticles]);

  // 计算是否部分选择：检查是否有部分文章被选中但不是全选
  const isIndeterminate = useMemo(() => {
    if (!listData?.items?.length) return false;
    return selectedArticles.length > 0 && selectedArticles.length < listData.items.length;
  }, [listData, selectedArticles]);

  // 处理全选/全不选操作
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 全选：将当前页所有文章的ID添加到选中列表
      setSelectedArticles(listData?.items?.map(article => article.id) || []);
    } else {
      // 取消全选：清空选中列表
      setSelectedArticles([]);
    }
  };

  // 处理单个文章的选择/取消选择
  const handleArticleSelect = (articleId: number, checked: boolean) => {
    if (checked) {
      // 选中：将文章ID添加到选中列表
      setSelectedArticles(prev => [...prev, articleId]);
    } else {
      // 取消选中：从选中列表中移除文章ID
      setSelectedArticles(prev => prev.filter(id => id !== articleId));
    }
  };

  // 批量删除文章
  const handleBatchDelete = async () => {
    // 安全检查：确保有选中的文章
    if (selectedArticles.length === 0) {
      message.warning('请选择要删除的文章');
      return;
    }

    // 显示确认对话框，防止误操作
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedArticles.length} 篇文章吗？此操作不可恢复。`,
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          setDeleteLoading(true);
          // 调用API执行批量删除
          await removeArticles(selectedArticles);
          
          // 删除成功提示
          message.success(`成功删除 ${selectedArticles.length} 篇文章`);
          // 清空选中状态
          setSelectedArticles([]);
          
          // 重新加载当前页面的数据，更新列表显示
          const data = await getArticles({ page, pageSize, tag });
          setListData(data);
          // 更新上次加载参数记录
          lastLoadedParams.current = { page, pageSize, tag };
          
        } catch (err) {
          // 删除失败处理
          message.error(err instanceof Error ? err.message : '删除失败');
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // 加载标签列表的副作用
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

  // 初始化上次加载参数记录
  useEffect(() => {
    if (listData && !lastLoadedParams.current) {
      lastLoadedParams.current = {
        page: listData.meta.page,
        pageSize: listData.meta.pageSize,
        tag,
        search
      };
    }
  }, [listData, tag, search]);

  // 加载文章列表的副作用
  useEffect(() => {
    let ignore = false;
    const paramsKey = { page, pageSize, tag, search };
    // 检查参数是否与上次加载相同，避免重复请求
    const matchesLast =
      !!lastLoadedParams.current &&
      lastLoadedParams.current.page === paramsKey.page &&
      lastLoadedParams.current.pageSize === paramsKey.pageSize &&
      lastLoadedParams.current.tag === paramsKey.tag &&
      lastLoadedParams.current.search === paramsKey.search;

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
  }, [getArticles, listData, page, pageSize, setListData, tag, search]);

  // 处理分页变化
  const handlePaginationChange = (nextPage: number, nextPageSize?: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('page', String(nextPage));
      params.set('pageSize', String(nextPageSize ?? pageSize));
      return params;
    });
  };

  // 处理标签筛选变化
  const handleSelectTag = (tagSlug?: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (tagSlug) {
        params.set('tag', tagSlug);
      } else {
        params.delete('tag');
      }
      params.set('page', '1'); // 切换标签时重置到第一页
      params.set('pageSize', String(pageSize));
      return params;
    });
  };

  // 本地搜索输入状态
  const [localSearch, setLocalSearch] = useState(search || '');

  // 同步URL搜索参数到本地搜索状态
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  // 处理搜索变化
  const handleSearch = (value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (value.trim()) {
        params.set('search', value.trim());
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // 搜索时重置到第一页
      params.set('pageSize', String(pageSize));
      return params;
    });
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('search');
      params.set('page', '1'); // 清除搜索时重置到第一页
      params.set('pageSize', String(pageSize));
      return params;
    });
  }; 

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', margin: 5 }}>
      {/* 顶部操作栏：包含标题、筛选器和操作按钮 */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Input.Search
              placeholder="搜索文章标题与摘要"
              allowClear
              style={{ width: 280 }}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            {search && (
              <span style={{ fontSize: '14px', color: '#666' }}>
                搜索: "{search}"
              </span>
            )}
          </div>
        </div>
        
        {/* 操作按钮区域 */}
        <Space>
          {/* 批量删除按钮 - 仅在选中文章时显示 */}
          {selectedArticles.length > 0 && (
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />}
              loading={deleteLoading}
              onClick={handleBatchDelete}
            >
              批量删除 ({selectedArticles.length})
            </Button>
          )}
          
          {/* 新增文章按钮 */}
          <Link to="/articles/new">
            <Button type="primary" icon={<PlusOutlined />}>
              新增文章
            </Button>
          </Link>
        </Space>
      </div>

      {/* 选择控制栏 - 仅在列表有数据时显示 */}
      {listData && listData.items.length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          border: '1px solid #d9d9d9'
        }}>
          {/* 全选复选框 */}
          <Checkbox
            indeterminate={isIndeterminate}
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            全选
          </Checkbox>
          
          {/* 选择数量显示 */}
          <span style={{ color: '#666', fontSize: '14px' }}>
            已选择 {selectedArticles.length} 篇文章
          </span>
          
          {/* 取消选择按钮 - 仅在选中文章时显示 */}
          {selectedArticles.length > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={() => setSelectedArticles([])}
              style={{ padding: 0 }}
            >
              取消选择
            </Button>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error ? (
        <Alert type="error" title={error} showIcon />
      ) : null}

      {/* 文章列表 */}
      <List
        itemLayout="vertical"
        dataSource={listData?.items ?? []}
        loading={loading && !error}
        renderItem={(article) => (
          <List.Item key={article.id}>
            {/* 文章项布局：左侧选择框 + 右侧文章卡片 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
              {/* 单个文章选择框 */}
              <Checkbox
                checked={selectedArticles.includes(article.id)}
                onChange={(e) => handleArticleSelect(article.id, e.target.checked)}
                style={{ marginTop: '4px' }}
              />
              <div style={{ flex: 1 }}>
                <ArticleCard article={article} />
              </div>
            </div>
          </List.Item>
        )}
        locale={{
          emptyText: search ? (
            <Empty 
              description={`没有找到包含"${search}"的文章`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="link" onClick={handleClearSearch}>
                清除搜索条件
              </Button>
            </Empty>
          ) : (
            <Empty description="暂无文章" />
          )
        }}
      />

      {/* 分页组件 */}
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