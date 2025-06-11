import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, User, Calendar, Target } from 'lucide-react';
import { analytics } from '@/utils/analytics';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  coursesCompleted: number;
  totalTimeSpent: number;
  lastActivity: Date;
  completionRate: number;
  streak: number;
}

interface LeaderboardProps {
  courseId?: string; // If provided, show leaderboard for specific course
  limit?: number; // Number of entries to show
}

export function Leaderboard({ courseId, limit = 10 }: LeaderboardProps) {
  const leaderboardData = useMemo(() => {
    const analyticsData = analytics.getAnalyticsData();
    const events = analyticsData.events;

    // Generate mock leaderboard data based on analytics
    // In a real app, this would come from your backend
    const users = new Map<string, LeaderboardEntry>();

    // Process completion events
    for (const event of events.filter(e => e.eventName === 'lesson_completed' || e.eventName === 'course_completed')) {
      const userId = String(event.properties.userId || 'anonymous');
      const userName = String(event.properties.userName || `User ${userId.slice(-4)}`);

      if (!users.has(userId)) {
        users.set(userId, {
          userId,
          userName,
          coursesCompleted: 0,
          totalTimeSpent: 0,
          lastActivity: event.timestamp,
          completionRate: 0,
          streak: 0
        });
      }

      const user = users.get(userId);
      if (!user) continue;
      if (event.eventName === 'course_completed') {
        user.coursesCompleted++;
      }
      user.totalTimeSpent += Number(event.properties.timeSpent) || 30; // Default 30 minutes
      user.lastActivity = event.timestamp > user.lastActivity ? event.timestamp : user.lastActivity;
    }

    // Add some sample users if we don't have enough data
    if (users.size < 5) {
      const sampleUsers = [
        { name: 'Alex Chen', completed: 8, time: 2400, rate: 95 },
        { name: 'Sarah Johnson', completed: 6, time: 1800, rate: 92 },
        { name: 'Mike Rodriguez', completed: 5, time: 1500, rate: 88 },
        { name: 'Emily Davis', completed: 4, time: 1200, rate: 85 },
        { name: 'David Kim', completed: 3, time: 900, rate: 82 },
        { name: 'Lisa Wang', completed: 2, time: 600, rate: 79 },
        { name: 'Tom Brown', completed: 1, time: 300, rate: 76 }
      ];

      sampleUsers.forEach((sample, index) => {
        const userId = `sample-${index}`;
        if (!users.has(userId)) {
          users.set(userId, {
            userId,
            userName: sample.name,
            coursesCompleted: sample.completed,
            totalTimeSpent: sample.time,
            lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            completionRate: sample.rate,
            streak: Math.floor(Math.random() * 10) + 1
          });
        }
      });
    }

    // Convert to array and sort by completion rate and courses completed
    return Array.from(users.values())
      .sort((a, b) => {
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        return b.coursesCompleted - a.coursesCompleted;
      })
      .slice(0, limit);
  }, [limit]);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-gray-500">#{position}</span>;
    }
  };

  const getRankBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 3:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {courseId ? 'Course Leaderboard' : 'Global Leaderboard'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Top performers ranked by completion rate and courses completed
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboardData.map((entry, index) => {
            const position = index + 1;
            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  position <= 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(position)}
                    <Badge variant="outline" className={getRankBadgeColor(position)}>
                      #{position}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{entry.userName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Last active {formatDate(entry.lastActivity)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{entry.coursesCompleted}</div>
                    <div className="text-xs text-gray-500">Courses</div>
                  </div>

                  <div className="text-center">
                    <div className="font-medium text-gray-900">{entry.completionRate}%</div>
                    <div className="text-xs text-gray-500">Rate</div>
                  </div>

                  <div className="text-center">
                    <div className="font-medium text-gray-900">{formatTime(entry.totalTimeSpent)}</div>
                    <div className="text-xs text-gray-500">Time</div>
                  </div>

                  <div className="text-center">
                    <div className="font-medium text-gray-900 flex items-center gap-1">
                      <Target className="h-3 w-3 text-orange-500" />
                      {entry.streak}
                    </div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboardData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No leaderboard data available yet.</p>
            <p className="text-sm">Complete some courses to see rankings!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
