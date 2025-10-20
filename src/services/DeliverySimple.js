import { db } from './database';
import { getCustomerById } from './CustomerStore';

// Static debug logger (service-safe, no React hooks)
const debug = {
  info: (a,d)=>console.log('[DELIVERY_SIMPLE] INFO:',a,d),
  warn: (a,d)=>console.warn('[DELIVERY_SIMPLE] WARN:',a,d),
  trace:(a,d)=>console.log('[DELIVERY_SIMPLE] TRACE:',a,d),
  error:(a,d)=>console.error('[DELIVERY_SIMPLE] ERROR:',a,d)
};

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

export async function sendEmail(id) {
  try {
    // Retrieve delivery record by id
    const delivery = await db.deliveries_simple.get(id);
    if (!delivery) throw new Error(`Delivery ${id} not found`);

    // Get linked customer contact info from CustomerStore
    const customer = await getCustomerById(delivery.customerId);
    if (!customer) throw new Error(`Customer ${delivery.customerId} not found`);

    // Check if customer has email
    if (!customer.email) throw new Error('Customer has no email address');

    // Log simulated send message
    debug.info('send_email_simulated', {
      id,
      email: customer.email,
      sessionId: delivery.sessionId,
      customerId: delivery.customerId
    });
    console.log(`[DELIVERY_SIMPLE] INFO: Simulated Email sent to ${customer.email}`);

    // Mark delivery as sent and return updated record
    const updated = await markSent(id);
    return updated;
  } catch (e) {
    debug.error('sendEmail_failed', e.message);
    throw e;
  }
}

export async function sendSMS(id) {
  try {
    // Retrieve delivery record by id
    const delivery = await db.deliveries_simple.get(id);
    if (!delivery) throw new Error(`Delivery ${id} not found`);

    // Get linked customer contact info from CustomerStore
    const customer = await getCustomerById(delivery.customerId);
    if (!customer) throw new Error(`Customer ${delivery.customerId} not found`);

    // Check if customer has phone
    if (!customer.phone) throw new Error('Customer has no phone number');

    // Log simulated send message
    debug.info('send_sms_simulated', {
      id,
      phone: customer.phone,
      sessionId: delivery.sessionId,
      customerId: delivery.customerId
    });
    console.log(`[DELIVERY_SIMPLE] INFO: Simulated SMS sent to ${customer.phone}`);

    // Mark delivery as sent and return updated record
    const updated = await markSent(id);
    return updated;
  } catch (e) {
    debug.error('sendSMS_failed', e.message);
    throw e;
  }
}

export default { addDelivery, markSent, listDeliveries, clearDeliveries, getDeliveryStats, sendEmail, sendSMS };
