import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
  isRunning: boolean;
  isPaused: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  disabled?: boolean;
  className?: string;
}

export function TimerControls({
  isRunning,
  isPaused,
  onPlayPause,
  onReset,
  onSkip,
  disabled = false,
  className,
}: TimerControlsProps) {
  const isPlaying = isRunning && !isPaused;

  return (
    <div className={cn("flex items-center justify-center space-x-4", className)}>
      {/* Reset Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onReset}
        disabled={disabled}
        className="w-16 h-16 rounded-full p-0 border-2 hover:bg-muted/50 transition-colors"
        aria-label="Reset timer"
      >
        <RotateCcw className="w-6 h-6" />
      </Button>

      {/* Play/Pause Button */}
      <Button
        onClick={onPlayPause}
        disabled={disabled}
        size="lg"
        className={cn(
          "w-20 h-20 rounded-full p-0 shadow-lg transition-all duration-200",
          "hover:scale-105 active:scale-95",
          isPlaying 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-primary hover:bg-primary/90 text-primary-foreground"
        )}
        aria-label={isPlaying ? "Pause timer" : "Start timer"}
      >
        {isPlaying ? (
          <Pause className="w-8 h-8" />
        ) : (
          <Play className="w-8 h-8 ml-1" />
        )}
      </Button>

      {/* Skip Button */}
      <Button
        variant="outline"
        size="lg"
        onClick={onSkip}
        disabled={disabled}
        className="w-16 h-16 rounded-full p-0 border-2 hover:bg-muted/50 transition-colors"
        aria-label="Skip to next session"
      >
        <SkipForward className="w-6 h-6" />
      </Button>
    </div>
  );
}
