import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
}

export default function Dashboard() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDebates();
  }, []);

  const fetchDebates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("debates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDebates(data || []);
    } catch (error) {
      console.error("Error fetching debates:", error);
      toast.error("Failed to load debates");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your debates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-background to-muted">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">My Debate History</h1>
          </div>
        </div>

        {debates.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No debates yet</h2>
            <p className="text-muted-foreground mb-6">
              Start your first debate to see your performance history here
            </p>
            <Button onClick={() => navigate("/")}>Start First Debate</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {debates.map((debate) => (
              <Card key={debate.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{debate.topic}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{debate.difficulty}</Badge>
                        <Badge variant="outline">{debate.side}</Badge>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          {debate.allocated_time}s per turn
                        </Badge>
                      </div>
                    </div>

                    {debate.scores && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Argument Quality</p>
                          <p className="text-lg font-semibold text-primary">
                            {debate.scores.argument_quality?.score || 0}/30
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Relevance</p>
                          <p className="text-lg font-semibold text-primary">
                            {debate.scores.relevance?.score || 0}/20
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fluency</p>
                          <p className="text-lg font-semibold text-primary">
                            {debate.scores.fluency?.score || 0}/20
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Timing</p>
                          <p className="text-lg font-semibold text-primary">
                            {debate.scores.timing_and_rules?.score || 0}/15
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <p className="text-lg font-semibold text-primary">
                            {debate.scores.engagement_rebuttal?.score || 0}/15
                          </p>
                        </div>
                      </div>
                    )}

                    {debate.scores && debate.scores.final_score !== undefined && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-accent" />
                          <span className="text-sm text-muted-foreground">Final Score:</span>
                          <span className="text-2xl font-bold text-accent">
                            {debate.scores.final_score}/100
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {formatDate(debate.created_at)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
