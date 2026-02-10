import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
}

interface PerformanceChartsProps {
  debates: Debate[];
}

export const PerformanceCharts = ({ debates }: PerformanceChartsProps) => {
  // Filter debates with scores
  const debatesWithScores = debates.filter((d) => d.scores?.final_score !== undefined);

  if (debatesWithScores.length === 0) {
    return null;
  }

  // Prepare data for score trend chart (chronological order)
  const scoreTrendData = [...debatesWithScores]
    .reverse()
    .map((debate, index) => ({
      debate: `#${index + 1}`,
      score: debate.scores.final_score,
      date: new Date(debate.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

  // Prepare data for latest performance radar chart
  const latestDebate = debatesWithScores[0];
  const latestScores = latestDebate.scores?.scores || latestDebate.scores;
  const radarData = [
    {
      metric: "Argument",
      score: latestScores?.argument_quality?.score || 0,
      fullMark: 30,
    },
    {
      metric: "Relevance",
      score: latestScores?.relevance?.score || 0,
      fullMark: 20,
    },
    {
      metric: "Fluency",
      score: latestScores?.fluency?.score || 0,
      fullMark: 20,
    },
    {
      metric: "Engagement",
      score: latestScores?.engagement_rebuttal?.score || 0,
      fullMark: 30,
    },
  ];

  // Prepare data for metrics comparison across debates
  const metricsComparisonData = [...debatesWithScores]
    .reverse()
    .slice(-5)
    .map((debate, index) => {
      const s = debate.scores?.scores || debate.scores;
      return {
        debate: `#${index + 1}`,
        Argument: s?.argument_quality?.score || 0,
        Relevance: s?.relevance?.score || 0,
        Fluency: s?.fluency?.score || 0,
        Engagement: s?.engagement_rebuttal?.score || 0,
      };
    });

  // Calculate average scores
  const averageScore =
    debatesWithScores.reduce((sum, d) => sum + (d.scores.final_score || 0), 0) /
    debatesWithScores.length;

  const bestScore = Math.max(...debatesWithScores.map((d) => d.scores.final_score || 0));
  const latestScore = debatesWithScores[0].scores.final_score;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Average Score</p>
          <p className="text-3xl font-bold text-primary">{averageScore.toFixed(1)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Best Score</p>
          <p className="text-3xl font-bold text-accent">{bestScore}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Latest Score</p>
          <p className="text-3xl font-bold text-foreground">{latestScore}</p>
        </Card>
      </div>

      {/* Score Trend Over Time */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Score Trend Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={scoreTrendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="debate" className="text-xs" />
            <YAxis domain={[0, 100]} className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Performance Breakdown */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Latest Performance Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-muted" />
              <PolarAngleAxis dataKey="metric" className="text-xs" />
              <PolarRadiusAxis angle={90} domain={[0, 'auto']} className="text-xs" />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Metrics Comparison Across Debates */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Metrics Comparison (Last {metricsComparisonData.length} Debates)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsComparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="debate" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="Argument" fill="hsl(var(--primary))" />
              <Bar dataKey="Relevance" fill="hsl(var(--accent))" />
              <Bar dataKey="Fluency" fill="hsl(var(--secondary))" />
              <Bar dataKey="Engagement" fill="hsl(var(--foreground))" opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
