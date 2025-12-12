import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Trophy, AlertTriangle, RefreshCw, MessageSquare, Target, Mic, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  transcript: any;
  scores: any;
}

export default function DebateDetail() {
  const { id } = useParams();
  const [debate, setDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDebate();
  }, [id]);

  const fetchDebate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("debates")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setDebate(data);
    } catch (error) {
      console.error("Error fetching debate:", error);
      toast.error("Failed to load debate details");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const downloadTranscript = () => {
    if (!debate || !debate.transcript) {
      toast.error("No transcript available");
      return;
    }

    const formatTimeForDownload = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    let content = `Debate Transcript\n`;
    content += `Topic: ${debate.topic}\n`;
    content += `Side: ${debate.side}\n`;
    content += `Difficulty: ${debate.difficulty}\n`;
    content += `Date: ${new Date(debate.created_at).toLocaleDateString()}\n`;
    content += `\n${'='.repeat(60)}\n\n`;

    debate.transcript.forEach((entry: any) => {
      const speaker = entry.speaker === 'user' ? 'You' : 'AI Opponent';
      content += `[${formatTimeForDownload(entry.start_time_s)} - ${formatTimeForDownload(entry.end_time_s)}] ${speaker}:\n`;
      content += `${entry.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-transcript-${debate.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reanalyzeDebate = async () => {
    if (!debate) return;

    setReanalyzing(true);
    toast.info("Analyzing debate...");

    try {
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-debate',
        {
          body: {
            transcript: debate.transcript || [],
            timeLog: { userTotal: 0, aiTotal: 0 },
            config: {
              topic: debate.topic,
              difficulty: debate.difficulty,
              side: debate.side,
              allocatedTime: debate.allocated_time
            }
          }
        }
      );

      if (analysisError) throw analysisError;

      const { error: updateError } = await supabase
        .from('debates')
        .update({ scores: analysisData })
        .eq('id', debate.id);

      if (updateError) throw updateError;

      await fetchDebate();
      toast.success("Debate analyzed successfully!");
    } catch (error) {
      console.error("Error reanalyzing debate:", error);
      toast.error("Failed to analyze debate. Please try again.");
    } finally {
      setReanalyzing(false);
    }
  };

  const getScoreData = (key: string, maxDefault: number) => {
    const scoresObj = debate?.scores?.scores || debate?.scores;
    const data = scoresObj?.[key];
    return {
      score: data?.score || 0,
      max: data?.max || maxDefault,
      notes: data?.notes || "No notes available"
    };
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "bg-accent";
    if (percentage >= 60) return "bg-primary";
    if (percentage >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const getScoreTextColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-accent";
    if (percentage >= 60) return "text-primary";
    if (percentage >= 40) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading debate details...</p>
        </div>
      </div>
    );
  }

  if (!debate) return null;

  const metrics = [
    { key: "argument_quality", label: "Argument Quality", max: 30, icon: MessageSquare },
    { key: "relevance", label: "Relevance to Topic", max: 20, icon: Target },
    { key: "fluency", label: "Fluency & Delivery", max: 20, icon: Mic },
    { key: "engagement_rebuttal", label: "Engagement & Rebuttal", max: 30, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-display font-bold line-clamp-1">{debate.topic}</h1>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant="outline" className="capitalize text-xs">{debate.difficulty}</Badge>
              <Badge variant="outline" className="capitalize text-xs">{debate.side}</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Score Hero */}
        {debate.scores?.final_score !== undefined ? (
          <Card className="p-8 glass-card animate-fade-up text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Final Score</p>
            <p className={`text-6xl font-display font-bold ${getScoreTextColor(debate.scores.final_score, 100)}`}>
              {debate.scores.final_score}
              <span className="text-2xl text-muted-foreground">/100</span>
            </p>
          </Card>
        ) : (
          <Card className="p-8 glass-card animate-fade-up text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Performance analysis not available</p>
          </Card>
        )}

        {/* No Data State */}
        {!debate.scores && !debate.transcript && (
          <Card className="p-8 text-center glass-card animate-fade-up">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-display font-semibold mb-2">No Performance Data Available</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This debate doesn't have performance metrics. Click below to analyze it.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reanalyzeDebate} disabled={reanalyzing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${reanalyzing ? 'animate-spin' : ''}`} />
                {reanalyzing ? 'Analyzing...' : 'Analyze Debate'}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>Start New Debate</Button>
            </div>
          </Card>
        )}

        {/* Performance Breakdown */}
        {debate.scores && (
          <>
            <Card className="p-6 glass-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-display font-bold mb-6">Performance Breakdown</h2>
              <div className="grid gap-5">
                {metrics.map((metric, index) => {
                  const data = getScoreData(metric.key, metric.max);
                  const Icon = metric.icon;
                  const percentage = (data.score / data.max) * 100;
                  
                  return (
                    <div key={metric.key} className="space-y-3 animate-fade-up" style={{ animationDelay: `${0.05 * index}s` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getScoreColor(data.score, data.max)}/10`}>
                            <Icon className={`w-5 h-5 ${getScoreTextColor(data.score, data.max)}`} />
                          </div>
                          <h3 className="font-semibold">{metric.label}</h3>
                        </div>
                        <span className={`text-xl font-display font-bold ${getScoreTextColor(data.score, data.max)}`}>
                          {data.score}<span className="text-sm text-muted-foreground">/{data.max}</span>
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{data.notes}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Penalties */}
            {debate.scores.penalties && debate.scores.penalties.length > 0 && (
              <Card className="p-6 glass-card border-destructive/20 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <h2 className="text-xl font-display font-semibold">Penalties</h2>
                </div>
                <div className="space-y-3">
                  {debate.scores.penalties.map((penalty: any, idx: number) => (
                    <div key={idx} className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{penalty.type}</span>
                        <Badge variant="destructive">-{penalty.amount_points} pts</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{penalty.details}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Tips */}
            {((debate.scores.advice && Array.isArray(debate.scores.advice) && debate.scores.advice.length > 0) || 
              (debate.scores.advice?.user && debate.scores.advice.user.length > 0)) && (
              <Card className="p-6 glass-card border-accent/20 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="text-xl font-display font-semibold">Tips for Improvement</h2>
                </div>
                <ul className="space-y-3">
                  {(Array.isArray(debate.scores.advice) ? debate.scores.advice : debate.scores.advice?.user || []).map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        {/* Transcript */}
        {debate.transcript && debate.transcript.length > 0 && (
          <Card className="p-6 glass-card animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold">Transcript</h2>
              <Button onClick={downloadTranscript} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {debate.transcript.map((entry: any, idx: number) => (
                  <div key={idx} className={`p-4 rounded-xl ${
                    entry.speaker === 'user' 
                      ? 'bg-primary/5 border border-primary/20 ml-8' 
                      : 'bg-muted/50 border border-border/50 mr-8'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold text-sm ${entry.speaker === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                        {entry.speaker === 'user' ? 'You' : 'AI Opponent'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(entry.start_time_s)} - {formatTime(entry.end_time_s)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </main>
    </div>
  );
}