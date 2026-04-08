import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios from 'axios';
import morgan from 'morgan';
import { stringify } from 'csv-stringify/sync';

dotenv.config();

interface LedgerRecord {
  id: string;
  date: string;
  amount: number;
  reference: string;
  status: string;
  source: string;
}

const app = express();
app.use(express.json());
app.use(morgan('combined'));

const reconBase = process.env.RECON_BASE_URL ?? 'http://reconciliation-engine:8082';

const buildLedger = async (): Promise<LedgerRecord[]> => {
  const response = await axios.get(`${reconBase}/reconciliation-results`);
  return response.data.map((entry: any) => ({
    id: entry.transaction.id,
    date: entry.transaction.date,
    amount: entry.transaction.amount,
    reference: entry.transaction.reference,
    status: entry.status,
    source: entry.transaction.source
  }));
};

app.get('/daily-ledger.json', async (_req: Request, res: Response) => {
  const records = await buildLedger();
  const summary = {
    matched: records.filter((record) => record.status === 'matched').length,
    unmatched: records.filter((record) => record.status === 'unmatched').length,
    suspicious: records.filter((record) => record.status === 'suspicious').length
  };

  res.status(200).json({ date: new Date().toISOString().slice(0, 10), summary, records });
});

app.get('/daily-ledger.csv', async (_req: Request, res: Response) => {
  const records = await buildLedger();
  const csv = stringify(records, { header: true });
  res.setHeader('Content-Type', 'text/csv');
  res.status(200).send(csv);
});

app.get('/export/accounting', async (_req: Request, res: Response) => {
  const records = await buildLedger();
  res.status(200).json({ provider: 'generic-accounting-export', records });
});

const port = Number(process.env.REPORTING_SERVICE_PORT ?? 8083);
app.listen(port, () => {
  console.log(`Reporting service listening on port ${port}`);
});
