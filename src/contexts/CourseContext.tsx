import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Course, LessonLibraryItem, CourseTemplate, ViewMode } from '@/types';
import { storageService } from '@/utils/storage';
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
  // Course operations
  loadCourses: () => Promise<void>;
  createCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Course>;
  updateCourse: (course: Course) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  cloneCourse: (id: string) => Promise<Course>;
  loadCourse: (id: string) => Promise<void>;

  // View mode
  setViewMode: (mode: ViewMode) => void;

  // Lesson Library
  loadLessonLibrary: () => Promise<void>;
  addToLessonLibrary: (lesson: LessonLibraryItem) => Promise<void>;

  // Templates
  loadTemplates: () => Promise<void>;
  saveAsTemplate: (courseId: string, name: string, description: string) => Promise<void>;

  // Import/Export
  exportCourse: (courseId: string) => Promise<string>;
  importCourse: (courseData: string) => Promise<Course>;

  // Utility
  generateId: () => string;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
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
  }, []);

  const createCourse = async (courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const course: Course = {
        ...courseData,
        id: storageService.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedCourse = await storageService.saveCourse(course);
      dispatch({ type: 'ADD_COURSE', payload: savedCourse });

      // Track analytics
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
      const updatedCourse = { ...course, updatedAt: new Date() };
      await storageService.saveCourse(updatedCourse);
      dispatch({ type: 'UPDATE_COURSE', payload: updatedCourse });

      // Track analytics
      analytics.trackCourseUpdated(updatedCourse, ['content_updated']);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteCourse = async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const courseToDelete = await storageService.getCourse(id);
      await storageService.deleteCourse(id);
      dispatch({ type: 'DELETE_COURSE', payload: id });

      // Track analytics
      if (courseToDelete) {
        analytics.trackCourseDeleted(id, courseToDelete.title);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete course' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cloneCourse = async (id: string): Promise<Course> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const originalCourse = await storageService.getCourse(id);
      if (!originalCourse) throw new Error('Course not found');

      const clonedCourse: Course = {
        ...originalCourse,
        id: storageService.generateId(),
        title: `${originalCourse.title} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const savedCourse = await storageService.saveCourse(clonedCourse);
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
  }, []);

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
  }, []);

  const addToLessonLibrary = useCallback(async (lesson: LessonLibraryItem) => {
    try {
      await storageService.saveLessonToLibrary(lesson);
      await loadLessonLibrary();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add lesson to library' });
    }
  }, [loadLessonLibrary]);

  const loadTemplates = async () => {
    try {
      const templates = await storageService.getTemplates();
      dispatch({ type: 'SET_TEMPLATES', payload: templates });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load templates' });
    }
  };

  const saveAsTemplate = async (courseId: string, name: string, description: string) => {
    try {
      const course = await storageService.getCourse(courseId);
      if (!course) throw new Error('Course not found');

      const template: CourseTemplate = {
        id: storageService.generateId(),
        name,
        description,
        course: {
          title: course.title,
          description: course.description,
          coverImage: course.coverImage,
          modules: course.modules,
          tags: course.tags,
        },
        createdAt: new Date(),
      };

      await storageService.saveTemplate(template);
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

  const importCourse = async (courseData: string): Promise<Course> => {
    try {
      const course = await storageService.importCourse(courseData);
      dispatch({ type: 'ADD_COURSE', payload: course });
      return course;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to import course' });
      throw error;
    }
  };

  const generateId = () => storageService.generateId();

  // Load initial data on mount
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

    initializeData();
  }, []);

  const value: CourseContextType = {
    ...state,
    loadCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    cloneCourse,
    loadCourse,
    setViewMode,
    loadLessonLibrary,
    addToLessonLibrary,
    loadTemplates,
    saveAsTemplate,
    exportCourse,
    importCourse,
    generateId,
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
