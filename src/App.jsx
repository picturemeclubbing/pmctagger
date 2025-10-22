/**
 * File: /src/App.jsx
 * Purpose: Main app routing with all phases integrated
 * Connects To: All pages, DebugProvider, React Router
 *
 * Phase 5.2a: Added DebugPage
 * Phase 5.3a: Added GalleryPage
 * Phase 5.4a: Added SessionDetailPage
 * Phase 6.0a: Added CustomerInfoPage
 * Phase 7.0: Added Delivery Automation (Monitor, Settings)
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DebugProvider, useDebugContext } from './debug/DebugContext';

// Components
import Layout from './components/Layout';

// Pages
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import TaggingPage from './pages/TaggingPage';
import SharePage from './pages/SharePage';
import GalleryPage from './pages/GalleryPage';
import SessionDetailPage from './pages/SessionDetailPage';
import CustomerInfoPage from './pages/CustomerInfoPage';  // Phase 6.0a: NEW
import DeliverySimplePage from './pages/DeliverySimplePage';  // Phase 6.1: NEW
import DeliveryMonitorPage from './pages/DeliveryMonitorPage';  // Phase 7.0: NEW
import SettingsPage from './pages/SettingsPage';  // Phase 7.0: NEW
import CRMHomePage from './pages/CRMHomePage';  // Phase 8.0: NEW
import CustomerProfilePage from './pages/CustomerProfilePage';  // Phase 8.0: NEW
import DebugPage from './pages/DebugPage';

// Services
import { initDatabase } from './services/database';
import { initializeAutomation } from './services/DeliveryAutomation';
import { APP_VERSION } from './version';

// ============================================================================
// DEBUG-AWARE ROUTE WRAPPER
// ============================================================================

function DebugAwareRoutes() {
  const debugContext = useDebugContext();

  return (
    <Routes>
      {/* Home Page - Full-screen layout */}
      <Route path="/" element={<HomePage />} />

      {/* Customer Info Form - Customer-facing, no internal navigation */}
      <Route path="/collect/:sessionId" element={<CustomerInfoPage />} />

      {/* All Other Pages - Wrapped with global navigation */}
      <Route path="/upload" element={<Layout><UploadPage /></Layout>} />
      <Route path="/tag/:sessionId" element={<Layout><TaggingPage /></Layout>} />
      <Route path="/share/:sessionId" element={<Layout><SharePage /></Layout>} />
      <Route path="/gallery" element={<Layout><GalleryPage /></Layout>} />
      <Route path="/session/:sessionId" element={<Layout><SessionDetailPage /></Layout>} />
      <Route path="/deliveries-simple" element={<Layout><DeliverySimplePage /></Layout>} />
      <Route path="/deliveries-auto" element={<Layout><DeliveryMonitorPage /></Layout>} />  {/* Phase 7.0: NEW */}
      <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />  {/* Phase 7.0: NEW */}
      <Route path="/crm" element={<Layout><CRMHomePage /></Layout>} />  {/* Phase 8.0: NEW */}
      <Route path="/crm/:customerId" element={<Layout><CustomerProfilePage /></Layout>} />  {/* Phase 8.0: NEW */}
      <Route path="/debug" element={<Layout><DebugPage debugContext={debugContext} /></Layout>} />
    </Routes>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  // Initialize services after component mounts
  useEffect(() => {
    const initialize = async () => {
      console.log('[App] Initializing application...');

      // Initialize database
      const dbInit = await initDatabase();
      if (dbInit) {
        console.log('[App] Database initialized, starting delivery automation...');
        // Initialize delivery automation after database
        await initializeAutomation();
      } else {
        console.error('[App] Database initialization failed');
      }
    };

    initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <DebugProvider>
          <DebugAwareRoutes />
        </DebugProvider>
      </BrowserRouter>

      {/* Version badge - Phase 7.0 */}
      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-600 shadow-sm z-50">
        v{APP_VERSION}
      </div>
    </div>
  );
}

// ============================================================================
// PHASE 6.0a INTEGRATION CHECKLIST FOR GROK
// ============================================================================
//
// ✅ Import CustomerInfoPage at top of file
// ✅ Add route: <Route path="/collect/:sessionId" element={<CustomerInfoPage />} />
// ✅ Route positioned between SessionDetailPage and DebugPage
// ✅ Verify all existing routes still work
// ✅ Test navigation to /collect/:sessionId
// ✅ Confirm no console errors
//
// VERIFICATION STEPS:
// 1. npm run dev
// 2. Navigate to tagging page
// 3. Click "Continue" after tagging
// 4. Verify customer info form appears
// 5. Fill out form and submit
// 6. Check debug console for [DELIVERY] namespace logs
// 7. Verify delivery record created in Dexie
// 8. Verify customer record created/updated in Dexie
//
// ============================================================================

export default App;
