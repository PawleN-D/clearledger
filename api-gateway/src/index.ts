import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import morgan from 'morgan';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

const ingestionBase = process.env.INGESTION_BASE_URL ?? 'http://ingestion-service:8081';
const reconBase = process.env.RECON_BASE_URL ?? 'http://reconciliation-engine:8082';
const cloudflareCacheControl = process.env.CLOUDFLARE_CACHE_CONTROL ?? 'public, max-age=60';

app.use((_req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', cloudflareCacheControl);
  res.setHeader('CF-Cache-Status', 'DYNAMIC');
  res.setHeader('CF-Ray', 'local-dev-placeholder');
  next();
});

const proxy = async (res: Response, requestPromise: Promise<AxiosResponse>): Promise<void> => {
  try {
    const response = await requestPromise;
    res.status(response.status).json(response.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown proxy error';
    res.status(502).json({ error: 'Bad gateway', message });
  }
};

app.post('/upload-file', async (req: Request, res: Response) => {
  await proxy(res, axios.post(`${ingestionBase}/upload-file`, req.body));
});

app.post('/ingest-api', async (req: Request, res: Response) => {
  await proxy(res, axios.post(`${ingestionBase}/ingest-api`, req.body));
});

app.get('/reconciliation-results', async (_req: Request, res: Response) => {
  await proxy(res, axios.get(`${reconBase}/reconciliation-results`));
});

app.get('/anomalies', async (_req: Request, res: Response) => {
  await proxy(res, axios.get(`${reconBase}/anomalies`));
});

const port = Number(process.env.API_GATEWAY_PORT ?? 8080);
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
