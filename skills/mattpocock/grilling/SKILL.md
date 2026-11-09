---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

The **root** of the tree is the problem, and the opening message often names a solution instead. Treat that solution as one candidate, until the user says in words that it is settled. Before the first round, work out the problem that the solution removes: what goes wrong today, and for whom. Make it Q1 of round 1: state the problem, ask if it is right, and put the user's solution beside each other answer that you would seriously recommend. If you see no better answer, say so. Ask in the same round each question whose answer holds for every candidate. When the source states the problem itself, not only a solution, for example in a Problem field or a map destination, put it in the goal line and skip the question. An agent that takes the solution as settled grills only its implementation.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Open each round with one line that states the goal of the session and the decisions settled so far. When a fact found since the last round changes a recommendation that you already gave, say so by name before the questions, for example "This changes my answer to Q1 from yes to skip, because ...". A changed recommendation hidden in a new question reads as a new problem, and the user loses the goal.

Format a round like so:

```
🎯 <goal> · settled: <decision>, <decision>

❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

Start each question body with a short scenario in the product, with concrete values, for example two releases with the same name from different groups. Under each option, say what the user sees in that scenario. Name things as the user sees them. A user who has not read the code cannot answer a question about a field such as `groupId`.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. Before the first round, find each fact that the tree depends on, so that a later round does not reopen a settled question. For a security question, trace each path by which an attacker reaches the asset, and ask the first round only when every path is known. When a recommendation rests on how an external API, library, or tool behaves, read its current reference before you recommend, also when the repo already uses it. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent with a fresh context window to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

When a recommended answer changes what a live system filters, grabs, deletes, or moves, and the history of that system is at hand (logs, a database copy, an API listing), replay the proposed rule against that history before you recommend it. Give the result in the question, for example "of the last 40 grabs, this rule would have blocked 3, and all 3 were real duplicates".

When a round settles the interface or seam of a code module, read `../codebase-design/GUARDING.md` and put its guard question in the next round.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
