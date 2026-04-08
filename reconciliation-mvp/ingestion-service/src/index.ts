import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import axios from 'axios';
import morgan from 'morgan';
import { getTransactions, initDb, insertRawPayload, insertTransactions } from './database.js';
import { logError } from './logger.js';
import { parseCsvTransactions, parseJsonTransactions, parsePdfTransactions } from './parsers.js';
import { UploadFileRequest } from './types.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(morgan('combined'));

app.post('/upload-file', async (req: Request<unknown, unknown, UploadFileRequest>, res: Response) => {
  try {
    const { fileName, contentBase64 } = req.body;
    const buffer = Buffer.from(contentBase64, 'base64');
    const source = `file:${fileName}`;

    let transactions = [];
    if (fileName.endsWith('.csv')) {
      transactions = parseCsvTransactions(buffer.toString('utf8'), source);
    } else if (fileName.endsWith('.pdf')) {
      transactions = await parsePdfTransactions(buffer, source);
    } else if (fileName.endsWith('.json')) {
      transactions = parseJsonTransactions(JSON.parse(buffer.toString('utf8')), source);
    } else {
      return res.status(400).json({ error: 'Unsupported file format' });
    }

    await insertRawPayload(source, { fileName, size: buffer.length });
    await insertTransactions(transactions);
    return res.status(201).json({ ingested: transactions.length, transactions });
  } catch (error: unknown) {
    logError('upload-file', error);
    return res.status(500).json({ error: 'Failed to ingest file' });
  }
});

app.post('/ingest-api', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body as { endpoint: string };
    const response = await axios.get(endpoint);
    const source = `api:${endpoint}`;
    const transactions = parseJsonTransactions(response.data, source);

    await insertRawPayload(source, response.data);
    await insertTransactions(transactions);
    return res.status(201).json({ ingested: transactions.length, transactions });
  } catch (error: unknown) {
    logError('ingest-api', error);
    return res.status(500).json({ error: 'Failed to ingest API payload' });
  }
});

app.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const transactions = await getTransactions();
    return res.status(200).json(transactions);
  } catch (error: unknown) {
    logError('transactions', error);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

const port = Number(process.env.INGESTION_SERVICE_PORT ?? 8081);

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Ingestion service listening on port ${port}`);
    });
  })
  .catch((error: unknown) => {
    logError('initDb', error);
    process.exit(1);
  });
