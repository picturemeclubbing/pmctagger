import { db } from '../utils/database';
import useDebug from '../debug/useDebug';

const debug = useDebug('DELIVERY_SIMPLE');

export async function addDelivery(sessionId, customerId, method = 'manual') {
  try {
    if (!sessionId || !customerId) throw new Error('sessionId and customerId required');
    if (!['manual','email','sms'].includes(method))
      throw new Error('Invalid method');

    const delivery = {
      sessionId,
      customerId,
      method,
      status: 'pending',
      createdAt: Date.now()
    };
    const id = await db.deliveries_simple.add(delivery);
    debug.info('delivery_added', { id, sessionId, customerId, method });
    return { id, ...delivery };
  } catch (e) {
    debug.error('addDelivery_failed', e.message);
    throw e;
  }
}

export async function markSent(id) {
  try {
    const d = await db.deliveries_simple.get(id);
    if (!d) throw new Error(`Delivery ${id} not found`);
    if (d.status === 'sent') return d;
    await db.deliveries_simple.update(id,{status:'sent',sentAt:Date.now()});
    debug.info('delivery_marked_sent',{id});
    return db.deliveries_simple.get(id);
  } catch (e) {
    debug.error('markSent_failed', e.message);
    throw e;
  }
}

export async function listDeliveries(filters={}) {
  try {
    let deliveries;
    if (filters.status) {
      deliveries = await db.deliveries_simple
        .where('status')
        .equals(filters.status)
        .reverse()
        .sortBy('createdAt');
    } else {
      deliveries = await db.deliveries_simple
        .toCollection()
        .reverse()
        .sortBy('createdAt');
    }
    debug.info('deliveries_listed',{count:deliveries.length,filters});
    return deliveries;
  } catch (e) {
    debug.error('listDeliveries_failed', e.message);
    throw e;
  }
}

export async function clearDeliveries() {
  const count = await db.deliveries_simple.count();
  await db.deliveries_simple.clear();
  debug.info('deliveries_cleared',{count});
  return count;
}

export async function getDeliveryStats() {
  try {
    const [pending,sent] = await Promise.all([
      db.deliveries_simple.where('status').equals('pending').count(),
      db.deliveries_simple.where('status').equals('sent').count()
    ]);
    const total = pending+sent;
    const all = await db.deliveries_simple.toArray();
    const byMethod = {
      manual: all.filter(d=>d.method==='manual').length,
      email: all.filter(d=>d.method==='email').length,
      sms: all.filter(d=>d.method==='sms').length
    };
    return {total,pending,sent,byMethod};
  } catch(e){
    debug.error('getDeliveryStats_failed',e.message);
    throw e;
  }
}

export default { addDelivery, markSent, listDeliveries, clearDeliveries, getDeliveryStats };
