import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Star, Flame, Shield, Target, Zap, 
  Award, Crown, Medal, TrendingUp, BookOpen, Swords, Lock
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
  gradient: string;
  glowColor: string;
  iconColor: string;
  check: (debates: Debate[]) => boolean;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-debate",
    name: "First Steps",
    description: "Complete your first debate",
    icon: Star,
    gradient: "from-amber-400 to-orange-500",
    glowColor: "shadow-amber-400/30",
    iconColor: "text-amber-100",
    check: (debates) => debates.length >= 1,
  },
  {
    id: "five-debates",
    name: "Debater",
    description: "Complete 5 debates",
    icon: BookOpen,
    gradient: "from-blue-400 to-indigo-500",
    glowColor: "shadow-blue-400/30",
    iconColor: "text-blue-100",
    check: (debates) => debates.length >= 5,
  },
  {
    id: "ten-debates",
    name: "Veteran",
    description: "Complete 10 debates",
    icon: Shield,
    gradient: "from-violet-400 to-purple-600",
    glowColor: "shadow-violet-400/30",
    iconColor: "text-violet-100",
    check: (debates) => debates.length >= 10,
  },
  {
    id: "first-80",
    name: "High Achiever",
    description: "Score 80+ in a debate",
    icon: Trophy,
    gradient: "from-emerald-400 to-teal-500",
    glowColor: "shadow-emerald-400/30",
    iconColor: "text-emerald-100",
    check: (debates) => debates.some(d => d.scores?.final_score >= 80),
  },
  {
    id: "first-90",
    name: "Elite Performer",
    description: "Score 90+ in a debate",
    icon: Crown,
    gradient: "from-yellow-400 to-amber-500",
    glowColor: "shadow-yellow-400/30",
    iconColor: "text-yellow-100",
    check: (debates) => debates.some(d => d.scores?.final_score >= 90),
  },
  {
    id: "rebuttal-master",
    name: "Rebuttal Master",
    description: "Score 25+ in Engagement & Rebuttal",
    icon: Swords,
    gradient: "from-rose-400 to-pink-600",
    glowColor: "shadow-rose-400/30",
    iconColor: "text-rose-100",
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
    gradient: "from-cyan-400 to-sky-500",
    glowColor: "shadow-cyan-400/30",
    iconColor: "text-cyan-100",
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
    gradient: "from-lime-400 to-green-500",
    glowColor: "shadow-lime-400/30",
    iconColor: "text-lime-100",
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
    gradient: "from-red-400 to-rose-600",
    glowColor: "shadow-red-400/30",
    iconColor: "text-red-100",
    check: (debates) => debates.some(d => d.difficulty === "hard"),
  },
  {
    id: "hard-ace",
    name: "Hard Mode Ace",
    description: "Score 75+ on Hard difficulty",
    icon: Medal,
    gradient: "from-fuchsia-400 to-purple-600",
    glowColor: "shadow-fuchsia-400/30",
    iconColor: "text-fuchsia-100",
    check: (debates) => debates.some(d => d.difficulty === "hard" && d.scores?.final_score >= 75),
  },
  {
    id: "both-sides",
    name: "Perspective Taker",
    description: "Debate on both proposition and opposition sides",
    icon: Target,
    gradient: "from-orange-400 to-red-500",
    glowColor: "shadow-orange-400/30",
    iconColor: "text-orange-100",
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
    gradient: "from-indigo-400 to-blue-600",
    glowColor: "shadow-indigo-400/30",
    iconColor: "text-indigo-100",
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
        <h2 className="text-xl font-display font-bold">✨ Skill Badges</h2>
        <Badge variant="outline" className="font-bold text-sm px-3">
          {earned.length}/{BADGE_DEFINITIONS.length}
        </Badge>
      </div>

      {earned.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🏆 Earned</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {earned.map(badge => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`group relative p-4 rounded-2xl text-center space-y-2.5 cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${badge.glowColor}`}
                  style={{ background: 'hsl(var(--card))' }}
                >
                  {/* Glow ring on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${badge.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                  <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-current opacity-0 group-hover:opacity-20 transition-all duration-500 bg-gradient-to-br ${badge.gradient} [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [-webkit-mask-composite:xor] [mask-composite:exclude]`} />
                  
                  <div className={`relative w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${badge.gradient} flex items-center justify-center shadow-lg ${badge.glowColor} transition-all duration-500 group-hover:scale-110 group-hover:shadow-xl group-hover:rotate-3`}>
                    <Icon className={`w-7 h-7 ${badge.iconColor} drop-shadow-sm`} />
                  </div>
                  <p className="text-sm font-bold leading-tight relative">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight relative">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🔒 Locked</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {locked.map(badge => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.id}
                  className="group relative p-4 rounded-2xl text-center space-y-2.5 cursor-default transition-all duration-300 hover:-translate-y-1 border border-border/20 bg-muted/20"
                >
                  <div className="relative w-14 h-14 mx-auto rounded-2xl bg-muted/40 flex items-center justify-center transition-all duration-300 group-hover:bg-muted/60">
                    <Icon className="w-7 h-7 text-muted-foreground/40 transition-all duration-300 group-hover:text-muted-foreground/60" />
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50 absolute -bottom-0.5 -right-0.5 bg-muted rounded-full p-0.5" />
                  </div>
                  <p className="text-sm font-bold leading-tight text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground/40 leading-tight group-hover:text-muted-foreground/60 transition-colors">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
