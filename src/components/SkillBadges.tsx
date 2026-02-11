import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Star, Flame, Shield, Target, Zap, 
  Award, Crown, Medal, TrendingUp, BookOpen, Swords
} from "lucide-react";
import { useMemo } from "react";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  check: (debates: Debate[]) => boolean;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-debate",
    name: "First Steps",
    description: "Complete your first debate",
    icon: Star,
    color: "text-primary",
    bgColor: "bg-primary/10",
    check: (debates) => debates.length >= 1,
  },
  {
    id: "five-debates",
    name: "Debater",
    description: "Complete 5 debates",
    icon: BookOpen,
    color: "text-primary",
    bgColor: "bg-primary/10",
    check: (debates) => debates.length >= 5,
  },
  {
    id: "ten-debates",
    name: "Veteran",
    description: "Complete 10 debates",
    icon: Shield,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    check: (debates) => debates.length >= 10,
  },
  {
    id: "first-80",
    name: "High Achiever",
    description: "Score 80+ in a debate",
    icon: Trophy,
    color: "text-accent",
    bgColor: "bg-accent/10",
    check: (debates) => debates.some(d => d.scores?.final_score >= 80),
  },
  {
    id: "first-90",
    name: "Elite Performer",
    description: "Score 90+ in a debate",
    icon: Crown,
    color: "text-accent",
    bgColor: "bg-accent/10",
    check: (debates) => debates.some(d => d.scores?.final_score >= 90),
  },
  {
    id: "rebuttal-master",
    name: "Rebuttal Master",
    description: "Score 25+ in Engagement & Rebuttal",
    icon: Swords,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    check: (debates) => debates.some(d => {
      const s = d.scores?.scores || d.scores;
      return (s?.engagement_rebuttal?.score || 0) >= 25;
    }),
  },
  {
    id: "silver-tongue",
    name: "Silver Tongue",
    description: "Score 17+ in Fluency & Delivery",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    check: (debates) => debates.some(d => {
      const s = d.scores?.scores || d.scores;
      return (s?.fluency?.score || 0) >= 17;
    }),
  },
  {
    id: "consistent-performer",
    name: "Consistent Performer",
    description: "Score 70+ in 3 consecutive debates",
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
    check: (debates) => {
      const scored = [...debates]
        .filter(d => d.scores?.final_score !== undefined)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      for (let i = 0; i <= scored.length - 3; i++) {
        if (scored[i].scores.final_score >= 70 && 
            scored[i+1].scores.final_score >= 70 && 
            scored[i+2].scores.final_score >= 70) return true;
      }
      return false;
    },
  },
  {
    id: "hard-mode",
    name: "Fearless",
    description: "Complete a debate on Hard difficulty",
    icon: Flame,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    check: (debates) => debates.some(d => d.difficulty === "hard"),
  },
  {
    id: "hard-ace",
    name: "Hard Mode Ace",
    description: "Score 75+ on Hard difficulty",
    icon: Medal,
    color: "text-accent",
    bgColor: "bg-accent/10",
    check: (debates) => debates.some(d => d.difficulty === "hard" && d.scores?.final_score >= 75),
  },
  {
    id: "both-sides",
    name: "Perspective Taker",
    description: "Debate on both proposition and opposition sides",
    icon: Target,
    color: "text-primary",
    bgColor: "bg-primary/10",
    check: (debates) => {
      const sides = new Set(debates.map(d => d.side));
      return sides.has("proposition") && sides.has("opposition");
    },
  },
  {
    id: "perfect-argument",
    name: "Master Arguer",
    description: "Score 27+ in Argument Quality",
    icon: Award,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    check: (debates) => debates.some(d => {
      const s = d.scores?.scores || d.scores;
      return (s?.argument_quality?.score || 0) >= 27;
    }),
  },
];

interface SkillBadgesProps {
  debates: Debate[];
}

export const SkillBadges = ({ debates }: SkillBadgesProps) => {
  const { earned, locked } = useMemo(() => {
    const earnedBadges: BadgeDefinition[] = [];
    const lockedBadges: BadgeDefinition[] = [];
    
    BADGE_DEFINITIONS.forEach(badge => {
      if (badge.check(debates)) {
        earnedBadges.push(badge);
      } else {
        lockedBadges.push(badge);
      }
    });
    
    return { earned: earnedBadges, locked: lockedBadges };
  }, [debates]);

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold">Skill Badges</h2>
        <Badge variant="outline" className="font-medium">
          {earned.length}/{BADGE_DEFINITIONS.length} earned
        </Badge>
      </div>

      {earned.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Earned</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {earned.map(badge => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="group p-3 rounded-xl border border-border/50 bg-card hover-lift text-center space-y-2"
                >
                  <div className={`w-12 h-12 mx-auto rounded-xl ${badge.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${badge.color}`} />
                  </div>
                  <p className="text-sm font-semibold leading-tight">{badge.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Locked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {locked.map(badge => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="p-3 rounded-xl border border-border/30 bg-muted/30 text-center space-y-2 opacity-50"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-muted/50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold leading-tight text-muted-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
