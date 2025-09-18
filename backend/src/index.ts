import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';
import { router as apiRouter } from './routes/index';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({ origin: process.env.ALLOW_ORIGIN?.split(',') || '*' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/v1', apiRouter);

const port = Number(process.env.PORT || 4000);
const enableTls = String(process.env.ENABLE_TLS || 'false') === 'true';

if (enableTls) {
  const key = fs.readFileSync(process.env.TLS_KEY_PATH!);
  const cert = fs.readFileSync(process.env.TLS_CERT_PATH!);
  https.createServer({ key, cert }, app).listen(port, () => {
    console.log(`HTTPS server listening on ${port}`);
  });
} else {
  http.createServer(app).listen(port, () => {
    console.log(`HTTP server listening on ${port}`);
  });
}