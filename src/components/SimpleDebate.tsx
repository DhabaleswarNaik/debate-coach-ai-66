import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, StopCircle, Volume2, Loader2, Lightbulb, MessageSquare, CheckCircle } from "lucide-react";
import { DebateConfig } from "./DebateSetup";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-1">{config.topic}</h2>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{config.difficulty}</Badge>
                <Badge variant="outline">{config.side}</Badge>
                <Badge variant="outline">{config.language === "hi" ? "हिंदी" : "English"}</Badge>
              </div>
            </div>
            <Button variant="destructive" onClick={handleEndDebate}>
              <StopCircle className="w-4 h-4 mr-2" />
              End Debate
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className={`p-3 rounded-lg text-center ${isRecording ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500' : 'bg-muted/50'}`}>
              <p className="text-sm text-muted-foreground">Your Speaking Time</p>
              <p className="text-xl font-mono">
                {isRecording 
                  ? `${Math.floor(timeLog.userTotal) + liveRecordingTime}s (recording: ${liveRecordingTime}s)`
                  : `${Math.floor(timeLog.userTotal)}s`
                }
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${isAISpeaking ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' : 'bg-muted/50'}`}>
              <p className="text-sm text-muted-foreground">AI Speaking Time</p>
              <p className="text-xl font-mono">
                {isAISpeaking 
                  ? `${Math.floor(timeLog.aiTotal) + liveAITime}s (speaking: ${liveAITime}s)`
                  : `${Math.floor(timeLog.aiTotal)}s`
                }
              </p>
            </div>
          </div>

          {!debateStarted ? (
            <div className="text-center py-8">
              <Button onClick={startDebate} size="lg" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Debate
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                AI will present its opening argument first
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {isAISpeaking && (
                <div className="flex items-center gap-2 text-primary">
                  <Volume2 className="w-6 h-6 animate-pulse" />
                  <span>{config.language === "hi" ? "AI बोल रहा है..." : "AI is speaking..."}</span>
                </div>
              )}
              
              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{config.language === "hi" ? "सोच रहा हूं..." : "Thinking..."}</span>
                </div>
              )}

              {!isAISpeaking && !isProcessing && (
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  variant={isRecording ? "destructive" : "default"}
                  className="min-w-[200px]"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      {config.language === "hi" ? "रिकॉर्डिंग बंद करें" : "Stop Recording"}
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      {config.language === "hi" ? "रिकॉर्डिंग शुरू करें" : "Start Recording"}
                    </>
                  )}
                </Button>
              )}

              {isRecording && (
                <div className="w-full p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    {config.language === "hi" ? "आप कह रहे हैं:" : "You're saying:"}
                  </p>
                  <p className="text-foreground min-h-[24px]">
                    {currentUserText || (config.language === "hi" ? "बोलना शुरू करें..." : "Start speaking...")}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Practice Mode Hint */}
        {currentHint && (
          <Card className={`p-4 border-2 ${
            hintType === "post_speech_review" 
              ? "border-primary/30 bg-primary/5" 
              : "border-accent/30 bg-accent/5"
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                hintType === "post_speech_review" ? "bg-primary/10" : "bg-accent/10"
              }`}>
                {hintType === "post_speech_review" ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : hintType === "opening_guide" ? (
                  <MessageSquare className="w-4 h-4 text-accent" />
                ) : (
                  <Lightbulb className="w-4 h-4 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
                  hintType === "post_speech_review" ? "text-primary" : "text-accent"
                }`}>
                  {hintType === "post_speech_review" 
                    ? "📝 Review & Next Steps" 
                    : hintType === "opening_guide" 
                      ? "🎯 How to Respond" 
                      : "💡 Suggested Approach"}
                </p>
                <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                  {currentHint}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Transcript */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">
            {config.language === "hi" ? "बातचीत का रिकॉर्ड" : "Conversation Transcript"}
          </h3>
          <ScrollArea className="h-[300px]" ref={scrollRef as any}>
            {transcript.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {config.language === "hi" ? "अभी तक कोई बातचीत नहीं" : "No conversation yet"}
              </p>
            ) : (
              <div className="space-y-3 pr-4 font-mono text-sm">
                {transcript.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="font-bold text-primary shrink-0">
                      {entry.speaker === "user" ? "User:" : "AI:"}
                    </span>
                    <span className="text-foreground">{entry.text}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
