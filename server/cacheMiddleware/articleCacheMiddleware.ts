import express from 'express';
import crypto from 'node:crypto';

/**
 * 文章API缓存中间件
 * 对文章列表和文章详情使用智能缓存策略
 */
export const articleCacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const originalSend = res.send.bind(res);
  
  // 只对GET请求的文章API应用缓存
  const isArticleApi = req.path.startsWith('/api/articles') && req.method === 'GET';
  
  if (!isArticleApi) {
    return next();
  }
  
  // 检查客户端缓存头
  const clientETag = req.headers['if-none-match'];
  const clientModifiedSince = req.headers['if-modified-since'];
  
  // 重写res.send方法以应用缓存策略
  res.send = function(body?: any): express.Response {
    if (typeof body === 'string' || Buffer.isBuffer(body) || (body && typeof body === 'object')) {
      // 生成响应内容的ETag
      const content = JSON.stringify(body);
      const hash = crypto.createHash('md5').update(content).digest('hex');
      const etag = `"${hash}"`;
      
      // 设置缓存头
      res.setHeader('ETag', etag);
      res.setHeader('Last-Modified', new Date().toUTCString());
      
      // 根据请求类型设置不同的缓存策略
      if (req.path === '/api/articles' || req.path === '/api/articles/') {
        // 文章列表：较短的缓存时间（1分钟），因为列表可能频繁更新
        res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
      } else if (req.path.match(/\/api\/articles\/[^\/]+$/)) {
        // 文章详情：较长的缓存时间（5分钟），因为单篇文章更新频率较低
        res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
      } else {
        // 其他文章相关API：默认缓存策略
        res.setHeader('Cache-Control', 'public, max-age=180, must-revalidate');
      }
      
      // 检查缓存有效性
      if (clientETag && clientETag === etag) {
        // ETag匹配，返回304 Not Modified
        res.status(304);
        return res.end();
      }
      
      if (clientModifiedSince) {
        // 这里可以添加基于修改时间的缓存验证逻辑
        // 由于我们的数据来自数据库，需要更复杂的逻辑，暂时使用ETag
      }
    }
    
    return originalSend(body);
  };
  
  next();
};

/**
 * 文章列表缓存中间件（更激进的缓存策略）
 * 对文章列表页面使用更长的缓存时间
 */
export const articleListCacheMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 只对文章列表路由应用
  if (req.path === '/api/articles' || req.path === '/api/articles/') {
    const originalSend = res.send.bind(res);
    
    res.send = function(body?: any): express.Response {
      if (typeof body === 'string' || Buffer.isBuffer(body) || (body && typeof body === 'object')) {
        const content = JSON.stringify(body);
        const hash = crypto.createHash('md5').update(content).digest('hex');
        const etag = `"${hash}"`;
        
        res.setHeader('ETag', etag);
        res.setHeader('Last-Modified', new Date().toUTCString());
        
        // 文章列表使用较短的缓存时间，但允许stale-while-revalidate
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        
        const clientETag = req.headers['if-none-match'];
        if (clientETag && clientETag === etag) {
          res.status(304);
          return res.end();
        }
      }
      
      return originalSend(body);
    };
  }
  
  next();
};