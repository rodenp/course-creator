import React, { useState, useEffect } from 'react';
import { stripeService } from './services/stripe';
import { CourseProvider } from './contexts/CourseContext';
import { BillingProvider } from './contexts/BillingContext';
import { StripeProvider } from './contexts/StripeContext';
import { LanguageProvider } from './i18n';
import { CourseList } from './components/CourseList';
import { CourseViewer } from './components/CourseViewer';
import { CourseEditor } from './components/CourseEditor';
import { CourseSettings } from './components/CourseSettings';
import { Extensions } from './components/Extensions';
import { PlanPricing } from './components/PlanPricing';
import { DebugPanel } from './components/DebugPanel';
import { initializeSampleData } from './utils/sampleData';
// Import webhook polling to start automatically
import './services/webhook-polling';

type AppView = 'list' | 'view' | 'edit' | 'settings' | 'extensions' | 'planpricing';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Initialize sample data on first load
  useEffect(() => {
    initializeSampleData();

    // Expose stripeService globally for testing
    (window as { stripeService?: typeof stripeService }).stripeService = stripeService;

    // Also expose backend simulator and real API for testing
    import('./services/stripe-backend-simulator').then(({ stripeBackendSimulator }) => {
      (window as { stripeBackendSimulator?: typeof stripeBackendSimulator }).stripeBackendSimulator = stripeBackendSimulator;
    });

    import('./services/stripe-real-api').then(({ realStripeAPI }) => {
      (window as { realStripeAPI?: typeof realStripeAPI }).realStripeAPI = realStripeAPI;
    });
  }, []);

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('view');
  };

  const handleEditCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedCourseId(null);
  };

  const handleSwitchToView = () => {
    setCurrentView('view');
  };

  const handleSettingsCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('settings');
  };

  const handleShowExtensions = () => {
    setCurrentView('extensions');
    setSelectedCourseId(null);
  };

  const handleShowPlanPricing = () => {
    setCurrentView('planpricing');
    setSelectedCourseId(null);
  };

  return (
    <LanguageProvider>
      <BillingProvider>
        <StripeProvider customerId="demo_customer_123">
          <CourseProvider>
            <div className="min-h-screen bg-gray-50">
              {currentView === 'list' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <CourseList
                    onViewCourse={handleViewCourse}
                    onEditCourse={handleEditCourse}
                    onSettingsCourse={handleSettingsCourse}
                    onShowExtensions={handleShowExtensions}
                    onShowPlanPricing={handleShowPlanPricing}
                  />
                </div>
              )}

              {currentView === 'view' && selectedCourseId && (
                <CourseViewer
                  courseId={selectedCourseId}
                  onBack={handleBackToList}
                />
              )}

              {currentView === 'edit' && selectedCourseId && (
                <CourseEditor
                  courseId={selectedCourseId}
                  onBack={handleBackToList}
                  onViewMode={handleSwitchToView}
                />
              )}

              {currentView === 'settings' && selectedCourseId && (
                <CourseSettings
                  courseId={selectedCourseId}
                  onBack={handleBackToList}
                />
              )}

              {currentView === 'extensions' && (
                <Extensions
                  onBack={handleBackToList}
                />
              )}

              {currentView === 'planpricing' && (
                <PlanPricing
                  onBack={handleBackToList}
                  onGoToExtensions={() => setCurrentView('extensions')}
                />
              )}
            </div>
          </CourseProvider>
        </StripeProvider>
      </BillingProvider>
      <DebugPanel />
    </LanguageProvider>
  );
}

export default App;
