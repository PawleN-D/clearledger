export type TransactionType = 'credit' | 'debit' | 'unknown';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  type: TransactionType;
  source: string;
}

export interface ReconciliationResult {
  transaction: Transaction;
  matchedWith?: Transaction;
  status: 'matched' | 'unmatched' | 'suspicious';
  reason?: string;
  confidence?: number;
}
