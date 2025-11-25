import { useState, useEffect } from "react";
import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, StopCircle } from "lucide-react";
import { DebateConfig } from "./DebateSetup";
import { DebateTimer } from "./DebateTimer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceDebateProps {
  config: DebateConfig;
  onEnd: () => void;
  userId?: string;
}

// You need to create an agent in ElevenLabs dashboard and get the agent ID
const ELEVENLABS_AGENT_ID = "agent_4501k9q5jxvtf5fr6dct0se3zad6";

export const VoiceDebate = ({ config, onEnd, userId }: VoiceDebateProps) => {
  const [timeLog, setTimeLog] = useState({
    userTotal: 0,
    aiTotal: 0,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string, timestamp: number}>>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<"user" | "ai" | null>(null);
  const [speakingStartTime, setSpeakingStartTime] = useState<number | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      toast.success("Voice conversation started");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      toast.info("Voice conversation ended");
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      
      // Track transcript
      if (message && typeof message === "object") {
        const msg = message as any;
        if (msg.message && typeof msg.message === "object") {
          setTranscript(prev => [...prev, {
            speaker: msg.message.role === "user" ? "user" : "ai",
            text: msg.message.content || "",
            timestamp: Date.now()
          }]);
        }
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast.error("Voice conversation error");
    },
  });

  const handleStartConversation = async () => {
    try {
      setIsConnecting(true);
      
      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId: ELEVENLABS_AGENT_ID }
      });

      if (error) throw error;
      if (!data.signedUrl) throw new Error("No signed URL received");

      console.log("Starting conversation with signed URL");
      
      // Determine AI's side (opposite of user's side)
      const aiSide = config.side === "proposition" ? "opposition" : "proposition";
      
      // Create debate-specific prompt and first message
      const debatePrompt = `You are an AI debate opponent in a structured debate. 

DEBATE DETAILS:
- Topic: "${config.topic}"
- Your Side: ${aiSide.toUpperCase()}
- Difficulty Level: ${config.difficulty}
- Speaking Time Limit: ${config.allocatedTime} seconds per turn

RULES:
1. You must argue ONLY for the ${aiSide} side
2. Keep each response under ${config.allocatedTime} seconds
3. Use clear, logical arguments with evidence
4. Follow standard debate structure: claim, evidence, reasoning
5. Be respectful and professional
6. Do NOT ask the user for debate parameters - they are already set

DIFFICULTY GUIDELINES:
${config.difficulty === "easy" ? "- Use simple arguments\n- Speak slowly and clearly\n- Focus on 1-2 main points" : 
  config.difficulty === "medium" ? "- Use moderate complexity arguments\n- Include some evidence and reasoning\n- Cover 2-3 main points" :
  "- Use sophisticated arguments\n- Include detailed evidence and counter-arguments\n- Address multiple perspectives"}

Start immediately with your opening argument for the ${aiSide} side.`;

      const firstMessage = `I will argue for the ${aiSide} side of this debate. Let me begin with my opening argument.`;
      
      // Start the conversation with overrides
      await conversation.startSession({
        signedUrl: data.signedUrl,
        overrides: {
          agent: {
            prompt: {
              prompt: debatePrompt
            },
            firstMessage: firstMessage
          }
        }
      });

      setIsConnecting(false);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start conversation");
      setIsConnecting(false);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      
      if (userId) {
        toast.info("Analyzing debate performance...");
        
        // Call edge function to analyze debate
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-debate', {
          body: {
            transcript,
            timeLog,
            config
          }
        });

        let scores = null;
        if (analysisError) {
          console.error("Error analyzing debate:", analysisError);
          toast.error("Could not analyze performance");
        } else {
          scores = analysisData;
        }

        // Save debate to database
        const { error } = await supabase.from("debates").insert({
          user_id: userId,
          topic: config.topic,
          difficulty: config.difficulty,
          side: config.side,
          allocated_time: config.allocatedTime,
          transcript: transcript.length > 0 ? transcript : null,
          scores: scores,
        });

        if (error) {
          console.error("Error saving debate:", error);
          toast.error("Debate saved locally but couldn't sync to your history");
        } else {
          toast.success("Debate saved with performance analysis");
        }
      }
      
      onEnd();
    } catch (error) {
      console.error("Error ending conversation:", error);
      toast.error("Failed to end conversation");
    }
  };

  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    };
  }, []);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Track speaking time
  useEffect(() => {
    if (isSpeaking && currentSpeaker !== "ai") {
      setCurrentSpeaker("ai");
      setSpeakingStartTime(Date.now());
    } else if (!isSpeaking && currentSpeaker === "ai" && speakingStartTime) {
      const duration = (Date.now() - speakingStartTime) / 1000;
      setTimeLog(prev => ({
        ...prev,
        aiTotal: prev.aiTotal + duration
      }));
      setCurrentSpeaker(null);
      setSpeakingStartTime(null);
    }
  }, [isSpeaking, currentSpeaker, speakingStartTime]);

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
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
            </div>
            <Button variant="destructive" onClick={handleEndConversation}>
              <StopCircle className="w-4 h-4 mr-2" />
              End Debate
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <DebateTimer 
              label="Your Time" 
              time={timeLog.userTotal}
              limit={config.allocatedTime}
              isActive={false}
            />
            <DebateTimer 
              label="AI Time" 
              time={timeLog.aiTotal}
              limit={config.allocatedTime}
              isActive={isSpeaking}
            />
          </div>

          <div className="flex flex-col items-center gap-4">
            {!isConnected ? (
              <Button
                onClick={handleStartConversation}
                size="lg"
                className="w-full md:w-auto"
                disabled={isConnecting}
              >
                <Mic className="w-5 h-5 mr-2" />
                {isConnecting ? "Connecting..." : "Start Voice Debate"}
              </Button>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isSpeaking ? (
                    <MicOff className="w-8 h-8 text-primary animate-pulse" />
                  ) : (
                    <Mic className="w-8 h-8 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSpeaking ? "AI is speaking..." : "Listening..."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Setup Required:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create an agent in your ElevenLabs dashboard</li>
              <li>Configure the agent with debate instructions</li>
              <li>Copy the agent ID and update ELEVENLABS_AGENT_ID in the code</li>
              <li>Make sure your ELEVEN_LABS_API_KEY is configured</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  );
};
