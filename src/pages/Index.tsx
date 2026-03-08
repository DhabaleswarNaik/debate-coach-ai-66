import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { DebateSetup, DebateConfig } from "@/components/DebateSetup";
import { SimpleDebate } from "@/components/SimpleDebate";
import { DebateFeedback } from "@/components/DebateFeedback";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, LogOut } from "lucide-react";

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

  const handleRematch = () => {
    if (!config) return;
    const swappedConfig: DebateConfig = {
      ...config,
      side: config.side === "proposition" ? "opposition" : "proposition",
    };
    setConfig(swappedConfig);
    setState("active");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {state === "setup" && (
        <header className="fixed top-0 right-0 z-50 p-4 flex gap-2">
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="glass-card shadow-sm hover:shadow-md transition-all"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </header>
      )}
      {state === "setup" && <DebateSetup onStart={handleStart} />}
      {state === "active" && config && <SimpleDebate config={config} onEnd={handleEnd} userId={user?.id} />}
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