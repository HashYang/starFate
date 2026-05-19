import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/starfate',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@starfate.app',
  },

  app: {
    maxFreeReadingsPerDay: parseInt(process.env.MAX_FREE_READINGS_PER_DAY || '3', 10),
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
};
