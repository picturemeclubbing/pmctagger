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
    return await db.transaction('rw', [db.deliveries_simple], async () => {
      const d = await db.deliveries_simple.get(id);
      if (!d) throw new Error(`Delivery ${id} not found`);
      if (d.status === 'sent') return d;

      await db.deliveries_simple.update(id, { status: 'sent', sentAt: Date.now() });
      debug.info('delivery_marked_sent', { id });
      return await db.deliveries_simple.get(id);
    });
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
    } else if (filters.sessionIds && filters.sessionIds.length > 0) {
      // Optimized anyOf() query for multiple sessions to prevent N+1 queries
      deliveries = await db.deliveries_simple
        .where('sessionId')
        .anyOf(filters.sessionIds)
        .reverse()
        .sortBy('createdAt');
      debug.info('deliveries_listed_by_sessions',{count:deliveries.length,sessions:filters.sessionIds});
    } else if (filters.customerIds && filters.customerIds.length > 0) {
      // Optional: bulk fetch by customer IDs if needed
      deliveries = await db.deliveries_simple
        .where('customerId')
        .anyOf(filters.customerIds)
        .reverse()
        .sortBy('createdAt');
      debug.info('deliveries_listed_by_customers',{count:deliveries.length,customers:filters.customerIds});
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
    const [pending, sent, manual, email, sms] = await Promise.all([
      db.deliveries_simple.where('status').equals('pending').count(),
      db.deliveries_simple.where('status').equals('sent').count(),
      db.deliveries_simple.where('method').equals('manual').count(),
      db.deliveries_simple.where('method').equals('email').count(),
      db.deliveries_simple.where('method').equals('sms').count()
    ]);
    const total = pending + sent;
    const byMethod = { manual, email, sms };
    return { total, pending, sent, byMethod };
  } catch(e){
    debug.error('getDeliveryStats_failed', e.message);
    throw e;
  }
}

export async function sendEmail(id) {
  try {
    return await db.transaction('rw', [db.deliveries_simple], async () => {
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
    });
  } catch (e) {
    debug.error('sendEmail_failed', e.message);
    throw e;
  }
}

export async function sendSMS(id) {
  try {
    return await db.transaction('rw', [db.deliveries_simple], async () => {
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
    });
  } catch (e) {
    debug.error('sendSMS_failed', e.message);
    throw e;
  }
}

// PHASE 6.2f: Atomic create+send operations to eliminate race conditions and improve performance
export async function createAndSendEmail(sessionId, customerId) {
  try {
    if (!sessionId || !customerId) throw new Error('sessionId and customerId required');

    debug.info('create_and_send_email_start', { sessionId, customerId });

    const result = await db.transaction('rw', [db.deliveries_simple, db.customers], async () => {
      // Atomic: retrieve customer within transaction
      const customer = await db.customers.get(customerId);
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      if (!customer.email) throw new Error('Customer has no email address');

      // Atomic: create delivery record
      const deliveryId = await db.deliveries_simple.add({
        sessionId,
        customerId,
        method: 'email',
        status: 'sent',
        createdAt: Date.now(),
        sentAt: Date.now()
      });

      debug.info('email_sent_atomic', {
        id: deliveryId,
        email: customer.email,
        sessionId,
        customerId
      });
      console.log(`[DELIVERY_SIMPLE] INFO: Atomic Email sent to ${customer.email}`);

      return { id: deliveryId, sessionId, customerId, method: 'email', status: 'sent', sentAt: Date.now() };
    });

    debug.info('create_and_send_email_complete', result);
    return result;
  } catch (e) {
    debug.error('createAndSendEmail_failed', e.message);
    throw e;
  }
}

