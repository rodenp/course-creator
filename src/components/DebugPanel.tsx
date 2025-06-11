import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Trash2 } from 'lucide-react';
import { sampleCourses, globalStripeSettings } from '@/utils/sampleData';

export function DebugPanel() {
  const [isOpen, setIsOpen] = React.useState(false);

  const checkLocalStorage = () => {
    const courses = localStorage.getItem('courses');
    const version = localStorage.getItem('courseDataVersion');

    console.log('=== COURSE DATA DEBUG ===');
    console.log('Data Version:', version);
    console.log('Raw courses data:', courses);

    if (courses) {
      try {
        const parsed = JSON.parse(courses);
        console.log('Parsed courses:', parsed);
        console.log('Courses with Stripe settings:', parsed.filter((c: any) => c.stripeSettings || c.isPaid));
        parsed.forEach((course: any, index: number) => {
          console.log(`Course ${index + 1}:`, {
            id: course.id,
            title: course.title,
            isPaid: course.isPaid,
            accessLevel: course.accessLevel,
            hasStripeSettings: !!course.stripeSettings,
            stripeEnabled: course.stripeSettings?.enabled,
            planCount: course.stripeSettings?.plans?.length || 0
          });
        });
      } catch (e) {
        console.error('Failed to parse courses:', e);
      }
    }

    console.log('Sample courses (expected):', sampleCourses.map(c => ({
      id: c.id,
      title: c.title,
      isPaid: c.isPaid,
      accessLevel: c.accessLevel,
      hasStripeSettings: !!c.stripeSettings,
      planCount: c.stripeSettings?.plans?.length || 0
    })));
  };

  const forceRefreshData = () => {
    console.log('🔄 Forcing data refresh with new billing architecture...');
    localStorage.removeItem('courses');
    localStorage.removeItem('stripeSettings');
    localStorage.removeItem('courseDataVersion');
    localStorage.setItem('courses', JSON.stringify(sampleCourses));
    localStorage.setItem('stripeSettings', JSON.stringify(globalStripeSettings));
    localStorage.setItem('courseDataVersion', '3.0.0');
    console.log('✅ Data refreshed with corrected billing model! Reloading page...');
    window.location.reload();
  };

  const clearAllData = () => {
    if (confirm('Clear all course data? This will reset everything.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        <Database className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Panel</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-gray-600 mb-2">Local Storage Status:</p>
          <Badge variant="outline" className="text-xs">
            Version: {localStorage.getItem('courseDataVersion') || 'None'}
          </Badge>
        </div>

        <div className="space-y-2">
          <Button
            onClick={checkLocalStorage}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Database className="h-4 w-4 mr-2" />
            Check Data
          </Button>

          <Button
            onClick={forceRefreshData}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Refresh
          </Button>

          <Button
            onClick={clearAllData}
            variant="outline"
            size="sm"
            className="w-full justify-start text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          Use "Check Data" to see console logs of current course data.
          Use "Force Refresh" if billing features aren't showing.
        </div>
      </CardContent>
    </Card>
  );
}
