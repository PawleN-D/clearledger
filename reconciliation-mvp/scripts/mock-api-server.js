import express from 'express';

const app = express();
app.get('/transactions', (_req, res) => {
  res.json([
    { id: 'm1', date: '2026-04-01', amount: 125, reference: 'BILL-44', type: 'credit', source: 'mock-api' },
    { id: 'm2', date: '2026-04-01', amount: -125, reference: 'BILL-44', type: 'debit', source: 'mock-api' }
  ]);
});

app.listen(9090, () => console.log('Mock API at http://localhost:9090/transactions'));
