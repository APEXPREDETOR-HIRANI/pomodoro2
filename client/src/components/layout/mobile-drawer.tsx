import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TaskList } from '@/components/tasks/task-list';
import { Clock } from 'lucide-react';
import type { Task } from '@shared/schema';

interface MobileDrawerProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTask?: Task | null;
  onTaskSelect?: (task: Task) => void;
}

export function MobileDrawer({ 
  children, 
  open, 
  onOpenChange, 
  selectedTask, 
  onTaskSelect 
}: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
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

        {/* Task Management */}
        <TaskList
          selectedTask={selectedTask}
          onTaskSelect={(task) => {
            onTaskSelect?.(task);
            onOpenChange(false);
          }}
          className="flex-1 flex flex-col"
        />
      </SheetContent>
    </Sheet>
  );
}