import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';

export const app = express();
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === env.CORS_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem não permitida pelo CORS.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'petlife-api' }));
app.use('/api/v1', routes);
app.use(notFound);
app.use(errorHandler);
