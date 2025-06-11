import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Award, Calendar, Clock } from 'lucide-react';
import type { Course } from '@/types';

interface CertificateProps {
  course: Course;
  studentName?: string;
  completionDate?: Date;
  completionTime?: number; // in minutes
  onDownload?: () => void;
  onShare?: () => void;
}

export function Certificate({
  course,
  studentName = 'Course Learner',
  completionDate = new Date(),
  completionTime = 0,
  onDownload,
  onShare
}: CertificateProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`;
  };

  const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
  const estimatedDuration = course.modules?.reduce((total, module) =>
    total + (module.lessons?.reduce((lessonTotal, lesson) => lessonTotal + (lesson.duration || 0), 0) || 0), 0
  ) || 0;

  const certificateId = `CB-${course.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Certificate Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-2xl">
        {/* Decorative Border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-10" />
        <div className="absolute inset-2 border-2 border-gold border-opacity-30 rounded-lg" />

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-blue-300" />
        <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-blue-300" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-blue-300" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-blue-300" />

        <CardContent className="relative p-16 text-center">
          {/* Header */}
          <div className="mb-8">
            <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Certificate of Completion</h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto" />
          </div>

          {/* Main Content */}
          <div className="mb-8 space-y-6">
            <p className="text-lg text-gray-600">This is to certify that</p>

            <div className="py-4 px-8 bg-white bg-opacity-60 rounded-lg border border-blue-200 inline-block">
              <h2 className="text-3xl font-bold text-gray-800">{studentName}</h2>
            </div>

            <p className="text-lg text-gray-600">has successfully completed the course</p>

            <div className="py-4 px-8 bg-white bg-opacity-60 rounded-lg border border-blue-200 inline-block max-w-2xl">
              <h3 className="text-2xl font-bold text-blue-800">{course.title}</h3>
              {course.description && (
                <p className="text-sm text-gray-600 mt-2 italic">{course.description}</p>
              )}
            </div>
          </div>

          {/* Course Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-white bg-opacity-40 rounded-lg p-6 border border-blue-200">
            <div className="text-center">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Completion Date</p>
              <p className="text-lg font-bold text-gray-800">{formatDate(completionDate)}</p>
            </div>

            <div className="text-center">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Study Time</p>
              <p className="text-lg font-bold text-gray-800">
                {completionTime > 0 ? formatTime(completionTime) : formatTime(estimatedDuration)}
              </p>
            </div>

            <div className="text-center">
              <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Lessons Completed</p>
              <p className="text-lg font-bold text-gray-800">{totalLessons} Lessons</p>
            </div>
          </div>

          {/* Signature Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <div className="border-t-2 border-gray-400 pt-2 inline-block px-12">
                <p className="font-semibold text-gray-800">Course Instructor</p>
                <p className="text-sm text-gray-600">Course Builder Platform</p>
              </div>
            </div>

            <div className="text-center">
              <div className="border-t-2 border-gray-400 pt-2 inline-block px-12">
                <p className="font-semibold text-gray-800">Issue Date</p>
                <p className="text-sm text-gray-600">{formatDate(new Date())}</p>
              </div>
            </div>
          </div>

          {/* Certificate ID */}
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 font-mono">Certificate ID: {certificateId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button onClick={onDownload} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Download Certificate
        </Button>
        <Button variant="outline" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Certificate
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .certificate-container {
            margin: 0;
            padding: 0;
          }

          .certificate-actions {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// Certificate Modal Component
interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  studentName?: string;
  completionDate?: Date;
  completionTime?: number;
}

export function CertificateModal({
  isOpen,
  onClose,
  course,
  studentName,
  completionDate,
  completionTime
}: CertificateModalProps) {
  const handleDownload = () => {
    // In a real app, this would generate a PDF
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificate of Completion - ${course.title}`,
        text: `I've completed the course "${course.title}" and earned a certificate!`,
        url: window.location.href
      });
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert('Certificate link copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Certificate of Completion</h2>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="certificate-container">
          <Certificate
            course={course}
            studentName={studentName}
            completionDate={completionDate}
            completionTime={completionTime}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </div>
      </div>
    </div>
  );
}
