import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .preprocess((value) => (value ? Number(value) : 5174), z.number().int().positive())
    .default(5174),
  MYSQL_HOST: z.string().default('127.0.0.1'),
  MYSQL_PORT: z
    .preprocess((value) => (value ? Number(value) : 3306), z.number().int().positive())
    .default(3306),
  MYSQL_USER: z.string().default('blog_user'),
  MYSQL_PASSWORD: z.string().default('1234567890'),
  MYSQL_DATABASE: z.string().default('blog_platform'),
  MYSQL_CONNECTION_LIMIT: z
    .preprocess((value) => (value ? Number(value) : undefined), z.number().int().positive())
    .default(10),
  REDIS_URL: z.string().default('redis://localhost:6379')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}
else {
  // eslint-disable-next-line no-console
  console.log('Environment configuration loaded successfully');
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
}

export interface RedisConfig {
  url: string;
}

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  http: {
    port: number;
  };
  database: DatabaseConfig;
  redis?: RedisConfig;
}

export const appConfig: AppConfig = {
  env: parsed.data.NODE_ENV,
  http: {
    port: parsed.data.PORT
  },
  database: {
    host: parsed.data.MYSQL_HOST,
    port: parsed.data.MYSQL_PORT,
    user: parsed.data.MYSQL_USER,
    password: parsed.data.MYSQL_PASSWORD,
    database: parsed.data.MYSQL_DATABASE,
    connectionLimit: parsed.data.MYSQL_CONNECTION_LIMIT
  },
  redis: {
    url: parsed.data.REDIS_URL
  }
};

export const isProd = parsed.data.NODE_ENV === 'production';
export const isDev = parsed.data.NODE_ENV === 'development';