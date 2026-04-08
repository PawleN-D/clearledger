import { ReconciliationResult, Transaction } from './types.js';

const normalizeDate = (date: string): string => new Date(date).toISOString().slice(0, 10);

export const reconcileTransactions = (transactions: Transaction[]): ReconciliationResult[] => {
  const used = new Set<string>();
  const results: ReconciliationResult[] = [];

  for (const tx of transactions) {
    if (used.has(tx.id)) {
      continue;
    }

    const match = transactions.find((candidate) => {
      if (candidate.id === tx.id || used.has(candidate.id)) {
        return false;
      }

      const amountMatches = Math.abs(candidate.amount) === Math.abs(tx.amount);
      const dateMatches = normalizeDate(candidate.date) === normalizeDate(tx.date);
      const referenceMatches = candidate.reference === tx.reference;
      const oppositeType = candidate.type !== tx.type;
      return amountMatches && dateMatches && referenceMatches && oppositeType;
    });

    if (match) {
      used.add(tx.id);
      used.add(match.id);
      results.push({ transaction: tx, matchedWith: match, status: 'matched' });
      continue;
    }

    used.add(tx.id);
    results.push({ transaction: tx, status: 'unmatched', reason: 'No deterministic match found' });
  }

  return results;
};
