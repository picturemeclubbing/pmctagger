import React, { useState, useEffect } from 'react';
import { useDebug } from '../debug/useDebug';
import { DebugProvider } from '../debug/DebugContext';

const Phase2TestHarnessInner = () => {
  const [results, setResults] = useState([]);
  const debug = useDebug('TESTHARNESS');

  async function runDatabaseTest() {
    try {
      debug.time('database-test');
      const { db, initDatabase } = await import('../services/database.js');
      await initDatabase();
      const tables = Object.keys(db.tables);
      debug.timeEnd('database-test');
      return { name: 'Database', passed: true, message: `Tables: ${tables.join(', ')}` };
    } catch (err) {
      return { name: 'Database', passed: false, message: err.message };
    }
  }

  async function runSettingsTest() {
    try {
      debug.time('settings-test');
      const { getSettings } = await import('../services/SettingsStore.js');
      const settings = await getSettings();
      if (settings && settings.brandName) {
        debug.timeEnd('settings-test');
        return { name: 'SettingsStore', passed: true, message: 'Defaults loaded' };
      } else {
        throw new Error('Invalid settings returned');
      }
    } catch (err) {
      return { name: 'SettingsStore', passed: false, message: err.message };
    }
  }

  async function runSessionTest() {
    try {
      debug.time('session-test');
      const SessionStore = await import('../services/SessionStore.js');
      await SessionStore.saveRawVersion('test-session', new Blob(['test'], { type: 'image/png' }), new Blob(['thumb'], { type: 'image/png' }), 'test.png');
      const sessions = await SessionStore.listSessions();
      debug.timeEnd('session-test');
      return { name: 'SessionStore', passed: true, message: 'Save and list OK' };
    } catch (err) {
      return { name: 'SessionStore', passed: false, message: err.message };
    }
  }

  async function runImageTest() {
    try {
      debug.time('image-test');
      const { compressImage, makeThumbnail } = await import('../services/ImageService.js');
      const testBlob = new Blob(['test'], { type: 'image/png' });
      const compressed = await compressImage(testBlob, 800, 0.8);
      const thumbnail = await makeThumbnail(testBlob, 150);
      if (compressed && thumbnail) {
        debug.timeEnd('image-test');
        return { name: 'ImageService', passed: true, message: 'Compression & thumbnail OK' };
      } else {
        throw new Error('Services returned null');
      }
    } catch (err) {
      return { name: 'ImageService', passed: false, message: err.message };
    }
  }

  async function runEventBusTest() {
    try {
      debug.time('eventbus-test');
      const { emit, on } = await import('../services/EventBus.js');
      let received = false;
      on('test-event', () => {
        received = true;
      });
      emit('test-event', { data: 'test' });
      debug.timeEnd('eventbus-test');
      return { name: 'EventBus', passed: received, message: received ? 'Event received' : 'Event not received' };
    } catch (err) {
      return { name: 'EventBus', passed: false, message: err.message };
    }
  }

  async function runDeliveryTest() {
    try {
      debug.time('delivery-test');
      const { enqueueJob, updateJobStatus } = await import('../services/DeliveryQueue.js');
      const job = await enqueueJob('test-session', 'raw', { email: 'test@example.com' }, 'email');
      await updateJobStatus(job.jobId, 'completed');
      debug.timeEnd('delivery-test');
      return { name: 'DeliveryQueue', passed: true, message: 'Job enqueued and updated' };
    } catch (err) {
      return { name: 'DeliveryQueue', passed: false, message: err.message };
    }
  }

  async function runDebugTest() {
    try {
      debug.time('debug-test');
      const testMsg = 'Test log from harness';
      debug.info(testMsg);
      debug.timeEnd('debug-test');
      return { name: 'Debug System', passed: true, message: 'Logs and timing OK' };
    } catch (err) {
      return { name: 'Debug System', passed: false, message: err.message };
    }
  }

  async function runAllTests() {
    debug.info('Starting Phase 2 Core Services Tests');
    const testFuncs = [runDatabaseTest, runSettingsTest, runSessionTest, runImageTest, runEventBusTest, runDeliveryTest, runDebugTest];
    const newResults = [];
    for (const testFunc of testFuncs) {
      const result = await testFunc();
      newResults.push(result);
      setResults([...newResults]);
    }
    debug.info('Phase 2 Core Services Tests Completed');
  }

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Phase 2 Core Services Test Harness</h1>
      <button
        onClick={runAllTests}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Re-run Tests
      </button>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Service</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Message</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={index}>
              <td className="border p-2">{result.name}</td>
              <td className={`border p-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? '✅' : '❌'}
              </td>
              <td className="border p-2">{result.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Phase2TestHarness = () => (
  <DebugProvider>
    <Phase2TestHarnessInner />
  </DebugProvider>
);

export default Phase2TestHarness;

// Phase 2 Core Services Test Harness
// Verifies database, stores, event bus, image pipeline, delivery queue, and debugger integration
// Created for internal testing before Phase 3
