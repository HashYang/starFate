import express from 'express';
import cors from 'cors';
import { config } from './config';
import { handleError } from './utils/errors';

// Routes
import authRoutes from './routes/auth';
import readingRoutes from './routes/readings';
import archiveRoutes from './routes/archive';
import userRoutes from './routes/user';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({ origin: config.app.corsOrigin }));
app.use(express.json({ limit: '10kb' }));

// Request logging
if (config.isDev) {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/readings', readingRoutes);
app.use('/api/v1/archive', archiveRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const { statusCode, body } = handleError(err);
  res.status(statusCode).json(body);
});

// Start server
app.listen(config.port, () => {
  console.log(`✨ 星命后端服务启动成功`);
  console.log(`📡 地址: http://localhost:${config.port}`);
  console.log(`🔧 环境: ${config.nodeEnv}`);
  console.log(`📋 API 文档: http://localhost:${config.port}/health`);
});

export default app;
