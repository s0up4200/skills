# Conditions on the compact tool call

A skill that calls `mcp__compact__after_turn` does not say when the compact mod will skip the compaction. The skill calls the tool, and the mod decides.

## Why this is out of scope

The compact mod skips a compaction for two reasons:

- Its last compaction was less than 30 minutes ago.
- The context holds under 100k tokens.

The agent cannot see the state that the first condition reads. The mod starts its 30-minute timer only after a compaction that the mod itself started. An automatic compaction or a `/compact` command does not start the timer. A reload of the mod clears it. A rule such as "call it if the session did not compact in the last 30 minutes" therefore gives a different answer from the mod. The agent then skips a call that the mod would run, or makes a call that the mod skips.

A skipped call costs one tool call. The tool returns one line that starts with "No compaction:" and gives the reason. If the call has a `then` prompt, the mod still sends that prompt when the turn ends.

If the mod changes its conditions, the skills stay correct, because only the mod holds the conditions.

## Prior requests

- #19: "verify-review: step 8 calls the compact tool when the compact mod will skip it"
