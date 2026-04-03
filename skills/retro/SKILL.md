---
name: retro
description: >-
  End-of-task reflection that captures what worked, what didn't, and what to do
  differently next time. Saves actionable learnings to auto memory so they
  persist across sessions. Use when finishing a difficult task, after a long
  debugging session, after completing a feature, or when the user says "retro",
  "what did we learn", "reflect on this session", or "save what you learned".
disable-model-invocation: true
argument-hint: "[optional: focus area or topic]"
---

# Session Retro

Reflect on the work just completed and save actionable learnings to your auto memory system. The goal is to capture insights that will make future sessions better — not to summarize what happened.

## How to reflect

Look back at the conversation and think about:

1. **What approaches worked well?** Did a particular debugging strategy, tool usage pattern, or problem-solving approach prove effective? These are worth remembering.

2. **Where did you get stuck or spiral?** Did you retry the same failing approach too many times? Did you take shortcuts under pressure? Did you agree with something you shouldn't have? Be honest — this is for your own benefit.

3. **What would you do differently?** With hindsight, what's the better path? This is the most valuable part — it turns experience into future guidance.

4. **What did you learn about this codebase or domain?** Build commands that were tricky, architectural patterns that weren't obvious, edge cases that bit you. The kind of thing that would save time if you knew it going in.

If the user provided a focus area via `$ARGUMENTS`, concentrate your reflection there.

## What to save

Save learnings as **feedback-type memories** in your auto memory. Each memory should be:

- **Actionable** — something that changes future behavior, not just an observation
- **Specific** — "in this codebase, test failures in auth/ usually mean the mock DB isn't seeded" not "tests can be tricky"
- **Forward-looking** — written for a future version of yourself starting a fresh session

Good retro memories:

- "When debugging build failures in [project], check [specific thing] first — it's the cause 80% of the time"
- "Don't retry the same approach more than twice. After two failures on the same path, step back and reconsider the strategy"
- "The user prefers [specific approach] over [other approach] for [this kind of task]"

Bad retro memories:

- "Today we fixed a bug" (not actionable)
- "The code is complex" (not specific)
- "Remember to test" (too generic to be useful)

## Output

After reflecting, present a brief summary to the user:

- 2-3 key takeaways from the session
- What you saved to memory (so they can review/edit if they want)
- A note that they can browse memories with `/memory` anytime

Keep it concise. The retro itself should take less than a minute — the value is in the memories saved, not in the ceremony.
