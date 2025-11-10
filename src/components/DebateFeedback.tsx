import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DebateConfig } from "./DebateSetup";
import { Trophy } from "lucide-react";

interface DebateFeedbackProps {
  config: DebateConfig;
  onNewDebate: () => void;
}

export const DebateFeedback = ({ config, onNewDebate }: DebateFeedbackProps) => {
  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-accent" />
          <h1 className="text-4xl font-bold mb-2">Debate Complete!</h1>
          <div className="text-muted-foreground">
            Topic: {config.topic}
          </div>
          <div className="mt-4">
            <Badge variant="outline" className="mr-2">{config.difficulty}</Badge>
            <Badge variant="outline">{config.side}</Badge>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Note</h3>
          <p className="text-muted-foreground mb-4">
            This was a voice conversation powered by ElevenLabs Conversational AI. 
            For detailed scoring and feedback, you can review the conversation in your ElevenLabs dashboard.
          </p>
          <p className="text-sm text-muted-foreground">
            Future updates will include AI-powered scoring and feedback directly in the app.
          </p>
        </Card>

        <Button onClick={onNewDebate} size="lg" className="w-full">
          Start New Debate
        </Button>
      </div>
    </div>
  );
};
