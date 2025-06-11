import type { Course, Module, Lesson } from '@/types';

// Analytics event types
export interface AnalyticsEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  eventType: string;
  eventName: string;
  properties: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalViews: number;
  totalEdits: number;
  totalModules: number;
  totalLessons: number;
  averageSessionTime: number;
  completionRate: number;
  lastAccessed: Date;
  createdDate: Date;
  totalUsers: number;
  engagementScore: number;
}

export interface UserAnalytics {
  userId: string;
  sessionId: string;
  totalSessions: number;
  totalTimeSpent: number; // in minutes
  coursesCreated: number;
  coursesViewed: number;
  coursesCompleted: number;
  modulesCompleted: number;
  lessonsCompleted: number;
  averageSessionTime: number;
  lastActive: Date;
  firstVisit: Date;
  deviceInfo: string;
  browserInfo: string;
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface LearningAnalytics {
  courseId: string;
  moduleId?: string;
  lessonId?: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  timeSpent: number; // in seconds
  completed: boolean;
  progress: number; // 0-100
  interactions: number;
  scrollDepth?: number;
  exitPoint?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string;
  private events: AnalyticsEvent[] = [];
  private sessionStartTime: Date;
  private currentCourseStartTime?: Date;
  private currentLessonStartTime?: Date;
  private pageViewStartTime: Date;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.sessionStartTime = new Date();
    this.pageViewStartTime = new Date();
    this.loadStoredEvents();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getUserId(): string {
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('analytics_user_id', userId);
    }
    return userId;
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        const events = JSON.parse(stored);
        this.events = events.map((event: { timestamp: string; [key: string]: unknown }) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load stored analytics events:', error);
    }
  }

