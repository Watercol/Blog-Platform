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
        // 文章列表：使用协商缓存，每次都向服务器验证，确保列表实时性
        res.setHeader('Cache-Control', 'no-cache');
      } else if (req.path.match(/\/api\/articles\/[^\/]+$/)) {
        // 文章详情：使用协商缓存，确保内容实时性
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        // 其他文章相关API：默认使用协商缓存
        res.setHeader('Cache-Control', 'no-cache');
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
