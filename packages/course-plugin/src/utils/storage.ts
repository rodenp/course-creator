import type { Course, LessonLibraryItem, CourseTemplate, StorageConfig } from '@/types';

export class StorageService {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    // Backend API implementation
    const response = await fetch(`${this.config.apiUrl}/courses`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async getCourse(id: string): Promise<Course | null> {
    const response = await fetch(`${this.config.apiUrl}/courses/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.ok ? response.json() : null;
  }

  async saveCourse(course: Course): Promise<Course> {
    const response = await fetch(`${this.config.apiUrl}/courses`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(course),
    });
    return response.json();
  }

  async deleteCourse(id: string): Promise<void> {
    await fetch(`${this.config.apiUrl}/courses/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
  }

  // Lesson Library operations
  async getLessonLibrary(): Promise<LessonLibraryItem[]> {
    const response = await fetch(`${this.config.apiUrl}/lesson-library`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async saveLessonToLibrary(lesson: LessonLibraryItem): Promise<void> {
    await fetch(`${this.config.apiUrl}/lesson-library`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(lesson),
    });
  }

  // Course Templates operations
  async getTemplates(): Promise<CourseTemplate[]> {
    const response = await fetch(`${this.config.apiUrl}/templates`, {
      headers: this.getAuthHeaders(),
    });
    return response.json();
  }

  async saveTemplate(template: CourseTemplate): Promise<void> {
    await fetch(`${this.config.apiUrl}/templates`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
  }

  // File upload (for media content)
  async uploadFile(file: File): Promise<string> {
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

      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid course data format');
      }

      let courseToImport = parsedData;
      if (parsedData.exportVersion && parsedData.courses && Array.isArray(parsedData.courses)) {
        if (parsedData.courses.length === 0) {
          throw new Error('No courses found in export file');
        }
        courseToImport = parsedData.courses[0];
      }

      if (!courseToImport.title) {
        throw new Error('Course must have a title');
      }

      // ID generation for course and its nested entities should be handled by the backend.
      // The frontend should send the data structure, and the backend assigns new IDs.
      // For this refactor, we remove frontend ID generation.
      // The backend will need to ensure ID uniqueness and assignment.
      const coursePayload: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'modules'> & { modules: Omit<typeof courseToImport.modules[0], 'id' | 'createdAt' | 'updatedAt' | 'lessons'> & { lessons: Omit<typeof courseToImport.modules[0]['lessons'][0], 'id' | 'createdAt' | 'updatedAt' | 'content'> & { content: Omit<typeof courseToImport.modules[0]['lessons'][0]['content'][0], 'id'>[] }[] }[] } = {
        title: `${courseToImport.title} (Imported)`,
        description: courseToImport.description || '',
        coverImage: courseToImport.coverImage,
        modules: courseToImport.modules ? courseToImport.modules.map((module: any) => ({
          title: module.title || 'Untitled Module',
          description: module.description || '',
          lessons: Array.isArray(module.lessons) ? module.lessons.map((lesson: any) => ({
            title: lesson.title || 'Untitled Lesson',
            description: lesson.description || '',
            content: Array.isArray(lesson.content) ? lesson.content.map((content: any) => ({
              type: content.type || 'text',
              content: content.content || { type: 'text', content: '' }, // Ensure content always has a value
              order: content.order || 1,
            })) : [],
            duration: lesson.duration,
            order: lesson.order || 1,
          })) : [],
          order: module.order || 1,
        })) : [],
        progress: 0,
        tags: courseToImport.tags || [],
        isPaid: courseToImport.isPaid,
        accessLevel: courseToImport.accessLevel,
        requiredPlan: courseToImport.requiredPlan,
        stripeProductId: courseToImport.stripeProductId,
        isTemplate: courseToImport.isTemplate,
      };

      // The saveCourse method is expected to handle a Course object that might include an ID for updates,
      // or no ID for creation (where backend assigns it).
      // We are sending a payload that's almost a Course but without frontend generated IDs.
      // This implies the backend's saveCourse/createCourse endpoint handles ID generation.
      return this.saveCourse(coursePayload as unknown as Course);

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
}
