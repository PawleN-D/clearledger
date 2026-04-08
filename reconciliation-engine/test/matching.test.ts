import { describe, expect, it } from 'vitest';
import { reconcileTransactions } from '../src/matching.js';

describe('reconcileTransactions', () => {
  it('matches transactions by deterministic keys', () => {
    const results = reconcileTransactions([
      { id: '1', date: '2026-01-01', amount: 100, reference: 'INV-1', type: 'credit', source: 'a' },
      { id: '2', date: '2026-01-01', amount: -100, reference: 'INV-1', type: 'debit', source: 'b' }
    ]);

    expect(results[0]?.status).toBe('matched');
  });
});
