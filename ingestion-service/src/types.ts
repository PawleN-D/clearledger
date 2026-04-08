export type TransactionType = 'credit' | 'debit' | 'unknown';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  reference: string;
  type: TransactionType;
  source: string;
}

export interface UploadFileRequest {
  fileName: string;
  mimeType?: string;
  contentBase64: string;
}
