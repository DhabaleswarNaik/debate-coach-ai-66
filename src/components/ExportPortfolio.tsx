import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface Debate {
  id: string;
  topic: string;
  difficulty: string;
  side: string;
  allocated_time: number;
  created_at: string;
  scores: any;
  transcript?: any;
}

interface ExportPortfolioProps {
  debates: Debate[];
  userName?: string;
}

export const ExportPortfolio = ({ debates, userName }: ExportPortfolioProps) => {
  const [exporting, setExporting] = useState(false);

  const scoredDebates = debates.filter(d => d.scores?.final_score !== undefined);

  const generatePDF = async () => {
    if (scoredDebates.length === 0) {
      toast.error("No scored debates to export");
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const checkPage = (needed: number) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // ===== COVER PAGE =====
      doc.setFillColor(67, 56, 202); // primary indigo
      doc.rect(0, 0, pageWidth, 80, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("Debate Portfolio", pageWidth / 2, 35, { align: "center" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.text(userName || "Student", pageWidth / 2, 48, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, 58, { align: "center" });
      doc.text(`${scoredDebates.length} Scored Debates`, pageWidth / 2, 66, { align: "center" });

      // Summary stats
      y = 95;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Performance Summary", margin, y);
      y += 10;

      const avgScore = Math.round(scoredDebates.reduce((s, d) => s + d.scores.final_score, 0) / scoredDebates.length);
      const bestScore = Math.max(...scoredDebates.map(d => d.scores.final_score));
      const totalDebates = debates.length;

      const stats = [
        { label: "Total Debates", value: String(totalDebates) },
        { label: "Average Score", value: `${avgScore}/100` },
        { label: "Best Score", value: `${bestScore}/100` },
        { label: "Scored Debates", value: String(scoredDebates.length) },
      ];

      const statBoxWidth = (contentWidth - 15) / 4;
      stats.forEach((stat, i) => {
        const x = margin + i * (statBoxWidth + 5);
        doc.setFillColor(245, 245, 250);
        doc.roundedRect(x, y, statBoxWidth, 25, 3, 3, "F");

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(stat.label, x + statBoxWidth / 2, y + 8, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(67, 56, 202);
        doc.text(stat.value, x + statBoxWidth / 2, y + 20, { align: "center" });
      });

      y += 35;

      // Score trend
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Score Progression", margin, y);
      y += 8;

      const trendDebates = [...scoredDebates].reverse();
      const chartWidth = contentWidth;
      const chartHeight = 40;
      const barWidth = Math.min(15, (chartWidth - 10) / trendDebates.length - 2);

      // Draw axis
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + chartHeight, margin + chartWidth, y + chartHeight);

      trendDebates.forEach((debate, i) => {
        const score = debate.scores.final_score;
        const barHeight = (score / 100) * chartHeight;
        const x = margin + 5 + i * (barWidth + 2);

        // Color based on score
        if (score >= 80) doc.setFillColor(16, 185, 129);
        else if (score >= 60) doc.setFillColor(67, 56, 202);
        else if (score >= 40) doc.setFillColor(245, 158, 11);
        else doc.setFillColor(239, 68, 68);

        doc.roundedRect(x, y + chartHeight - barHeight, barWidth, barHeight, 1, 1, "F");

        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        doc.text(String(score), x + barWidth / 2, y + chartHeight + 5, { align: "center" });
      });

      y += chartHeight + 15;

      // ===== INDIVIDUAL DEBATE PAGES =====
      // Sort by score descending (best first)
      const sortedDebates = [...scoredDebates].sort((a, b) => b.scores.final_score - a.scores.final_score);

      sortedDebates.forEach((debate, debateIndex) => {
        doc.addPage();
        y = margin;

        // Debate header
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, pageWidth, 12, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Debate ${debateIndex + 1} of ${sortedDebates.length}`, pageWidth / 2, 8, { align: "center" });

        y = 22;

        // Topic
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const topicLines = doc.splitTextToSize(debate.topic, contentWidth);
        doc.text(topicLines, margin, y);
        y += topicLines.length * 6 + 4;

        // Meta badges
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        const meta = `${debate.difficulty.charAt(0).toUpperCase() + debate.difficulty.slice(1)} · ${debate.side.charAt(0).toUpperCase() + debate.side.slice(1)} · ${new Date(debate.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        doc.text(meta, margin, y);
        y += 10;

        // Score
        doc.setFillColor(245, 245, 250);
        doc.roundedRect(margin, y, contentWidth, 20, 3, 3, "F");

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Final Score", margin + 10, y + 8);

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        const score = debate.scores.final_score;
        if (score >= 80) doc.setTextColor(16, 185, 129);
        else if (score >= 60) doc.setTextColor(67, 56, 202);
        else if (score >= 40) doc.setTextColor(245, 158, 11);
        else doc.setTextColor(239, 68, 68);
        doc.text(`${score}/100`, margin + contentWidth - 10, y + 15, { align: "right" });
        y += 28;

        // Metric breakdown
        const scoresObj = debate.scores?.scores || debate.scores;
        const metrics = [
          { label: "Argument Quality", key: "argument_quality", max: 30 },
          { label: "Relevance", key: "relevance", max: 20 },
          { label: "Fluency & Delivery", key: "fluency", max: 20 },
          { label: "Engagement & Rebuttal", key: "engagement_rebuttal", max: 30 },
        ];

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text("Performance Breakdown", margin, y);
        y += 8;

        metrics.forEach(metric => {
          checkPage(16);
          const data = scoresObj?.[metric.key];
          const metricScore = data?.score || 0;
          const percentage = (metricScore / metric.max) * 100;

          // Label & score
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(50, 50, 50);
          doc.text(metric.label, margin, y);
          doc.text(`${metricScore}/${metric.max}`, margin + contentWidth, y, { align: "right" });
          y += 4;

          // Progress bar
          doc.setFillColor(230, 230, 235);
          doc.roundedRect(margin, y, contentWidth, 3, 1.5, 1.5, "F");

          if (percentage >= 80) doc.setFillColor(16, 185, 129);
          else if (percentage >= 60) doc.setFillColor(67, 56, 202);
          else if (percentage >= 40) doc.setFillColor(245, 158, 11);
          else doc.setFillColor(239, 68, 68);
          doc.roundedRect(margin, y, contentWidth * (percentage / 100), 3, 1.5, 1.5, "F");
          y += 5;

          // Notes
          if (data?.notes) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(120, 120, 120);
            const noteLines = doc.splitTextToSize(data.notes, contentWidth);
            doc.text(noteLines, margin, y + 3);
            y += noteLines.length * 3.5 + 5;
          } else {
            y += 4;
          }
        });

        // Advice
        const advice = Array.isArray(debate.scores.advice) ? debate.scores.advice : debate.scores.advice?.user || [];
        if (advice.length > 0) {
          checkPage(20);
          y += 4;
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("AI Feedback", margin, y);
          y += 7;

          advice.forEach((tip: string, i: number) => {
            checkPage(12);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80, 80, 80);
            const tipLines = doc.splitTextToSize(`${i + 1}. ${tip}`, contentWidth - 5);
            doc.text(tipLines, margin + 3, y);
            y += tipLines.length * 3.5 + 3;
          });
        }

        // Transcript excerpt
        if (debate.transcript && Array.isArray(debate.transcript) && debate.transcript.length > 0) {
          checkPage(20);
          y += 6;
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text("Transcript", margin, y);
          y += 7;

          const maxEntries = Math.min(debate.transcript.length, 10);
          for (let i = 0; i < maxEntries; i++) {
            checkPage(14);
            const entry = debate.transcript[i];
            const speaker = entry.speaker === "user" ? "You" : "AI";

            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(entry.speaker === "user" ? 67 : 100, entry.speaker === "user" ? 56 : 100, entry.speaker === "user" ? 202 : 100);
            doc.text(`${speaker}:`, margin, y);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);
            const textLines = doc.splitTextToSize(entry.text, contentWidth - 15);
            doc.text(textLines, margin + 12, y);
            y += textLines.length * 3.5 + 4;
          }

          if (debate.transcript.length > maxEntries) {
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`... and ${debate.transcript.length - maxEntries} more exchanges`, margin, y);
          }
        }
      });

      // Save
      const fileName = `debate-portfolio-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      toast.success("Portfolio exported successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      disabled={exporting || scoredDebates.length === 0}
      className="gap-2"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Export PDF Portfolio
        </>
      )}
    </Button>
  );
};
