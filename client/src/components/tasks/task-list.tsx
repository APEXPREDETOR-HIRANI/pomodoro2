import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { TaskItem } from './task-item';
import { AddTaskDialog } from './add-task-dialog';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@shared/schema';

interface TaskListProps {
  selectedTask?: Task | null;
  onTaskSelect?: (task: Task) => void;
  className?: string;
}

type ProjectFilter = 'All' | 'Work' | 'Personal' | 'Learning';

export function TaskList({ selectedTask, onTaskSelect, className }: TaskListProps) {
  const { 
    tasks, 
    isLoading, 
    createTask, 
    updateTask, 
    deleteTask, 
    reorderTasks,
    isCreating 
  } = useTasks();
  
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('All');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    if (selectedFilter === 'All') return tasks;
    return tasks.filter(task => task.project === selectedFilter);
  }, [tasks, selectedFilter]);

  const projectCounts = useMemo(() => {
    const counts = { All: tasks.length, Work: 0, Personal: 0, Learning: 0 };
    tasks.forEach(task => {
      if (task.project in counts) {
        (counts as any)[task.project]++;
      }
    });
    return counts;
  }, [tasks]);

  const handleTaskUpdate = (id: number, updates: Partial<Task>) => {
    updateTask({ id, updates });
  };

  const handleTaskDelete = (id: number) => {
    deleteTask(id);
  };

  const filters: ProjectFilter[] = ['All', 'Work', 'Personal', 'Learning'];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
          <Button
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
            className="h-8 w-8 rounded-full p-0"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Project Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Badge
              key={filter}
              variant={selectedFilter === filter ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setSelectedFilter(filter)}
            >
              {filter} {projectCounts[filter] > 0 && `(${projectCounts[filter]})`}
            </Badge>
          ))}
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {selectedFilter === 'All' 
                  ? "No tasks yet. Create your first task to get started!"
                  : `No ${selectedFilter.toLowerCase()} tasks yet.`
                }
              </p>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(true)}
                disabled={isCreating}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
                onSelect={onTaskSelect}
                isSelected={selectedTask?.id === task.id}
                className="group"
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={(taskData) => {
          createTask(taskData);
          setIsAddDialogOpen(false);
        }}
        isLoading={isCreating}
      />
    </div>
  );
}
