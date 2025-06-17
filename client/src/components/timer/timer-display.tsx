import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  currentTime: number;
  totalTime: number;
  sessionType: 'focus' | 'short_break' | 'long_break';
  className?: string;
}

export function TimerDisplay({ currentTime, totalTime, sessionType, className }: TimerDisplayProps) {
  const minutes = Math.floor(currentTime / 60);
  const seconds = currentTime % 60;
  const displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate progress (0 to 1)
  const progress = totalTime > 0 ? 1 - (currentTime / totalTime) : 0;
  
  // Circle properties
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  // Colors based on session type
  const getStrokeColor = () => {
    switch (sessionType) {
      case 'focus':
        return '#6366F1'; // primary-500
      case 'short_break':
        return '#10B981'; // green-500
      case 'long_break':
        return '#8B5CF6'; // purple-500
      default:
        return '#6366F1';
    }
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg 
        className="w-80 h-80 transform -rotate-90" 
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Timer showing ${displayTime} remaining`}
      >
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth="8"
          fill="none"
          className="opacity-20"
        />
        
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      
      {/* Timer display overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div 
          className="text-6xl font-bold text-foreground mb-2 tabular-nums"
          aria-live="polite"
          aria-atomic="true"
        >
          {displayTime}
        </div>
        <div className="text-muted-foreground text-lg">
          {currentTime === 0 ? 'Time\'s up!' : 'minutes remaining'}
        </div>
      </div>
    </div>
  );
}
