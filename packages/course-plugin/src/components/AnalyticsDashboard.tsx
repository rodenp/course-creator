import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
  Eye,
  Edit,
  Download,
  Calendar,
  Activity,
  Target,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { analytics, type AnalyticsEvent, type CourseAnalytics, type UserAnalytics } from '@/utils/analytics';
import { useCourse } from '@/contexts/CourseContext';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

interface EventGroup {
  eventType: string;
  eventName: string;
  count: number;
  lastOccurred: Date;
}

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const { courses } = useCourse();
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [eventGroups, setEventGroups] = useState<EventGroup[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [showDetailedEvents, setShowDetailedEvents] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAnalytics = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      loadAnalytics();
      setIsRefreshing(false);
    }, 500);
  };

  const loadAnalytics = useCallback(() => {
    // Get date range
    const now = new Date();
    let startDate: Date | undefined;

    switch (selectedTimeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined;
    }

    // Load user analytics
    const userStats = analytics.getUserAnalytics();
    setUserAnalytics(userStats);

    // Load course analytics
    const courseStats = courses.map(course => analytics.getCourseAnalytics(course.id)).filter(Boolean) as CourseAnalytics[];
    setCourseAnalytics(courseStats);

    // Load recent events
    const events = analytics.getEvents(startDate);
    setRecentEvents(events.slice(-50)); // Last 50 events

    // Group events by type
    const groups = events.reduce((acc, event) => {
      const key = `${event.eventType}.${event.eventName}`;
      if (!acc[key]) {
        acc[key] = {
          eventType: event.eventType,
          eventName: event.eventName,
          count: 0,
          lastOccurred: event.timestamp
        };
      }
      acc[key].count++;
      if (event.timestamp > acc[key].lastOccurred) {
        acc[key].lastOccurred = event.timestamp;
      }
      return acc;
    }, {} as Record<string, EventGroup>);

    setEventGroups(Object.values(groups).sort((a, b) => b.count - a.count));
  }, [selectedTimeRange, courses]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleExportAnalytics = () => {
    const now = new Date();
    let startDate: Date | undefined;

    switch (selectedTimeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const exportData = analytics.exportAnalytics(startDate);

    // Create and trigger download
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${selectedTimeRange}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const getEngagementBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'lesson': return <Eye className="h-4 w-4" />;
      case 'content': return <Edit className="h-4 w-4" />;
      case 'interaction': return <Activity className="h-4 w-4" />;
      case 'system': return <Target className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const topCourses = useMemo(() => {
    return courseAnalytics
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5);
  }, [courseAnalytics]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
              <p className="text-blue-100">Insights into your course builder usage and performance</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshAnalytics}
                disabled={isRefreshing}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-blue-600"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={onClose} variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                ✕
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Time Range Filter */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium">Time Range:</span>
            {(['24h', '7d', '30d', 'all'] as const).map(range => (
              <Button
                key={range}
                size="sm"
                variant={selectedTimeRange === range ? 'default' : 'outline'}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range === '24h' ? 'Last 24 Hours' :
                 range === '7d' ? 'Last 7 Days' :
                 range === '30d' ? 'Last 30 Days' : 'All Time'}
              </Button>
            ))}
            <Button onClick={handleExportAnalytics} variant="outline" size="sm" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          {/* User Analytics Overview */}
          {userAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userAnalytics.totalSessions}</div>
                  <p className="text-xs text-gray-500">
                    <Badge className={getEngagementBadgeColor(userAnalytics.engagementLevel)}>
                      {userAnalytics.engagementLevel} engagement
                    </Badge>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    Time Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(userAnalytics.totalTimeSpent)}</div>
                  <p className="text-xs text-gray-500">
                    Avg: {formatDuration(userAnalytics.averageSessionTime)} per session
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    Courses Created
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userAnalytics.coursesCreated}</div>
                  <p className="text-xs text-gray-500">
                    {userAnalytics.coursesViewed} viewed • {userAnalytics.lessonsCompleted} lessons completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    Device & Browser
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{userAnalytics.deviceInfo}</div>
                  <p className="text-xs text-gray-500">{userAnalytics.browserInfo}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Course Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Top Performing Courses
                </CardTitle>
                <CardDescription>Courses ranked by engagement score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topCourses.length === 0 ? (
                    <p className="text-gray-500 text-sm">No course analytics available yet</p>
                  ) : (
                    topCourses.map((course, index) => (
                      <div key={course.courseId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{course.courseName}</div>
                            <div className="text-xs text-gray-500">
                              {course.totalViews} views • {course.totalEdits} edits
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-600">{course.engagementScore}/100</div>
                          <div className="text-xs text-gray-500">{Math.round(course.completionRate)}% completion</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  Activity Summary
                </CardTitle>
                <CardDescription>Most frequent actions in selected time range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eventGroups.slice(0, 8).map((group) => (
                    <div key={`${group.eventType}.${group.eventName}`} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {getEventIcon(group.eventType)}
                        <span className="text-sm">{group.eventName.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{group.count}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(group.lastOccurred).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Recent Activity
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailedEvents(!showDetailedEvents)}
                >
                  {showDetailedEvents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showDetailedEvents ? 'Show Less' : 'Show More'}
                </Button>
              </CardTitle>
              <CardDescription>
                Last {recentEvents.length} events in the selected time range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentEvents.slice(showDetailedEvents ? 0 : -10).reverse().map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.eventType)}
                      <span className="font-medium">{event.eventName.replace(/_/g, ' ')}</span>
                      {event.properties.courseName ? (
                        <span className="text-gray-500">• {String(event.properties.courseName)}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No recent activity in this time range</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Award className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Privacy & Data</h4>
                <p className="text-sm text-blue-700 mt-1">
                  All analytics data is stored locally in your browser. No personal information is sent to external servers.
                  You can clear all analytics data at any time.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
                      analytics.clearAnalytics();
                      loadAnalytics();
                    }
                  }}
                  className="mt-2"
                >
                  Clear Analytics Data
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
