import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import type { PomodoroSession, Task } from '@shared/schema';

export default function AnalyticsPage() {
  // Fetch sessions and tasks
  const { data: sessions = [] } = useQuery<PomodoroSession[]>({
    queryKey: ['/api/sessions'],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Calculate analytics data
  const completedSessions = sessions.filter(s => s.completed);
  const focusSessions = completedSessions.filter(s => s.type === 'focus');
  
  // Daily data for the last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySessions = focusSessions.filter(s => 
      format(new Date(s.startedAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return {
      date: format(date, 'MMM dd'),
      sessions: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
    };
  });

  // Project distribution
  const projectData = tasks.reduce((acc, task) => {
    const existing = acc.find(p => p.project === task.project);
    if (existing) {
      existing.tasks += 1;
      existing.completedPomodoros += task.completedPomodoros;
    } else {
      acc.push({
        project: task.project,
        tasks: 1,
        completedPomodoros: task.completedPomodoros,
      });
    }
    return acc;
  }, [] as any[]);

  const projectColors = {
    Work: '#3B82F6',
    Personal: '#8B5CF6',
    Learning: '#10B981',
  };

  // Calculate total stats
  const totalFocusTime = focusSessions.reduce((sum, s) => sum + s.duration, 0);
  const totalSessions = focusSessions.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const avgSessionLength = totalSessions > 0 ? Math.round(totalFocusTime / totalSessions) : 0;

  // This week's stats
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const thisWeekSessions = focusSessions.filter(s => {
    const sessionDate = new Date(s.startedAt);
    return sessionDate >= weekStart && sessionDate <= weekEnd;
  });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 pb-20 lg:pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track your productivity and identify patterns in your focus sessions
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Total Focus Time</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
                </div>
                <p className="text-xs text-muted-foreground">
                  {thisWeekSessions.reduce((sum, s) => sum + s.duration, 0)} minutes this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-muted-foreground">Sessions Completed</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {thisWeekSessions.length} sessions this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-muted-foreground">Avg Session</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{avgSessionLength}m</div>
                <p className="text-xs text-muted-foreground">
                  Average focus session length
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-muted-foreground">Tasks Completed</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{completedTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {tasks.length} total tasks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="daily" className="space-y-6">
            <TabsList>
              <TabsTrigger value="daily">Daily Trends</TabsTrigger>
              <TabsTrigger value="projects">Project Breakdown</TabsTrigger>
              <TabsTrigger value="tasks">Task Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Focus Sessions - Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'sessions' ? `${value} sessions` : `${value} minutes`,
                          name === 'sessions' ? 'Sessions' : 'Focus Time'
                        ]}
                      />
                      <Bar dataKey="sessions" fill="#6366F1" name="sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Focus Time - Last 7 Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} minutes`, 'Focus Time']}
                      />
                      <Bar dataKey="minutes" fill="#10B981" name="minutes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks by Project</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={projectData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="tasks"
                          label={({ project, tasks }) => `${project}: ${tasks}`}
                        >
                          {projectData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={projectColors[entry.project as keyof typeof projectColors] || '#8B5CF6'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projectData.map((project) => (
                      <div key={project.project} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: projectColors[project.project as keyof typeof projectColors] }}
                          />
                          <span className="font-medium">{project.project}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{project.tasks} tasks</div>
                          <div className="text-sm text-muted-foreground">
                            {project.completedPomodoros} pomodoros
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Task Completion Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.slice(0, 10).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              variant="outline"
                              className={
                                task.project === 'Work' ? 'border-blue-500 text-blue-700' :
                                task.project === 'Personal' ? 'border-purple-500 text-purple-700' :
                                'border-green-500 text-green-700'
                              }
                            >
                              {task.project}
                            </Badge>
                            <Badge variant={task.completed ? "default" : "secondary"}>
                              {task.completed ? "Completed" : "In Progress"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {task.completedPomodoros}/{task.estimatedPomodoros}
                          </div>
                          <div className="text-sm text-muted-foreground">pomodoros</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
