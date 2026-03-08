
# Practice Mode with Real-Time Hints

## Overview
Add a toggle in the Debate Setup screen to enable "Practice Mode." When active, the AI will provide coaching hints after each user turn -- suggestions like "Try addressing their last point" or "Support your claim with evidence" -- displayed as a styled hint card in the debate UI. This acts as training wheels for beginners.

## Changes

### 1. Update `DebateConfig` interface (DebateSetup.tsx)
- Add `practiceMode: boolean` to the `DebateConfig` interface.
- Add a toggle button in the setup form (between Side Selection and Start Button) using the existing Switch component from shadcn/ui.
- The toggle will have a label like "Practice Mode" with a short description: "Get real-time coaching hints during the debate."

### 2. Update `DebateSetup` component UI (DebateSetup.tsx)
- Add state: `const [practiceMode, setPracticeMode] = useState(false);`
- Pass `practiceMode` into the `onStart` config.
- Render a new section with a `Switch` toggle and a `GraduationCap` icon from lucide-react.

### 3. Update `SimpleDebate` component (SimpleDebate.tsx)
- Add a `currentHint` state to store the latest coaching hint.
- After the AI responds to the user's turn, if `config.practiceMode` is true, make a second call to the `debate-ai` edge function with a new action `"hint"` that asks the AI to generate a short coaching hint based on the user's last argument.
- Display the hint in a styled card (with a lightbulb icon) between the recording controls and the transcript, only when a hint is available.
- Clear the hint when the user starts a new recording.

### 4. Update `debate-ai` edge function (supabase/functions/debate-ai/index.ts)
- Add a new `action === "hint"` handler.
- It will use a specialized system prompt that acts as a debate coach (not an opponent), analyzing the user's last message and the conversation context.
- The prompt will instruct the AI to return a single short coaching tip (1 sentence) such as:
  - "Try countering the opponent's point about X before making your own argument."
  - "Your claim needs supporting evidence -- try citing a specific example."
  - "Good rebuttal! Now strengthen it by explaining why their reasoning is flawed."
- Uses the same Gemini model with low temperature (0.5) for consistent hints.

## Technical Details

```text
Setup Screen                    Active Debate Screen
+-------------------------+    +---------------------------+
| ...existing fields...   |    | Topic / Badges            |
|                         |    | Speaking Time Stats       |
| [Practice Mode Toggle]  |    |                           |
|   Switch + description  |    | [Recording Controls]      |
|                         |    |                           |
| [Start Debate]          |    | +--- Hint Card ----------+|
+-------------------------+    | | Lightbulb icon          ||
                               | | "Try addressing their   ||
                               | |  last point about..."   ||
                               | +------------------------+||
                               |                           |
                               | [Transcript]              |
                               +---------------------------+
```

### Files to modify:
1. **src/components/DebateSetup.tsx** -- Add `practiceMode` to config interface, add Switch toggle UI
2. **src/components/SimpleDebate.tsx** -- Add hint state, hint fetch logic after AI response, hint display card
3. **supabase/functions/debate-ai/index.ts** -- Add `"hint"` action handler with coaching prompt
4. **src/pages/Index.tsx** -- No changes needed (config passes through automatically)
