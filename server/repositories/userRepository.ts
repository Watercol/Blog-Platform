import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export interface User {
  id: number;
  displayName: string;
  email: string;
}

export const findUserByEmail = async (pool: Pool, email: string): Promise<User | null> => {
  const [rows] = await pool.query<Array<User & RowDataPacket>>(
    'SELECT id, display_name AS displayName, email FROM users WHERE email = :email',
    { email }
  );

  return rows[0] || null;
};

export const createUser = async (pool: Pool, displayName: string, email: string): Promise<number> => {
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (display_name, email) VALUES (:displayName, :email)',
    { displayName, email }
  );

  return result.insertId;
};

export const findOrCreateUser = async (
  pool: Pool,
  displayName: string,
  email: string
): Promise<number> => {
  const existing = await findUserByEmail(pool, email);
  if (existing) {
    return existing.id;
  }

  return createUser(pool, displayName, email);
};
