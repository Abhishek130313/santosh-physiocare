import { openDB } from 'idb'

const DB_NAME = 'dhrms-offline'
const STORE = 'queue'

async function getDb() {
  return openDB(DB_NAME, 1, { upgrade(db) { db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }) } })
}

export type OfflineOp = { type: 'enroll'|'encounter'; payload: any }

export async function enqueue(op: OfflineOp) {
  const db = await getDb()
  await db.add(STORE, { ...op, createdAt: Date.now() })
}

export async function listQueue() {
  const db = await getDb();
  return db.getAll(STORE)
}

export async function clearQueue() {
  const db = await getDb();
  const items = await db.getAllKeys(STORE)
  for (const k of items) await db.delete(STORE, k)
}