## Physiotherapy Backend API (Node.js + Express + MongoDB)

Production-ready backend for Dr. Santosh Bilwal. Provides REST APIs for appointments, reviews, services, and contact forms with admin authentication, validation, logging, email notifications, and Swagger docs.

### Tech Stack
- Node.js, Express
- MongoDB with Mongoose
- JWT auth
- Validation via Joi
- Logging via Winston + Morgan
- Security via Helmet, Rate Limiting, Mongo Sanitize, XSS Clean
- Swagger for API docs

### Getting Started
1. Copy `.env.example` to `.env` and configure values (MongoDB, JWT, SMTP, admin credentials)
2. Install dependencies:
```bash
npm install
```
3. Run in development:
```bash
npm run dev
```
4. Open docs: `http://localhost:4000/api/docs`

### Run with Docker
```bash
cp .env.example .env
docker compose up --build
```
API at `http://localhost:4000`, Swagger at `http://localhost:4000/api/docs`.

### Scripts
- `npm run dev`: Start with nodemon
- `npm start`: Start server

### Environment Variables
See `.env.example` for all variables (Mongo URI, JWT, Rate limiting, SMTP, Admin bootstrap).

### API Overview
- Auth: `POST /api/auth/login`
- Appointments: `POST /api/appointments` (public), `GET /api/appointments` (admin), `PATCH /api/appointments/:id/status` (admin)
- Reviews: `POST /api/reviews` (public), `GET /api/reviews/public` (public), `GET /api/reviews` (admin), `PATCH /api/reviews/:id/approve` (admin), `DELETE /api/reviews/:id` (admin)
- Services: `GET /api/services/public` (public), `GET/POST/PUT/DELETE /api/services` (admin)
- Contacts: `POST /api/contacts` (public), `GET /api/contacts` (admin)
- Admin Dashboard: `GET /api/admin/dashboard` (admin)

### Deployment
- Works on Render/Heroku: set environment variables, define start command `npm start` and build step `npm install`
- For Vercel Serverless functions, consider Next.js API routes instead of this Express server

### Notes
- Admin user is auto-created on first start if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are provided.
- Emails are best-effort and failures do not block requests. Use Mailtrap or a real SMTP provider.

# santosh-physiocare