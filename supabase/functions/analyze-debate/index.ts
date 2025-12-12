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

    // Determine the user's actual debate side (now config.side is AI's side, so user is opposite)
    const userDebateSide = config.side === "proposition" ? "opposition (AGAINST the motion)" : "proposition (FOR the motion)";

    // Use Lovable AI to analyze the debate - ONLY evaluating user's performance
    const analysisPrompt = `You are an expert debate judge and language evaluator. Analyze ONLY THE USER'S performance in this debate. The AI is just a practice partner - do NOT evaluate the AI's arguments.

DEBATE CONTEXT:
- Topic: "${config.topic}"
- Difficulty Level: ${config.difficulty}
- User's Side: ${userDebateSide}
- AI's Side: ${config.side === "proposition" ? "proposition (FOR)" : "opposition (AGAINST)"}

USER'S STATEMENTS TO EVALUATE:
${userEntries.map((e: any) => `"${e.text}"`).join("\n")}

FULL TRANSCRIPT (for context on rebuttals):
${formattedTranscript}

═══════════════════════════════════════════════════════════════
SCORING RUBRIC (Total = 100 points) - EVALUATE ONLY USER'S SPEECH
═══════════════════════════════════════════════════════════════

1. ARGUMENT QUALITY — 30 points maximum
   Evaluate the user's argumentation skills:
   
   A) Claim Clarity (0-10 points):
      - 8-10: Clear, well-defined claims with specific positions
      - 5-7: Understandable claims but somewhat vague
      - 2-4: Unclear or poorly stated claims
      - 0-1: No discernible claims made
   
   B) Evidence & Reasoning (0-12 points):
      - 10-12: Strong logical reasoning with examples/evidence
      - 6-9: Some reasoning but lacks depth or evidence
      - 2-5: Weak reasoning, assertions without support
      - 0-1: No logical support provided
   
   C) Persuasiveness (0-8 points):
      - 7-8: Compelling, convincing delivery
      - 4-6: Somewhat persuasive
      - 1-3: Weak persuasion
      - 0: Not persuasive at all

2. RELEVANCE TO TOPIC — 20 points maximum
   
   A) Topic Adherence (0-15 points):
      - 13-15: Directly and consistently addresses the debate topic
      - 8-12: Mostly on-topic with minor tangents
      - 4-7: Partially relevant, significant off-topic content
      - 0-3: Mostly off-topic or irrelevant statements
   
   B) Side Consistency (0-5 points):
      - 5: Consistently argues for their assigned side (${userDebateSide})
      - 3-4: Mostly consistent but some contradiction
      - 1-2: Unclear which side they support
      - 0: Argues for the wrong side or no clear position

3. FLUENCY & LANGUAGE — 20 points maximum
   Evaluate grammar, vocabulary, and expression quality:
   
   A) Grammar & Syntax (0-10 points):
      - 9-10: Excellent grammar, proper sentence structure
      - 6-8: Minor grammatical errors, mostly correct
      - 3-5: Frequent grammar mistakes affecting clarity
      - 0-2: Poor grammar making meaning unclear
   
   B) Vocabulary Usage (0-5 points):
      - 5: Rich, varied, and appropriate vocabulary
      - 3-4: Good vocabulary with some variety
      - 1-2: Basic or repetitive vocabulary
      - 0: Inappropriate or confusing word choices
   
   C) Coherence & Clarity (0-5 points):
      - 5: Clear, well-organized, easy to follow
      - 3-4: Mostly clear with some confusion
      - 1-2: Difficult to follow
      - 0: Incoherent or incomprehensible

4. ENGAGEMENT & REBUTTAL — 30 points maximum
   
   A) Addressing Opponent's Points (0-15 points):
      - 13-15: Directly addresses and refutes AI's key arguments
      - 8-12: Partially addresses AI's points
      - 4-7: Minimal engagement with opponent's arguments
      - 0-3: Ignores AI's arguments entirely
   
   B) Counter-Argument Quality (0-15 points):
      - 13-15: Strong, well-reasoned counter-arguments
      - 8-12: Adequate rebuttals with some gaps
      - 4-7: Weak or poorly constructed rebuttals
      - 0-3: No meaningful rebuttals

═══════════════════════════════════════════════════════════════
PENALTIES (Deduct from final score):
═══════════════════════════════════════════════════════════════
- Off-topic statements: -5 to -10 points (based on severity)
- Personal attacks or inappropriate language: -5 per incident
- Incoherent or incomplete sentences: -2 per incident
- Contradicting own position: -3 per incident
- Completely ignoring the topic: -10 points

═══════════════════════════════════════════════════════════════
IMPORTANT EVALUATION GUIDELINES:
═══════════════════════════════════════════════════════════════
- BE STRICT AND FAIR: Score based on actual performance
- GRAMMAR MATTERS: Poor grammar should significantly lower the Fluency score
- RELEVANCE IS KEY: Off-topic rambling should result in low Relevance scores
- USER SIDE CHECK: User should argue ${userDebateSide}. If they argue for the wrong side, penalize heavily in Relevance.
- MEANINGFUL ENGAGEMENT: Simply agreeing or making one-word responses = low Engagement score

Return a JSON response in this EXACT format:
{
  "scores": {
    "argument_quality": {"score": number, "max": 30, "notes": "Detailed explanation of user's argument quality, structure, and reasoning"},
    "relevance": {"score": number, "max": 20, "notes": "How well user stayed on topic and defended their assigned side"},
    "fluency": {"score": number, "max": 20, "notes": "Assessment of user's grammar, vocabulary, and language clarity"},
    "engagement_rebuttal": {"score": number, "max": 30, "notes": "How effectively user addressed and countered AI's arguments"}
  },
  "penalties": [{"type": "string", "amount_points": number, "details": "string"}],
  "final_score": number (sum of scores minus penalties, minimum 0),
  "advice": ["First specific, actionable improvement tip", "Second specific improvement tip", "Third tip if applicable"]
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
