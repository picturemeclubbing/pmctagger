import Dexie from 'dexie';
export const db = new Dexie('PMC_SocialTagger');
db.version(6).stores({
  photoSessions: 'sessionId, createdAt, hasTags, currentVersion',
  customers: '++id, phone, email, name, createdAt',
  settings: 'key',
  // Optimized schema with index on status
  deliveries_simple: '++id, status, sessionId, customerId, method, createdAt'
});
export default db;
