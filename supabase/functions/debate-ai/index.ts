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
    } else if (action === "hint") {
      // Generate coaching hint for practice mode
      const hasUserSpoken = transcript.some((e: any) => e.speaker === "user");
      const lastSpeaker = transcript.length > 0 ? transcript[transcript.length - 1].speaker : null;
      
      let hintSystemPrompt: string;
      let hintType: string;

      if (!hasUserSpoken) {
        hintType = "opening_guide";
        hintSystemPrompt = `You are a debate coach. Topic: "${config.topic}". Student argues: "${config.side}".

The opponent just gave their opening. Give exactly 3 ultra-short bullet tips:
• Attack: One specific weakness in opponent's argument (1 line)
• Say this: One power sentence the student should open with (1 line)  
• Approach: One word — aggressive/measured/questioning (1 line)

CRITICAL: Each bullet must be ONE short sentence max. No headers, no numbering, no explanations. Just 3 bullet points.`;
      } else if (lastSpeaker === "user" || userMessage) {
        hintType = "post_speech_review";
        hintSystemPrompt = `You are a debate coach. Topic: "${config.topic}". Student argues: "${config.side}".

The student just spoke. Give exactly 3 ultra-short bullet tips:
• Good: One thing they did well (1 line)
• Fix: One correction or missing point (1 line)
• Next: One sentence they should say next (1 line)

CRITICAL: Each bullet must be ONE short sentence max. No headers, no numbering, no explanations. Just 3 bullet points.`;
      } else {
        hintType = "response_guide";
        hintSystemPrompt = `You are a debate coach. Topic: "${config.topic}". Student argues: "${config.side}".

The opponent just responded. Give exactly 3 ultra-short bullet tips:
• Weakness: One attackable point in opponent's response (1 line)
• Counter: One specific counter-argument to use (1 line)
• Say this: One power sentence to deliver (1 line)

CRITICAL: Each bullet must be ONE short sentence max. No headers, no numbering, no explanations. Just 3 bullet points.`;
      }

      const hintMessages = [
        { role: "system", content: hintSystemPrompt },
        ...transcript.map((entry: any) => ({
          role: entry.speaker === "user" ? "user" : "assistant",
          content: entry.text
        })),
      ];

      if (userMessage) {
        hintMessages.push({ role: "user", content: `[Student's last argument]: ${userMessage}` });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: hintMessages,
          temperature: 0.5,
        }),
      });

      if (!response.ok) throw new Error("AI gateway error during hint generation");

      const data = await response.json();
      const hint = data.choices[0].message.content;

      return new Response(JSON.stringify({ hint, hintType }), {
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
    easy: "Use simpler vocabulary and be forgiving.",
    medium: "Use balanced arguments with moderate complexity.",
    hard: "Use advanced vocabulary and quick rebuttals."
  };

  // config.side now represents the AI's side directly
  const aiSide = config.side === "proposition" ? "PROPOSITION" : "OPPOSITION";
  const userSide = config.side === "proposition" ? "opposition (AGAINST)" : "proposition (FOR)";
  
  const sideInstructions = config.side === "proposition" 
    ? `You are STRICTLY arguing FOR the motion (PROPOSITION side). The user is arguing AGAINST the motion. You MUST support and defend the topic with strong arguments.`
    : `You are STRICTLY arguing AGAINST the motion (OPPOSITION side). The user is arguing FOR the motion. You MUST oppose everything they say and provide counter-arguments against the topic.`;

  const languageInstruction = config.language === "hi"
    ? "IMPORTANT: You MUST respond in Hindi (हिंदी). Use Devanagari script."
    : "Respond in English.";

  return `You are an AI Debate Partner.

TOPIC: "${config.topic}"

YOUR ASSIGNED SIDE: ${aiSide}
USER'S SIDE: ${userSide}

${sideInstructions}

DIFFICULTY: ${difficultyInstructions[config.difficulty as keyof typeof difficultyInstructions]}

LANGUAGE: ${languageInstruction}

ABSOLUTE RULES - NEVER BREAK THESE:
1. NEVER agree with the user's position - you are on the OPPOSITE side
2. NEVER switch sides or acknowledge the user might be right
3. ALWAYS defend YOUR assigned position (${aiSide}) with conviction
4. Give ONLY 1-2 short sentences per response
5. Be direct and concise - no long paragraphs
6. Counter the user's point, then make one point supporting YOUR side

You are a competitive debater. Stay firm on your ${aiSide} position no matter what the user says.`;
}

function buildEvaluationPrompt(config: any, transcript: any[]): string {
  // Format transcript as "AI:" and "User:" format
  const formattedTranscript = transcript.map((entry: any) => 
    `${entry.speaker === "user" ? "User" : "AI"}: ${entry.text}`
  ).join("\n\n");

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
   - Natural flow (0-5)

4. Engagement & Rebuttal (30 points):
   - Addressing opponent's points (0-15)
   - Rebuttal techniques (0-15)

TRANSCRIPT:
${formattedTranscript}

Return ONLY valid JSON in this exact format:
{
  "argumentQuality": {"score": number, "max": 30, "notes": "string"},
  "relevance": {"score": number, "max": 20, "notes": "string"},
  "fluency": {"score": number, "max": 20, "notes": "string"},
  "engagementRebuttal": {"score": number, "max": 30, "notes": "string"},
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
    fluency: { score: 14, max: 20, notes: "Clear delivery" },
    engagementRebuttal: { score: 21, max: 30, notes: "Addressed opponent's points" },
    finalScore: 70,
    penalties: [],
    advice: [
      "Practice structuring arguments with clear claims and evidence",
      "Work on rebuttal techniques to challenge opponent's logic"
    ]
  };
}
