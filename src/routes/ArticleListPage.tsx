import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, Button, Empty, List, Select, Checkbox, message, Modal, Space, Spin, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { Tag, ArticleSummary } from '@shared/types';
import { ArticleCard } from '../components/ArticleCard';
import { useArticlesApi } from '../hooks/useArticlesApi';

// 默认每页加载的文章数量
const DEFAULT_PAGE_SIZE = 10;
// 无限滚动触发阈值（距离底部多少像素时触发加载）
const SCROLL_THRESHOLD = 100;

/**
 * 文章列表页面组件
 * 主要功能：
 * - 展示文章列表
 * - 支持无限滚动浏览
 * - 按标签筛选文章
 * - 批量选择和删除文章
 * - 新增文章导航
 */
export const ArticleListPage = () => {
  // 使用文章API钩子获取文章相关操作方法
  const { getArticles, getTags, removeArticles } = useArticlesApi();
  // 获取URL搜索参数和设置方法，用于筛选
  const [searchParams, setSearchParams] = useSearchParams();

  // 状态管理
  const [loading, setLoading] = useState(false); // 文章列表初始加载状态
  const [loadingMore, setLoadingMore] = useState(false); // 加载更多文章状态
  const [tagsLoading, setTagsLoading] = useState(false); // 标签加载状态
  const [error, setError] = useState<string | null>(null); // 错误信息
  const [tags, setTags] = useState<Tag[]>([]); // 标签列表
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]); // 选中的文章ID列表
  const [deleteLoading, setDeleteLoading] = useState(false); // 批量删除操作进行中状态
  
  // 无限滚动相关状态
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const [hasMore, setHasMore] = useState(true); // 是否还有更多数据
  const [allArticles, setAllArticles] = useState<ArticleSummary[]>([]); // 所有已加载的文章
  
  // 记录上次加载的参数，避免重复请求
  const lastLoadedParams = useRef<{ page: number; pageSize: number; tag?: string; search?: string } | null>(null);

  // 从URL参数中解析筛选条件
  const tag = useMemo(() => searchParams.get('tag') ?? undefined, [searchParams]);
  const search = useMemo(() => searchParams.get('search') ?? undefined, [searchParams]);

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

  // 计算是否全选：检查所有已加载文章是否都被选中
  const isAllSelected = useMemo(() => {
    if (!allArticles.length) return false;
    return allArticles.every(article => selectedArticles.includes(article.id));
  }, [allArticles, selectedArticles]);

  // 计算是否部分选择：检查是否有部分文章被选中但不是全选
  const isIndeterminate = useMemo(() => {
    if (!allArticles.length) return false;
    return selectedArticles.length > 0 && selectedArticles.length < allArticles.length;
  }, [allArticles, selectedArticles]);

  // 处理全选/全不选操作
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 全选：将所有已加载文章的ID添加到选中列表
      setSelectedArticles(allArticles.map(article => article.id));
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
          // 调用API执行批量删除（硬删除）
          await removeArticles(selectedArticles, true);
          
          // 删除成功提示
          message.success(`成功删除 ${selectedArticles.length} 篇文章`);
          // 清空选中状态
          setSelectedArticles([]);
          
          // 重新加载数据，更新列表显示
          await loadArticles(1, true);
          
        } catch (err) {
          // 删除失败处理
          message.error(err instanceof Error ? err.message : '删除失败');
        } finally {
          setDeleteLoading(false);
        }
      }
    });
  };

  // 加载文章的函数
  const loadArticles = useCallback(async (pageToLoad: number, reset = false) => {
    // 如果正在加载或没有更多数据，则跳过
    if (loadingMore || (pageToLoad > 1 && !hasMore)) return;

    const paramsKey = { 
      page: pageToLoad, 
      pageSize: DEFAULT_PAGE_SIZE, 
      tag, 
      search 
    };

    // 检查参数是否与上次加载相同，避免重复请求
    if (lastLoadedParams.current && 
        JSON.stringify(lastLoadedParams.current) === JSON.stringify(paramsKey) && 
        !reset) {
      return;
    }

    try {
      if (reset || pageToLoad === 1) {
        setLoading(true);
        setAllArticles([]);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      const data = await getArticles(paramsKey);
      
      if (reset || pageToLoad === 1) {
        // 重置或第一页加载
        setAllArticles(data.items);
        setCurrentPage(1);
      } else {
        // 加载更多
        setAllArticles(prev => [...prev, ...data.items]);
        setCurrentPage(pageToLoad);
      }
      
      // 检查是否还有更多数据
      setHasMore(data.items.length === DEFAULT_PAGE_SIZE);
      lastLoadedParams.current = paramsKey;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载文章失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getArticles, tag, search, loadingMore, hasMore]);

  // 无限滚动处理函数
  const handleScroll = useCallback(() => {
    const scrollElement = document.documentElement;
    const scrollTop = scrollElement.scrollTop;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    
    // 检查是否接近底部
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD && hasMore && !loadingMore) {
      loadArticles(currentPage + 1);
    }
  }, [currentPage, hasMore, loadingMore, loadArticles]);

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
    if (allArticles.length > 0 && !lastLoadedParams.current) {
      lastLoadedParams.current = {
        page: currentPage,
        pageSize: DEFAULT_PAGE_SIZE,
        tag,
        search
      };
    }
  }, [allArticles, currentPage, tag, search]);

  // 加载文章列表的副作用 - 初始加载和筛选条件变化时重置
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      if (!ignore) {
        await loadArticles(1, true);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [tag, search]);

  // 添加滚动事件监听器
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // 无限滚动机制不再需要分页变化处理函数

  // 处理标签筛选变化
  const handleSelectTag = (tagSlug?: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (tagSlug) {
        params.set('tag', tagSlug);
      } else {
        params.delete('tag');
      }
      params.delete('page'); // 无限滚动不需要页码参数
      params.delete('pageSize'); // 无限滚动不需要页大小参数
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
      params.delete('page'); // 无限滚动不需要页码参数
      params.delete('pageSize'); // 无限滚动不需要页大小参数
      return params;
    });
  };

  // 清除搜索
  const handleClearSearch = () => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete('search');
      params.delete('page'); // 无限滚动不需要页码参数
      params.delete('pageSize'); // 无限滚动不需要页大小参数
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
      {allArticles.length > 0 && (
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

      {/* 文章列表 - 无限滚动 */}
      <List
        itemLayout="vertical"
        dataSource={allArticles}
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

      {/* 加载更多指示器 */}
      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spin size="large" tip="加载更多文章..." />
        </div>
      )}

      {/* 没有更多数据的提示 */}
      {!hasMore && allArticles.length > 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666',
          fontSize: '14px'
        }}>
          已加载全部文章
        </div>
      )}

      {/* 无限滚动机制不再需要分页组件 */}
    </div>
  );
};