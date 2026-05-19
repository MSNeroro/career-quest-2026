import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-change-me',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'career_quest_2026',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  },
};
