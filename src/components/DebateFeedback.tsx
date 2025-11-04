import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TranscriptEntry, TimeLog } from "./ActiveDebate";
import { Trophy, TrendingUp, Clock, MessageCircle, Target } from "lucide-react";

interface DebateFeedbackProps {
  transcript: TranscriptEntry[];
  timeLog: TimeLog;
  scores: DebateScores;
  onNewDebate: () => void;
}

export interface DebateScores {
  argumentQuality: { score: number; max: number; notes: string };
  relevance: { score: number; max: number; notes: string };
  fluency: { score: number; max: number; notes: string };
  timingAndRules: { score: number; max: number; notes: string };
  engagementRebuttal: { score: number; max: number; notes: string };
  finalScore: number;
  penalties: Array<{ type: string; amount: number; details: string }>;
  advice: string[];
}

export const DebateFeedback = ({ 
  transcript, 
  timeLog, 
  scores, 
  onNewDebate 
}: DebateFeedbackProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl font-bold mb-2">Debate Complete!</h1>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(timeLog.userTotal)} total
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              {transcript.filter(t => t.speaker === "user").length} turns
            </span>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Final Score
          </h2>
          
          <div className="text-center mb-8">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(scores.finalScore)}`}>
              {scores.finalScore}
            </div>
            <div className="text-2xl text-muted-foreground">out of 100</div>
          </div>

          <div className="space-y-4">
            <ScoreMetric
              label="Argument Quality"
              score={scores.argumentQuality.score}
              max={scores.argumentQuality.max}
              notes={scores.argumentQuality.notes}
            />
            <ScoreMetric
              label="Relevance"
              score={scores.relevance.score}
              max={scores.relevance.max}
              notes={scores.relevance.notes}
            />
            <ScoreMetric
              label="Fluency & Delivery"
              score={scores.fluency.score}
              max={scores.fluency.max}
              notes={scores.fluency.notes}
            />
            <ScoreMetric
              label="Timing & Rules"
              score={scores.timingAndRules.score}
              max={scores.timingAndRules.max}
              notes={scores.timingAndRules.notes}
            />
            <ScoreMetric
              label="Engagement & Rebuttal"
              score={scores.engagementRebuttal.score}
              max={scores.engagementRebuttal.max}
              notes={scores.engagementRebuttal.notes}
            />
          </div>
        </Card>

        {scores.penalties.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-destructive" />
              Penalties
            </h3>
            <div className="space-y-2">
              {scores.penalties.map((penalty, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">{penalty.details}</span>
                  <Badge variant="destructive">{penalty.amount} pts</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Actionable Advice</h3>
          <ul className="space-y-2">
            {scores.advice.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-accent mt-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Button onClick={onNewDebate} size="lg" className="w-full">
          Start New Debate
        </Button>
      </div>
    </div>
  );
};

const ScoreMetric = ({ 
  label, 
  score, 
  max, 
  notes 
}: { 
  label: string; 
  score: number; 
  max: number; 
  notes: string;
}) => {
  const percentage = (score / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">
          {score} / {max}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-sm text-muted-foreground">{notes}</p>
    </div>
  );
};
