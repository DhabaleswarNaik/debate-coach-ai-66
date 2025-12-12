import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  language: "en" | "hi";
}

const DEBATE_TOPICS = [
  {
    id: "ai-future",
    en: "Artificial Intelligence is the future of humanity",
    hi: "कृत्रिम बुद्धिमत्ता मानवता का भविष्य है"
  },
  {
    id: "social-media",
    en: "Social media does more harm than good to society",
    hi: "सोशल मीडिया समाज को फायदे से ज्यादा नुकसान पहुंचाता है"
  },
  {
    id: "climate-action",
    en: "Individual actions can significantly impact climate change",
    hi: "व्यक्तिगत कार्य जलवायु परिवर्तन को महत्वपूर्ण रूप से प्रभावित कर सकते हैं"
  }
];

export const DebateSetup = ({ onStart }: DebateSetupProps) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [side, setSide] = useState<"proposition" | "opposition">("proposition");
  const [allocatedTime, setAllocatedTime] = useState(60);
  const [language, setLanguage] = useState<"en" | "hi">("en");

  const handleStart = () => {
    const topicData = DEBATE_TOPICS.find(t => t.id === selectedTopic);
    if (!topicData) return;
    
    const topic = language === "en" ? topicData.en : topicData.hi;
    onStart({ topic, difficulty, side, allocatedTime, language });
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
            <Label>Language / भाषा</Label>
            <RadioGroup value={language} onValueChange={(v) => setLanguage(v as "en" | "hi")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="font-normal cursor-pointer">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hi" id="lang-hi" />
                <Label htmlFor="lang-hi" className="font-normal cursor-pointer">हिंदी (Hindi)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Select Debate Topic / विषय चुनें</Label>
            <RadioGroup value={selectedTopic} onValueChange={setSelectedTopic}>
              {DEBATE_TOPICS.map((topic) => (
                <div key={topic.id} className="flex items-start space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={topic.id} id={topic.id} className="mt-0.5" />
                  <Label htmlFor={topic.id} className="font-normal cursor-pointer flex-1">
                    <div className="font-medium">{topic.en}</div>
                    <div className="text-sm text-muted-foreground">{topic.hi}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
            <Label>AI Side (You will argue the opposite)</Label>
            <RadioGroup value={side} onValueChange={(v) => setSide(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="proposition" id="proposition" />
                <Label htmlFor="proposition" className="font-normal cursor-pointer">
                  Proposition - AI argues for the motion (You argue against)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="opposition" id="opposition" />
                <Label htmlFor="opposition" className="font-normal cursor-pointer">
                  Opposition - AI argues against the motion (You argue for)
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
            disabled={!selectedTopic}
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
