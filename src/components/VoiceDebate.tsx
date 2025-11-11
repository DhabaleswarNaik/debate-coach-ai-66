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
}

// You need to create an agent in ElevenLabs dashboard and get the agent ID
const ELEVENLABS_AGENT_ID = "agent_4501k9q5jxvtf5fr6dct0se3zad6";

export const VoiceDebate = ({ config, onEnd }: VoiceDebateProps) => {
  const [timeLog, setTimeLog] = useState({
    userTotal: 0,
    aiTotal: 0,
  });
  const [isConnecting, setIsConnecting] = useState(false);

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
      
      // Start the conversation
      await conversation.startSession({
        signedUrl: data.signedUrl,
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
      
      // Save debate to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase.from("debates").insert({
          user_id: user.id,
          topic: config.topic,
          difficulty: config.difficulty,
          side: config.side,
          allocated_time: config.allocatedTime,
          transcript: null,
          scores: null,
        });

        if (error) {
          console.error("Error saving debate:", error);
          toast.error("Debate saved locally but couldn't sync to your history");
        } else {
          toast.success("Debate saved to your history");
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
