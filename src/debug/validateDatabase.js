/**
 * Phase 8.2 Dexie v9 Validator + Auto-Rebuild Utility
 * Detects old string keys or schema mismatch and resets DB automatically.
 */
import db from '../services/database';

export async function validateDatabaseSchema() {
  try {
    const sample = await db.customers.limit(1).toArray();
    if (sample.length && typeof sample[0].id !== 'number') {
      console.warn('[DB] ⚠️ Legacy schema detected – rebuilding Dexie v9 database...');
      await db.delete();
      await db.open();
      console.log('[DB] ✅ Database reinitialized with Dexie v9 schema.');
    } else {
      console.log('[DB] ✅ Schema validation passed – Dexie v9 active.');
    }
  } catch (err) {
    console.error('[DB] ❌ Validation error:', err);
  }
}

export async function resetCRMDatabase() {
  console.warn('[DB] ⚠️ Manual reset triggered from Debug Panel...');
  try {
    await db.delete();
    await db.open();
    console.log('[DB] ✅ Database reset complete. Running Phase 8.2 upgrade...');
    const { upgradeCustomerImagesToV82, setDefaultProfileImages } = await import('../services/database');
    await upgradeCustomerImagesToV82();
    await setDefaultProfileImages();
    console.log('[DB] ✅ Phase 8.2 upgrade complete.');
  } catch (err) {
    console.error('[DB] ❌ Manual reset failed:', err);
  }
}
