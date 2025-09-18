## Digital Health Record Management System (Kerala Migrant Workers) – Prototype

Professional, secure, offline-capable SPA + API + DB + storage with analytics and audit.

### Quick start

```bash
git clone <repo>
cd <repo>
cp .env.example .env
bash scripts/gen_certs.sh  # optional TLS
docker-compose up --build -d
./seed/seed.sh
# Open
# Frontend: http://localhost:3000
# Backend Swagger: http://localhost:4000/docs
```

Run E2E demo:

```bash
./tests/run_e2e.sh
```

### Services
- **Frontend**: React + Vite + Tailwind (TypeScript), PWA, i18n (en/hi/ml), IndexedDB/PouchDB
- **Backend**: Node.js + Express (TypeScript), Prisma/Postgres, MinIO, JWT + OAuth2 mock, Swagger
- **Database**: PostgreSQL + Prisma migrations and seed (~2k synthetic migrant records)
- **Storage**: MinIO (S3 compatible) with AES-GCM encryption-at-rest
- **Audit**: Append-only ledger with hash chain and verification script
- **Analytics**: Simple spike detection generating alerts for dashboard

See `docs/` for FHIR profile mapping, runbook, and admin manual.