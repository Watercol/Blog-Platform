import type { Pool } from 'mysql2/promise';
import { createPool } from '../db/pool';
import type { AppConfig } from './env';
import { RedisCache } from '../cache/redisCache';

export interface AppDependencies {
  pool: Pool;
  cache: RedisCache;
}

export const createDependencies = async (config: AppConfig): Promise<AppDependencies> => {
  const pool = createPool(config.database);
  const cache = new RedisCache(config.redis?.url);
  
  console.log('Database pool created');
  console.log('Redis cache initialized');
  
  return {
    pool,
    cache
  };
};

export const destroyDependencies = async (deps: AppDependencies): Promise<void> => {
  await deps.pool.end();
  await deps.cache.disconnect();
  console.log('Database pool closed');
  console.log('Redis cache disconnected');
};