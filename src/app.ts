import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { listFilesHandler, getMetadataHandler, streamHandler } from './handlers.js';
import { ApiError } from './types.js';

/**
 * Creates and configures the Express application
 */
export function createApp(): Application {
  const app = express();

  // CORS configuration for localhost origins
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (origin === undefined) {
          callback(null, true);
          return;
        }

        if (config.allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'OPTIONS'],
      allowedHeaders: ['Range', 'Content-Type', 'Accept'],
      exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    })
  );

  // Parse JSON bodies
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.get('/api/files', listFilesHandler);
  app.get('/api/metadata/:filename', getMetadataHandler);
  app.get('/api/stream/:filename', streamHandler);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    const error: ApiError = {
      error: 'NOT_FOUND',
      message: 'The requested resource was not found',
      statusCode: 404,
    };
    res.status(404).json(error);
  });

  // Global error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err.message);
    const error: ApiError = {
      error: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
      statusCode: 500,
    };
    res.status(500).json(error);
  });

  return app;
}
