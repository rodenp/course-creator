import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Copy, MoreVertical, Settings, FileText, Download, Lock, CheckCircle } from 'lucide-react';
import type { Course } from '@/types';
import { useCourse } from '@/contexts/CourseContext';
import { analytics } from '@/utils/analytics';

interface CourseCardProps {
  course: Course;
  onView: (courseId: string) => void;
  onEdit: (courseId: string) => void;
  onSettings?: (courseId: string) => void;
  userPlan?: any; // Current user subscription plan object
}

export function CourseCard({ course, onView, onEdit, onSettings, userPlan = null }: CourseCardProps) {
  const { deleteCourse, cloneCourse, saveAsTemplate, exportCourse } = useCourse();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [templateName, setTemplateName] = useState(`${course.title} Template`);
  const [templateDescription, setTemplateDescription] = useState(`Template based on ${course.title}`);

  // Check if user has access to this course
  const hasAccess = () => {
    // Free courses are always accessible
    if (!course.isPaid || course.accessLevel === 'free') {
      return true;
    }

    // No subscription = no access to paid courses
    if (!userPlan) {
      return false;
    }

    // Check if user's plan meets the requirement
    const planHierarchy = ['basic', 'pro', 'enterprise'];
    const userPlanId = userPlan.id || userPlan; // Handle both plan object and string
    const userPlanLevel = planHierarchy.indexOf(userPlanId);
    const requiredPlanLevel = planHierarchy.indexOf(course.requiredPlan || 'basic');

    return userPlanLevel >= requiredPlanLevel;
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCourse(course.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete course:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async () => {
    try {
      setIsCloning(true);
      await cloneCourse(course.id);
    } catch (error) {
      console.error('Failed to clone course:', error);
    } finally {
      setIsCloning(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    try {
      setIsSavingTemplate(true);
      await saveAsTemplate(course.id, templateName, templateDescription);
      setShowTemplateDialog(false);

      // Track analytics
      analytics.track('template_created', {
        sourceId: course.id,
        templateName: templateName,
        modules: course.modules.length,
        lessons: course.modules.reduce((total, module) => total + module.lessons.length, 0)
      });
    } catch (error) {
      console.error('Failed to save as template:', error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportCourse(course.id);

      // Track analytics
      analytics.track('course_exported', {
        courseId: course.id,
        modules: course.modules.length,
        lessons: course.modules.reduce((total, module) => total + module.lessons.length, 0)
      });
    } catch (error) {
      console.error('Failed to export course:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgressColor = (progress = 0) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  const getAccessStatusBadge = () => {
    if (!course.isPaid || course.accessLevel === 'free') {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Free
        </Badge>
      );
    }

    return (
      <Badge className="bg-blue-600 text-white">
        <Lock className="h-3 w-3 mr-1" />
        Paid
      </Badge>
    );
  };

  const getPlanRequirementText = () => {
    if (!course.isPaid || course.accessLevel === 'free') {
      return 'Free for everyone';
    }

    const planName = course.requiredPlan ?
      course.requiredPlan.charAt(0).toUpperCase() + course.requiredPlan.slice(1) :
      'Pro';

    return `Requires ${planName} plan`;
  };

  const getActionButton = () => {
    const userHasAccess = hasAccess();

    if (userHasAccess) {
      return (
        <Button onClick={() => onView(course.id)} className="flex-1">
          <Eye className="h-4 w-4 mr-2" />
          View Course
        </Button>
      );
    } else {
      return (
        <Button variant="outline" className="flex-1" disabled>
          <Lock className="h-4 w-4 mr-2" />
          Upgrade to Access
        </Button>
      );
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
      <div className="relative">
        {course.coverImage && (
          <div className="h-48 overflow-hidden">
            <img
              src={course.coverImage}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Access Level Badge */}
        <div className="absolute top-3 left-3">
          {getAccessStatusBadge()}
        </div>



        {/* Template Badge */}
        {course.isTemplate && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              Template
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {course.title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 line-clamp-2">
              {course.description}
            </CardDescription>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showActionsMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-40">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onEdit(course.id);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Course
                  </button>

                  {onSettings && (
                    <button
                      onClick={() => {
                        onSettings(course.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleClone();
                      setShowActionsMenu(false);
                    }}
                    disabled={isCloning}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    {isCloning ? 'Cloning...' : 'Clone Course'}
                  </button>

                  <button
                    onClick={() => {
                      setShowTemplateDialog(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Save as Template
                  </button>

                  <button
                    onClick={() => {
                      handleExport();
                      setShowActionsMenu(false);
                    }}
                    disabled={isExporting}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export Course'}
                  </button>

                  <div className="border-t border-gray-100 my-1" />

                  <button
                    onClick={() => {
                      setShowDeleteDialog(true);
                      setShowActionsMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Course
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Course Statistics */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-4">
            <span>{course.modules.length} modules</span>
            <span>
              {course.modules.reduce((total, module) => total + module.lessons.length, 0)} lessons
            </span>
            {course.progress !== undefined && (
              <span>{course.progress}% complete</span>
            )}
          </div>
        </div>



        {/* Tags */}
        {course.tags && course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{course.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Primary Action Button */}
          {getActionButton()}

          <Button variant="outline" onClick={() => onEdit(course.id)}>
            <Edit className="h-4 w-4" />
          </Button>

          {onSettings && (
            <Button variant="outline" onClick={() => onSettings(course.id)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>



      {/* Delete Confirmation Dialog - keeping existing dialog code */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{course.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Save Dialog - keeping existing dialog code */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Create a reusable template from "{course.title}" that can be used to create new courses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              disabled={isSavingTemplate}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={isSavingTemplate || !templateName.trim()}
            >
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