export async function createAndSendSMS(sessionId, customerId) {
  try {
    if (!sessionId || !customerId) throw new Error('sessionId and customerId required');

    debug.info('create_and_send_sms_start', { sessionId, customerId });

    const result = await db.transaction('rw', [db.deliveries_simple, db.customers], async () => {
      // Atomic: retrieve customer within transaction
      const customer = await db.customers.get(customerId);
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      if (!customer.phone) throw new Error('Customer has no phone number');

      // Atomic: create delivery record
      const deliveryId = await db.deliveries_simple.add({
        sessionId,
        customerId,
        method: 'sms',
        status: 'sent',
        createdAt: Date.now(),
        sentAt: Date.now()
      });

      debug.info('sms_sent_atomic', {
        id: deliveryId,
        phone: customer.phone,
        sessionId,
        customerId
      });
      console.log(`[DELIVERY_SIMPLE] INFO: Atomic SMS sent to ${customer.phone}`);

      return { id: deliveryId, sessionId, customerId, method: 'sms', status: 'sent', sentAt: Date.now() };
    });

    debug.info('create_and_send_sms_complete', result);
    return result;
  } catch (e) {
    debug.error('createAndSendSMS_failed', e.message);
    throw e;
  }
}

export async function bulkMarkSent(ids) {
  try {
    debug.info('bulk_mark_sent_start', { count: ids.length });

    const result = await db.transaction('rw', [db.deliveries_simple], async () => {
      const updates = [];
      const sessionUpdates = new Map(); // Track sessions to avoid duplicates

      for (const id of ids) {
        const delivery = await db.deliveries_simple.get(id);
        if (delivery && delivery.status === 'pending') {
          updates.push({ id, status: 'sent', sentAt: Date.now() });
          // Track session for potential update
          if (!sessionUpdates.has(delivery.sessionId)) {
            sessionUpdates.set(delivery.sessionId, true);
          }
        }
      }

      // Bulk update deliveries
      await Promise.all(
        updates.map(update => db.deliveries_simple.update(update.id, {
          status: update.status,
          sentAt: update.sentAt
        }))
      );

      // Handle any session updates if needed (placeholder for future expansion)
      // This ensures we don't duplicate session updates for bulk operations

      return updates.length;
    });

    debug.info('bulk_mark_sent_complete', { processed: result });
    return result;
  } catch (e) {
    debug.error('bulkMarkSent_failed', e.message);
    throw e;
  }
}

export async function bulkSendEmail(ids) {
  try {
    debug.info('bulk_send_email_start', { count: ids.length });

    const result = await db.transaction('rw', [db.deliveries_simple, db.customers], async () => {
      const updates = [];
      const sessionUpdates = new Map();

      // First, bulk fetch all deliveries and customers
      const deliveries = await Promise.all(ids.map(id => db.deliveries_simple.get(id)));
      const customerIds = deliveries.map(d => d.customerId);
      const customers = await Promise.all(customerIds.map(getCustomerById));

      // Create customer lookup map
      const customerMap = new Map(customers.map((c, i) => [customerIds[i], c]));

      for (const delivery of deliveries) {
        if (!delivery) {
          debug.warn('delivery_not_found', { id: delivery.id });
          continue;
        }

        const customer = customerMap.get(delivery.customerId);
        if (!customer?.email) {
          debug.warn('customer_no_email', { customerId: delivery.customerId });
          continue;
        }

        if (delivery.status === 'pending') {
          updates.push({ id: delivery.id, sessionId: delivery.sessionId });
          if (!sessionUpdates.has(delivery.sessionId)) {
            sessionUpdates.set(delivery.sessionId, true);
          }
          debug.info('send_email_simulated', {
            id: delivery.id,
            email: customer.email,
            sessionId: delivery.sessionId
          });
        }
      }

      // Bulk update deliveries with Promise.all
      await Promise.all(
        updates.map(update => db.deliveries_simple.update(update.id, {
          status: 'sent',
          sentAt: Date.now()
        }))
      );

      return updates.length;
    });

    debug.info('bulk_send_email_complete', { processed: result });
    return result;
  } catch (e) {
    debug.error('bulkSendEmail_failed', e.message);
    throw e;
  }
}

