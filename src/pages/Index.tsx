import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DebateSetup, DebateConfig } from "@/components/DebateSetup";
import { VoiceDebate } from "@/components/VoiceDebate";
import { DebateFeedback } from "@/components/DebateFeedback";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

type DebateState = "setup" | "active" | "feedback";

const Index = () => {
  const [state, setState] = useState<DebateState>("setup");
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex gap-2">
        {state === "setup" && (
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      {state === "setup" && <DebateSetup onStart={handleStart} />}
      {state === "active" && config && <VoiceDebate config={config} onEnd={handleEnd} userId={user?.id} />}
      {state === "feedback" && config && (
        <DebateFeedback 
          config={config}
          onNewDebate={handleNewDebate}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default Index;
