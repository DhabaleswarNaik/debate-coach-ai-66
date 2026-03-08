

## Suggested Features for Your Debate Coach AI

Based on reviewing your project, here are minimal yet impactful features you could add:

### 1. Custom Topic Input
Currently users pick from 10 preset topics. Allow typing a custom debate topic for unlimited flexibility. Minimal change: add a text input option alongside the dropdown in DebateSetup.

### 2. Debate Streak Tracker
Show a "daily streak" counter on the Dashboard (consecutive days with at least one debate). Motivates regular practice. Calculated from existing `created_at` data — no schema changes needed.

### 3. Share Debate Results
Add a "Share" button on the feedback/detail page that copies a shareable summary (topic, score, key stats) to clipboard or generates a share link. Great for social proof.

### 4. Quick Rematch
After a debate ends, add a "Rematch" button that starts a new debate with the same config but swaps your side. Helps users practice arguing both perspectives.

### 5. Debate Stats Leaderboard (Personal Bests)
Show personal records on the dashboard: highest score, longest streak, most debates in a day. Gamification without needing multi-user infrastructure.

### 6. Profile Edit Page
Let users update their first/last name and add an avatar from the dashboard. Currently names are set only at signup with no way to change them.

### 7. Sound Effects & Audio Feedback
Add subtle sound effects for debate start, timer warnings (30s, 10s remaining), and debate end. Enhances the competitive feel with minimal code.

---

Which of these interest you? Pick one or more and I'll implement them.

