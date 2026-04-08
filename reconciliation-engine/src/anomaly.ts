import axios from 'axios';
import { ReconciliationResult } from './types.js';

interface AIAnomalyResponse {
  suspiciousTransactionIds: string[];
}

export const detectAnomalies = async (results: ReconciliationResult[]): Promise<ReconciliationResult[]> => {
  const unmatched = results.filter((result) => result.status === 'unmatched');

  if (unmatched.length === 0) {
    return results;
  }

  const apiKey = process.env.OPENAI_API_KEY ?? 'sk-free-placeholder';
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  try {
    const response = await axios.post<AIAnomalyResponse>(
      `${baseUrl}/reconciliation/anomaly-detect`,
      {
        // NOTE: replace with compatible free-tier endpoint payload schema.
        transactions: unmatched.map((item) => item.transaction)
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    const flagged = new Set(response.data.suspiciousTransactionIds);
    return results.map((result) => {
      if (flagged.has(result.transaction.id)) {
        return {
          ...result,
          status: 'suspicious',
          reason: 'Flagged by AI free-tier endpoint',
          confidence: 0.65
        };
      }

      return result;
    });
  } catch (error: unknown) {
    console.error('[anomaly] AI endpoint failed; fallback heuristic applied', error);
    return results.map((result) => {
      if (result.status === 'unmatched' && Math.abs(result.transaction.amount) > 10_000) {
        return {
          ...result,
          status: 'suspicious',
          reason: 'High-value unmatched transaction (fallback)',
          confidence: 0.55
        };
      }

      return result;
    });
  }
};
