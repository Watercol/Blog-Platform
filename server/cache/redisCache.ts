import Redis from 'ioredis';
import type { PaginatedArticles } from '@shared/types';

export interface CacheOptions {
  ttl?: number; // 缓存过期时间（秒）
}

export class RedisCache {
  private client: Redis;
  private prefix: string;

  constructor(redisUrl?: string, prefix = 'blog:') {
    this.client = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.prefix = prefix;

    // 监听Redis连接事件
    this.client.on('connect', () => {
      console.log('Redis连接成功');
    });

    this.client.on('error', (err) => {
      console.error('Redis连接错误:', err);
    });
  }

  /**
   * 生成缓存键
   */
  private generateKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.generateKey(key);
    const serializedValue = JSON.stringify(value);
    
    if (options.ttl) {
      await this.client.setex(cacheKey, options.ttl, serializedValue);
    } else {
      await this.client.set(cacheKey, serializedValue);
    }
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateKey(key);
    const cachedValue = await this.client.get(cacheKey);
    
    if (!cachedValue) {
      return null;
    }

    try {
      return JSON.parse(cachedValue) as T;
    } catch (error) {
      console.error('缓存数据解析失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    const cacheKey = this.generateKey(key);
    await this.client.del(cacheKey);
  }

  /**
   * 清空所有缓存
   */
  async flushAll(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * 生成文章列表的缓存键
   */
  generateArticlesKey(params: {
    page: number;
    pageSize: number;
    tag?: string;
    search?: string;
    sort?: string;
    order?: string;
  }): string {
    const { page, pageSize, tag, search, sort = 'publishedAt', order = 'desc' } = params;
    const keyParts = [`articles:list`, `page:${page}`, `size:${pageSize}`, `sort:${sort}`, `order:${order}`];
    
    if (tag) keyParts.push(`tag:${tag}`);
    if (search) keyParts.push(`search:${search}`);
    
    return keyParts.join(':');
  }

  /**
   * 获取文章列表缓存
   */
  async getArticles(params: {
    page: number;
    pageSize: number;
    tag?: string;
    search?: string;
    sort?: string;
    order?: string;
  }): Promise<PaginatedArticles | null> {
    const key = this.generateArticlesKey(params);
    return this.get<PaginatedArticles>(key);
  }

  /**
   * 设置文章列表缓存
   */
  async setArticles(
    params: {
      page: number;
      pageSize: number;
      tag?: string;
      search?: string;
      sort?: string;
      order?: string;
    },
    data: PaginatedArticles,
    options: CacheOptions = { ttl: 300 } // 默认5分钟过期
  ): Promise<void> {
    const key = this.generateArticlesKey(params);
    await this.set(key, data, options);
  }

  /**
   * 删除文章相关的所有缓存
   */
  async invalidateArticleCaches(): Promise<void> {
    const keys = await this.client.keys(`${this.prefix}articles:*`);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * 关闭Redis连接
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

// 创建全局Redis缓存实例
export const redisCache = new RedisCache();