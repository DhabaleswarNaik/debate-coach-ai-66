import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Sparkles, Zap, Shield, Target } from "lucide-react";

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
  { id: "ai-future", en: "Artificial Intelligence is the future of humanity", hi: "कृत्रिम बुद्धिमत्ता मानवता का भविष्य है" },
  { id: "social-media", en: "Social media does more harm than good to society", hi: "सोशल मीडिया समाज को फायदे से ज्यादा नुकसान पहुंचाता है" },
  { id: "climate-action", en: "Individual actions can significantly impact climate change", hi: "व्यक्तिगत कार्य जलवायु परिवर्तन को महत्वपूर्ण रूप से प्रभावित कर सकते हैं" },
  { id: "tech-social", en: "Technology makes people less social", hi: "प्रौद्योगिकी लोगों को कम सामाजिक बनाती है" },
  { id: "online-education", en: "Online education is better than classroom learning", hi: "ऑनलाइन शिक्षा कक्षा शिक्षा से बेहतर है" },
  { id: "ai-jobs", en: "Artificial intelligence is a threat to jobs", hi: "कृत्रिम बुद्धिमत्ता नौकरियों के लिए खतरा है" },
  { id: "capital-punishment", en: "Capital punishment should be abolished", hi: "मृत्युदंड समाप्त किया जाना चाहिए" },
  { id: "wfh", en: "Work from home improves productivity", hi: "घर से काम करने से उत्पादकता बढ़ती है" },
  { id: "exams", en: "Exams are the best way to assess students", hi: "परीक्षा छात्रों का मूल्यांकन करने का सबसे अच्छा तरीका है" },
  { id: "growth-vs-env", en: "Economic growth matters more than the environment", hi: "आर्थिक विकास पर्यावरण से अधिक महत्वपूर्ण है" },
];

const DIFFICULTY_CONFIG = [
  { value: "easy", label: "Easy", icon: Zap, description: "Simpler arguments, forgiving feedback", color: "text-accent" },
  { value: "medium", label: "Medium", icon: Target, description: "Balanced challenge, moderate complexity", color: "text-primary" },
  { value: "hard", label: "Hard", icon: Shield, description: "Advanced arguments, strict evaluation", color: "text-secondary" },
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-2xl p-8 space-y-8 glass-card shadow-lg relative animate-fade-up">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">AI Debate Partner</h1>
            <p className="text-muted-foreground mt-2">
              Sharpen your argumentation skills with intelligent AI opposition
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Language / भाषा</Label>
            <div className="flex gap-3">
              {[
                { value: "en", label: "English", flag: "🇬🇧" },
                { value: "hi", label: "हिंदी", flag: "🇮🇳" }
              ].map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLanguage(lang.value as "en" | "hi")}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
                    language === lang.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Select Topic</Label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full h-12 text-sm bg-card border-2 border-border hover:border-primary/50 transition-all duration-300">
                <SelectValue placeholder="Choose a debate topic..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg">
                {DEBATE_TOPICS.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id} className="py-3 cursor-pointer">
                    <div>
                      <div className="font-medium">{topic.en}</div>
                      <div className="text-xs text-muted-foreground">{topic.hi}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Difficulty Level</Label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_CONFIG.map((diff) => {
                const Icon = diff.icon;
                return (
                  <button
                    key={diff.value}
                    onClick={() => setDifficulty(diff.value as any)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-center ${
                      difficulty === diff.value
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${diff.color}`} />
                    <div className="font-semibold text-sm">{diff.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {DIFFICULTY_CONFIG.find(d => d.value === difficulty)?.description}
            </p>
          </div>

          {/* Side Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your Position</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide("proposition")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  side === "proposition"
                    ? 'border-accent bg-accent/5 shadow-md'
                    : 'border-border hover:border-accent/50 bg-card'
                }`}
              >
                <div className="font-semibold text-accent mb-1">Argue Against</div>
                <div className="text-xs text-muted-foreground">AI argues FOR the motion</div>
              </button>
              <button
                onClick={() => setSide("opposition")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  side === "opposition"
                    ? 'border-secondary bg-secondary/5 shadow-md'
                    : 'border-border hover:border-secondary/50 bg-card'
                }`}
              >
                <div className="font-semibold text-secondary mb-1">Argue For</div>
                <div className="text-xs text-muted-foreground">AI argues AGAINST the motion</div>
              </button>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            disabled={!selectedTopic}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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