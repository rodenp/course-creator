import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Course, LessonLibraryItem, CourseTemplate, ViewMode } from '@/types';
// Removed global storageService import, will use prop instead
// import { storageService } from '@/utils/storage';
import { StorageService } from '@/utils/storage'; // Import the class for type annotation
import { analytics } from '@/utils/analytics';

interface CourseState {
  courses: Course[];
  lessonLibrary: LessonLibraryItem[];
  templates: CourseTemplate[];
  currentCourse: Course | null;
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
}

type CourseAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COURSES'; payload: Course[] }
  | { type: 'SET_CURRENT_COURSE'; payload: Course | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ADD_COURSE'; payload: Course }
  | { type: 'UPDATE_COURSE'; payload: Course }
  | { type: 'DELETE_COURSE'; payload: string }
  | { type: 'SET_LESSON_LIBRARY'; payload: LessonLibraryItem[] }
  | { type: 'SET_TEMPLATES'; payload: CourseTemplate[] };

const initialState: CourseState = {
  courses: [],
  lessonLibrary: [],
  templates: [],
  currentCourse: null,
  viewMode: 'view',
  loading: false,
  error: null,
};

function courseReducer(state: CourseState, action: CourseAction): CourseState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_COURSES':
      return { ...state, courses: action.payload };
    case 'SET_CURRENT_COURSE':
      return { ...state, currentCourse: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'ADD_COURSE':
      return { ...state, courses: [...state.courses, action.payload] };
    case 'UPDATE_COURSE':
      return {
        ...state,
        courses: state.courses.map(course =>
          course.id === action.payload.id ? action.payload : course
        ),
        currentCourse: state.currentCourse?.id === action.payload.id ? action.payload : state.currentCourse,
      };
    case 'DELETE_COURSE':
      return {
        ...state,
        courses: state.courses.filter(course => course.id !== action.payload),
        currentCourse: state.currentCourse?.id === action.payload ? null : state.currentCourse,
      };
    case 'SET_LESSON_LIBRARY':
      return { ...state, lessonLibrary: action.payload };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    default:
      return state;
  }
}

