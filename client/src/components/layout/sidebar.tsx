import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { TaskList } from '@/components/tasks/task-list';
import { Clock, BarChart3, Settings } from 'lucide-react';
import type { Task } from '@shared/schema';

interface SidebarProps {
  selectedTask?: Task | null;
  onTaskSelect?: (task: Task) => void;
  className?: string;
}

const navigation = [
  { name: 'Timer', href: '/', icon: Clock },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ selectedTask, onTaskSelect, className }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside className={cn("hidden lg:flex lg:flex-col lg:w-80 bg-card shadow-xl border-r border-border", className)}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">PomodoroFlow</h1>
            <p className="text-sm text-muted-foreground">Focus & Productivity</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 border-b border-border">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Task Management */}
      <TaskList
        selectedTask={selectedTask}
        onTaskSelect={onTaskSelect}
        className="flex-1 flex flex-col"
      />
    </aside>
  );
}
