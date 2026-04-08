# AI Reconciliation-as-a-Service MVP (Node.js + TypeScript)

This repository is now structured with **ClearLedger as the root** (no extra nested `reconciliation-mvp/` folder).

## Services

- **api-gateway** (Express + TypeScript)
  - `POST /upload-file`
  - `POST /ingest-api`
  - `GET /reconciliation-results`
  - `GET /anomalies`
  - Adds Cloudflare-style response headers for caching/proxy compatibility.
- **ingestion-service**
  - Parses CSV (`csv-parse`), PDF (`pdf-parse`), JSON, and API payloads (`axios`).
  - Normalizes to `{ id, date, amount, reference, type, source }`.
  - Stores raw + normalized records in SQLite.
- **reconciliation-engine**
  - Deterministic rules: amount + date + reference + opposite type.
  - Flags unmatched transactions.
  - AI anomaly detection integration with free-tier placeholder endpoint + confidence score.
- **reporting-service**
  - `GET /daily-ledger.json`
  - `GET /daily-ledger.csv`
  - `GET /export/accounting`
- **frontend** (optional)
  - React + Tailwind dashboard for quick visualization.

## Project structure

```text
/clearledger
├─ api-gateway/
├─ ingestion-service/
├─ reconciliation-engine/
├─ reporting-service/
├─ frontend/
├─ shared/
├─ scripts/
├─ docker-compose.yml
├─ package.json
└─ README.md
```

## Installing dependencies

You have two options:

### 1) Install everything from the repo root (recommended)

```bash
npm install
```

Because root `package.json` uses npm workspaces, this installs dependencies for all services in one command.

### 2) Install a single service only

```bash
npm install -w ingestion-service
npm install -w reconciliation-engine
```

## Quick start

1. Copy environment defaults if needed:
   ```bash
   cp .env.example .env
   ```
2. Start all containers:
   ```bash
   docker compose up --build
   ```
3. APIs:
   - Gateway: `http://localhost:8080`
   - Reporting: `http://localhost:8083`
   - Frontend: `http://localhost:5173`

## Example ingestion

### CSV upload

```bash
curl -X POST http://localhost:8080/upload-file \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg f \"sample-transactions.csv\" --arg b \"$(base64 -w0 scripts/sample-transactions.csv)\" '{fileName:$f,contentBase64:$b}')"
```

### JSON upload

```bash
curl -X POST http://localhost:8080/upload-file \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg f \"sample-transactions.json\" --arg b \"$(base64 -w0 scripts/sample-transactions.json)\" '{fileName:$f,contentBase64:$b}')"
```

### API ingestion

```bash
node scripts/mock-api-server.js
curl -X POST http://localhost:8080/ingest-api \
  -H 'Content-Type: application/json' \
  -d '{"endpoint":"http://host.docker.internal:9090/transactions"}'
```

## Cloudflare deployment readiness

For Cloudflare routing, put the **api-gateway** behind Cloudflare Tunnel / Load Balancer.

- `Cache-Control` is set in the gateway.
- Placeholder Cloudflare headers are attached for local testing.
- For production, replace placeholder headers with actual Cloudflare edge metadata.

## AI anomaly detection notes

`reconciliation-engine/src/anomaly.ts` contains placeholder integration:

- Default key: `OPENAI_API_KEY=sk-free-placeholder`
- Default base URL: `https://api.openai.com/v1`
- Endpoint: `/reconciliation/anomaly-detect` (example placeholder)

> Replace the endpoint + payload with your current free-tier-compatible model/provider. Fallback heuristics are applied if AI endpoint fails.

## Tests

Run all workspace tests:

```bash
npm test
```

Or run service tests only:

```bash
npm test -w reconciliation-engine
```

## Logging & monitoring

- Services use `morgan` for request logs.
- Ingestion and AI errors are logged with clear service scopes.
- Extend with Prometheus/Grafana or Cloudflare Analytics in production.