interface CourseContextType extends CourseState {
  loadCourses: () => Promise<void>;
  createCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>, authorId: string) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  cloneCourse: (id: string, authorId: string) => Promise<Course>;
  loadCourse: (id: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  loadLessonLibrary: () => Promise<void>;
  addToLessonLibrary: (lesson: LessonLibraryItem) => Promise<void>;
  loadTemplates: () => Promise<void>;
  saveAsTemplate: (courseId: string, name: string, description: string, authorId: string) => Promise<void>;
  exportCourse: (courseId: string) => Promise<string>;
  importCourse: (courseData: string, authorId: string) => Promise<Course>;
  // generateId removed as it's backend's responsibility
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

interface CourseProviderProps {
  children: ReactNode;
  storageService: StorageService; // Instance passed as prop
  userId: string; // User ID for authorship
}

export function CourseProvider({ children, storageService, userId }: CourseProviderProps) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  const loadCourses = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const courses = await storageService.getCourses();
      dispatch({ type: 'SET_COURSES', payload: courses });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load courses' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storageService]);

  // Modified to accept authorId
  const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>, authorId: string): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      // Backend will handle ID, createdAt, updatedAt. authorId is passed.
      const coursePayload = { ...courseData, authorId };

      // Type assertion needed if backend expects full Course object but frontend sends partial for creation
      const savedCourse = await storageService.saveCourse(coursePayload as Course);
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });
      analytics.trackCourseCreated(savedCourse);
      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create course' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateCourse = useCallback(async (course: Course) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const updatedCourseData = { ...course, updatedAt: new Date() };
      // Assuming ownership/permissions are checked by the backend via API route
      await storageService.saveCourse(updatedCourseData);
      dispatch({ type: 'UPDATE_COURSE', payload: updatedCourseData });
      analytics.trackCourseUpdated(updatedCourseData, ['content_updated']);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storageService]);

  const deleteCourse = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const courseToDelete = await storageService.getCourse(id); // To get title for analytics
      // Assuming ownership/permissions are checked by the backend via API route
      await storageService.deleteCourse(id);
      dispatch({ type: 'DELETE_COURSE', payload: id });
      if (courseToDelete) {
        analytics.trackCourseDeleted(id, courseToDelete.title);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Modified to accept authorId for the new cloned course
  const cloneCourse = async (id: string, authorId: string): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const originalCourse = await storageService.getCourse(id);
      if (!originalCourse) throw new Error('Course not found');

      // Backend handles new ID generation. Frontend sends data for cloning.
      const { id: originalId, authorId: originalAuthorId, createdAt, updatedAt, ...clonableData } = originalCourse;
      const clonedCourseData = {
        ...clonableData,
        title: `${originalCourse.title} (Copy)`,
        authorId: authorId, // New author for the cloned course
      };

      const savedCourse = await storageService.saveCourse(clonedCourseData as Course); // saveCourse expects full Course, backend creates new ID
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });
      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clone course' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadCourse = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const course = await storageService.getCourse(id);
      dispatch({ type: 'SET_CURRENT_COURSE', payload: course });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [storageService]);

  const setViewMode = (mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const loadLessonLibrary = useCallback(async () => {
    try {
      const library = await storageService.getLessonLibrary();
      dispatch({ type: 'SET_LESSON_LIBRARY', payload: library });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load lesson library' });
    }
  }, [storageService]);

  const addToLessonLibrary = useCallback(async (lesson: LessonLibraryItem) => {
    try {
      // Backend handles ID generation for new library items
      await storageService.saveLessonToLibrary(lesson);
      await loadLessonLibrary(); // Refresh library
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add lesson to library' });
    }
  }, [storageService, loadLessonLibrary]);

  const loadTemplates = useCallback(async () => {
    try {
      const templates = await storageService.getTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load templates' });
    }
  }, [storageService]);

  // Modified to accept authorId for the new template
  const saveAsTemplate = async (courseId: string, name: string, description: string, authorId: string) => {
    try {
      const course = await storageService.getCourse(courseId);
      if (!course) throw new Error('Course not found');

      const templateData: Omit<CourseTemplate, 'id' | 'createdAt'> = {
        name,
        description,
        course: { // This structure matches CourseTemplate's 'course' field
          title: course.title,
          description: course.description,
          coverImage: course.coverImage,
          modules: course.modules,
          tags: course.tags,
          isPaid: course.isPaid,
          accessLevel: course.accessLevel,
          requiredPlan: course.requiredPlan,
          stripeProductId: course.stripeProductId,
          // authorId for the template content itself can be the original author or system
        },
        // authorId: authorId, // If templates themselves are user-owned
      };
      // Backend will assign ID to the template.
      await storageService.saveTemplate(templateData as CourseTemplate);
      await loadTemplates();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to save template' });
    }
  };

  const exportCourse = async (courseId: string): Promise<string> => {
    try {
      return await storageService.exportCourse(courseId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to export course' });
      throw error;
    }
  };

  // Modified to accept authorId for the imported course
  const importCourse = async (courseData: string, authorId: string): Promise<Course> => {
    try {
      // The storageService.importCourse method now doesn't assign IDs.
      // It prepares a payload for the backend to create a new course with a new author.
      const courseToCreate = await storageService.importCourse(courseData); // This will be Omit<Course, 'id' ...>

      const coursePayloadWithAuthor = {
        ...courseToCreate,
        authorId: authorId,
      };

      // Assuming the backend's saveCourse (POST to /api/courses) can handle this payload
      // and will create all nested structures with new IDs.
      const savedCourse = await storageService.saveCourse(coursePayloadWithAuthor as Course);

      dispatch({ type: 'ADD_COURSE', payload: savedCourse });
      return savedCourse;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to import course' });
      throw error;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const [courses, library, templates] = await Promise.all([
          storageService.getCourses(),
          storageService.getLessonLibrary(),
          storageService.getTemplates(),
        ]);
        dispatch({ type: 'SET_COURSES', payload: courses });
        dispatch({ type: 'SET_LESSON_LIBRARY', payload: library });
        dispatch({ type: 'SET_TEMPLATES', payload: templates });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    if (storageService) { // Only initialize if storageService is provided
        initializeData();
    }
  }, [storageService, loadCourses, loadLessonLibrary, loadTemplates]); // Dependencies ensure re-init if service changes

  const value: CourseContextType = {
    ...state,
    loadCourses,
    createCourse: (courseData, authorId = userId) => createCourse(courseData, authorId),
    updateCourse,
    deleteCourse,
    cloneCourse: (id, authorId = userId) => cloneCourse(id, authorId),
    loadCourse,
    setViewMode,
    loadLessonLibrary,
    addToLessonLibrary,
    loadTemplates,
    saveAsTemplate: (courseId, name, description, authorId = userId) => saveAsTemplate(courseId, name, description, authorId),
    exportCourse,
    importCourse: (courseData, authorId = userId) => importCourse(courseData, authorId),
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse(): CourseContextType {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
