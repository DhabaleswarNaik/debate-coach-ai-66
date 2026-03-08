import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Calendar, TrendingUp, Target, Award, Sparkles, Mail, LogOut, BarChart3, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { PerformanceCharts } from "@/components/PerformanceCharts";
import { SkillBadges } from "@/components/SkillBadges";
import { ExportPortfolio } from "@/components/ExportPortfolio";
import { StreakTracker } from "@/components/StreakTracker";
import { PersonalBests } from "@/components/PersonalBests";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoGlow } from "@/components/LogoGlow";
import logo from "@/assets/logo.png";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
  transcript?: any;
  practice_mode?: boolean;
}

export default function Dashboard() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userCreatedAt, setUserCreatedAt] = useState<string | undefined>();
  const [userName, setUserName] = useState<string>("User");
  const [userInitials, setUserInitials] = useState<string>("U");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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

      // Fetch profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url || null);
        if (profile.first_name) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
          setUserName(fullName);
          const initials = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .map(n => n[0])
            .join("")
            .toUpperCase();
          setUserInitials(initials || "U");
        } else {
          setUserName(extractUsername(user.email));
          setUserInitials(getInitials(user.email));
        }
      } else {
        setUserName(extractUsername(user.email));
        setUserInitials(getInitials(user.email));
      }

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
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoGlow size="sm" />
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ExportPortfolio debates={debates} userName={userName} />
            <Button onClick={() => navigate("/new-debate")} className="bg-primary hover:bg-primary-hover shadow-md btn-glow">
              <Sparkles className="w-4 h-4 mr-2" />
              New Debate
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 relative">
        {/* User Profile Card */}
        <Card className="p-6 glass-card animate-fade-up overflow-hidden relative hover-glow hover-scale-card card-shine group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full transition-all duration-500 group-hover:from-primary/10" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative">
            <Avatar className="w-20 h-20 border-4 border-primary/20 shadow-lg transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-primary/20 group-hover:scale-105">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-display font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <h2 className="text-2xl font-display font-bold transition-colors duration-300 group-hover:text-primary">{userName}</h2>
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
                <Badge variant="secondary" className="gap-1 transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default">
                  <Target className="w-3 h-3" />
                  {debates.length} debate{debates.length !== 1 ? 's' : ''}
                </Badge>
                {streak > 0 && (
                  <Badge variant="secondary" className="gap-1 transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default">
                    <TrendingUp className="w-3 h-3" />
                    {streak} win streak
                  </Badge>
                )}
                {topDifficulty && (
                  <Badge variant="secondary" className="gap-1 capitalize transition-all duration-300 hover:scale-105 hover:shadow-md cursor-default">
                    <Award className="w-3 h-3" />
                    {topDifficulty} level
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate("/edit-profile")} className="hover:border-primary/40 transition-all duration-300">
                <Target className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-300">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </div>
          </div>
        </Card>

        {debates.length === 0 ? (
          <Card className="p-16 text-center glass-card animate-fade-up hover-glow group">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
              <Trophy className="w-10 h-10 text-primary transition-transform duration-500 group-hover:rotate-12" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-3">No debates yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start your first debate to see your performance history and track your improvement over time
            </p>
            <Button size="lg" onClick={() => navigate("/new-debate")} className="bg-primary hover:bg-primary-hover shadow-lg btn-glow">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Your First Debate
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up section-hover p-2 -m-2">
              {[
                { icon: Target, label: "Debates", value: debates.length, gradient: "from-primary to-primary/60", color: "" },
                { icon: TrendingUp, label: "Avg Score", value: avgScore ?? '—', gradient: "from-accent to-accent/60", color: avgScore ? getScoreColor(avgScore) : '' },
                { icon: Award, label: "Best Score", value: bestScore ?? '—', gradient: "from-secondary to-secondary/60", color: bestScore ? getScoreColor(bestScore) : '' },
                { icon: BarChart3, label: "Win Streak", value: streak, gradient: "from-primary/80 to-accent/60", color: "" },
              ].map((stat, i) => (
                <Card key={stat.label} className="metric-card group" style={{ animationDelay: `${0.05 * i}s` }}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:rotate-3`}>
                      <stat.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                      <p className={`text-2xl font-display font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Streak Tracker & Personal Bests */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up section-hover p-2 -m-2" style={{ animationDelay: '0.1s' }}>
              <StreakTracker debates={debates} />
              <div className="md:col-span-2">
                <PersonalBests debates={debates} />
              </div>
            </div>

            {/* Skill Badges */}
            <div className="animate-fade-up section-hover p-2 -m-2" style={{ animationDelay: '0.15s' }}>
              <SkillBadges debates={debates} />
            </div>

            {/* Charts */}
            <div className="animate-fade-up section-hover p-2 -m-2" style={{ animationDelay: '0.2s' }}>
              <PerformanceCharts debates={debates} />
            </div>
            
            {/* Debate History */}
            <div className="animate-fade-up section-hover p-2 -m-2" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-xl font-display font-bold">Debate History</h2>
                <Badge variant="outline" className="font-medium">{debates.length} debates</Badge>
              </div>
              <div className="grid gap-4 px-2">
                {debates.map((debate, index) => (
                  <Card 
                    key={debate.id} 
                    className="p-6 glass-card hover-scale-card hover-border-glow card-shine cursor-pointer transition-all duration-300 group"
                    onClick={() => navigate(`/debate/${debate.id}`)}
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-2 line-clamp-1 transition-colors duration-300 group-hover:text-primary">{debate.topic}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize transition-all duration-300 group-hover:border-primary/40">{debate.difficulty}</Badge>
                            <Badge variant="outline" className="capitalize transition-all duration-300 group-hover:border-primary/40">{debate.side}</Badge>
                            {debate.practice_mode && (
                              <Badge className="bg-accent/15 text-accent border border-accent/30 gap-1">
                                <GraduationCap className="w-3 h-3" />
                                Practice
                              </Badge>
                            )}
                          </div>
                        </div>

                        {debate.scores && debate.scores.final_score !== undefined && (
                          <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/20">
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