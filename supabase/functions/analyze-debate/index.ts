import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, timeLog, config } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Format transcript as "AI:" and "User:" format
    const formattedTranscript = transcript.map((entry: any) => 
      `${entry.speaker === "user" ? "User" : "AI"}: ${entry.text}`
    ).join("\n\n");

    // Use Lovable AI to analyze the debate
    const analysisPrompt = `You are an expert debate judge. Analyze this debate and provide detailed scoring based on the following rubric:

Debate Config:
- Topic: ${config.topic}
- Difficulty: ${config.difficulty}
- Side: ${config.side}

Transcript:
${formattedTranscript}

SCORING RUBRIC (Total = 100 points):

1. Argument Quality — 30 points
   - Claim clarity (0–10)
   - Evidence & reasoning (0–12)
   - Persuasiveness & conclusion (0–8)

2. Relevance to topic — 20 points
   - Direct relevance (0–15)
   - Staying on-side (0–5)

3. Fluency & Delivery — 20 points
   - Speech smoothness (0–10)
   - Clarity (0–5)
   - Natural flow (0–5)

4. Engagement & Rebuttal — 30 points
   - Addressed opponent's points (0–15)
   - Use of rebuttal techniques (0–15)

PENALTIES:
- Off-topic: up to -10 points
- Personal attacks: -5 per incident

Return a JSON response in this EXACT format:
{
  "scores": {
    "argument_quality": {"score": number, "max": 30, "notes": "string"},
    "relevance": {"score": number, "max": 20, "notes": "string"},
    "fluency": {"score": number, "max": 20, "notes": "string"},
    "engagement_rebuttal": {"score": number, "max": 30, "notes": "string"}
  },
  "penalties": [{"type": "string", "amount_points": number, "details": "string"}],
  "final_score": number,
  "advice": ["string", "string"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-debate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
