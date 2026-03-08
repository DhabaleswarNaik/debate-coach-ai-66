import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Calendar, TrendingUp, Target, Award, Sparkles, Mail, LogOut, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PerformanceCharts } from "@/components/PerformanceCharts";
import { SkillBadges } from "@/components/SkillBadges";
import { ExportPortfolio } from "@/components/ExportPortfolio";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
  transcript?: any;
}

export default function Dashboard() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>();
  const navigate = useNavigate();

  const extractUsername = (email?: string) => {
    if (!email) return "User";
    return email.split("@")[0].replace(/[^a-zA-Z]/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase()) || "User";
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    const parts = name.split(/[._-]/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    fetchDebates();
  }, []);

  const fetchDebates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserEmail(user.email);
      setUserCreatedAt(user.created_at);

      const { data, error } = await supabase
        .from("debates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDebates(data || []);
    } catch (error) {
      console.error("Error fetching debates:", error);
      toast.error("Failed to load debates");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAverageScore = () => {
    const scored = debates.filter(d => d.scores?.final_score !== undefined);
    if (scored.length === 0) return null;
    const total = scored.reduce((sum, d) => sum + d.scores.final_score, 0);
    return Math.round(total / scored.length);
  };

  const getBestScore = () => {
    const scored = debates.filter(d => d.scores?.final_score !== undefined);
    if (scored.length === 0) return null;
    return Math.max(...scored.map(d => d.scores.final_score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-accent";
    if (score >= 60) return "text-primary";
    if (score >= 40) return "text-warning";
    return "text-destructive";
  };

  const getStreak = () => {
    let streak = 0;
    for (const d of debates) {
      if (d.scores?.final_score >= 60) streak++;
      else break;
    }
    return streak;
  };

  const getTopDifficulty = () => {
    const difficulties = ["advanced", "intermediate", "beginner"];
    for (const diff of difficulties) {
      if (debates.some(d => d.difficulty === diff && d.scores?.final_score >= 60)) return diff;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const avgScore = getAverageScore();
  const bestScore = getBestScore();
  const streak = getStreak();
  const topDifficulty = getTopDifficulty();
  const userName = extractUsername(userEmail);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ExportPortfolio debates={debates} userName={userName} />
            <Button onClick={() => navigate("/new-debate")} className="bg-primary hover:bg-primary-hover shadow-md">
              <Sparkles className="w-4 h-4 mr-2" />
              New Debate
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* User Profile Card */}
        <Card className="p-6 glass-card animate-fade-up overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
            <Avatar className="w-20 h-20 border-4 border-primary/20 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-display font-bold">
                {getInitials(userEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-display font-bold">{userName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
              {userCreatedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(userCreatedAt)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="gap-1">
                  <Target className="w-3 h-3" />
                  {debates.length} debate{debates.length !== 1 ? 's' : ''}
                </Badge>
                {streak > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {streak} win streak
                  </Badge>
                )}
                {topDifficulty && (
                  <Badge variant="secondary" className="gap-1 capitalize">
                    <Award className="w-3 h-3" />
                    {topDifficulty} level
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
          </div>
        </Card>

        {debates.length === 0 ? (
          <Card className="p-16 text-center glass-card animate-fade-up">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">No debates yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start your first debate to see your performance history and track your improvement over time
            </p>
            <Button size="lg" onClick={() => navigate("/new-debate")} className="bg-primary hover:bg-primary-hover shadow-lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Your First Debate
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
              <Card className="metric-card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md">
                    <Target className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Debates</p>
                    <p className="text-2xl font-display font-bold">{debates.length}</p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-md">
                    <TrendingUp className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg Score</p>
                    <p className={`text-2xl font-display font-bold ${avgScore ? getScoreColor(avgScore) : ''}`}>
                      {avgScore ?? '—'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary/60 flex items-center justify-center shadow-md">
                    <Award className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Score</p>
                    <p className={`text-2xl font-display font-bold ${bestScore ? getScoreColor(bestScore) : ''}`}>
                      {bestScore ?? '—'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="metric-card hover-lift">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/80 to-accent/60 flex items-center justify-center shadow-md">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Win Streak</p>
                    <p className="text-2xl font-display font-bold">{streak}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Skill Badges */}
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <SkillBadges debates={debates} />
            </div>

            {/* Charts */}
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <PerformanceCharts debates={debates} />
            </div>
            
            {/* Debate History */}
            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold">Debate History</h2>
                <Badge variant="outline" className="font-medium">{debates.length} debates</Badge>
              </div>
              <div className="grid gap-4">
                {debates.map((debate, index) => (
                  <Card 
                    key={debate.id} 
                    className="p-6 glass-card hover-lift cursor-pointer border-border/50 transition-all duration-300 hover:border-primary/30"
                    onClick={() => navigate(`/debate/${debate.id}`)}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{debate.topic}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">{debate.difficulty}</Badge>
                            <Badge variant="outline" className="capitalize">{debate.side}</Badge>
                          </div>
                        </div>

                        {debate.scores && debate.scores.final_score !== undefined && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Trophy className="w-5 h-5 text-accent" />
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Score</span>
                                <p className={`text-2xl font-display font-bold ${getScoreColor(debate.scores.final_score)}`}>
                                  {debate.scores.final_score}<span className="text-base text-muted-foreground">/100</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(debate.created_at)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}