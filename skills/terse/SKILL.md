---
name: terse
description: Terse mode for chat replies, on until the user turns it off. Use when the user types /terse [text], or tells you how to reply with "terse", "be terse", "tldr", "tl;dr", or "be concise", also inside a longer message. Also use when the user asks to make named UI copy or docs terse. Not for a phrase about text that other people read, such as "keep the PR body concise" or "add a tldr section".
argument-hint: "[optional: a question, a task, or the part of the last reply to rewrite]"
---

# Terse

The style is one instruction: be extremely concise, drop grammar for the sake of concision.

## Start

- `/terse` alone, or a message that is only a trigger phrase: rewrite your last reply in this style, with only its facts.
- `/terse <text>`, or a trigger phrase inside a longer message: handle the text as a normal message and reply in this style. When the text names part of the last reply ("q1", "the bugs"), rewrite that part.

## The mode

Each later chat reply to the user is terse too. The mode ends when the user types `/terse off`, "stop terse", or "normal replies", or runs `/clear`. When the user asks for detail ("explain that properly"), give that one reply in full sentences, and go back to terse after it.

The mode shapes chat replies to the user. Text that other people read or that goes into a file (PR bodies, commit messages, issue comments, code comments, docs, UI strings) keeps its own rules. When the user names UI copy or a doc to make terse, rewrite that text in this style and edit the file. That applies to the named text only.

While the mode is on, the `simple-english` reply rules and `unslop` rule 33 (over-compression) give way for terse text, and so does a user or repo rule that asks for full sentences or plain English. The other `unslop` rules still apply.

## Decisions

When a decision or an action waits for the user, end with a numbered list under "You need to decide:" or "You need to do:". Each item names the choice and gives your pick. When nothing waits, leave the list out.
