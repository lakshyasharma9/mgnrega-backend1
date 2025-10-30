import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors';
import districtRoutes from './routes/districtRoutes';
import connectDB from './config/database';
import dataSyncService from './services/dataSync';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// ✅ Required when deploying behind Render / Nginx
app.set('trust proxy', 1);

// ✅ Security & performance middlewares
app.use(helmet());
app.use(compression());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));

// ✅ Routes
app.use('/api', districtRoutes);

// ✅ Health check (for Render)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// ✅ 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Initialize database and services (but don’t start server here)
export async function initApp() {
  try {
    await connectDB();
    console.log('✅ Database connected successfully');

    dataSyncService.startScheduledSync();
    console.log('✅ Data sync service started');

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    process.exit(1);
  }
}

export default app;
