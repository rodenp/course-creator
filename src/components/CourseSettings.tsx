import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, X, CreditCard, Settings, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useCourse } from '@/contexts/CourseContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStripe } from '@/contexts/StripeContext';
import type { Course } from '@/types';

interface CourseSettingsProps {
  courseId: string;
  onBack: () => void;
}

export function CourseSettings({ courseId, onBack }: CourseSettingsProps) {

  const { loadCourse, currentCourse, updateCourse } = useCourse();
  const { isConfigured: isStripeConfigured } = useStripe();
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSaving, setIsSaving] = useState(false);



  useEffect(() => {
    loadCourse(courseId);
  }, [courseId]);

  useEffect(() => {
    if (currentCourse) {
      // Ensure isPaid field is properly initialized if missing
      const courseWithDefaults = {
        ...currentCourse,
        isPaid: currentCourse.isPaid ?? false,
        accessLevel: currentCourse.accessLevel || 'free'
      };
      console.log('📋 CourseSettings: Loading course with defaults:', courseWithDefaults);
      setEditingCourse(courseWithDefaults);
    }
  }, [currentCourse]);

  const handleSaveCourse = async () => {
    if (!editingCourse) return;

    try {
      setIsSaving(true);
      await updateCourse(editingCourse);
      onBack();
    } catch (error) {
      console.error('Failed to save course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCourseInfoChange = (field: string, value: string | boolean) => {
    if (!editingCourse) return;

    console.log(`🔧 CourseSettings: Updating ${field} to:`, value);
    console.log(`🔧 CourseSettings: Current editingCourse.${field}:`, editingCourse[field as keyof Course]);

    const updatedCourse = {
      ...editingCourse,
      [field]: value,
      updatedAt: new Date(),
    };

    console.log(`✅ CourseSettings: Setting new editingCourse:`, updatedCourse);

    setEditingCourse(updatedCourse);
  };



  if (!editingCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading course settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Course Settings</h1>
                <p className="text-sm text-gray-600">{editingCourse.title}</p>
              </div>
            </div>
            <Button onClick={handleSaveCourse} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course Title</label>
                  <Input
                    value={editingCourse.title}
                    onChange={(e) => handleCourseInfoChange('title', e.target.value)}
                    placeholder="Enter course title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={editingCourse.description}
                    onChange={(e) => handleCourseInfoChange('description', e.target.value)}
                    placeholder="Describe what students will learn in this course"
                    rows={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cover Image URL</label>
                  <Input
                    value={editingCourse.coverImage || ''}
                    onChange={(e) => handleCourseInfoChange('coverImage', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {editingCourse.coverImage && (
                    <div className="mt-3">
                      <img
                        src={editingCourse.coverImage}
                        alt="Cover preview"
                        className="w-full h-40 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Access & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Access & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Paid Course</h3>
                    <p className="text-sm text-gray-600">Require payment to access this course</p>
                    <p className="text-xs text-blue-600">Debug: isPaid = {String(editingCourse.isPaid)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {editingCourse.isPaid ? 'Paid' : 'Free'}
                    </span>
                    <Switch
                      checked={Boolean(editingCourse.isPaid)}
                      onCheckedChange={(isPaid) => {
                        console.log('🎯 Switch clicked! isPaid value:', isPaid);
                        console.log('🎯 Current editingCourse.isPaid:', editingCourse.isPaid);
                        console.log('🎯 Updating both isPaid and accessLevel together');


                        // Update both fields together in a single state update
                        const updatedCourse = {
                          ...editingCourse,
                          isPaid,
                          accessLevel: isPaid ? 'paid' : 'free',
                          updatedAt: new Date(),
                        };

                        console.log('🎯 New course state:', updatedCourse);
                        setEditingCourse(updatedCourse);
                      }}
                    />
                  </div>
                </div>

                {editingCourse.isPaid && (
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-blue-900">Stripe Product Integration</h3>
                        <p className="text-sm text-blue-700 mt-1">Map this course to a Stripe product for payment processing</p>
                      </div>

                      {!isStripeConfigured ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-orange-700">
                              Stripe not configured. Please configure Stripe in Extensions first.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Stripe Product ID</label>
                            <Input
                              value={editingCourse.stripeProductId || ''}
                              onChange={(e) => handleCourseInfoChange('stripeProductId', e.target.value)}
                              placeholder="prod_xxxxxxxxxxxxx"
                            />
                            <p className="text-xs text-gray-600 mt-1">
                              Enter the Stripe Product ID that customers will purchase to access this course
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Required Subscription Plan</label>
                            <Select
                              value={editingCourse.requiredPlan || 'basic'}
                              onValueChange={(value) => handleCourseInfoChange('requiredPlan', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Basic Plan</SelectItem>
                                <SelectItem value="pro">Pro Plan</SelectItem>
                                <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-600 mt-1">
                              Minimum subscription plan required to access this course
                            </p>
                          </div>

                          {editingCourse.stripeProductId && (
                            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                              <CheckCircle className="h-4 w-4" />
                              <span>Course linked to Stripe product: {editingCourse.stripeProductId}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!editingCourse.isPaid && (
                  <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                    This course is free for all users. Enable "Paid Course" to set up Stripe product mapping.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags and Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editingCourse.tags?.map((tag) => (
                      <div key={tag} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedTags = editingCourse.tags?.filter(t => t !== tag) || [];
                            setEditingCourse({
                              ...editingCourse,
                              tags: updatedTags.length > 0 ? updatedTags : undefined,
                              updatedAt: new Date(),
                            });
                          }}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          const newTag = input.value.trim();
                          if (newTag && !editingCourse.tags?.includes(newTag)) {
                            setEditingCourse({
                              ...editingCourse,
                              tags: [...(editingCourse.tags || []), newTag],
                              updatedAt: new Date(),
                            });
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const newTag = input.value.trim();
                        if (newTag && !editingCourse.tags?.includes(newTag)) {
                          setEditingCourse({
                            ...editingCourse,
                            tags: [...(editingCourse.tags || []), newTag],
                            updatedAt: new Date(),
                          });
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Access Level</span>
                    <Badge variant={editingCourse.accessLevel === 'free' ? 'secondary' : 'default'}>
                      {editingCourse.accessLevel || 'free'}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment Status</span>
                    <Badge variant={editingCourse.isPaid ? 'default' : 'secondary'}>
                      {editingCourse.isPaid ? 'Paid' : 'Free'}
                    </Badge>
                  </div>

                  {editingCourse.stripeProductId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stripe Product</span>
                      <Badge className="bg-green-100 text-green-800">
                        Linked
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="font-medium">{editingCourse.progress || 0}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Modules</span>
                    <span className="font-medium">{editingCourse.modules.length}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lessons</span>
                    <span className="font-medium">
                      {editingCourse.modules.reduce((total, module) => total + module.lessons.length, 0)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tags</span>
                    <span className="font-medium">{editingCourse.tags?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stripe Integration */}
            {editingCourse.stripeProductId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stripe Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Product ID</span>
                      <span className="font-mono text-xs bg-gray-100 p-1 rounded">
                        {editingCourse.stripeProductId}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Required Plan</span>
                      <Badge variant="outline">
                        {editingCourse.requiredPlan || 'Basic'}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">{editingCourse.createdAt.toLocaleDateString()}</div>
                  </div>

                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <div className="font-medium">{editingCourse.updatedAt.toLocaleDateString()}</div>
                  </div>

                  <div>
                    <span className="text-gray-600">Course ID:</span>
                    <div className="font-mono text-xs bg-gray-100 p-1 rounded">{editingCourse.id}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
