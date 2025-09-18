### Runbook

- Copy env: `cp .env.example .env`
- Generate certs (optional): `bash scripts/gen_certs.sh`
- Start services (with Docker): `docker-compose up --build -d`
- Seed: `./seed/seed.sh`
- Frontend: http://localhost:3000
- Backend Swagger: http://localhost:4000/docs

Demo accounts:
- clinician@example.com / password
- kiosk@example.com / password
- admin@example.com / password
- ph@example.com / password