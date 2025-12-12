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

    // Extract only user's contributions
    const userEntries = transcript.filter((entry: any) => entry.speaker === "user");
    const userText = userEntries.map((entry: any) => entry.text.trim()).join(" ").trim();
    const userWordCount = userText ? userText.split(/\s+/).filter((w: string) => w.length > 0).length : 0;

    console.log(`User contributions: ${userEntries.length} entries, ${userWordCount} words`);

    // If user didn't speak or said very little, return 0 score
    if (userWordCount < 5) {
      console.log("User did not contribute meaningfully to the debate");
      return new Response(JSON.stringify({
        scores: {
          argument_quality: { score: 0, max: 30, notes: "No arguments presented by user" },
          relevance: { score: 0, max: 20, notes: "User did not engage with the topic" },
          fluency: { score: 0, max: 20, notes: "No speech to evaluate" },
          engagement_rebuttal: { score: 0, max: 30, notes: "No rebuttals or engagement from user" }
        },
        penalties: [],
        final_score: 0,
        advice: [
          "You need to actively participate in the debate by speaking your arguments",
          "Try recording your thoughts on the topic and responding to the AI's points"
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format transcript as "AI:" and "User:" format
    const formattedTranscript = transcript.map((entry: any) => 
      `${entry.speaker === "user" ? "User" : "AI"}: ${entry.text}`
    ).join("\n\n");

    // Use Lovable AI to analyze the debate - ONLY evaluating user's performance
    const analysisPrompt = `You are an expert debate judge. Analyze ONLY THE USER'S performance in this debate. The AI is just a practice partner - do NOT evaluate the AI's arguments.

Debate Config:
- Topic: ${config.topic}
- Difficulty: ${config.difficulty}
- Side: ${config.side}

Transcript:
${formattedTranscript}

IMPORTANT: Score ONLY based on what the USER said. Evaluate their grammar, vocabulary, argument structure, and debate skills.

SCORING RUBRIC (Total = 100 points) - Based ONLY on USER's contributions:

1. Argument Quality — 30 points
   - Claim clarity and structure (0–10)
   - Evidence, reasoning, and logical support (0–12)
   - Persuasiveness and conclusion strength (0–8)

2. Relevance to Topic — 20 points
   - How directly user addressed the debate topic (0–15)
   - Staying consistent with their assigned side (0–5)

3. Fluency & Language — 20 points
   - Grammar and vocabulary usage (0–10)
   - Sentence clarity and coherence (0–5)
   - Natural expression and articulation (0–5)

4. Engagement & Rebuttal — 30 points
   - How well user addressed AI's counterpoints (0–15)
   - Quality of user's rebuttals and counter-arguments (0–15)

PENALTIES:
- Off-topic statements: up to -10 points
- Personal attacks: -5 per incident
- Incoherent or incomplete sentences: -2 per incident

BE STRICT: If user gave weak arguments or poor grammar, score low. If user barely engaged, give minimal points.

Return a JSON response in this EXACT format:
{
  "scores": {
    "argument_quality": {"score": number, "max": 30, "notes": "string explaining user's argument quality"},
    "relevance": {"score": number, "max": 20, "notes": "string explaining how relevant user's points were"},
    "fluency": {"score": number, "max": 20, "notes": "string about user's grammar and language quality"},
    "engagement_rebuttal": {"score": number, "max": 30, "notes": "string about how user engaged with AI's points"}
  },
  "penalties": [{"type": "string", "amount_points": number, "details": "string"}],
  "final_score": number,
  "advice": ["specific actionable tip for user", "another tip"]
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
