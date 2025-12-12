import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, StopCircle, Volume2, Loader2 } from "lucide-react";
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
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const userStartTimeRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const accumulatedTextRef = useRef("");

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

  const speakText = useCallback(async (text: string): Promise<void> => {
    const startTime = Date.now();
    setIsAISpeaking(true);
    
    try {
      // Try ElevenLabs TTS via edge function
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text, language: config.language },
      });

      // If error or data is JSON (error response), fallback to browser TTS
      if (error || !data || data instanceof ArrayBuffer === false) {
        console.log("Using browser TTS (ElevenLabs unavailable)");
        return fallbackSpeak(text, startTime);
      }

      const audioBlob = new Blob([data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          const duration = (Date.now() - startTime) / 1000;
          setTimeLog(prev => ({ ...prev, aiTotal: prev.aiTotal + duration }));
          setIsAISpeaking(false);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = () => {
          setIsAISpeaking(false);
          URL.revokeObjectURL(audioUrl);
          fallbackSpeak(text, startTime).then(resolve);
        };
        
        audio.play().catch(() => {
          setIsAISpeaking(false);
          fallbackSpeak(text, startTime).then(resolve);
        });
      });
    } catch (error) {
      console.error("TTS failed, using fallback:", error);
      return fallbackSpeak(text, startTime);
    }
  }, [config.language]);

  const fallbackSpeak = (text: string, startTime: number): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = config.language === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 0.9;
      
      const voices = speechSynthesis.getVoices();
      const langCode = config.language === "hi" ? "hi" : "en";
      const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      
      utterance.onend = () => {
        const duration = (Date.now() - startTime) / 1000;
        setTimeLog(prev => ({ ...prev, aiTotal: prev.aiTotal + duration }));
        setIsAISpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        resolve();
      };

      setIsAISpeaking(true);
      speechSynthesis.speak(utterance);
    });
  };

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
      await speakText(aiText);
      
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
      
      setTranscript([{
        speaker: "ai",
        text: aiText,
        timestamp: Date.now()
      }]);

      setIsProcessing(false);
      await speakText(aiText);
      
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

    // Reset accumulated text
    accumulatedTextRef.current = "";
    setCurrentUserText("");
    userStartTimeRef.current = Date.now();
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info(config.language === "hi" ? "सुन रहा हूं..." : "Listening...");
    } catch (error) {
      console.error("Error starting recognition:", error);
      toast.error("Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recognitionRef.current) return;

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
    // Stop any ongoing audio/speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
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
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Your Speaking Time</p>
              <p className="text-xl font-mono">{Math.floor(timeLog.userTotal)}s</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">AI Speaking Time</p>
              <p className="text-xl font-mono">{Math.floor(timeLog.aiTotal)}s</p>
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
