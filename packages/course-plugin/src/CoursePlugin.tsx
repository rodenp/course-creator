import React, { useState, useEffect, useMemo } from 'react';
// import { stripeService } from './services/stripe'; // Stripe service might be initialized differently
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
import { StorageService } from './utils/storage';
import type { StorageConfig as StorageConfigurationType } from './types'; // Renamed to avoid conflict

// Define prop types (these might eventually move to a central types file)
interface UserInfoType {
  id: string;
  email?: string;
  name?: string;
  planId?: string;      // e.g., 'free', 'pro'
  planStatus?: string;  // e.g., 'active', 'trialing'
  // Add other relevant user details
}

interface StripePluginConfigType {
  publishableKey: string;
  // Potentially other Stripe related configs the plugin UI might need
}

interface CoursePluginProps {
  storageConfig: StorageConfigurationType;
  userInfo: UserInfoType;
  stripeConfig?: StripePluginConfigType;
  showDebugPanel?: boolean;
}

type AppView = 'list' | 'view' | 'edit' | 'settings' | 'extensions' | 'planpricing';

export default function CoursePlugin({
  storageConfig,
  userInfo,
  stripeConfig,
  showDebugPanel = false
}: CoursePluginProps) {
  const [currentView, setCurrentView] = useState<AppView>('list');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Instantiate StorageService with the provided config
  const effectiveStorageService = useMemo(() => {
      return new StorageService(storageConfig);
  }, [storageConfig]);

  // Configure Stripe service if stripeConfig is provided
  // useEffect(() => {
  //   if (stripeConfig?.publishableKey) {
  //     // Assuming stripeService has an init method or similar
  //     // stripeService.initialize(stripeConfig.publishableKey);
  //   }
  // }, [stripeConfig]);

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setCurrentView('view');
  };
  const handleEditCourse = (courseId: string) => { setSelectedCourseId(courseId); setCurrentView('edit'); };
  const handleBackToList = () => { setCurrentView('list'); setSelectedCourseId(null); };
  const handleSwitchToView = () => { setCurrentView('view'); };
  const handleSettingsCourse = (courseId: string) => { setSelectedCourseId(courseId); setCurrentView('settings'); };
  const handleShowExtensions = () => { setCurrentView('extensions'); setSelectedCourseId(null); };
  const handleShowPlanPricing = () => { setCurrentView('planpricing'); setSelectedCourseId(null); };

  return (
    <LanguageProvider>
      <BillingProvider
        // Pass relevant props from userInfo if needed, e.g., planStatus
        // userPlanStatus={userInfo.planStatus} // BillingProvider doesn't take this prop currently
      >
        <StripeProvider
          customerId={userInfo.id} /* Or a specific stripeCustomerId from userInfo */
          // publishableKey={stripeConfig?.publishableKey} // StripeProvider doesn't take this prop currently
        >
          <CourseProvider storageService={effectiveStorageService} userId={userInfo.id}>
            <div className="min-h-screen bg-gray-50"> {/* Consider if plugin should dictate bg or consumer */}
              {currentView === 'list' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <CourseList
                    onViewCourse={handleViewCourse}
                    onEditCourse={handleEditCourse}
                    onSettingsCourse={handleSettingsCourse}
                    onShowExtensions={handleShowExtensions}
                    onShowPlanPricing={handleShowPlanPricing}
                    // Pass userInfo for conditional UI based on plan, etc.
                    // userInfo={userInfo} // CourseList doesn't take this prop currently
                  />
                </div>
              )}
              {currentView === 'view' && selectedCourseId && (<CourseViewer courseId={selectedCourseId} onBack={handleBackToList} />)}
              {currentView === 'edit' && selectedCourseId && (<CourseEditor courseId={selectedCourseId} onBack={handleBackToList} onViewMode={handleSwitchToView} />)}
              {currentView === 'settings' && selectedCourseId && (<CourseSettings courseId={selectedCourseId} onBack={handleBackToList} />)}
              {currentView === 'extensions' && (<Extensions onBack={handleBackToList} />)}
              {currentView === 'planpricing' && (<PlanPricing onBack={handleBackToList} onGoToExtensions={() => setCurrentView('extensions')} />)}
            </div>
            {showDebugPanel && <DebugPanel />}
          </CourseProvider>
        </StripeProvider>
      </BillingProvider>
    </LanguageProvider>
  );
}
