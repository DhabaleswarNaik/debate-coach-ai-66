import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, StopCircle, Volume2, Loader2, Lightbulb, MessageSquare, CheckCircle, Sparkles } from "lucide-react";
import { DebateConfig } from "./DebateSetup";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface SimpleDebateProps {
  config: DebateConfig;
  onEnd: () => void;
  userId?: string;
}

interface TranscriptEntry {
  speaker: "user" | "ai";
  text: string;
  timestamp: number;
}

export const SimpleDebate = ({ config, onEnd, userId }: SimpleDebateProps) => {
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const [timeLog, setTimeLog] = useState({ userTotal: 0, aiTotal: 0 });
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUserText, setCurrentUserText] = useState("");
  const [debateStarted, setDebateStarted] = useState(false);
  const [liveRecordingTime, setLiveRecordingTime] = useState(0);
  const [liveAITime, setLiveAITime] = useState(0);
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintType, setHintType] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const userStartTimeRef = useRef<number | null>(null);
  const aiStartTimeRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const accumulatedTextRef = useRef("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aiTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = config.language === "hi" ? "hi-IN" : "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptText = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptText + " ";
        } else {
          interimTranscript += transcriptText;
        }
      }

      if (finalTranscript) {
        accumulatedTextRef.current += finalTranscript;
        setCurrentUserText(accumulatedTextRef.current + interimTranscript);
      } else if (interimTranscript) {
        setCurrentUserText(accumulatedTextRef.current + interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Use ref to check current recording state
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart failed:", e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [config.language]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, currentUserText]);

  // Get the best available voice for the language
  const getBestVoice = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    const langCode = config.language === "hi" ? "hi" : "en";
    
    // Priority list for English voices (higher quality voices first)
    const preferredEnglishVoices = [
      "Google UK English Male",
      "Google UK English Female", 
      "Google US English",
      "Microsoft David",
      "Microsoft Zira",
      "Daniel",
      "Samantha",
      "Alex",
    ];
    
    // Priority list for Hindi voices
    const preferredHindiVoices = [
      "Google हिन्दी",
      "Microsoft Hemant",
      "Lekha",
    ];
    
    const preferredVoices = config.language === "hi" ? preferredHindiVoices : preferredEnglishVoices;
    
    // Try to find a preferred voice
    for (const name of preferredVoices) {
      const voice = voices.find(v => v.name.includes(name));
      if (voice) return voice;
    }
    
    // Fall back to any matching language voice
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchingVoice) return matchingVoice;
    
    // Last resort: first available voice
    return voices[0] || null;
  }, [config.language]);

  const speakText = useCallback(async (text: string): Promise<void> => {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.language === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voice = getBestVoice();
      if (voice) {
        utterance.voice = voice;
        console.log("Using voice:", voice.name);
      }
      
      utterance.onstart = () => {
        setIsAISpeaking(true);
        aiStartTimeRef.current = Date.now();
        setLiveAITime(0);
        aiTimerIntervalRef.current = setInterval(() => {
          if (aiStartTimeRef.current) {
            setLiveAITime(Math.floor((Date.now() - aiStartTimeRef.current) / 1000));
          }
        }, 1000);
      };
      
      utterance.onend = () => {
        if (aiTimerIntervalRef.current) {
          clearInterval(aiTimerIntervalRef.current);
          aiTimerIntervalRef.current = null;
        }
        const duration = (Date.now() - startTime) / 1000;
        setTimeLog(prev => ({ ...prev, aiTotal: prev.aiTotal + duration }));
        setIsAISpeaking(false);
        setLiveAITime(0);
        aiStartTimeRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event.error);
        if (aiTimerIntervalRef.current) {
          clearInterval(aiTimerIntervalRef.current);
          aiTimerIntervalRef.current = null;
        }
        setIsAISpeaking(false);
        setLiveAITime(0);
        aiStartTimeRef.current = null;
        resolve();
      };

      setIsAISpeaking(true);
      speechSynthesis.speak(utterance);
    });
  }, [config.language, getBestVoice]);

  const getAIResponse = async (userText: string) => {
    setIsProcessing(true);
    
    try {
      const userEntry: TranscriptEntry = {
        speaker: "user",
        text: userText,
        timestamp: Date.now()
      };
      setTranscript(prev => [...prev, userEntry]);

      const { data, error } = await supabase.functions.invoke('debate-ai', {
        body: {
          action: "respond",
          config: {
            topic: config.topic,
            difficulty: config.difficulty,
            side: config.side,
            allocatedTime: config.allocatedTime,
            language: config.language
          },
          transcript: [...transcript, userEntry],
          userMessage: userText
        }
      });

      if (error) throw error;

      const aiText = data.response;
      
      setTranscript(prev => [...prev, {
        speaker: "ai",
        text: aiText,
        timestamp: Date.now()
      }]);

      setIsProcessing(false);

      // Fetch hint in parallel with TTS so it's ready instantly when AI stops speaking
      const hintPromise = config.practiceMode
        ? supabase.functions.invoke('debate-ai', {
            body: {
              action: "hint",
              config: {
                topic: config.topic,
                difficulty: config.difficulty,
                side: config.side,
                language: config.language
              },
              transcript: [...transcript, userEntry, { speaker: "ai", text: aiText, timestamp: Date.now() }],
              userMessage: userText
            }
          }).then(({ data: hintData }) => {
            if (hintData?.hint) {
              setCurrentHint(hintData.hint);
              setHintType(hintData.hintType || "response_guide");
            }
          }).catch(e => console.error("Error fetching hint:", e))
        : Promise.resolve();

      await Promise.all([speakText(aiText), hintPromise]);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get AI response");
      setIsProcessing(false);
    }
  };

  const startDebate = async () => {
    setDebateStarted(true);

    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('debate-ai', {
        body: {
          action: "respond",
          config: {
            topic: config.topic,
            difficulty: config.difficulty,
            side: config.side,
            allocatedTime: config.allocatedTime,
            language: config.language
          },
          transcript: [],
          userMessage: config.language === "hi" 
            ? "कृपया अपना उद्घाटन तर्क प्रस्तुत करें।"
            : "Please present your opening argument."
        }
      });

      if (error) throw error;

      const aiText = data.response;
      const aiEntry: TranscriptEntry = { speaker: "ai", text: aiText, timestamp: Date.now() };
      
      setTranscript([aiEntry]);
      setIsProcessing(false);

      // In practice mode, fetch opening hint in parallel with TTS
      const hintPromise = config.practiceMode
        ? supabase.functions.invoke('debate-ai', {
            body: {
              action: "hint",
              config: {
                topic: config.topic,
                difficulty: config.difficulty,
                side: config.side,
                language: config.language
              },
              transcript: [aiEntry],
              userMessage: ""
            }
          }).then(({ data: hintData }) => {
            if (hintData?.hint) {
              setCurrentHint(hintData.hint);
              setHintType(hintData.hintType || "opening_guide");
            }
          }).catch(e => console.error("Error fetching opening hint:", e))
        : Promise.resolve();

      await Promise.all([speakText(aiText), hintPromise]);
      
    } catch (error) {
      console.error("Error starting debate:", error);
      toast.error("Failed to start debate");
      setIsProcessing(false);
    }
  };

  const startRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not available");
      return;
    }

    // Reset accumulated text and hint
    accumulatedTextRef.current = "";
    setCurrentUserText("");
    setCurrentHint(null);
    setLiveRecordingTime(0);
    userStartTimeRef.current = Date.now();
    
    // Start live timer
    timerIntervalRef.current = setInterval(() => {
      if (userStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - userStartTimeRef.current) / 1000);
        setLiveRecordingTime(elapsed);
      }
    }, 1000);
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info(config.language === "hi" ? "सुन रहा हूं..." : "Listening...");
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Failed to start recording");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;

    // Stop live timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop recognition first
    setIsRecording(false);
    isRecordingRef.current = false;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      // Ignore
    }

    // Calculate user speaking time
    if (userStartTimeRef.current) {
      const duration = (Date.now() - userStartTimeRef.current) / 1000;
      setTimeLog(prev => ({ ...prev, userTotal: prev.userTotal + duration }));
      userStartTimeRef.current = null;
    }
    
    setLiveRecordingTime(0);

    // Get the accumulated text
    const userText = accumulatedTextRef.current.trim() || currentUserText.trim();
    
    if (userText) {
      // In practice mode, show immediate review of user's speech first
      if (config.practiceMode) {
        setCurrentHint(null);
        setHintType("post_speech_review");
        // Fire review hint (don't await — it shows while AI is thinking)
        supabase.functions.invoke('debate-ai', {
          body: {
            action: "hint",
            config: {
              topic: config.topic,
              difficulty: config.difficulty,
              side: config.side,
              language: config.language
            },
            transcript: [...transcript, { speaker: "user", text: userText, timestamp: Date.now() }],
            userMessage: userText
          }
        }).then(({ data: hintData }) => {
          if (hintData?.hint) {
            setCurrentHint(hintData.hint);
            setHintType(hintData.hintType || "post_speech_review");
          }
        }).catch(e => console.error("Error fetching review hint:", e));
      }
      await getAIResponse(userText);
    } else {
      toast.info(config.language === "hi" ? "कोई भाषण नहीं मिला" : "No speech detected. Please try speaking louder.");
    }
    
    accumulatedTextRef.current = "";
    setCurrentUserText("");
  };

  const handleEndDebate = async () => {
    // Stop any ongoing speech
    speechSynthesis.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }

    if (userId && transcript.length > 0) {
      toast.info("Analyzing debate performance...");
      
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-debate', {
          body: { transcript, timeLog, config }
        });

        let scores = null;
        if (analysisError) {
          console.error("Error analyzing debate:", analysisError);
        } else {
          scores = analysisData;
        }

        const { error } = await supabase.from("debates").insert([{
          user_id: userId,
          topic: config.topic,
          difficulty: config.difficulty,
          side: config.side,
          allocated_time: config.allocatedTime,
          transcript: transcript as any,
          scores: scores,
          practice_mode: config.practiceMode,
        }]);

        if (error) {
          console.error("Error saving debate:", error);
          toast.error("Couldn't save debate");
        } else {
          toast.success("Debate saved with analysis");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }

    onEnd();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        {isRecording && <div className="absolute inset-0 bg-destructive/3 animate-pulse" />}
        {isAISpeaking && <div className="absolute inset-0 bg-primary/3 animate-pulse" />}
      </div>

      {/* Top Bar */}
      <header className="relative z-10 px-6 py-3 glass-card border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-md shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-display font-bold truncate">{config.topic}</h2>
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-2 py-0">{config.difficulty}</Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0">{config.side}</Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0">{config.language === "hi" ? "हिंदी" : "EN"}</Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Timer */}
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-500 ${
              isRecording 
                ? 'bg-gradient-to-r from-destructive/20 to-destructive/10 border-2 border-destructive shadow-lg' 
                : 'bg-muted/30 border border-border/40'
            }`}
            style={isRecording ? { boxShadow: '0 0 25px hsl(var(--destructive) / 0.3)' } : {}}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isRecording ? 'bg-destructive/20' : 'bg-muted/50'
              }`}>
                <Mic className={`w-4 h-4 transition-all duration-300 ${
                  isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground leading-none mb-0.5">You</p>
                <p className={`text-lg font-mono font-black leading-none tabular-nums ${
                  isRecording ? 'text-destructive' : 'text-foreground'
                }`}>
                  {formatTimer(isRecording ? Math.floor(timeLog.userTotal) + liveRecordingTime : Math.floor(timeLog.userTotal))}
                </p>
              </div>
              {isRecording && <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />}
            </div>

            {/* AI Timer */}
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-500 ${
              isAISpeaking 
                ? 'bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary shadow-lg' 
                : 'bg-muted/30 border border-border/40'
            }`}
            style={isAISpeaking ? { boxShadow: '0 0 25px hsl(var(--primary) / 0.3)' } : {}}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isAISpeaking ? 'bg-primary/20' : 'bg-muted/50'
              }`}>
                <Volume2 className={`w-4 h-4 transition-all duration-300 ${
                  isAISpeaking ? 'text-primary animate-pulse' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground leading-none mb-0.5">AI</p>
                <p className={`text-lg font-mono font-black leading-none tabular-nums ${
                  isAISpeaking ? 'text-primary' : 'text-foreground'
                }`}>
                  {formatTimer(isAISpeaking ? Math.floor(timeLog.aiTotal) + liveAITime : Math.floor(timeLog.aiTotal))}
                </p>
              </div>
              {isAISpeaking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
            </div>

            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleEndDebate}
              className="btn-glow rounded-xl"
            >
              <StopCircle className="w-4 h-4 mr-1.5" />
              End
            </Button>
          </div>
        </div>
      </header>

      {/* Main content — fills remaining space */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full flex gap-4 p-4">
          
          {/* Left: Transcript (takes most space) */}
          <div className="flex-1 flex flex-col min-w-0">
            <Card className="flex-1 flex flex-col glass-card border-border/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">
                  {config.language === "hi" ? "💬 बातचीत" : "💬 Conversation"}
                </h3>
                <Badge variant="outline" className="text-[10px]">{transcript.length} messages</Badge>
              </div>
              <ScrollArea className="flex-1" ref={scrollRef as any}>
                {transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full py-16">
                    <div className="text-center space-y-3 animate-pulse">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {config.language === "hi" ? "बातचीत शुरू होने का इंतज़ार..." : "Waiting for debate to begin..."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-4">
                    {transcript.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex ${entry.speaker === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div
                          className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed transition-all duration-300 hover:shadow-md ${
                            entry.speaker === "user"
                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl rounded-br-sm shadow-md shadow-primary/10"
                              : "bg-muted/80 text-foreground rounded-2xl rounded-bl-sm border border-border/30"
                          }`}
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                            entry.speaker === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}>
                            {entry.speaker === "user" ? "You" : "AI Opponent"}
                          </p>
                          {entry.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Live recording preview inside transcript */}
              {isRecording && (
                <div className="px-4 py-3 border-t border-destructive/20 bg-destructive/5 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-destructive/70 mb-1">
                        {config.language === "hi" ? "लाइव" : "Live"}
                      </p>
                      <p className="text-sm text-foreground">
                        {currentUserText || (config.language === "hi" ? "बोलना शुरू करें..." : "Start speaking...")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Controls + Hints */}
          <div className="w-80 shrink-0 flex flex-col gap-4">
            {/* Controls Card */}
            <Card className="glass-card border-border/30 p-5">
              {!debateStarted ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <Mic className="w-10 h-10 text-primary/60" />
                  </div>
                  <Button 
                    onClick={startDebate} 
                    size="lg" 
                    disabled={isProcessing}
                    className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-primary/80 shadow-xl shadow-primary/20 btn-glow rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Debate
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    AI will present its opening argument first
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status indicator */}
                  <div className="text-center">
                    {isAISpeaking && (
                      <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Volume2 className="w-8 h-8 text-primary animate-pulse" />
                          </div>
                          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                        </div>
                        <span className="text-sm font-semibold text-primary">
                          {config.language === "hi" ? "AI बोल रहा है..." : "AI Speaking..."}
                        </span>
                      </div>
                    )}
                    
                    {isProcessing && (
                      <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {config.language === "hi" ? "सोच रहा हूं..." : "Thinking..."}
                        </span>
                      </div>
                    )}

                    {!isAISpeaking && !isProcessing && (
                      <div className="space-y-3 animate-fade-in">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`w-full group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ${
                            isRecording
                              ? 'bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-xl shadow-destructive/30'
                              : 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-xl shadow-primary/20'
                          }`}
                          style={isRecording 
                            ? { boxShadow: '0 0 30px hsl(var(--destructive) / 0.4), 0 8px 20px hsl(var(--destructive) / 0.2)' }
                            : { boxShadow: '0 0 30px hsl(var(--primary) / 0.3), 0 8px 20px hsl(var(--primary) / 0.15)' }
                          }
                        >
                          <div className="relative z-10 flex flex-col items-center gap-2">
                            {isRecording ? (
                              <MicOff className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                              <Mic className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" />
                            )}
                            <span className="font-bold text-sm">
                              {isRecording 
                                ? (config.language === "hi" ? "बंद करें" : "Stop Recording")
                                : (config.language === "hi" ? "बोलें" : "Start Recording")
                              }
                            </span>
                          </div>
                          {/* Ripple effect on hover */}
                          <div className={`absolute inset-0 rounded-2xl transition-opacity duration-500 ${
                            isRecording ? 'bg-destructive/20' : 'bg-white/10'
                          } opacity-0 group-hover:opacity-100`} />
                        </button>

                        {isRecording && (
                          <div className="flex items-center justify-center gap-1.5 text-destructive text-xs font-mono animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-destructive" />
                            REC {liveRecordingTime}s
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Practice Mode Hint */}
            {currentHint && (
              <Card className={`glass-card border-2 p-4 animate-fade-up ${
                hintType === "post_speech_review" 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-accent/30 bg-accent/5"
              }`}
              style={hintType === "post_speech_review" 
                ? { boxShadow: '0 0 20px hsl(var(--primary) / 0.1)' } 
                : { boxShadow: '0 0 20px hsl(var(--accent) / 0.1)' }
              }
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    hintType === "post_speech_review" ? "bg-primary/10" : "bg-accent/10"
                  }`}>
                    {hintType === "post_speech_review" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    ) : hintType === "opening_guide" ? (
                      <MessageSquare className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                      hintType === "post_speech_review" ? "text-primary" : "text-accent"
                    }`}>
                      {hintType === "post_speech_review" 
                        ? "📝 Review" 
                        : hintType === "opening_guide" 
                          ? "🎯 Respond" 
                          : "💡 Approach"}
                    </p>
                    <div className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                      {currentHint}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
