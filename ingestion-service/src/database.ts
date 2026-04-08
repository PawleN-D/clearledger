import sqlite3 from 'sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Transaction } from './types.js';

const dbPath = process.env.SQLITE_PATH ?? '/data/reconciliation.db';
mkdirSync(dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath);

export const initDb = async (): Promise<void> =>
  new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS raw_payloads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source TEXT,
          payload TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      );
      db.run(
        `CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          date TEXT,
          amount REAL,
          reference TEXT,
          type TEXT,
          source TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`,
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });
  });

export const insertRawPayload = async (source: string, payload: unknown): Promise<void> =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO raw_payloads(source, payload) VALUES(?, ?)',
      [source, JSON.stringify(payload)],
      (error) => (error ? reject(error) : resolve())
    );
  });

export const insertTransactions = async (transactions: Transaction[]): Promise<void> => {
  await Promise.all(
    transactions.map(
      (tx) =>
        new Promise<void>((resolve, reject) => {
          db.run(
            `INSERT OR REPLACE INTO transactions(id, date, amount, reference, type, source)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [tx.id, tx.date, tx.amount, tx.reference, tx.type, tx.source],
            (error) => (error ? reject(error) : resolve())
          );
        })
    )
  );
};

export const getTransactions = async (): Promise<Transaction[]> =>
  new Promise((resolve, reject) => {
    db.all('SELECT id, date, amount, reference, type, source FROM transactions', (error, rows: Transaction[]) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });
