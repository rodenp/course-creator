import type React from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, Upload, Download, FileText, BarChart3, Trophy, CreditCard, Globe } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { Badge } from '@/components/ui/badge';
import { CreateCourseForm } from './CreateCourseForm';
import { BillingDashboard } from './BillingDashboard';
import { FeatureGate, FeatureCheck, UsageLimit } from './FeatureGate';
import { useCourse } from '@/contexts/CourseContext';
import { useBilling } from '@/contexts/BillingContext';
import { useTranslation, useLanguage } from '@/i18n';
import { analytics } from '@/utils/analytics';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { Leaderboard } from './Leaderboard';
import type { CourseTemplate, Module, Lesson, ContentBlock } from '@/types';

interface CourseListProps {
  onViewCourse: (courseId: string) => void;
  onEditCourse: (courseId: string) => void;
  onSettingsCourse?: (courseId: string) => void;
  onShowExtensions?: () => void;
  onShowPlanPricing?: () => void;
}

export function CourseList({ onViewCourse, onEditCourse, onSettingsCourse, onShowExtensions, onShowPlanPricing }: CourseListProps) {
  const { courses, loading, templates, importCourse, createCourse, exportCourse } = useCourse();
  const { canCreateCourse, getCourseLimit, currentPlan } = useBilling();
  const { t } = useTranslation();
  const { language, setLanguage, languages } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'courses' | 'templates'>('all');
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showBilling, setShowBilling] = useState(false);

  // Handle billing modal
  const handleShowBilling = () => {
    setShowBilling(true);
  };

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by type
    if (filterType === 'templates') {
      filtered = filtered.filter(course => course.isTemplate);
    } else if (filterType === 'courses') {
      filtered = filtered.filter(course => !course.isTemplate);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.tags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [courses, searchTerm, filterType]);

  // Track search and filter usage
  useEffect(() => {
    if (searchTerm) {
      analytics.trackSearchUsed(searchTerm, filteredCourses.length);
    }
  }, [searchTerm, filteredCourses.length]);

  useEffect(() => {
    if (filterType !== 'all') {
      analytics.trackFilterUsed(filterType, filteredCourses.length);
    }
  }, [filterType, filteredCourses.length]);

  const handleImportCourse = async () => {
    if (!importData.trim()) return;

    try {
      setIsImporting(true);
      setImportError(null);

      // Validate JSON first
      try {
        JSON.parse(importData);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your course data.');
      }

      const importedCourse = await importCourse(importData);
      analytics.trackCourseImported(importedCourse.id, importedCourse.title, importData.includes('"courses"') ? 'file' : 'text');
      setImportData('');
      setShowImportDialog(false);
    } catch (error) {
      console.error('Failed to import course:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import course');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.onerror = () => {
        setImportError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  const handleUseTemplate = async (template: CourseTemplate) => {
    try {
      const newCourse = await createCourse({
        title: `${template.course.title} (From Template)`,
        description: template.course.description,
        coverImage: template.course.coverImage,
        modules: template.course.modules.map((module: Module) => ({
          ...module,
          id: `module-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          lessons: module.lessons.map((lesson: Lesson) => ({
            ...lesson,
            id: `lesson-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            content: lesson.content.map((content: ContentBlock) => ({
              ...content,
              id: `content-${Date.now()}-${Math.random().toString(36).substring(2)}`,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        tags: template.course.tags,
        progress: 0,
      });

      setShowTemplatesDialog(false);
      onEditCourse(newCourse.id); // Open the new course in edit mode
    } catch (error) {
      console.error('Failed to create course from template:', error);
    }
  };

  const handleExportAll = async () => {
    try {
      setIsExportingAll(true);

      // Export all courses (excluding templates)
      const coursesToExport = courses.filter(c => !c.isTemplate);

      // Track analytics for each course
      for (const course of coursesToExport) {
        analytics.trackCourseExported(course.id, course.title, 'bulk');
      }

      const exportPromises = coursesToExport.map(course => exportCourse(course.id));
      const exportedData = await Promise.all(exportPromises);

      // Combine all courses into one export
      const combinedExport = {
        exportVersion: '1.0',
        exportDate: new Date().toISOString(),
        courses: exportedData.map(data => JSON.parse(data)),
        totalCourses: coursesToExport.length
      };

      // Create and trigger download
      const blob = new Blob([JSON.stringify(combinedExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_courses_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to export all courses:', error);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleTestImport = async () => {
    try {
      if (courses.length === 0) {
        setImportError('No courses available to test with');
        return;
      }

      // Export first course and immediately import it back
      const firstCourse = courses.find(c => !c.isTemplate);
      if (!firstCourse) {
        setImportError('No non-template courses available');
        return;
      }

      console.log('Testing with course:', firstCourse.title);
      const exportedData = await exportCourse(firstCourse.id);
      console.log('Exported data:', exportedData);

      await importCourse(exportedData);
      console.log('Import successful!');

    } catch (error) {
      console.error('Test import/export failed:', error);
      setImportError(error instanceof Error ? error.message : 'Test failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('courses.title')}</h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600">
              {courses.filter(c => !c.isTemplate).length} {t('courses.title').toLowerCase()} • {' '}
              {courses.filter(c => c.isTemplate).length} {t('templates.title').toLowerCase()} • {' '}
              {t('billing.currentPlan')}: {currentPlan?.name}
            </p>
            {courses.filter(c => !c.isTemplate).length >= getCourseLimit() * 0.8 && getCourseLimit() !== -1 && (
              <UsageLimit
                current={courses.filter(c => !c.isTemplate).length}
                limit={getCourseLimit()}
                feature={t('courses.title')}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 mr-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 text-sm rounded ${
                  language === lang.code
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={lang.name}
              >
                {lang.flag}
              </button>
            ))}
          </div>

          {/* Extensions Button */}
          {onShowExtensions && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowExtensions}
            >
              <Globe className="h-4 w-4 mr-2" />
              Extensions
            </Button>
          )}

          {/* Plan Pricing Button */}
          {onShowPlanPricing && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowPlanPricing}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Plan Pricing
            </Button>
          )}

          {/* Billing Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBilling(true)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {t('billing.billing')}
          </Button>
          <FeatureCheck feature="leaderboard">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
            >
              <Trophy className="h-4 w-4 mr-2" />
              {t('leaderboard.title')}
            </Button>
          </FeatureCheck>

          <FeatureCheck feature="analytics_basic">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {t('analytics.title')}
            </Button>
          </FeatureCheck>

          <FeatureCheck feature="import_export">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              disabled={isExportingAll || courses.filter(c => !c.isTemplate).length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingAll ? t('common.loading') : `${t('common.export')} All (${courses.filter(c => !c.isTemplate).length})`}
            </Button>
          </FeatureCheck>

          <FeatureCheck feature="import_export">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  {t('common.import')}
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Course</DialogTitle>
                <DialogDescription>
                  Import a course from JSON data or upload a file
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Upload JSON file</label>
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Or paste JSON data</label>
                  <textarea
                    value={importData}
                    onChange={(e) => {
                      setImportData(e.target.value);
                      setImportError(null);
                    }}
                    placeholder="Paste course JSON data here..."
                    className="w-full h-32 p-3 border rounded-md resize-none"
                  />
                  {importError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {importError}
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleTestImport}
                    size="sm"
                  >
                    Test Import/Export
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportCourse}
                      disabled={!importData.trim() || isImporting}
                    >
                      {isImporting ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </FeatureCheck>

          <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Templates ({templates.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Course Templates</DialogTitle>
                <DialogDescription>
                  Choose from pre-built templates to start your course quickly
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto">
                {templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first template by saving an existing course as a template
                    </p>
                    <Button variant="outline" onClick={() => setShowTemplatesDialog(false)}>
                      Close
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="text-xs text-gray-500">
                              <div>{template.course.modules.length} module{template.course.modules.length !== 1 ? 's' : ''}</div>
                              <div>
                                {template.course.modules.reduce((total, module) => total + module.lessons.length, 0)} lesson{template.course.modules.reduce((total, module) => total + module.lessons.length, 0) !== 1 ? 's' : ''}
                              </div>
                              {template.course.tags && template.course.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.course.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {template.course.tags.length > 3 && (
                                    <span className="text-xs text-gray-400">+{template.course.tags.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('courses.create')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('courses.create')}</DialogTitle>
                <DialogDescription>
                  {t('courses.createFirstCourse')}
                </DialogDescription>
              </DialogHeader>
              <CreateCourseForm
                onSuccess={() => setShowCreateDialog(false)}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`${t('common.search')} ${t('courses.title').toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">{t('common.filter')} - All</option>
            <option value="courses">{t('courses.title')}</option>
            <option value="templates">{t('templates.title')}</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterType !== 'all' ? 'No courses found' : t('courses.noCourses')}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : t('courses.createFirstCourse')}
          </p>
          {!searchTerm && filterType === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('courses.create')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onView={onViewCourse}
              onEdit={onEditCourse}
              onSettings={onSettingsCourse}
              userPlan={currentPlan}
            />
          ))}
        </div>
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Global Leaderboard</h2>
              <Button variant="ghost" onClick={() => setShowLeaderboard(false)}>×</Button>
            </div>
            <div className="p-6">
              <Leaderboard limit={20} />
            </div>
          </div>
        </div>
      )}

      {/* Billing Dashboard Modal */}
      {showBilling && (
        <BillingDashboard
          onClose={() => setShowBilling(false)}
          onNavigateToExtensions={onShowExtensions}
        />
      )}
    </div>
  );
}
