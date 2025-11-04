import { useState } from "react";
import { DebateSetup, DebateConfig } from "@/components/DebateSetup";
import { ActiveDebate, TranscriptEntry, TimeLog } from "@/components/ActiveDebate";
import { DebateFeedback, DebateScores } from "@/components/DebateFeedback";

type DebateState = "setup" | "active" | "feedback";

const Index = () => {
  const [state, setState] = useState<DebateState>("setup");
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [timeLog, setTimeLog] = useState<TimeLog | null>(null);
  const [scores, setScores] = useState<DebateScores | null>(null);

  const handleStart = (debateConfig: DebateConfig) => {
    setConfig(debateConfig);
    setState("active");
  };

  const handleEnd = async (finalTranscript: TranscriptEntry[], finalTimeLog: TimeLog) => {
    setTranscript(finalTranscript);
    setTimeLog(finalTimeLog);
    
    // TODO: Call edge function to get AI evaluation
    // For now, using mock scores
    const mockScores: DebateScores = {
      argumentQuality: { score: 24, max: 30, notes: "Clear claims with good structure. Could use more specific evidence." },
      relevance: { score: 17, max: 20, notes: "Stayed mostly on topic with minor digressions." },
      fluency: { score: 16, max: 20, notes: "Good pace with some filler words. Consider reducing pauses." },
      timingAndRules: { score: 12, max: 15, notes: "Minor time overrun in round 2." },
      engagementRebuttal: { score: 10, max: 15, notes: "Addressed opponent's points but lacked depth in rebuttals." },
      finalScore: 79,
      penalties: [
        { type: "overtime", amount: -3, details: "8 seconds overtime in round 2" }
      ],
      advice: [
        "Practice reducing filler words like 'um' and 'uh'",
        "Bring specific statistics to support your main claims",
        "Use transition phrases to signal the end of your turn",
        "Spend more time analyzing opponent's evidence in rebuttals"
      ]
    };
    
    setScores(mockScores);
    setState("feedback");
  };

  const handleNewDebate = () => {
    setConfig(null);
    setTranscript([]);
    setTimeLog(null);
    setScores(null);
    setState("setup");
  };

  return (
    <>
      {state === "setup" && <DebateSetup onStart={handleStart} />}
      {state === "active" && config && <ActiveDebate config={config} onEnd={handleEnd} />}
      {state === "feedback" && transcript && timeLog && scores && (
        <DebateFeedback 
          transcript={transcript}
          timeLog={timeLog}
          scores={scores}
          onNewDebate={handleNewDebate}
        />
      )}
    </>
  );
};

export default Index;
