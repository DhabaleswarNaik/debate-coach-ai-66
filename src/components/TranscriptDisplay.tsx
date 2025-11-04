import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Bot } from "lucide-react";
import { TranscriptEntry } from "./ActiveDebate";
import { useEffect, useRef } from "react";

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
}

export const TranscriptDisplay = ({ entries }: TranscriptDisplayProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Debate Transcript</h3>
        <Badge variant="outline">{entries.length} messages</Badge>
      </div>
      
      <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No transcript yet. Start speaking to begin the debate.
            </div>
          ) : (
            entries.map((entry, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  entry.speaker === "ai" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.speaker === "ai" ? "bg-accent" : "bg-primary"
                }`}>
                  {entry.speaker === "ai" ? (
                    <Bot className="w-4 h-4 text-accent-foreground" />
                  ) : (
                    <User className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                
                <div className={`flex-1 ${entry.speaker === "user" ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      entry.speaker === "user" ? "order-2" : ""
                    }`}>
                      {entry.speaker === "ai" ? "AI Opponent" : "You"}
                    </span>
                    <span className={`text-xs text-muted-foreground ${
                      entry.speaker === "user" ? "order-1" : ""
                    }`}>
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <Card className={`p-3 inline-block max-w-[85%] ${
                    entry.speaker === "ai" 
                      ? "bg-muted" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                  </Card>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};
