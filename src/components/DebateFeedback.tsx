import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DebateConfig } from "./DebateSetup";
import { Trophy, TrendingUp, Target, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DebateFeedbackProps {
  config: DebateConfig;
  onNewDebate: () => void;
  userId?: string;
}

export const DebateFeedback = ({ config, onNewDebate, userId }: DebateFeedbackProps) => {
  const [scores, setScores] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestDebate();
  }, []);

  const fetchLatestDebate = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("debates")
        .select("scores")
        .eq("user_id", userId)
        .eq("topic", config.topic)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setScores(data?.scores);
    } catch (error) {
      console.error("Error fetching debate scores:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl font-bold mb-2">Debate Complete!</h1>
          <div className="text-muted-foreground mb-4">
            Topic: {config.topic}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline">{config.difficulty}</Badge>
            <Badge variant="outline">{config.side}</Badge>
          </div>

          {!loading && scores && scores.final_score !== undefined && (
            <div className="mt-6 p-6 bg-accent/10 rounded-lg border-2 border-accent">
              <div className="text-sm text-muted-foreground mb-2">Final Score</div>
              <div className="text-6xl font-bold text-accent">{scores.final_score}</div>
              <div className="text-2xl text-muted-foreground">/100</div>
            </div>
          )}
        </Card>

        {loading ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">Analyzing your performance...</p>
          </Card>
        ) : scores ? (
          <>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Performance Breakdown</h3>
              </div>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Argument Quality</p>
                    <p className="text-sm text-muted-foreground">{scores.scores?.argument_quality?.notes}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {scores.scores?.argument_quality?.score || 0}/30
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Relevance to Topic</p>
                    <p className="text-sm text-muted-foreground">{scores.scores?.relevance?.notes}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {scores.scores?.relevance?.score || 0}/20
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Fluency & Delivery</p>
                    <p className="text-sm text-muted-foreground">{scores.scores?.fluency?.notes}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {scores.scores?.fluency?.score || 0}/20
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Timing & Rule Adherence</p>
                    <p className="text-sm text-muted-foreground">{scores.scores?.timing_and_rules?.notes}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {scores.scores?.timing_and_rules?.score || 0}/15
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Engagement & Rebuttal</p>
                    <p className="text-sm text-muted-foreground">{scores.scores?.engagement_rebuttal?.notes}</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {scores.scores?.engagement_rebuttal?.score || 0}/15
                  </div>
                </div>
              </div>
            </Card>

            {scores.penalties && scores.penalties.length > 0 && (
              <Card className="p-6 border-destructive/50">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-semibold">Penalties</h3>
                </div>
                <div className="space-y-2">
                  {scores.penalties.map((penalty: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-destructive/10 rounded">
                      <p className="text-sm">{penalty.details}</p>
                      <Badge variant="destructive">{penalty.amount_points} pts</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {scores.advice?.user && scores.advice.user.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Tips for Improvement</h3>
                </div>
                <ul className="space-y-2">
                  {scores.advice.user.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-6">
            <p className="text-muted-foreground text-center">
              Performance analysis is not available for this debate.
            </p>
          </Card>
        )}

        <Button onClick={onNewDebate} size="lg" className="w-full">
          Start New Debate
        </Button>
      </div>
    </div>
  );
};
