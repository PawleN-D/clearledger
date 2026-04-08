import { parse } from 'csv-parse/sync';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from './types.js';

const normalizeTransaction = (input: Partial<Transaction>, source: string): Transaction => ({
  id: input.id ?? uuidv4(),
  date: input.date ?? new Date().toISOString().slice(0, 10),
  amount: Number(input.amount ?? 0),
  reference: input.reference ?? 'N/A',
  type: input.type ?? 'unknown',
  source
});

export const parseCsvTransactions = (content: string, source: string): Transaction[] => {
  const records = parse(content, { columns: true, skip_empty_lines: true }) as Partial<Transaction>[];
  return records.map((record) => normalizeTransaction(record, source));
};

export const parsePdfTransactions = async (buffer: Buffer, source: string): Promise<Transaction[]> => {
  const parsed = await pdfParse(buffer);
  const lines: string[] = parsed.text
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => Boolean(line));

  return lines
    .map((line: string) => {
      const [date, amount, reference, type] = line.split(',');
      if (!amount) {
        return null;
      }

      return normalizeTransaction({
        date,
        amount: Number(amount),
        reference,
        type: (type as Transaction['type']) ?? 'unknown'
      }, source);
    })
    .filter((tx: Transaction | null): tx is Transaction => tx !== null);
};

export const parseJsonTransactions = (payload: unknown, source: string): Transaction[] => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((entry) => normalizeTransaction(entry as Partial<Transaction>, source));
};
