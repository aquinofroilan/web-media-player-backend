import request from 'supertest';
import { createApp } from '../src/app.js';
import type { Application } from 'express';

describe('API Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/files', () => {
    it('should return a list of files', async () => {
      const response = await request(app).get('/api/files');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('files');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.files)).toBe(true);
    });
  });

  describe('GET /api/metadata/:filename', () => {
    it('should return 404 for non-existent file', async () => {
      const response = await request(app).get('/api/metadata/nonexistent.mp4');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
    });
  });

  describe('GET /api/stream/:filename', () => {
    it('should return 404 for non-existent file', async () => {
      const response = await request(app).get('/api/stream/nonexistent.mp4');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown/path');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'NOT_FOUND');
    });
  });

  describe('CORS', () => {
    it('should allow localhost origin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should handle non-localhost origin with error', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://evil.com');
      // CORS error results in 500 from our error handler
      expect(response.status).toBe(500);
    });
  });
});
