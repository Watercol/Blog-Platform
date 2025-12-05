import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { appConfig } from '../config/env';
import { createPool } from '../db/pool';

//初始化数据库
const runMigrations = async () => {
  const pool = createPool(appConfig.database);
  const connection = await pool.getConnection();

  //按序执行sql文件
  try {
    const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
    const files = (await globby('*.sql', {
      cwd: migrationsDir,
      absolute: true
    })).sort();

    for (const file of files) {
      const sql = await fs.readFile(file, 'utf-8'); 
      console.log(`Running migration: ${path.basename(file)}`);
      await connection.query(sql);
    }

    console.log('Migrations completed successfully');
  } finally {
    connection.release();
    await pool.end();
  }
};

runMigrations().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration run failed', error);
  process.exit(1);
});
