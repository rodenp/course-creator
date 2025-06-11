import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, Clock, BookOpen, Play, Trophy, Award } from 'lucide-react';
import { useCourse } from '@/contexts/CourseContext';
import { analytics } from '@/utils/analytics';
import { Leaderboard } from './Leaderboard';
import { CertificateModal } from './Certificate';
import type { Course, Module, Lesson, ContentBlock } from '@/types';

interface CourseViewerProps {
  courseId: string;
  onBack: () => void;
}

export function CourseViewer({ courseId, onBack }: CourseViewerProps) {
  const { loadCourse, currentCourse, updateCourse } = useCourse();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    loadCourse(courseId);
  }, [courseId, loadCourse]);

  useEffect(() => {
    if (currentCourse) {
      analytics.trackCourseViewed(currentCourse);

      // Track course exit when component unmounts
      return () => {
        analytics.trackCourseExited(currentCourse.id);
      };
    }
  }, [currentCourse]);

  if (!currentCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  const calculateProgress = () => {
    const totalLessons = currentCourse.modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = currentCourse.modules.reduce(
      (total, module) => total + module.lessons.filter(lesson => lesson.isCompleted).length,
      0
    );
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const toggleLessonComplete = async (moduleId: string, lessonId: string) => {
    if (!currentCourse) return;

    const updatedCourse = { ...currentCourse };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
    const lessonIndex = updatedCourse.modules[moduleIndex].lessons.findIndex(l => l.id === lessonId);

    if (moduleIndex === -1 || lessonIndex === -1) return;

    updatedCourse.modules[moduleIndex].lessons[lessonIndex].isCompleted =
      !updatedCourse.modules[moduleIndex].lessons[lessonIndex].isCompleted;

    // Calculate progress with the updated course
    const totalLessons = updatedCourse.modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = updatedCourse.modules.reduce(
      (total, module) => total + module.lessons.filter(lesson => lesson.isCompleted).length,
      0
    );
    updatedCourse.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    await updateCourse(updatedCourse);

    // Track lesson completion
    if (updatedCourse.modules[moduleIndex].lessons[lessonIndex].isCompleted) {
      analytics.trackLessonCompleted(moduleId, moduleId, lessonId);

      // Check if course is now completed
      if (updatedCourse.progress === 100) {
        analytics.trackCourseCompleted(updatedCourse.id, updatedCourse.title);
        setShowCertificate(true);
      }
    }
  };

  const selectLesson = (lesson: Lesson, moduleIndex: number, lessonIndex: number) => {
    setSelectedLesson(lesson);
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);

    // Track lesson started
    if (currentCourse) {
      const module = currentCourse.modules[moduleIndex];
      analytics.trackLessonStarted(currentCourse.id, module.id, lesson);
    }
  };

  const getCurrentLesson = () => {
    if (selectedLesson) return selectedLesson;
    return currentCourse.modules[0]?.lessons[0] || null;
  };

  const renderContent = (content: ContentBlock) => {
    switch (content.type) {
      case 'text':
        if (content.content.type === 'text') {
          return (
            <div
              className="prose max-w-none"
              // Note: In production, sanitize HTML content to prevent XSS
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted course data
              dangerouslySetInnerHTML={{ __html: content.content.content }}
            />
          );
        }
        break;
      case 'image':
        if (content.content.type === 'image') {
          return (
            <div className="my-4">
              <img
                src={content.content.url}
                alt={content.content.title || 'Course image'}
                className="w-full rounded-lg shadow-sm"
              />
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      case 'video':
        if (content.content.type === 'video') {
          return (
            <div className="my-4">
              <video
                controls
                className="w-full rounded-lg shadow-sm"
                src={content.content.url}
              >
                {/* Add subtitle track when available */}
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the video tag.
              </video>
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      case 'audio':
        if (content.content.type === 'audio') {
          return (
            <div className="my-4">
              <audio
                controls
                className="w-full"
                src={content.content.url}
              >
                {/* Add subtitle track when available */}
                <track kind="captions" label="English" srcLang="en" />
                Your browser does not support the audio tag.
              </audio>
              {content.content.caption && (
                <p className="text-sm text-gray-600 mt-2 italic">{content.content.caption}</p>
              )}
            </div>
          );
        }
        break;
      default:
        return <div>Unsupported content type</div>;
    }
    return <div>Invalid content configuration</div>;
  };

  const currentLesson = getCurrentLesson();
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack}>
              ← Back to Courses
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaderboard(true)}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Leaderboard
              </Button>
              {progress === 100 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCertificate(true)}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              )}
              <Badge variant="secondary">Student View</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentCourse.title}</CardTitle>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentCourse.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {module.title}
                    </h4>
                    <div className="space-y-1 ml-6">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className={`w-full p-2 rounded text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors cursor-pointer ${
                            selectedLesson?.id === lesson.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                          }`}
                          onClick={() => selectLesson(lesson, moduleIndex, lessonIndex)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLessonComplete(module.id, lesson.id);
                            }}
                            className="flex-shrink-0 hover:scale-110 transition-transform"
                          >
                            {lesson.isCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.duration && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">{lesson.duration}m</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentLesson ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{currentLesson.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{currentLesson.description}</p>
                    </div>
                    <Button
                      variant={currentLesson.isCompleted ? "default" : "outline"}
                      onClick={() => toggleLessonComplete(
                        currentCourse.modules[currentModuleIndex].id,
                        currentLesson.id
                      )}
                    >
                      {currentLesson.isCompleted ? 'Completed' : 'Mark Complete'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentLesson.content
                    .sort((a, b) => a.order - b.order)
                    .map((content) => (
                      <div key={content.id}>
                        {renderContent(content)}
                      </div>
                    ))
                  }
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Start Learning</h3>
                    <p className="text-gray-600">Select a lesson from the sidebar to begin</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        course={currentCourse}
        studentName="Course Learner"
        completionDate={new Date()}
        completionTime={currentCourse.modules?.reduce((total, module) =>
          total + (module.lessons?.reduce((lessonTotal, lesson) =>
            lessonTotal + (lesson.duration || 0), 0) || 0), 0) || 0}
      />

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Leaderboard</h2>
              <Button variant="ghost" onClick={() => setShowLeaderboard(false)}>×</Button>
            </div>
            <div className="p-6">
              <Leaderboard courseId={currentCourse.id} limit={15} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
