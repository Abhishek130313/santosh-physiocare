import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';

// Import i18n configuration
import i18n from '@/i18n/config';

// Import providers and contexts
import { AuthProvider } from '@/contexts/AuthContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { ToastProvider } from '@/contexts/ToastContext';

// Import components
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

// Import layouts
import { PublicLayout } from '@/layouts/PublicLayout';
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout';
import { KioskLayout } from '@/layouts/KioskLayout';

// Import pages (lazy loaded)
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const PatientEnrollmentPage = React.lazy(() => import('@/pages/enrollment/PatientEnrollmentPage'));
const PatientDetailsPage = React.lazy(() => import('@/pages/patients/PatientDetailsPage'));
const PatientSearchPage = React.lazy(() => import('@/pages/patients/PatientSearchPage'));
const EncounterPage = React.lazy(() => import('@/pages/encounters/EncounterPage'));
const QRScanPage = React.lazy(() => import('@/pages/qr/QRScanPage'));
const SmartCardPage = React.lazy(() => import('@/pages/cards/SmartCardPage'));
const ClinicianDashboard = React.lazy(() => import('@/pages/dashboards/ClinicianDashboard'));
const AdminDashboard = React.lazy(() => import('@/pages/dashboards/AdminDashboard'));
const PublicHealthDashboard = React.lazy(() => import('@/pages/dashboards/PublicHealthDashboard'));
const KioskMode = React.lazy(() => import('@/pages/kiosk/KioskMode'));
const OfflinePage = React.lazy(() => import('@/pages/offline/OfflinePage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Protected route component
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading component
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <OfflineProvider>
                <ToastProvider>
                  <Router>
                    <div className="App">
                      {/* Skip to content link for accessibility */}
                      <a 
                        href="#main-content" 
                        className="skip-to-content"
                      >
                        Skip to main content
                      </a>
                      
                      {/* Offline indicator */}
                      <OfflineIndicator />
                      
                      {/* PWA install prompt */}
                      <PWAInstallPrompt />
                      
                      <main id="main-content">
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            {/* Public routes */}
                            <Route path="/" element={<PublicLayout />}>
                              <Route index element={<LandingPage />} />
                              <Route path="login" element={<LoginPage />} />
                              <Route path="patient/:patientId" element={<PatientDetailsPage />} />
                              <Route path="qr/:qrCode" element={<QRScanPage />} />
                              <Route path="offline" element={<OfflinePage />} />
                            </Route>

                            {/* Kiosk mode */}
                            <Route path="/kiosk" element={<KioskLayout />}>
                              <Route index element={<KioskMode />} />
                              <Route path="enroll" element={<PatientEnrollmentPage />} />
                              <Route path="scan" element={<QRScanPage />} />
                            </Route>

                            {/* Authenticated routes */}
                            <Route 
                              path="/dashboard" 
                              element={
                                <ProtectedRoute>
                                  <AuthenticatedLayout />
                                </ProtectedRoute>
                              }
                            >
                              {/* Role-based dashboards */}
                              <Route 
                                index 
                                element={<ClinicianDashboard />} 
                              />
                              <Route 
                                path="admin" 
                                element={
                                  <ProtectedRoute requiredRole="ADMIN">
                                    <AdminDashboard />
                                  </ProtectedRoute>
                                } 
                              />
                              <Route 
                                path="public-health" 
                                element={
                                  <ProtectedRoute requiredRole={["PUBLIC_HEALTH", "ADMIN"]}>
                                    <PublicHealthDashboard />
                                  </ProtectedRoute>
                                } 
                              />

                              {/* Patient management */}
                              <Route path="patients">
                                <Route index element={<PatientSearchPage />} />
                                <Route path="enroll" element={<PatientEnrollmentPage />} />
                                <Route path=":patientId" element={<PatientDetailsPage />} />
                                <Route path=":patientId/encounter" element={<EncounterPage />} />
                                <Route path=":patientId/card" element={<SmartCardPage />} />
                              </Route>

                              {/* Encounters */}
                              <Route path="encounters">
                                <Route path=":encounterId" element={<EncounterPage />} />
                              </Route>

                              {/* QR and Cards */}
                              <Route path="qr">
                                <Route path="scan" element={<QRScanPage />} />
                                <Route path=":qrCode" element={<QRScanPage />} />
                              </Route>

                              <Route path="cards">
                                <Route path=":patientId" element={<SmartCardPage />} />
                              </Route>
                            </Route>

                            {/* 404 page */}
                            <Route path="*" element={<NotFoundPage />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </Router>
                </ToastProvider>
              </OfflineProvider>
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;