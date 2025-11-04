import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Sparkles } from "lucide-react";

interface DebateSetupProps {
  onStart: (config: DebateConfig) => void;
}

export interface DebateConfig {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  side: "proposition" | "opposition";
  allocatedTime: number;
}

export const DebateSetup = ({ onStart }: DebateSetupProps) => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [side, setSide] = useState<"proposition" | "opposition">("proposition");
  const [allocatedTime, setAllocatedTime] = useState(120);

  const handleStart = () => {
    if (!topic.trim()) return;
    onStart({ topic, difficulty, side, allocatedTime });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <Card className="w-full max-w-2xl p-8 space-y-6 shadow-lg">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Debate Partner</h1>
          </div>
          <p className="text-muted-foreground">
            Practice your debating skills with an AI opponent
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Debate Topic</Label>
            <Textarea
              id="topic"
              placeholder="Enter the debate topic (e.g., 'This house believes that universal basic income should be implemented')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Difficulty Level</Label>
            <RadioGroup value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="easy" id="easy" />
                <Label htmlFor="easy" className="font-normal cursor-pointer">
                  Easy - Simpler arguments, forgiving feedback
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="font-normal cursor-pointer">
                  Medium - Balanced challenge, moderate complexity
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hard" id="hard" />
                <Label htmlFor="hard" className="font-normal cursor-pointer">
                  Hard - Advanced arguments, strict evaluation
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Your Side</Label>
            <RadioGroup value={side} onValueChange={(v) => setSide(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proposition" id="proposition" />
                <Label htmlFor="proposition" className="font-normal cursor-pointer">
                  Proposition - Arguing for the motion
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="opposition" id="opposition" />
                <Label htmlFor="opposition" className="font-normal cursor-pointer">
                  Opposition - Arguing against the motion
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Speaking Time (per turn)</Label>
            <RadioGroup value={allocatedTime.toString()} onValueChange={(v) => setAllocatedTime(Number(v))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="60" id="60s" />
                <Label htmlFor="60s" className="font-normal cursor-pointer">1 minute</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="120" id="120s" />
                <Label htmlFor="120s" className="font-normal cursor-pointer">2 minutes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="180" id="180s" />
                <Label htmlFor="180s" className="font-normal cursor-pointer">3 minutes</Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full h-12 text-lg"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Debate
          </Button>
        </div>
      </Card>
    </div>
  );
};
