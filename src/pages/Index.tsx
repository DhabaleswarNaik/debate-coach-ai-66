import { useState } from "react";
import { DebateSetup, DebateConfig } from "@/components/DebateSetup";
import { VoiceDebate } from "@/components/VoiceDebate";
import { DebateFeedback } from "@/components/DebateFeedback";

type DebateState = "setup" | "active" | "feedback";

const Index = () => {
  const [state, setState] = useState<DebateState>("setup");
  const [config, setConfig] = useState<DebateConfig | null>(null);

  const handleStart = (debateConfig: DebateConfig) => {
    setConfig(debateConfig);
    setState("active");
  };

  const handleEnd = () => {
    setState("feedback");
  };

  const handleNewDebate = () => {
    setConfig(null);
    setState("setup");
  };

  return (
    <>
      {state === "setup" && <DebateSetup onStart={handleStart} />}
      {state === "active" && config && <VoiceDebate config={config} onEnd={handleEnd} />}
      {state === "feedback" && config && (
        <DebateFeedback 
          config={config}
          onNewDebate={handleNewDebate}
        />
      )}
    </>
  );
};

export default Index;
