import { describe, expect, it } from 'vitest';
import { detectAnomalies } from '../src/anomaly.js';

describe('detectAnomalies', () => {
  it('falls back to heuristic when AI endpoint is unavailable', async () => {
    const output = await detectAnomalies([
      {
        transaction: {
          id: 'x1',
          date: '2026-01-01',
          amount: 25000,
          reference: 'WIRE-77',
          type: 'debit',
          source: 'api'
        },
        status: 'unmatched',
        reason: 'No deterministic match found'
      }
    ]);

    expect(output[0]?.status).toBe('suspicious');
    expect(output[0]?.confidence).toBeGreaterThan(0.5);
  });
});
