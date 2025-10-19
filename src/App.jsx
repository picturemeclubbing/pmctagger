/**
 * File: /src/App.jsx
 * Purpose: Main app routing with all phases integrated
 * Connects To: All pages, DebugProvider, React Router
 *
 * Phase 5.2a: Added DebugPage
 * Phase 5.3a: Added GalleryPage
 * Phase 5.4a: Added SessionDetailPage
 * Phase 6.0a: Added CustomerInfoPage
 */

import React from 'react';
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
import DebugPage from './pages/DebugPage';

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
      <Route path="/debug" element={<Layout><DebugPage debugContext={debugContext} /></Layout>} />
    </Routes>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  return (
    <BrowserRouter>
      <DebugProvider>
        <DebugAwareRoutes />
      </DebugProvider>
    </BrowserRouter>
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
