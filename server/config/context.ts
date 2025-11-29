import type { Pool } from 'mysql2/promise';
import { createPool } from '../db/pool';
import type { AppConfig } from './env';

export interface AppDependencies {
  pool: Pool;
}

export const createDependencies = async (config: AppConfig): Promise<AppDependencies> => {
  const pool = createPool(config.database);
  return {
    pool
  };
};

export const destroyDependencies = async (deps: AppDependencies): Promise<void> => {
  await deps.pool.end();
};
