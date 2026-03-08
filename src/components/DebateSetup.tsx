import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Zap, Shield, Target, GraduationCap } from "lucide-react";
import { LogoGlow } from "@/components/LogoGlow";

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
    <div className="h-screen flex items-center justify-center p-3 bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <Card className="w-full max-w-5xl p-8 glass-card shadow-2xl relative animate-fade-up border-border/30">
        {/* Header */}
        <div className="flex items-center gap-5 mb-8">
          <LogoGlow size="md" />
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">AI Debate Partner</h1>
            <p className="text-muted-foreground">Sharpen your argumentation skills with intelligent AI opposition</p>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Column 1 */}
          <div className="space-y-5">
            {/* Language */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language / भाषा</Label>
              <div className="flex gap-3">
                {[
                  { value: "en", label: "English", flag: "🇬🇧" },
                  { value: "hi", label: "हिंदी", flag: "🇮🇳" }
                ].map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value as "en" | "hi")}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-2.5 group ${
                      language === lang.value
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15'
                        : 'border-border/60 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                    style={language === lang.value ? { boxShadow: '0 0 20px hsl(var(--primary) / 0.2), 0 4px 12px hsl(var(--primary) / 0.1)' } : {}}
                  >
                    <span className="text-xl transition-transform duration-300 group-hover:scale-110">{lang.flag}</span>
                    <span className="font-semibold text-sm">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="w-full h-12 text-sm bg-card/50 border-2 border-border/60 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 rounded-xl">
                  <SelectValue placeholder="Choose a debate topic..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-xl rounded-xl">
                  {DEBATE_TOPICS.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id} className="py-3 cursor-pointer rounded-lg">
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
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</Label>
              <div className="grid grid-cols-3 gap-2.5">
                {DIFFICULTY_CONFIG.map((diff) => {
                  const Icon = diff.icon;
                  const isSelected = difficulty === diff.value;
                  return (
                    <button
                      key={diff.value}
                      onClick={() => setDifficulty(diff.value as any)}
                      className={`p-3.5 rounded-xl border-2 transition-all duration-300 text-center group ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15'
                          : 'border-border/60 bg-card/50 hover:border-primary/40 hover:bg-primary/5'
                      }`}
                      style={isSelected ? { boxShadow: '0 0 20px hsl(var(--primary) / 0.2), 0 4px 12px hsl(var(--primary) / 0.1)' } : {}}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1.5 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-lg ${diff.color}`} />
                      <div className="font-semibold text-sm">{diff.label}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground text-center italic">
                {DIFFICULTY_CONFIG.find(d => d.value === difficulty)?.description}
              </p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-5">
            {/* Side */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Position</Label>
              <div className="space-y-2.5">
                <button
                  onClick={() => setSide("proposition")}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    side === "proposition"
                      ? 'border-accent bg-accent/10 shadow-lg shadow-accent/15'
                      : 'border-border/60 bg-card/50 hover:border-accent/40 hover:bg-accent/5'
                  }`}
                  style={side === "proposition" ? { boxShadow: '0 0 20px hsl(var(--accent) / 0.25), 0 4px 12px hsl(var(--accent) / 0.1)' } : {}}
                >
                  <div className="font-bold text-accent text-base mb-1 transition-transform duration-300 group-hover:translate-x-1">⚔️ Argue Against</div>
                  <div className="text-xs text-muted-foreground">You oppose the motion — AI argues FOR it</div>
                </button>
                <button
                  onClick={() => setSide("opposition")}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    side === "opposition"
                      ? 'border-secondary bg-secondary/10 shadow-lg shadow-secondary/15'
                      : 'border-border/60 bg-card/50 hover:border-secondary/40 hover:bg-secondary/5'
                  }`}
                  style={side === "opposition" ? { boxShadow: '0 0 20px hsl(var(--secondary) / 0.25), 0 4px 12px hsl(var(--secondary) / 0.1)' } : {}}
                >
                  <div className="font-bold text-secondary text-base mb-1 transition-transform duration-300 group-hover:translate-x-1">🛡️ Argue For</div>
                  <div className="text-xs text-muted-foreground">You support the motion — AI argues AGAINST it</div>
                </button>
              </div>
            </div>

            {/* Practice Mode */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 group cursor-pointer ${
                practiceMode
                  ? 'border-accent bg-accent/10 shadow-lg shadow-accent/15'
                  : 'border-border/60 bg-card/50 hover:border-accent/40 hover:bg-accent/5'
              }`}
              style={practiceMode ? { boxShadow: '0 0 20px hsl(var(--accent) / 0.2), 0 4px 12px hsl(var(--accent) / 0.1)' } : {}}
              onClick={() => setPracticeMode(!practiceMode)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-accent/20">
                  <GraduationCap className="w-5 h-5 text-accent transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <Label className="font-bold text-sm cursor-pointer">Practice Mode</Label>
                  <p className="text-xs text-muted-foreground">Real-time coaching hints</p>
                </div>
              </div>
              <Switch
                id="practice-mode"
                checked={practiceMode}
                onCheckedChange={setPracticeMode}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Column 3 — Info & Preview */}
          <div className="space-y-5">
            {/* What to expect */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-border/30 space-y-3 h-full">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How it works</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-md group-hover:shadow-primary/20 group-hover:scale-105">
                    <span className="text-xs font-bold text-primary">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">AI Opens</p>
                    <p className="text-xs text-muted-foreground">AI presents its opening argument first</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-md group-hover:shadow-accent/20 group-hover:scale-105">
                    <span className="text-xs font-bold text-accent">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">You Rebut</p>
                    <p className="text-xs text-muted-foreground">Speak your counter-argument using the mic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group">
                  <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-md group-hover:shadow-secondary/20 group-hover:scale-105">
                    <span className="text-xs font-bold text-secondary">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Get Scored</p>
                    <p className="text-xs text-muted-foreground">AI evaluates logic, evidence & delivery</p>
                  </div>
                </div>
                {practiceMode && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border/30 animate-fade-in group">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5 glow-pulse transition-all duration-300 group-hover:scale-105">
                      <span className="text-xs">💡</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-accent">Coaching Active</p>
                      <p className="text-xs text-muted-foreground">You'll get real-time tips after each turn</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected config summary */}
              {selectedTopic && (
                <div className="mt-4 pt-3 border-t border-border/30 animate-fade-in">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Your Setup</p>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-foreground truncate">
                      <span className="text-muted-foreground">Topic:</span>{" "}
                      {DEBATE_TOPICS.find(t => t.id === selectedTopic)?.[language]}
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Difficulty:</span>{" "}
                      <span className="capitalize">{difficulty}</span>
                    </p>
                    <p className="text-foreground">
                      <span className="text-muted-foreground">Position:</span>{" "}
                      {side === "proposition" ? "Against the motion" : "For the motion"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!selectedTopic}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary-hover hover:to-primary shadow-xl shadow-primary/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-glow rounded-xl"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Debate
        </Button>
      </Card>
    </div>
  );
};