  private saveEvents(): void {
    try {
      // Keep only last 1000 events to prevent storage bloat
      const eventsToStore = this.events.slice(-1000);
      localStorage.setItem('analytics_events', JSON.stringify(eventsToStore));
    } catch (error) {
      console.warn('Failed to save analytics events:', error);
    }
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('system', 'page_hidden', {});
      } else {
        this.trackEvent('system', 'page_visible', {});
        this.pageViewStartTime = new Date();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('system', 'session_end', {
        sessionDuration: Date.now() - this.sessionStartTime.getTime(),
        totalEvents: this.events.length
      });
      this.saveEvents();
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent('error', 'javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  private trackEvent(eventType: string, eventName: string, properties: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      eventType,
      eventName,
      properties,
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.events.push(event);

    // Periodically save events
    if (this.events.length % 10 === 0) {
      this.saveEvents();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Course Management Analytics
  trackCourseCreated(course: Course): void {
    this.trackEvent('course', 'course_created', {
      courseId: course.id,
      courseName: course.title,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0),
      hasCoverImage: !!course.coverImage,
      tags: course.tags
    });
  }

  trackCourseUpdated(course: Course, changes: string[]): void {
    this.trackEvent('course', 'course_updated', {
      courseId: course.id,
      courseName: course.title,
      changes,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0)
    });
  }

  trackCourseDeleted(courseId: string, courseName: string): void {
    this.trackEvent('course', 'course_deleted', {
      courseId,
      courseName
    });
  }

  trackCourseViewed(course: Course): void {
    this.currentCourseStartTime = new Date();
    this.trackEvent('course', 'course_viewed', {
      courseId: course.id,
      courseName: course.title,
      progress: course.progress || 0,
      moduleCount: course.modules.length,
      lessonCount: course.modules.reduce((total, module) => total + module.lessons.length, 0)
    });
  }

  trackCourseExited(courseId: string, timeSpent?: number): void {
    const actualTimeSpent = timeSpent || (this.currentCourseStartTime ?
      Date.now() - this.currentCourseStartTime.getTime() : 0);

    this.trackEvent('course', 'course_exited', {
      courseId,
      timeSpent: Math.round(actualTimeSpent / 1000), // in seconds
      timeSpentMinutes: Math.round(actualTimeSpent / 60000) // in minutes
    });
  }

  trackCourseCompleted(courseId: string, courseName: string): void {
    this.trackEvent('course', 'course_completed', {
      courseId,
      courseName,
      completionTimestamp: Date.now()
    });
  }

  // Module Analytics
  trackModuleCreated(courseId: string, module: Module): void {
    this.trackEvent('module', 'module_created', {
      courseId,
      moduleId: module.id,
      moduleName: module.title,
      lessonCount: module.lessons.length,
      moduleOrder: module.order
    });
  }

  trackModuleReordered(courseId: string, moduleId: string, oldOrder: number, newOrder: number): void {
    this.trackEvent('module', 'module_reordered', {
      courseId,
      moduleId,
      oldOrder,
      newOrder
    });
  }

  // Lesson Analytics
  trackLessonCreated(courseId: string, moduleId: string, lesson: Lesson): void {
    this.trackEvent('lesson', 'lesson_created', {
      courseId,
      moduleId,
      lessonId: lesson.id,
      lessonName: lesson.title,
      contentBlockCount: lesson.content.length,
      duration: lesson.duration,
      lessonOrder: lesson.order
    });
  }

  trackLessonStarted(courseId: string, moduleId: string, lesson: Lesson): void {
    this.currentLessonStartTime = new Date();
    this.trackEvent('lesson', 'lesson_started', {
      courseId,
      moduleId,
      lessonId: lesson.id,
      lessonName: lesson.title,
      contentBlockCount: lesson.content.length
    });
  }

  trackLessonCompleted(courseId: string, moduleId: string, lessonId: string, timeSpent?: number): void {
    const actualTimeSpent = timeSpent || (this.currentLessonStartTime ?
      Date.now() - this.currentLessonStartTime.getTime() : 0);

    this.trackEvent('lesson', 'lesson_completed', {
      courseId,
      moduleId,
      lessonId,
      timeSpent: Math.round(actualTimeSpent / 1000), // in seconds
      timeSpentMinutes: Math.round(actualTimeSpent / 60000) // in minutes
    });
  }

  trackLessonReordered(courseId: string, moduleId: string, lessonId: string, oldOrder: number, newOrder: number): void {
    this.trackEvent('lesson', 'lesson_reordered', {
      courseId,
      moduleId,
      lessonId,
      oldOrder,
      newOrder
    });
  }

  // Content Analytics
  trackContentBlockAdded(courseId: string, moduleId: string, lessonId: string, contentType: string): void {
    this.trackEvent('content', 'content_block_added', {
      courseId,
      moduleId,
      lessonId,
      contentType
    });
  }

  trackContentBlockEdited(courseId: string, moduleId: string, lessonId: string, contentType: string): void {
    this.trackEvent('content', 'content_block_edited', {
      courseId,
      moduleId,
      lessonId,
      contentType
    });
  }

  // Template Analytics
  trackTemplateCreated(templateId: string, templateName: string, sourceId: string): void {
    this.trackEvent('template', 'template_created', {
      templateId,
      templateName,
      sourceCourseId: sourceId
    });
  }

  trackTemplateUsed(templateId: string, templateName: string, newCourseId: string): void {
    this.trackEvent('template', 'template_used', {
      templateId,
      templateName,
      newCourseId
    });
  }

  // Import/Export Analytics
  trackCourseExported(courseId: string, courseName: string, exportType: 'single' | 'bulk'): void {
    this.trackEvent('import_export', 'course_exported', {
      courseId,
      courseName,
      exportType
    });
  }

  trackCourseImported(courseId: string, courseName: string, importType: 'file' | 'text'): void {
    this.trackEvent('import_export', 'course_imported', {
      courseId,
      courseName,
      importType
    });
  }

  // User Interaction Analytics
  trackDragAndDrop(action: 'module_reorder' | 'lesson_reorder', courseId: string): void {
    this.trackEvent('interaction', 'drag_and_drop', {
      action,
      courseId
    });
  }

  trackKeyboardShortcut(shortcut: string, action: string): void {
    this.trackEvent('interaction', 'keyboard_shortcut', {
      shortcut,
      action
    });
  }

  trackAutoSave(courseId: string, success: boolean): void {
    this.trackEvent('system', 'auto_save', {
      courseId,
      success
    });
  }

  trackSearchUsed(searchTerm: string, resultsCount: number): void {
    this.trackEvent('interaction', 'search_used', {
      searchTerm,
      resultsCount
    });
  }

  trackFilterUsed(filterType: string, resultsCount: number): void {
    this.trackEvent('interaction', 'filter_used', {
      filterType,
      resultsCount
    });
  }

  // Analytics Data Retrieval
  getEvents(startDate?: Date, endDate?: Date): AnalyticsEvent[] {
    let filteredEvents = this.events;

    if (startDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= startDate);
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= endDate);
    }

