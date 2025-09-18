import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  // users
  const users = [
    { email: 'clinician@example.com', password: 'password', role: 'CLINICIAN' },
    { email: 'kiosk@example.com', password: 'password', role: 'KIOSK' },
    { email: 'admin@example.com', password: 'password', role: 'ADMIN' },
    { email: 'ph@example.com', password: 'password', role: 'PUBLIC_HEALTH' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({ where: { email: u.email }, create: { email: u.email, password: hash, role: u.role as any }, update: {} });
  }

  // generate ~2000 patients
  const districts = ['Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha','Kottayam','Idukki','Ernakulam','Thrissur','Palakkad','Malappuram','Kozhikode','Wayanad','Kannur','Kasaragod'];
  const languages = ['en','hi','ml'];
  const batchSize = 2000;
  for (let i = 0; i < batchSize; i++) {
    const firstName = `Migrant${i}`;
    const lastName = `Worker${i}`;
    const district = districts[i % districts.length];
    const taluk = `Taluk${(i % 10) + 1}`;
    const language = languages[i % languages.length];
    const patient = await prisma.patient.create({ data: { firstName, lastName, gender: (i % 2 === 0 ? 'male' : 'female'), dob: new Date(1980 + (i % 30), (i % 12), (i % 28) + 1), phone: `9${(100000000 + i).toString().padStart(9,'0')}`, district, taluk, language } });
    await prisma.consent.create({ data: { patientId: patient.id, text: 'General consent', allowClinical: true, allowAnalytics: i % 7 !== 0 } });
    if (i % 3 === 0) {
      const enc = await prisma.encounter.create({ data: { patientId: patient.id, type: 'OPD', notes: 'Seed encounter' } });
      await prisma.observation.create({ data: { encounterId: enc.id, code: 'fever', value: (37 + (i % 4)).toString(), unit: 'C', district, taluk } });
    }
  }

  console.log('Seed completed');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });