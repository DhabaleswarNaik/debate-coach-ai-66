import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { DebateSetup, DebateConfig } from "@/components/DebateSetup";
import { VoiceDebate } from "@/components/VoiceDebate";
import { DebateFeedback } from "@/components/DebateFeedback";
import { Button } from "@/components/ui/button";

type DebateState = "setup" | "active" | "feedback";

const Index = () => {
  const [state, setState] = useState<DebateState>("setup");
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="absolute top-4 right-4">
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>
      
      {state === "setup" && <DebateSetup onStart={handleStart} />}
      {state === "active" && config && <VoiceDebate config={config} onEnd={handleEnd} />}
      {state === "feedback" && config && (
        <DebateFeedback 
          config={config}
          onNewDebate={handleNewDebate}
        />
      )}
    </div>
  );
};

export default Index;
