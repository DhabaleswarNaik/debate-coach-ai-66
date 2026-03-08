import { Card } from "@/components/ui/card";
import { Flame, Calendar, Zap } from "lucide-react";

interface Debate {
  id: string;
  created_at: string;
  scores: any;
}

interface StreakTrackerProps {
  debates: Debate[];
}

export function StreakTracker({ debates }: StreakTrackerProps) {
  const getDailyStreak = () => {
    if (debates.length === 0) return 0;

    const debateDates = new Set(
      debates.map((d) =>
        new Date(d.created_at).toLocaleDateString("en-CA") // YYYY-MM-DD
      )
    );

    const today = new Date();
    let streak = 0;
    let current = new Date(today);

    // Check today first, if not today check if yesterday started the streak
    const todayStr = current.toLocaleDateString("en-CA");
    if (!debateDates.has(todayStr)) {
      current.setDate(current.getDate() - 1);
      if (!debateDates.has(current.toLocaleDateString("en-CA"))) {
        return 0;
      }
    }

    while (debateDates.has(current.toLocaleDateString("en-CA"))) {
      streak++;
      current.setDate(current.getDate() - 1);
    }

    return streak;
  };

  const getLongestStreak = () => {
    if (debates.length === 0) return 0;

    const debateDates = [
      ...new Set(
        debates.map((d) => new Date(d.created_at).toLocaleDateString("en-CA"))
      ),
    ].sort();

    let longest = 1;
    let current = 1;

    for (let i = 1; i < debateDates.length; i++) {
      const prev = new Date(debateDates[i - 1]);
      const curr = new Date(debateDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  };

  const getLastActiveText = () => {
    if (debates.length === 0) return "No activity yet";
    const lastDate = new Date(debates[0].created_at);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === 0) return "Active today";
    if (diff === 1) return "Last active yesterday";
    return `Last active ${diff} days ago`;
  };

  const dailyStreak = getDailyStreak();
  const longestStreak = getLongestStreak();
  const lastActive = getLastActiveText();

  return (
    <Card className="p-6 glass-card hover-glow hover-scale-card card-shine group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-destructive/10 to-transparent rounded-bl-full transition-all duration-500 group-hover:from-destructive/20" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Flame className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Practice Streak</h3>
          <p className="text-xs text-muted-foreground">{lastActive}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 p-3 rounded-lg bg-muted/50 transition-all duration-300 group-hover:bg-muted/70">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Current
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-destructive">
            {dailyStreak}
            <span className="text-sm text-muted-foreground ml-1">
              day{dailyStreak !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        <div className="space-y-1 p-3 rounded-lg bg-muted/50 transition-all duration-300 group-hover:bg-muted/70">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Longest
            </span>
          </div>
          <p className="text-3xl font-display font-bold text-accent">
            {longestStreak}
            <span className="text-sm text-muted-foreground ml-1">
              day{longestStreak !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
      </div>
    </Card>
  );
}
