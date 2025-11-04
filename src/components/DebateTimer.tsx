import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebateTimerProps {
  label: string;
  time: number;
  limit: number;
  isActive: boolean;
}

export const DebateTimer = ({ label, time, limit, isActive }: DebateTimerProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const percentage = Math.min((time / limit) * 100, 100);
  const isOvertime = time > limit;
  const isWarning = time > limit * 0.8 && !isOvertime;

  return (
    <Card className={cn(
      "p-4 transition-all duration-300",
      isActive && "ring-2 ring-accent shadow-lg",
      isOvertime && "bg-destructive/10 border-destructive"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">{label}</span>
        <Clock className={cn(
          "w-4 h-4",
          isActive && "animate-pulse text-accent",
          isOvertime && "text-destructive",
          isWarning && "text-warning"
        )} />
      </div>
      
      <div className="text-3xl font-bold mb-2">
        <span className={cn(
          isOvertime && "text-destructive",
          isWarning && "text-warning"
        )}>
          {formatTime(time)}
        </span>
        <span className="text-sm text-muted-foreground ml-2">
          / {formatTime(limit)}
        </span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300",
            isOvertime ? "bg-destructive" : isWarning ? "bg-warning" : "bg-accent"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </Card>
  );
};
