import type { Course, LessonLibraryItem, CourseTemplate, StorageConfig } from '@/types';

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    if (this.config.type === 'localStorage') {
      const courses = localStorage.getItem('courses');
      return courses ? JSON.parse(courses).map(this.deserializeDates) : [];
    }

    // Backend API implementation
    const response = await fetch(`${this.config.apiUrl}/courses`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async getCourse(id: string): Promise<Course | null> {
    if (this.config.type === 'localStorage') {
      const courses = await this.getCourses();
      return courses.find(c => c.id === id) || null;
    }

    const response = await fetch(`${this.config.apiUrl}/courses/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.ok ? response.json() : null;
  }

  async saveCourse(course: Course): Promise<Course> {
    if (this.config.type === 'localStorage') {
      const courses = await this.getCourses();
      const existingIndex = courses.findIndex(c => c.id === course.id);

      if (existingIndex >= 0) {
        courses[existingIndex] = { ...course, updatedAt: new Date() };
      } else {
        courses.push({ ...course, createdAt: new Date(), updatedAt: new Date() });
      }

      localStorage.setItem('courses', JSON.stringify(courses));
      return course;
    }

    const response = await fetch(`${this.config.apiUrl}/courses`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    return response.json();
  }

  async deleteCourse(id: string): Promise<void> {
    if (this.config.type === 'localStorage') {
      const courses = await this.getCourses();
      const filtered = courses.filter(c => c.id !== id);
      localStorage.setItem('courses', JSON.stringify(filtered));
      return;
    }

    await fetch(`${this.config.apiUrl}/courses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Lesson Library operations
  async getLessonLibrary(): Promise<LessonLibraryItem[]> {
    if (this.config.type === 'localStorage') {
      const library = localStorage.getItem('lessonLibrary');
      return library ? JSON.parse(library).map(this.deserializeDates) : [];
    }

    const response = await fetch(`${this.config.apiUrl}/lesson-library`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async saveLessonToLibrary(lesson: LessonLibraryItem): Promise<void> {
    if (this.config.type === 'localStorage') {
      const library = await this.getLessonLibrary();
      const existingIndex = library.findIndex(l => l.id === lesson.id);

      if (existingIndex >= 0) {
        library[existingIndex] = lesson;
      } else {
        library.push({ ...lesson, createdAt: new Date() });
      }

      localStorage.setItem('lessonLibrary', JSON.stringify(library));
    } else {
      await fetch(`${this.config.apiUrl}/lesson-library`, {
        method: 'POST',
        headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      });
    }
  }

  // Course Templates operations
  async getTemplates(): Promise<CourseTemplate[]> {
    if (this.config.type === 'localStorage') {
      const templates = localStorage.getItem('courseTemplates');
      return templates ? JSON.parse(templates).map(this.deserializeDates) : [];
    }

    const response = await fetch(`${this.config.apiUrl}/templates`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async saveTemplate(template: CourseTemplate): Promise<void> {
    if (this.config.type === 'localStorage') {
      const templates = await this.getTemplates();
      templates.push({ ...template, createdAt: new Date() });
      localStorage.setItem('courseTemplates', JSON.stringify(templates));
      return;
    }

    await fetch(`${this.config.apiUrl}/templates`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
  }

  // File upload (for media content)
  async uploadFile(file: File): Promise<string> {
    if (this.config.type === 'localStorage') {
      // For localStorage, we'll use base64 encoding for images
      // For production, you'd want to use a file hosting service
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.config.apiUrl}/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    const result = await response.json();
    return result.url;
  }

  // Export/Import functionality
  async exportCourse(courseId: string): Promise<string> {
    const course = await this.getCourse(courseId);
    if (!course) throw new Error('Course not found');

    return JSON.stringify(course, null, 2);
  }

  async importCourse(courseData: string): Promise<Course> {
    try {
      const parsedData = JSON.parse(courseData);

      // Validate that it's a course object
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid course data format');
      }

      // Check if it's a bulk export format
      let courseToImport = parsedData;
      if (parsedData.exportVersion && parsedData.courses && Array.isArray(parsedData.courses)) {
        if (parsedData.courses.length === 0) {
          throw new Error('No courses found in export file');
        }
        // For bulk export, take the first course (could be enhanced to let user choose)
        courseToImport = parsedData.courses[0];
      }

      // Ensure required fields exist
      if (!courseToImport.title) {
        throw new Error('Course must have a title');
      }

      // Create new course with regenerated IDs
      const course: Course = {
        id: this.generateId(),
        title: `${courseToImport.title} (Imported)`,
        description: courseToImport.description || '',
        coverImage: courseToImport.coverImage,
        modules: courseToImport.modules ? courseToImport.modules.map((module: Record<string, unknown>) => ({
          id: this.generateId(),
          title: module.title || 'Untitled Module',
          description: module.description || '',
          lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson: Record<string, unknown>) => ({
            id: this.generateId(),
            title: lesson.title || 'Untitled Lesson',
            description: lesson.description || '',
            content: Array.isArray(lesson.content) ? lesson.content.map((content: Record<string, unknown>) => ({
              id: this.generateId(),
              type: content.type || 'text',
              content: content.content || { type: 'text', content: '' },
              order: content.order || 1,
            })) : [],
            duration: lesson.duration,
            order: lesson.order || 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })) : [],
          order: module.order || 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) : [],
        progress: 0, // Reset progress for imported course
        tags: courseToImport.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return this.saveCourse(course);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        throw new Error('Invalid JSON format. Please check your course data.');
      }
      throw parseError;
    }
  }

  // Utility methods
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  private deserializeDates(obj: Record<string, unknown>): Record<string, unknown> {
    const result = { ...obj };
    if (result.createdAt) result.createdAt = new Date(result.createdAt as string);
    if (result.updatedAt) result.updatedAt = new Date(result.updatedAt as string);

    // Handle nested objects
    if (result.modules && Array.isArray(result.modules)) {
      result.modules = result.modules.map((module: Record<string, unknown>) => ({
        ...module,
        createdAt: new Date(module.createdAt as string),
        updatedAt: new Date(module.updatedAt as string),
        lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson: Record<string, unknown>) => ({
          ...lesson,
          createdAt: new Date(lesson.createdAt as string),
          updatedAt: new Date(lesson.updatedAt as string),
        })) : [],
      }));
    }

    // Handle Stripe settings dates
    if (result.stripeSettings && typeof result.stripeSettings === 'object') {
      const stripeSettings = result.stripeSettings as Record<string, unknown>;
      result.stripeSettings = {
        ...stripeSettings,
        createdAt: stripeSettings.createdAt ? new Date(stripeSettings.createdAt as string) : undefined,
        updatedAt: stripeSettings.updatedAt ? new Date(stripeSettings.updatedAt as string) : undefined,
        plans: Array.isArray(stripeSettings.plans) ? stripeSettings.plans.map((plan: Record<string, unknown>) => ({
          ...plan,
          createdAt: plan.createdAt ? new Date(plan.createdAt as string) : new Date(),
          updatedAt: plan.updatedAt ? new Date(plan.updatedAt as string) : new Date(),
        })) : []
      };
    }

    return result;
  }

  generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Default storage configuration
export const getStorageConfig = (): StorageConfig => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const apiKey = import.meta.env.VITE_API_KEY;

  return {
    type: apiUrl ? 'backend' : 'localStorage',
    apiUrl,
    apiKey,
  };
};

export const storageService = new StorageService(getStorageConfig());
