import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import type { AppConfig } from './config/env';
import type { AppDependencies } from './config/context';
import { createApiRouter } from './api/createApiRouter';
import { createSsrMiddleware } from './ssr/ssrMiddleware';
import { errorHandler } from './errorMiddleware/errorHandler';
import { staticCacheMiddleware } from './cacheMiddleware/staticCacheMiddleware';
import { articleCacheMiddleware } from './cacheMiddleware/articleCacheMiddleware';

export const createApp = async (config: AppConfig, deps: AppDependencies) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  //服务静态资源（应用缓存策略）
  if (config.env === 'production') {
    // 使用静态缓存中间件服务静态资源
    app.use('/assets', staticCacheMiddleware);
    
    // 其他静态文件也使用缓存
    const clientDir = path.resolve(process.cwd(), 'dist/client');
    app.use(express.static(clientDir, { 
      index: false,
      maxAge: '1h' // 非assets目录的静态文件缓存1小时
    }));
  } else {
    // 开发环境也启用基础静态文件服务
    const clientDir = path.resolve(process.cwd(), 'dist/client');
    app.use('/assets', express.static(path.join(clientDir, 'assets')));
    app.use(express.static(clientDir, { index: false }));
  }

  //应用文章API缓存中间件
  app.use(articleCacheMiddleware);
  
  //注册API路由
  app.use('/api', createApiRouter(deps));

  //注册SSR中间件，用于服务端渲染React页面
  const ssrMiddleware = await createSsrMiddleware(config, deps);
  app.use(ssrMiddleware);

  app.use(errorHandler);

  return app;
};