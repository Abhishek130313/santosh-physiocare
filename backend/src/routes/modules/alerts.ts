import { Router } from 'express';
import { authenticate, requireRole } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import cron from 'node-cron';

export const router = Router();

let latestAlerts: any[] = [];

async function scanAlerts() {
  const threshold = Number(process.env.ALERT_THRESHOLD_COUNT || 25);
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE(o.district, 'Unknown') as district, COUNT(*)::int as cnt
     FROM "Observation" o
     JOIN "Encounter" e ON e.id = o."encounterId"
     JOIN "Patient" p ON p.id = e."patientId"
     JOIN "Consent" c ON c."patientId" = p.id
     WHERE o.code = 'fever' AND o."createdAt" >= $1 AND c."allowAnalytics" = true
     GROUP BY o.district
     ORDER BY cnt DESC
     LIMIT 10`, since
  );
  latestAlerts = rows
    .filter(r => r.cnt >= threshold)
    .map(r => ({ id: `${r.district}-${Date.now()}`, type: 'SPIKE', district: r.district, count: r.cnt, message: `Fever spike in ${r.district}` }));
}

cron.schedule(process.env.ALERT_SCAN_INTERVAL_CRON || '*/5 * * * *', scanAlerts);

router.get('/', authenticate, requireRole(['PUBLIC_HEALTH', 'ADMIN', 'CLINICIAN']), async (_req, res) => {
  res.json({ alerts: latestAlerts });
});

scanAlerts().catch(() => {});