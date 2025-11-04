import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, config, transcript, userMessage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt based on config
    const systemPrompt = buildSystemPrompt(config);
    
    // Build messages array
    const messages = [
      { role: "system", content: systemPrompt },
      ...transcript.map((entry: any) => ({
        role: entry.speaker === "user" ? "user" : "assistant",
        content: entry.text
      })),
    ];

    if (userMessage) {
      messages.push({ role: "user", content: userMessage });
    }

    if (action === "respond") {
      // Get AI response
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          temperature: getDifficultyTemperature(config.difficulty),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "evaluate") {
      // Evaluate debate performance
      const evaluationPrompt = buildEvaluationPrompt(config, transcript);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: evaluationPrompt },
            { role: "user", content: "Please evaluate this debate and provide scores." }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("AI gateway error during evaluation");
      }

      const data = await response.json();
      const evaluation = data.choices[0].message.content;

      // Parse the JSON from the evaluation
      let scores;
      try {
        scores = JSON.parse(evaluation);
      } catch {
        // If parsing fails, return a default structure
        scores = generateDefaultScores();
      }

      return new Response(JSON.stringify(scores), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

} catch (error) {
    console.error("debate-ai error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildSystemPrompt(config: any): string {
  const difficultyInstructions = {
    easy: "Use simpler vocabulary, fewer nested claims, and more explicit signposting. Be forgiving in your approach.",
    medium: "Use balanced arguments with moderate complexity and normal pace. Provide constructive feedback.",
    hard: "Use advanced vocabulary, multi-layered arguments, and quick rebuttals. Be strict in your evaluation."
  };

  const sideInstructions = config.side === "proposition" 
    ? "You are arguing AGAINST the motion (opposition side)."
    : "You are arguing FOR the motion (proposition side).";

  return `You are an AI Debate Partner acting as a ${config.difficulty} difficulty opponent.

TOPIC: "${config.topic}"

YOUR ROLE: ${sideInstructions}
DIFFICULTY: ${difficultyInstructions[config.difficulty as keyof typeof difficultyInstructions]}

RULES:
- Each speaker has ${config.allocatedTime} seconds per turn
- Build arguments with: Claim → Reasoning/Evidence → Example → Conclusion
- On rebuttals, reference opponent's claims explicitly
- Stay on topic and maintain your side consistently
- Be professional and engaging

Your goal is to provide a challenging but educational debate experience. Structure your arguments clearly and help the user improve their debating skills.`;
}

function buildEvaluationPrompt(config: any, transcript: any[]): string {
  return `You are an impartial debate judge evaluating a debate session.

TOPIC: "${config.topic}"
DIFFICULTY: ${config.difficulty}

Evaluate the USER's performance (not the AI's) based on this scoring rubric:

1. Argument Quality (30 points):
   - Claim clarity (0-10)
   - Evidence & reasoning (0-12)
   - Persuasiveness (0-8)

2. Relevance (20 points):
   - Direct relevance to topic (0-15)
   - Staying on-side (0-5)

3. Fluency & Delivery (20 points):
   - Speech smoothness (0-10)
   - Clarity (0-5)
   - Pauses and transitions (0-5)

4. Timing & Rules (15 points):
   - Time adherence (0-8)
   - Turn-taking (0-4)
   - Rule following (0-3)

5. Engagement & Rebuttal (15 points):
   - Addressing opponent (0-8)
   - Rebuttal techniques (0-7)

TRANSCRIPT:
${JSON.stringify(transcript, null, 2)}

Return ONLY valid JSON in this exact format:
{
  "argumentQuality": {"score": number, "max": 30, "notes": "string"},
  "relevance": {"score": number, "max": 20, "notes": "string"},
  "fluency": {"score": number, "max": 20, "notes": "string"},
  "timingAndRules": {"score": number, "max": 15, "notes": "string"},
  "engagementRebuttal": {"score": number, "max": 15, "notes": "string"},
  "finalScore": number,
  "penalties": [{"type": "string", "amount": number, "details": "string"}],
  "advice": ["string"]
}`;
}

function getDifficultyTemperature(difficulty: string): number {
  switch (difficulty) {
    case "easy": return 0.7;
    case "hard": return 0.9;
    default: return 0.8;
  }
}

function generateDefaultScores() {
  return {
    argumentQuality: { score: 20, max: 30, notes: "Good structure with room for improvement" },
    relevance: { score: 15, max: 20, notes: "Stayed mostly on topic" },
    fluency: { score: 14, max: 20, notes: "Clear delivery with some pauses" },
    timingAndRules: { score: 12, max: 15, notes: "Good time management" },
    engagementRebuttal: { score: 10, max: 15, notes: "Addressed opponent's points" },
    finalScore: 71,
    penalties: [],
    advice: [
      "Practice structuring arguments with clear claims and evidence",
      "Work on rebuttal techniques to challenge opponent's logic",
      "Use specific examples to strengthen your points"
    ]
  };
}
