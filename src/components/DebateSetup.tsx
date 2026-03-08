import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Sparkles, Zap, Shield, Target, GraduationCap } from "lucide-react";

interface DebateSetupProps {
  onStart: (config: DebateConfig) => void;
}

export interface DebateConfig {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  side: "proposition" | "opposition";
  allocatedTime: number;
  language: "en" | "hi";
  practiceMode: boolean;
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
  const [practiceMode, setPracticeMode] = useState(false);

  const handleStart = () => {
    const topicData = DEBATE_TOPICS.find(t => t.id === selectedTopic);
    if (!topicData) return;
    
    const topic = language === "en" ? topicData.en : topicData.hi;
    onStart({ topic, difficulty, side, allocatedTime, language, practiceMode });
  };

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-3xl p-6 glass-card shadow-lg relative animate-fade-up hover-glow card-shine">
        {/* Header — compact */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25 glow-pulse shrink-0">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold gradient-text">AI Debate Partner</h1>
            <p className="text-sm text-muted-foreground">Sharpen your argumentation skills</p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Language */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language / भाषा</Label>
              <div className="flex gap-2">
                {[
                  { value: "en", label: "English", flag: "🇬🇧" },
                  { value: "hi", label: "हिंदी", flag: "🇮🇳" }
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value as "en" | "hi")}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                      language === lang.value
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 bg-card'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-medium text-sm">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-full h-11 text-sm bg-card border-2 border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                  <SelectValue placeholder="Choose a debate topic..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg">
                  {DEBATE_TOPICS.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id} className="py-2.5 cursor-pointer">
                      <div>
                        <div className="font-medium text-sm">{topic.en}</div>
                        <div className="text-xs text-muted-foreground">{topic.hi}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Difficulty</Label>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_CONFIG.map((diff) => {
                  const Icon = diff.icon;
                  return (
                    <button
                      key={diff.value}
                      onClick={() => setDifficulty(diff.value as any)}
                      className={`p-2.5 rounded-xl border-2 transition-all duration-300 text-center group ${
                        difficulty === diff.value
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 bg-card'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 transition-transform duration-300 group-hover:scale-110 ${diff.color}`} />
                      <div className="font-semibold text-xs">{diff.label}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {DIFFICULTY_CONFIG.find(d => d.value === difficulty)?.description}
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Side */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSide("proposition")}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 text-left group ${
                    side === "proposition"
                      ? 'border-accent bg-accent/5 shadow-md shadow-accent/10'
                      : 'border-border hover:border-accent/50 hover:shadow-md hover:shadow-accent/5 bg-card'
                  }`}
                >
                  <div className="font-semibold text-accent text-sm mb-0.5 transition-transform duration-300 group-hover:translate-x-0.5">Argue Against</div>
                  <div className="text-[11px] text-muted-foreground">AI argues FOR</div>
                </button>
                <button
                  onClick={() => setSide("opposition")}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 text-left group ${
                    side === "opposition"
                      ? 'border-secondary bg-secondary/5 shadow-md shadow-secondary/10'
                      : 'border-border hover:border-secondary/50 hover:shadow-md hover:shadow-secondary/5 bg-card'
                  }`}
                >
                  <div className="font-semibold text-secondary text-sm mb-0.5 transition-transform duration-300 group-hover:translate-x-0.5">Argue For</div>
                  <div className="text-[11px] text-muted-foreground">AI argues AGAINST</div>
                </button>
              </div>
            </div>

            {/* Practice Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl border-2 border-border bg-card hover:border-accent/40 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-sm group-hover:shadow-accent/20">
                  <GraduationCap className="w-4 h-4 text-accent transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <Label htmlFor="practice-mode" className="font-semibold text-sm cursor-pointer">Practice Mode</Label>
                  <p className="text-[11px] text-muted-foreground">Real-time coaching hints</p>
                </div>
              </div>
              <Switch
                id="practice-mode"
                checked={practiceMode}
                onCheckedChange={setPracticeMode}
              />
            </div>

            {/* Quick stats / info panel */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to expect</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  AI presents opening argument first
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Speak your rebuttal using the mic
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Get scored on logic, evidence & delivery
                </li>
                {practiceMode && (
                  <li className="flex items-center gap-2 text-accent font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    Coaching hints enabled
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!selectedTopic}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Debate
        </Button>
      </Card>
    </div>
  );
};
