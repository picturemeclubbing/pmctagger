// File: /sandbox/database_delivery.js
// Purpose: Isolated Dexie database for sandbox testing (no overlap with production)
import Dexie from 'dexie';

export const dbDelivery = new Dexie('PMC_SocialTagger_Delivery');

dbDelivery.version(1).stores({
  deliveries: '++id, status, createdAt, sentAt, sessionId, customerId'
});

export default dbDelivery;
