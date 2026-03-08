import { Card } from "@/components/ui/card";
import { Trophy, Crown, Swords, Star } from "lucide-react";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  scores: any;
  created_at: string;
}

interface PersonalBestsProps {
  debates: Debate[];
}

export function PersonalBests({ debates }: PersonalBestsProps) {
  const scored = debates.filter((d) => d.scores?.final_score !== undefined);

  const getHighestScore = () => {
    if (scored.length === 0) return null;
    const best = scored.reduce((a, b) =>
      a.scores.final_score > b.scores.final_score ? a : b
    );
    return { score: best.scores.final_score, topic: best.topic };
  };

  const getMostDebatesInDay = () => {
    const dayCounts: Record<string, number> = {};
    debates.forEach((d) => {
      const day = new Date(d.created_at).toLocaleDateString("en-CA");
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const max = Math.max(...Object.values(dayCounts), 0);
    return max;
  };

  const getLongestWinStreak = () => {
    let longest = 0;
    let current = 0;
    for (const d of debates) {
      if (d.scores?.final_score >= 60) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  };

  const getHighestAdvanced = () => {
    const advanced = scored.filter((d) => d.difficulty === "advanced");
    if (advanced.length === 0) return null;
    return Math.max(...advanced.map((d) => d.scores.final_score));
  };

  if (debates.length === 0) return null;

  const highest = getHighestScore();
  const mostInDay = getMostDebatesInDay();
  const longestWin = getLongestWinStreak();
  const highestAdvanced = getHighestAdvanced();

  const records = [
    {
      icon: Crown,
      label: "Highest Score",
      value: highest ? `${highest.score}/100` : "—",
      detail: highest?.topic ? `"${highest.topic.slice(0, 30)}${highest.topic.length > 30 ? "…" : ""}"` : "",
      gradient: "from-yellow-500 to-amber-600",
    },
    {
      icon: Swords,
      label: "Most in a Day",
      value: mostInDay > 0 ? `${mostInDay}` : "—",
      detail: mostInDay > 0 ? `debate${mostInDay !== 1 ? "s" : ""}` : "",
      gradient: "from-primary to-primary/60",
    },
    {
      icon: Trophy,
      label: "Win Streak",
      value: longestWin > 0 ? `${longestWin}` : "—",
      detail: longestWin > 0 ? "consecutive wins" : "",
      gradient: "from-accent to-accent/60",
    },
    {
      icon: Star,
      label: "Best Advanced",
      value: highestAdvanced ? `${highestAdvanced}/100` : "—",
      detail: highestAdvanced ? "advanced difficulty" : "No advanced debates",
      gradient: "from-purple-500 to-violet-600",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-display font-bold mb-4">Personal Bests</h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {records.map((record, i) => (
          <Card
            key={record.label}
            className="p-5 glass-card hover-scale-card hover-glow card-shine group overflow-hidden relative"
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-muted/30 to-transparent rounded-bl-full transition-all duration-500 group-hover:from-muted/50" />
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${record.gradient} flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
              >
                <record.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {record.label}
              </span>
            </div>
            <p className="text-2xl font-display font-bold">{record.value}</p>
            {record.detail && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {record.detail}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
