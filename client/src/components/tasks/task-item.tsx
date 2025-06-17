import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@shared/schema';

interface TaskItemProps {
  task: Task;
  onUpdate: (id: number, updates: Partial<Task>) => void;
  onDelete: (id: number) => void;
  onSelect?: (task: Task) => void;
  isSelected?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  className?: string;
}

export function TaskItem({
  task,
  onUpdate,
  onDelete,
  onSelect,
  isSelected = false,
  isDragging = false,
  dragHandleProps,
  className,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);

  const handleComplete = (completed: boolean) => {
    onUpdate(task.id, { completed });
  };

  const handleEdit = () => {
    if (isEditing) {
      if (editTitle.trim() && editTitle !== task.title) {
        onUpdate(task.id, { title: editTitle.trim() });
      } else {
        setEditTitle(task.title);
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEdit();
    } else if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getProjectColor = (project: string) => {
    switch (project.toLowerCase()) {
      case 'work':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'personal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'learning':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-3 transition-all duration-200",
        "hover:shadow-sm hover:border-primary/20",
        isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        isDragging && "shadow-lg rotate-1 scale-105 opacity-90",
        task.completed && "opacity-60",
        className
      )}
      onClick={() => onSelect?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.(task);
        }
      }}
    >
      <div className="flex items-start space-x-2">
        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleComplete}
          className="mt-0.5 h-4 w-4"
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleEdit}
              onKeyDown={handleKeyPress}
              className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground"
              autoFocus
            />
          ) : (
            <h3 className={cn(
              "text-sm font-medium text-foreground cursor-pointer leading-tight",
              task.completed && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h3>
          )}

          {/* Compact badges row */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getProjectColor(task.project))}>
                {task.project.charAt(0)}
              </Badge>
              <Badge variant="outline" className={cn("text-xs px-1.5 py-0", getPriorityColor(task.priority))}>
                {task.priority.charAt(0)}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {task.completedPomodoros}/{task.estimatedPomodoros}
            </span>
          </div>
        </div>

        {/* Compact Actions */}
        <div className="flex flex-col space-y-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="h-6 w-6 p-0"
            aria-label="Edit task"
          >
            <Edit className="w-3 h-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            aria-label="Delete task"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