    return filteredEvents;
  }

  getCourseAnalytics(courseId: string): CourseAnalytics | null {
    const courseEvents = this.events.filter(event =>
      event.properties.courseId === courseId
    );

    if (courseEvents.length === 0) return null;

    const viewEvents = courseEvents.filter(event => event.eventName === 'course_viewed');
    const editEvents = courseEvents.filter(event => event.eventName === 'course_updated');
    const completionEvents = courseEvents.filter(event => event.eventName === 'lesson_completed');

    // Get course info from latest event
    const latestEvent = courseEvents[courseEvents.length - 1];
    const courseName = String(latestEvent.properties.courseName || 'Unknown Course');

    return {
      courseId,
      courseName,
      totalViews: viewEvents.length,
      totalEdits: editEvents.length,
      totalModules: Number(latestEvent.properties.moduleCount) || 0,
      totalLessons: Number(latestEvent.properties.lessonCount) || 0,
      averageSessionTime: this.calculateAverageSessionTime(courseEvents),
      completionRate: this.calculateCompletionRate(courseId),
      lastAccessed: courseEvents[courseEvents.length - 1]?.timestamp || new Date(),
      createdDate: courseEvents.find(e => e.eventName === 'course_created')?.timestamp || new Date(),
      totalUsers: new Set(courseEvents.map(e => e.userId)).size,
      engagementScore: this.calculateEngagementScore(courseEvents)
    };
  }

  getUserAnalytics(): UserAnalytics {
    const userEvents = this.events.filter(event => event.userId === this.userId);
    const sessions = new Set(userEvents.map(event => event.sessionId));

    return {
      userId: this.userId,
      sessionId: this.sessionId,
      totalSessions: sessions.size,
      totalTimeSpent: this.calculateTotalTimeSpent(userEvents),
      coursesCreated: userEvents.filter(e => e.eventName === 'course_created').length,
      coursesViewed: new Set(userEvents.filter(e => e.eventName === 'course_viewed').map(e => e.properties.courseId)).size,
      coursesCompleted: this.calculateCoursesCompleted(userEvents),
      modulesCompleted: userEvents.filter(e => e.eventName === 'module_completed').length,
      lessonsCompleted: userEvents.filter(e => e.eventName === 'lesson_completed').length,
      averageSessionTime: this.calculateAverageSessionTime(userEvents),
      lastActive: userEvents[userEvents.length - 1]?.timestamp || new Date(),
      firstVisit: userEvents[0]?.timestamp || new Date(),
      deviceInfo: this.getDeviceInfo(),
      browserInfo: this.getBrowserInfo(),
      engagementLevel: this.calculateEngagementLevel(userEvents)
    };
  }

  // Helper calculation methods
  private calculateAverageSessionTime(events: AnalyticsEvent[]): number {
    const sessionTimes: number[] = [];
    const sessionGroups = this.groupEventsBySession(events);

    for (const sessionEvents of Object.values(sessionGroups)) {
      if (sessionEvents.length > 1) {
        const startTime = sessionEvents[0].timestamp.getTime();
        const endTime = sessionEvents[sessionEvents.length - 1].timestamp.getTime();
        sessionTimes.push((endTime - startTime) / 60000); // in minutes
      }
    }

    return sessionTimes.length > 0 ?
      sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length : 0;
  }

  private calculateCompletionRate(courseId: string): number {
    const courseEvents = this.events.filter(event =>
      event.properties.courseId === courseId
    );

    const lessonsStarted = new Set(
      courseEvents.filter(e => e.eventName === 'lesson_started')
        .map(e => e.properties.lessonId)
    ).size;

    const lessonsCompleted = new Set(
      courseEvents.filter(e => e.eventName === 'lesson_completed')
        .map(e => e.properties.lessonId)
    ).size;

    return lessonsStarted > 0 ? (lessonsCompleted / lessonsStarted) * 100 : 0;
  }

  private calculateEngagementScore(events: AnalyticsEvent[]): number {
    // Engagement score based on various factors
    const factors = {
      totalEvents: Math.min(events.length / 100, 1) * 20, // max 20 points
      uniqueDays: Math.min(this.getUniqueDays(events) / 7, 1) * 25, // max 25 points
      eventVariety: Math.min(this.getUniqueEventTypes(events) / 10, 1) * 25, // max 25 points
      sessionLength: Math.min(this.calculateAverageSessionTime(events) / 30, 1) * 30 // max 30 points
    };

    return Math.round(Object.values(factors).reduce((sum, score) => sum + score, 0));
  }

  private calculateTotalTimeSpent(events: AnalyticsEvent[]): number {
    // Calculate total time spent based on session durations
    const sessionGroups = this.groupEventsBySession(events);
    let totalTime = 0;

    for (const sessionEvents of Object.values(sessionGroups)) {
      if (sessionEvents.length > 1) {
        const startTime = sessionEvents[0].timestamp.getTime();
        const endTime = sessionEvents[sessionEvents.length - 1].timestamp.getTime();
        totalTime += (endTime - startTime) / 60000; // in minutes
      }
    }

    return totalTime;
  }

  private calculateCoursesCompleted(events: AnalyticsEvent[]): number {
    // A course is considered completed if user has completed all lessons
    const courseCompletions = new Set();
    for (const event of events.filter(e => e.eventName === 'lesson_completed')) {
      // This is a simplified version - in practice you'd need to track completion properly
      courseCompletions.add(event.properties.courseId);
    }
    return courseCompletions.size;
  }

  private groupEventsBySession(events: AnalyticsEvent[]): Record<string, AnalyticsEvent[]> {
    return events.reduce((groups, event) => {
      const sessionId = event.sessionId;
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      groups[sessionId].push(event);
      return groups;
    }, {} as Record<string, AnalyticsEvent[]>);
  }

  private getUniqueDays(events: AnalyticsEvent[]): number {
    const days = new Set(
      events.map(event => event.timestamp.toDateString())
    );
    return days.size;
  }

  private getUniqueEventTypes(events: AnalyticsEvent[]): number {
    const types = new Set(events.map(event => event.eventName));
    return types.size;
  }

  private calculateEngagementLevel(events: AnalyticsEvent[]): 'low' | 'medium' | 'high' {
    const score = this.calculateEngagementScore(events);
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private getDeviceInfo(): string {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od)/.test(ua)) return 'Mobile';
    if (/Tablet|iPad/.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }



  // Get analytics data (for internal use)
  getAnalyticsData(startDate?: Date, endDate?: Date) {
    let events = [...this.events];

    if (startDate) {
      events = events.filter(event => event.timestamp >= startDate);
    }

    if (endDate) {
      events = events.filter(event => event.timestamp <= endDate);
    }

    const userAnalytics = this.getUserAnalytics();

    return {
      exportDate: new Date().toISOString(),
      userId: this.userId,
      sessionId: this.sessionId,
      userAnalytics,
      events,
      summary: {
        totalEvents: events.length,
        dateRange: {
          start: startDate?.toISOString() || events[0]?.timestamp.toISOString(),
          end: endDate?.toISOString() || events[events.length - 1]?.timestamp.toISOString()
        },
        eventTypes: this.getEventTypeSummary(events)
      }
    };
  }

  // Export analytics data
  exportAnalytics(startDate?: Date, endDate?: Date): string {
    return JSON.stringify(this.getAnalyticsData(startDate, endDate), null, 2);
  }

  private getEventTypeSummary(events: AnalyticsEvent[]): Record<string, number> {
    return events.reduce((summary, event) => {
      const key = `${event.eventType}.${event.eventName}`;
      summary[key] = (summary[key] || 0) + 1;
      return summary;
    }, {} as Record<string, number>);
  }

  // Clear analytics data (for privacy compliance)
  clearAnalytics(): void {
    this.events = [];
    localStorage.removeItem('analytics_events');
    localStorage.removeItem('analytics_user_id');
    this.trackEvent('system', 'analytics_cleared', {});
  }
}

// Create and export a singleton instance
export const analytics = new AnalyticsService();
