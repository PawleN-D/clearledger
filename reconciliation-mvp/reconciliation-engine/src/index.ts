import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios from 'axios';
import morgan from 'morgan';
import { reconcileTransactions } from './matching.js';
import { detectAnomalies } from './anomaly.js';
import { ReconciliationResult, Transaction } from './types.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan('combined'));

const ingestionBase = process.env.INGESTION_BASE_URL ?? 'http://ingestion-service:8081';

const buildResults = async (): Promise<ReconciliationResult[]> => {
  const txResponse = await axios.get<Transaction[]>(`${ingestionBase}/transactions`);
  const reconciled = reconcileTransactions(txResponse.data);
  return detectAnomalies(reconciled);
};

app.get('/reconciliation-results', async (_req: Request, res: Response) => {
  try {
    const results = await buildResults();
    return res.status(200).json(results);
  } catch (error: unknown) {
    console.error('[reconciliation-results]', error);
    return res.status(500).json({ error: 'Failed to produce reconciliation results' });
  }
});

app.get('/anomalies', async (_req: Request, res: Response) => {
  try {
    const results = await buildResults();
    return res.status(200).json(results.filter((result) => result.status === 'suspicious'));
  } catch (error: unknown) {
    console.error('[anomalies]', error);
    return res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

const port = Number(process.env.RECON_ENGINE_PORT ?? 8082);
app.listen(port, () => {
  console.log(`Reconciliation engine listening on port ${port}`);
});
