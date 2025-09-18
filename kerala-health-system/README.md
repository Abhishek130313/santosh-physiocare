# Kerala Digital Health Record Management System

A comprehensive, multilingual, offline-capable Digital Health Record Management System for migrant workers in Kerala, India.

## Features

- **Multilingual Support**: English, Hindi, Malayalam
- **Mobile-First Design**: Responsive, PWA-enabled
- **Offline Capability**: IndexedDB + sync functionality
- **FHIR Compliance**: Standard healthcare data formats
- **QR Smart Cards**: Printable health cards with QR codes
- **Secure & Auditable**: Encrypted storage, immutable audit logs
- **Government Integration**: ABHA stubs, IDSP compatibility

## Architecture

```
├── frontend/          # React + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + TypeScript
├── database/          # PostgreSQL schema + migrations
├── infrastructure/    # Docker + Kubernetes configs
├── seed/             # Sample data generation
├── tests/            # Unit + integration + E2E tests
├── docs/             # API docs + runbooks
└── assets/           # Images, logos, design assets
```

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repo-url>
   cd kerala-health-system
   cp .env.example .env
   ```

2. **Run with Docker**
   ```bash
   docker-compose up --build -d
   ```

3. **Seed Data**
   ```bash
   ./seed/seed.sh
   ```

4. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - API Docs: http://localhost:4000/docs
   - Database Admin: http://localhost:8080

5. **Run Demo**
   ```bash
   ./tests/run_e2e.sh
   ```

## Services

- **Frontend**: React SPA with PWA capabilities
- **Backend**: REST API with FHIR resources
- **Database**: PostgreSQL with audit logging
- **Object Storage**: MinIO (S3-compatible)
- **Cache**: Redis for sessions
- **Queue**: Optional Kafka for analytics

## Security & Compliance

- TLS encryption for all endpoints
- JWT + OAuth2 authentication
- Role-based access control (RBAC)
- Consent management with patient control
- Encrypted file storage
- Immutable audit trails

## Government Integration

- ABHA (Ayushman Bharat Health Account) integration stubs
- IDSP (Integrated Disease Surveillance Programme) compatibility
- Kerala State Health Department workflows
- Government of India digital health standards

## Development

See individual component READMEs:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Database Schema](./database/README.md)
- [Deployment Guide](./infrastructure/README.md)

## License

Government of Kerala & Health Department Pilot Project