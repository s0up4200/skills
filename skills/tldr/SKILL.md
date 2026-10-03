---
name: tldr
description: Rewrite the previous reply as a short version in simple terms, with the simple-english reply rules. Use it when the user types /tldr [focus], or sends a message that is only "tldr", "tl;dr", or "tldr <focus>". Do not use it when "tldr" is part of a longer request.
argument-hint: "[optional: the part to shorten, for example \"q1\" or \"the bugs\"]"
---

# TLDR

The user runs this after a reply that was too long or too hard to read. Give them the same content again, shorter and in simple words. They read it once and then act on it, so the short version must hold every fact that they need to act.

## What to shorten

The target is your previous reply. If the user gave a focus ("q1", "the recommendations", "what I need to decide"), shorten only that part.

Do not run tools and do not do new work. The short version uses only the facts from the long version. If a fact that the user needs is not in the long version, say so in one sentence instead of guessing.

## How to write it

Load the `simple-english` skill and follow its rules for The Reply. These rules apply even when a terse style mode is active: fragments and dropped words are what made the long version hard to read.

1. The first sentence gives the bottom line. When there are several items, give the count and the type: "Three review comments. One is a real bug, one is your call, and one is already fixed."
2. Keep one item per point that the user must know or decide. Drop the reasoning trail, the alternatives you rejected, and the history of how you found it.
3. Say each item in everyday words. When a point is abstract, give one concrete case: "Say you enter two trackers: an unknown one first and then ANT."
4. Define a term the user may not know in a few words at first use: "a commit gate (a check that blocks the commit until the review steps have run)". Do not define product names or code identifiers.
5. When an item is a decision, give your pick and the reason in one sentence. The user usually asks for your opinion next, so give it now.
6. When the long version waits for the user, end with one sentence that says what to type: "Say go and I do both in one commit."

Keep these exactly as they are: code identifiers, file paths, commands, numbers, commit hashes, quoted error text, and warnings. A shorter version that loses a warning or changes a number is worse than the long one.

Aim for a third of the original length or less. Use prose for one or two points of information. For three or more parallel items, such as findings or steps, use a short numbered list with a plain label and a colon. These lists are the exceptions to the no-list rule of `simple-english`, because the user answers by number ("q8 a, q9 ok").

The user must not miss a decision or an action that waits for them. Put each one in its own numbered list, even when there is only one, under the lead-in line "You need to decide:" or "You need to do:". Each item names the choice and gives your pick. Keep the information above the list and the decisions in the list, so that the user can find every decision without reading the rest. When nothing waits for the user, leave out the list.

Do not start with "TL;DR" or a heading, and do not repeat or link the long version.

Before you send it, apply the `unslop` skill to the draft. Rules 27 (say what it does), 32 (mannered prose), and 33 (over-compression) catch the most problems in a short reply.

Write in the language that the user writes in. For Norwegian, use the `norsk-tekst` skill instead of `simple-english`.

## Example

Long version (excerpt): "You have one decision now and three smaller ones for the PR. I can make the three smaller ones myself if you agree with my suggestions. The decision now is about the commit. A commit gate stopped the commit. All four review steps ran on this change. The gate did not see them, maybe because one step ran inside a helper agent, or because the first failed commit attempt reset the gate. [...three more paragraphs...]"

Short version:

> You need to decide four things. Each has my pick.
>
> You need to decide:
>
> 1. Commit: write `nogate`. All four review steps already ran, but the gate missed them. Only whitespace changed since then.
> 2. GUI source tag: the GUI never adds the tracker tag (for example "ANT") when the source field is empty, but the form shows it. My pick: the GUI fills the field with the tag.
> 3. Five removed GUI request fields: the form never showed them, and if we keep them, the GUI ignores their values without a warning. My pick: keep them removed.
> 4. `BatchJob.ToCreateOptions` now also returns an error: library callers change one line, and I know of none. My pick: accept it and note it in the PR.
>
> Say "go with your picks" and I do all four.
