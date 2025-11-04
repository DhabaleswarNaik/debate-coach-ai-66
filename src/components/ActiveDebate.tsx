import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, StopCircle, Volume2 } from "lucide-react";
import { DebateConfig } from "./DebateSetup";
import { DebateTimer } from "./DebateTimer";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { toast } from "sonner";

interface ActiveDebateProps {
  config: DebateConfig;
  onEnd: (transcript: TranscriptEntry[], timeLog: TimeLog) => void;
}

export interface TranscriptEntry {
  speaker: "user" | "ai";
  text: string;
  timestamp: number;
}

export interface TimeLog {
  userTotal: number;
  aiTotal: number;
  rounds: Array<{ round: number; userTime: number; aiTime: number }>;
}

export const ActiveDebate = ({ config, onEnd }: ActiveDebateProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "ai">("user");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeLog, setTimeLog] = useState<TimeLog>({
    userTotal: 0,
    aiTotal: 0,
    rounds: [{ round: 1, userTime: 0, aiTime: 0 }]
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioSubmit(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      updateTimeLog(currentSpeaker, duration);
      setElapsedTime(0);
    }
  };

  const updateTimeLog = (speaker: "user" | "ai", duration: number) => {
    setTimeLog(prev => {
      const currentRound = prev.rounds[prev.rounds.length - 1];
      const updatedRound = {
        ...currentRound,
        [speaker === "user" ? "userTime" : "aiTime"]: currentRound[speaker === "user" ? "userTime" : "aiTime"] + duration
      };
      
      return {
        ...prev,
        [speaker === "user" ? "userTotal" : "aiTotal"]: prev[speaker === "user" ? "userTotal" : "aiTotal"] + duration,
        rounds: [...prev.rounds.slice(0, -1), updatedRound]
      };
    });
  };

  const handleAudioSubmit = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64 for API
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          toast.error("Failed to process audio");
          return;
        }

        // Add user transcript entry
        const userEntry: TranscriptEntry = {
          speaker: "user",
          text: "Processing speech...",
          timestamp: Date.now()
        };
        setTranscript(prev => [...prev, userEntry]);

        // In a real implementation, this would call the debate AI edge function
        // For now, we'll simulate a response
        setTimeout(() => {
          const aiEntry: TranscriptEntry = {
            speaker: "ai",
            text: "This is a simulated AI response. The actual implementation will use the debate AI edge function.",
            timestamp: Date.now()
          };
          setTranscript(prev => [...prev, aiEntry]);
          setCurrentSpeaker("user");
        }, 2000);
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process speech");
    }
  };

  const handleEndDebate = () => {
    stopRecording();
    onEnd(transcript, timeLog);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{config.topic}</h2>
              <div className="flex gap-2">
                <Badge variant="outline">{config.difficulty}</Badge>
                <Badge variant="outline">{config.side}</Badge>
              </div>
            </div>
            <Button variant="destructive" onClick={handleEndDebate}>
              <StopCircle className="w-4 h-4 mr-2" />
              End Debate
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <DebateTimer 
              label="Your Time" 
              time={timeLog.userTotal}
              limit={config.allocatedTime}
              isActive={currentSpeaker === "user" && isRecording}
            />
            <DebateTimer 
              label="AI Time" 
              time={timeLog.aiTotal}
              limit={config.allocatedTime}
              isActive={currentSpeaker === "ai"}
            />
          </div>

          <div className="flex gap-2 justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="w-full md:w-auto"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Speaking
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="secondary"
                className="w-full md:w-auto"
              >
                <MicOff className="w-5 h-5 mr-2" />
                Stop Speaking
              </Button>
            )}
          </div>
        </Card>

        <TranscriptDisplay entries={transcript} />
      </div>
    </div>
  );
};
