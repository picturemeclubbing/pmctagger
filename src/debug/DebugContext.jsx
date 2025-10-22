/**
 * File: /src/debug/DebugContext.jsx
 * Purpose: Central debug state, log storage, export, and subscription for UI.
 * Connects To: useDebug hook, DebugPanel component, global pages & services.
 */

import React, { createContext, useContext, useState, useRef } from 'react';
import { resetCRMDatabase } from './validateDatabase';
import db from '../services/database';

const DebugContext = createContext(null);

const MAX_LOGS = 1000;

export function DebugProvider({ children }) {
  const [logs, setLogs] = useState([]);
  const subscribersRef = useRef(new Set());
  const perfRef = useRef(new Map());
  const MAX = 500;

  const api = {
    add(entry) {
      setLogs(prev => {
        const next = [...prev, entry].slice(-MAX);
        for (const sub of subscribersRef.current) {
          try {
            sub(next);
          } catch {}
        }
        return next;
      });
    },
    subscribe(cb) {
      subscribersRef.current.add(cb);
      return () => subscribersRef.current.delete(cb);
    },
    clear() {
      setLogs([]);
    },
    export() {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pmc_debug_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    perfStart(label) {
      perfRef.current.set(label, performance.now());
    },
    perfEnd(label) {
      const start = perfRef.current.get(label);
      if (start != null) {
        const dur = performance.now() - start;
        perfRef.current.delete(label);
        return dur;
      }
      return null;
    },
    logs
  };

  return <DebugContext.Provider value={api}>{children}</DebugContext.Provider>;
}

export function useDebugContext() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error('useDebugContext must be used within <DebugProvider/>');
  return ctx;
}

/**
 * Phase 8.2: Debug actions hook for control panel
 */
export function useDebugActions() {
  const actions = [
    {
      label: '🧹 Reset CRM Database Schema',
      description: 'Deletes and rebuilds Dexie v9 database schema.',
      action: async () => {
        if (confirm('⚠️ This will wipe all local CRM data. Continue?')) {
          await resetCRMDatabase();
          alert('✅ CRM Database Schema reset complete.');
          window.location.reload();
        }
      },
    },
    {
      label: '💾 Generate Dummy CRM Data',
      description: 'Creates sample customer and profile image for Phase 8.2 testing.',
      action: async () => {
        try {
          console.log('[Debug] Creating dummy CRM data...');

          const customerId = await db.customers.add({
            name: 'Arthur King',
            handle: '@arthurking',
            email: 'picturemeclubbing@gmail.com',
            phone: '3137031555',
            profileImageId: null,
            profileImageSource: null,
            profileImageUrl: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          const imageId = await db.customer_images.add({
            customerId,
            sessionId: 'session_test_1',
            url: 'https://picsum.photos/800',
            thumbnailUrl: 'https://picsum.photos/200',
            sourceType: 'manual',
            uploadedBy: 'system',
            createdAt: Date.now(),
            isProfileImage: true,
          });

          await db.customers.update(customerId, {
            profileImageId: imageId,
            profileImageSource: 'manual',
            profileImageUrl: 'https://picsum.photos/800',
            profileImageUpdatedAt: Date.now(),
          });

          console.log('✅ Dummy CRM data created:', { customerId, imageId });
          alert('✅ Dummy CRM record created successfully.');
          window.location.reload();
        } catch (err) {
          console.error('❌ Dummy data generation failed:', err);
          alert('❌ Failed to create dummy data. Check console for details.');
        }
      },
    },
  ];
  return actions;
}
