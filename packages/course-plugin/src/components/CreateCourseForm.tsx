import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCourse } from '@/contexts/CourseContext';
import type { Course } from '@/types';
import { Upload, X } from 'lucide-react';
import { storageService } from '@/utils/storage';

interface CreateCourseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateCourseForm({ onSuccess, onCancel }: CreateCourseFormProps) {
  const { createCourse } = useCourse();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    tags: [] as string[],
    isTemplate: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const url = await storageService.uploadFile(file);
      handleInputChange('coverImage', url);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        coverImage: formData.coverImage || undefined,
        modules: [],
        progress: 0,
        isTemplate: formData.isTemplate,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      await createCourse(courseData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Title */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Course Title *
        </label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter course title"
          required
        />
      </div>

      {/* Course Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description *
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what students will learn in this course"
          rows={4}
          required
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Cover Image
        </label>

        {/* URL Input */}
        <div className="space-y-3">
          <Input
            type="url"
            value={formData.coverImage}
            onChange={(e) => handleInputChange('coverImage', e.target.value)}
            placeholder="Enter image URL or upload a file"
          />

          {/* File Upload */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">or</span>
            <label className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingImage}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Image Preview */}
        {formData.coverImage && (
          <div className="mt-3">
            <img
              src={formData.coverImage}
              alt="Cover preview"
              className="w-full h-32 object-cover rounded-md border"
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tags
        </label>

        {/* Tag Input */}
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!tagInput.trim()}
          >
            Add
          </Button>
        </div>

        {/* Tags Display */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Template Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isTemplate"
          checked={formData.isTemplate}
          onChange={(e) => handleInputChange('isTemplate', e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="isTemplate" className="text-sm font-medium">
          Save as template
        </label>
        <span className="text-xs text-gray-500">
          (Templates can be reused to create new courses)
        </span>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
