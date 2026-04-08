import { useEffect, useState } from 'react';

interface Result {
  transaction: { id: string; reference: string; amount: number; date: string };
  status: string;
}

export const App = (): JSX.Element => {
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    fetch('/api/reconciliation-results')
      .then((res) => res.json())
      .then(setResults)
      .catch(console.error);
  }, []);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-bold">AI Reconciliation Dashboard</h1>
      <div className="rounded bg-white p-4 shadow">
        {results.map((result) => (
          <div key={result.transaction.id} className="border-b py-2">
            <div>{result.transaction.reference}</div>
            <div className="text-sm text-slate-600">
              ${result.transaction.amount} • {result.status} • {result.transaction.date}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
