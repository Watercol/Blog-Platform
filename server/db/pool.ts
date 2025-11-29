import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import type { DatabaseConfig } from '../config/env';

export type DatabasePool = Pool;

export const createPool = (config: DatabaseConfig): DatabasePool => {
  const options: PoolOptions = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    namedPlaceholders: true
  };

  return mysql.createPool(options);
};