export async function bulkSendSMS(ids) {
  try {
    debug.info('bulk_send_sms_start', { count: ids.length });

    const result = await db.transaction('rw', [db.deliveries_simple, db.customers], async () => {
      const updates = [];
      const sessionUpdates = new Map();

      // First, bulk fetch all deliveries and customers
      const deliveries = await Promise.all(ids.map(id => db.deliveries_simple.get(id)));
      const customerIds = deliveries.map(d => d.customerId);
      const customers = await Promise.all(customerIds.map(getCustomerById));

      // Create customer lookup map
      const customerMap = new Map(customers.map((c, i) => [customerIds[i], c]));

      for (const delivery of deliveries) {
        if (!delivery) {
          debug.warn('delivery_not_found', { id: delivery.id });
          continue;
        }

        const customer = customerMap.get(delivery.customerId);
        if (!customer?.phone) {
          debug.warn('customer_no_phone', { customerId: delivery.customerId });
          continue;
        }

        if (delivery.status === 'pending') {
          updates.push({ id: delivery.id, sessionId: delivery.sessionId });
          if (!sessionUpdates.has(delivery.sessionId)) {
            sessionUpdates.set(delivery.sessionId, true);
          }
          debug.info('send_sms_simulated', {
            id: delivery.id,
            phone: customer.phone,
            sessionId: delivery.sessionId
          });
        }
      }

      // Bulk update deliveries with Promise.all
      await Promise.all(
        updates.map(update => db.deliveries_simple.update(update.id, {
          status: 'sent',
          sentAt: Date.now()
        }))
      );

      return updates.length;
    });

    debug.info('bulk_send_sms_complete', { processed: result });
    return result;
  } catch (e) {
    debug.error('bulkSendSMS_failed', e.message);
    throw e;
  }
}

export async function bulkSendBoth(ids) {
  try {
    debug.info('bulk_send_both_start', { count: ids.length });

    const result = await db.transaction('rw', [db.deliveries_simple, db.customers], async () => {
      const updates = [];
      const sessionUpdates = new Map();

      // First, bulk fetch all deliveries and customers
      const deliveries = await Promise.all(ids.map(id => db.deliveries_simple.get(id)));
      const customerIds = deliveries.map(d => d.customerId);
      const customers = await Promise.all(customerIds.map(getCustomerById));

      // Create customer lookup map
      const customerMap = new Map(customers.map((c, i) => [customerIds[i], c]));

      for (const delivery of deliveries) {
        if (!delivery) {
          debug.warn('delivery_not_found', { id: delivery.id });
          continue;
        }

        const customer = customerMap.get(delivery.customerId);
        const hasEmail = customer?.email;
        const hasPhone = customer?.phone;

        if (!hasEmail && !hasPhone) {
          debug.warn('customer_no_contact', { customerId: delivery.customerId });
          continue;
        }

        if (delivery.status === 'pending') {
          updates.push({ id: delivery.id, sessionId: delivery.sessionId });

          if (!sessionUpdates.has(delivery.sessionId)) {
            sessionUpdates.set(delivery.sessionId, true);
          }

          if (hasEmail) {
            debug.info('send_email_simulated', {
              id: delivery.id,
              email: customer.email,
              sessionId: delivery.sessionId
            });
          }

          if (hasPhone) {
            debug.info('send_sms_simulated', {
              id: delivery.id,
              phone: customer.phone,
              sessionId: delivery.sessionId
            });
          }
        }
      }

      // Bulk update deliveries with Promise.all
      await Promise.all(
        updates.map(update => db.deliveries_simple.update(update.id, {
          status: 'sent',
          sentAt: Date.now()
        }))
      );

      return updates.length;
    });

    debug.info('bulk_send_both_complete', { processed: result });
    return result;
  } catch (e) {
    debug.error('bulkSendBoth_failed', e.message);
    throw e;
  }
}

export default {
  addDelivery,
  markSent,
  listDeliveries,
  clearDeliveries,
  getDeliveryStats,
  sendEmail,
  sendSMS,
  createAndSendEmail,
  createAndSendSMS,
  bulkMarkSent,
  bulkSendEmail,
  bulkSendSMS,
  bulkSendBoth
};
