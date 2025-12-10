import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

/**
 * 静态资源缓存中间件
 * 对CSS、JS、图片等静态资源设置长期缓存
 */
export const staticCacheMiddleware = express.static(
  path.resolve(process.cwd(), 'dist/client'),
  {
    immutable: true,
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      // 对CSS文件设置更强的缓存策略
      if (filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Vary', 'Accept-Encoding');
      }
      // 对JS文件设置长期缓存
      else if (filePath.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // 对图片资源设置缓存
      else if (/\.(png|jpg|jpeg|gif|svg|ico)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
      }
    }
  }
);

/**
 * 生成文件的ETag
 */
const generateETag = async (filePath: string): Promise<string> => {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return `"${hash}-${stats.mtime.getTime()}"`;
  } catch (error) {
    return `"${Date.now()}"`;
  }
};

/**
 * 动态资源缓存中间件工厂函数
 * 对文章列表和文章详情等动态内容使用ETag缓存
 */
export const createDynamicCacheMiddleware = (options: {
  maxAge?: number;
  mustRevalidate?: boolean;
} = {}) => {
  const { maxAge = 300, mustRevalidate = true } = options; // 默认5分钟缓存

  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const originalSend = res.send.bind(res);
    
    // 只对文章相关的API请求应用缓存
    const isArticleApi = req.path.startsWith('/api/articles') && 
                        (req.method === 'GET' || req.method === 'HEAD');
    
    if (!isArticleApi) {
      return next();
    }

    // 检查客户端是否发送了If-None-Match头
    const clientETag = req.headers['if-none-match'];
    
    // 重写res.send方法以捕获响应内容并生成ETag
    res.send = function(body?: any): express.Response {
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        // 生成响应内容的ETag
        const content = typeof body === 'string' ? body : body.toString();
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const etag = `"${hash}"`;
        
        // 设置ETag头
        res.setHeader('ETag', etag);
        
        // 设置缓存控制头
        let cacheControl = `public, max-age=${maxAge}`;
        if (mustRevalidate) {
          cacheControl += ', must-revalidate';
        }
        res.setHeader('Cache-Control', cacheControl);
        
        // 检查ETag是否匹配
        if (clientETag && clientETag === etag) {
          res.status(304); // Not Modified
          return res.end();
        }
      }
      
      return originalSend(body);
    };
    
    next();
  };
};