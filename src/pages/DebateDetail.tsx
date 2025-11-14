import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Trophy, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface TranscriptEntry {
  speaker: string;
  start_time_s: number;
  end_time_s: number;
  text: string;
}

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

    const formatTime = (seconds: number) => {
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

    debate.transcript.forEach((entry) => {
      const speaker = entry.speaker === 'user' ? 'You' : 'AI Opponent';
      content += `[${formatTime(entry.start_time_s)} - ${formatTime(entry.end_time_s)}] ${speaker}:\n`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading debate details...</p>
      </div>
    );
  }

  if (!debate) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{debate.topic}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{debate.difficulty}</Badge>
                <Badge variant="outline">{debate.side}</Badge>
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  {debate.allocated_time}s per turn
                </Badge>
              </div>
            </div>

            {debate.scores?.final_score !== undefined ? (
              <div className="flex items-center gap-3 pt-4 border-t">
                <Trophy className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Final Score</p>
                  <p className="text-4xl font-bold text-accent">{debate.scores.final_score}/100</p>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Performance analysis not available for this debate
                </p>
              </div>
            )}
          </div>
        </Card>

        {!debate.scores && !debate.transcript && (
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Performance Data Available</h2>
            <p className="text-muted-foreground mb-6">
              This debate doesn't have performance metrics or transcript data. This could happen if:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2 mb-6">
              <li>• The debate wasn't completed</li>
              <li>• The analysis process encountered an error</li>
              <li>• This debate was created before the scoring system was added</li>
            </ul>
            <Button onClick={() => navigate("/")}>Start a New Debate</Button>
          </Card>
        )}

        {debate.scores && (
          <>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Performance Breakdown</h2>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Argument Quality</h3>
                      <span className="text-lg font-bold text-primary">
                        {debate.scores.argument_quality?.score || 0}/{debate.scores.argument_quality?.max || 30}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debate.scores.argument_quality?.notes || "No notes available"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Relevance to Topic</h3>
                      <span className="text-lg font-bold text-primary">
                        {debate.scores.relevance?.score || 0}/{debate.scores.relevance?.max || 20}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debate.scores.relevance?.notes || "No notes available"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Fluency & Delivery</h3>
                      <span className="text-lg font-bold text-primary">
                        {debate.scores.fluency?.score || 0}/{debate.scores.fluency?.max || 20}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debate.scores.fluency?.notes || "No notes available"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Timing & Rule Adherence</h3>
                      <span className="text-lg font-bold text-primary">
                        {debate.scores.timing_and_rules?.score || 0}/{debate.scores.timing_and_rules?.max || 15}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debate.scores.timing_and_rules?.notes || "No notes available"}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Engagement & Rebuttal</h3>
                      <span className="text-lg font-bold text-primary">
                        {debate.scores.engagement_rebuttal?.score || 0}/{debate.scores.engagement_rebuttal?.max || 15}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {debate.scores.engagement_rebuttal?.notes || "No notes available"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {debate.scores.penalties && debate.scores.penalties.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h2 className="text-xl font-semibold">Penalties</h2>
                </div>
                <div className="space-y-2">
                  {debate.scores.penalties.map((penalty: any, idx: number) => (
                    <div key={idx} className="p-3 bg-destructive/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{penalty.type}</span>
                        <span className="text-destructive font-bold">{penalty.amount_points} points</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{penalty.details}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {debate.scores.advice?.user && debate.scores.advice.user.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Tips for Improvement</h2>
                <ul className="space-y-2">
                  {debate.scores.advice.user.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        {debate.transcript && debate.transcript.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <Button onClick={downloadTranscript} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {debate.transcript.map((entry, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${
                    entry.speaker === 'user' ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {entry.speaker === 'user' ? 'You' : 'AI Opponent'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(entry.start_time_s)} - {formatTime(entry.end_time_s)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
