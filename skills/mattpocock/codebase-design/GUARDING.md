# Guarding

A guard is a lint rule that fails when other code reaches past a module to the dependency that the module hides. Without a guard, an agent can import the dependency directly and skip the module. Assumes the vocabulary in [SKILL.md](SKILL.md): **module**, **interface**, **seam**, **depth**.

## Trigger

Run the step only when both of these are true:

1. The module passes the deletion test.
2. The module hides a dependency that other code can import directly. That dependency is a third-party library, or an internal package that no lint rule guards yet.

A thin wrapper gets no guard. The rule adds friction and protects nothing.

## Lookup

Start a background sub-agent. Tell it to read primary sources only: the linter docs and the linter source. The sub-agent writes no file. It reports three facts:

1. The rule that the linter of the project already ships. For Go, `depguard` blocks an import path and `forbidigo` blocks calls to the wrapped API. For TypeScript, `no-restricted-imports` blocks an import path.
2. The configuration for that rule. The `desc` or `message` text names the module to use, so that the agent that hits the failure knows where to go.
3. The fast check that the repo already has, where the agent sees the failure while it works. Examples are a pre-commit hook, a hook in `.claude/settings.json`, or CI.

Continue the session while the sub-agent runs. Only the questions that need its result wait.

## Question

When the sub-agent reports, ask about the proposed rule as a normal question with a recommended answer. Show the configuration and the place where the check runs.

The project can have no linter, or a linter with no matching rule. Then the question names a linter and a rule that can do the job. Recommend that the user skip the guard, unless the project already plans to add that linter. Do not install a tool.

If the repo has no fast check, the question mentions a Claude Code PostToolUse hook in one line and recommends CI.

## Record

The seam decision can earn an ADR by the three tests in `domain-modeling`: hard to reverse, surprising without context, and a real trade-off. Then that ADR names the guard. If not, the guard is a plan item in the ticket resolution, the spec, or the agent brief. The lint configuration and its `desc` text are the lasting record. The guard alone never earns an ADR, because a few lines of configuration are easy to remove.
