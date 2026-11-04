This file holds the brief of an area agent (step 3 of `SKILL.md`), the brief of a re-check agent (step 4), and the formats of `findings.md` and `coverage.md`.

Each agent starts with a fresh context window and sees only its brief, so the brief carries everything, with absolute paths. Fill each `<…>` slot.

## Area brief

```
You audit one area of a repo for security holes: <area name>.

Repo: <absolute path>
Scope: <path, or "the whole repo">
Checklist: read <absolute path of references/area-<x>.md> and check each item against the code in scope.
Scanner output: <absolute paths of the files in scanners/ for this area, or "none">
Earlier runs: <first work, last work, and known list of this area from prior.md, or "none">

Threat model: read <run folder>/threat-model.md

Rules:
- Read and run read-only commands only. Change no file in the repo. Send nothing to GitHub, and send no request to any host.
- Write the location and the kind of a secret, never its value.
- Cite each file and line from code that you read in this run.

Method: find the entry points first. Then follow the data from each input in the threat model to the place where it does harm, the sink. Read the whole path. A finding is a path from an input that an attacker in the threat model controls to a sink, with no guard that stops it. A scanner hit is a lead: keep it only when the input reaches the sink this way. A path that the by-design list allows is not a finding. A "Bar for a finding" section in the checklist also applies.

Do the first work from the earlier runs first, then the rest of the checklist, then the last work. A path on the known list is not a new finding, and a different path to the same sink is.

Risk scale, from 1 to 10: 1 to 3 is minor or unlikely. 4 to 6 is real but contained. 7 to 10 is a security breach, data loss, or a crash, that an attacker in the threat model can reach.

Return each finding in this form:

### <short title>
- Files: <path:line of the sink>, <path:line of the entry point>, <other hops>
- Attacker: <the party of the threat model, and what it controls>
- Attack: <numbered steps that the attacker takes>
- Exposed: <who or what is harmed>
- Fix: <the smallest change that blocks the path, and where>
- Risk: <N>/10. <one sentence: why this score>

Then the coverage, so that the next run knows where this one stopped:

## Coverage
- Read: <the folders and files that you read>
- Inputs followed: <each input of the threat model that you followed to its end>
- <checklist item>: <one of: checked, guard at path:line | finding, its title | n/a, the reason | not reached, the reason>

An item is one bullet of the checklist. Name it as `<heading>: <its first words>`, copied exactly, so that the next run can match it. Give each item one line. Write "not reached" for an item that you did not finish: a gap on the record is useful, and a guess is not.
```

## Re-check brief

For the shared re-check agent of the findings of Risk 1 to 3, paste each finding and ask for a verdict for each one.

```
You check a security finding and try to disprove it. Treat it as wrong until the code proves it.

Repo: <absolute path>
Run folder: <absolute path>

Threat model: read <run folder>/threat-model.md

Finding:
<the finding as the area agent returned it>

Rules:
- Change no file in the repo. Send nothing to GitHub, and send no request to any host.
- To run a test or a small program, copy the repo to <run folder>/recheck-<id>/ and run it there, against local code and local fakes only. Keep it small and give it a timeout: a load test can stop a shared service and proves nothing that the code does not show.
- Write the location and the kind of a secret, never its value.

Try each way to disprove it:
- The attacker that the finding names cannot reach the input: check the route setup, the login middleware, and the config defaults.
- A guard on the path stops the attack: validation, path cleaning, an allow list, escaping, or a type that cannot hold the payload.
- The sink does no harm in this use.
- The by-design list of the threat model allows it.

Verdict:
- proven: you followed the full path from the input to the sink and found no guard, or a test in the copy shows the attack.
- not proven: the path depends on something that the code cannot show, for example the deployment, a setting of the user, or the behavior of a remote service, or you could not finish the trace. Say what decides it.
- disproved: name the guard and its path:line, or the reason.

Return:
- Verdict: <proven | not proven | disproved>
- Risk: <N>/10, the same score or a new one with the reason
- Proof: each hop from the input to the sink, as path:line and one line about what happens there, or the test and its output
- Reason: for not proven, what decides it. For disproved, the guard or the reason.
```

## Findings file

`findings.md` is the record of the run, and an eval reads it, so keep this format. Put the proven and the not proven findings first, in order of risk from high to low, then the disproved ones.

```markdown
# Security audit: <repo> · <scope> · <date>

- Threat model: threat-model.md
- Areas: <the areas that ran>. Skipped: <area: reason>
- Scanners: <the scanners that ran>. Not installed: <names>

## F1 · <title> · Risk 8/10 · proven
- Area: <area>, also <area> when two agents found it
- Files: <path:line>, <path:line>
- Attacker: <party and what it controls>
- Attack: <numbered steps>
- Exposed: <who or what>
- Fix: <the change>
- Proof: <the hops or the test, from the re-check agent>
- Risk change: <old> → <new>, <reason>. Only when the re-check agent changed it.
- Carried from: <folder name of the earlier run> <its ID>. Only for a carried finding.
- Pick: <the letter and the name of the option from step 6, and the URL or path of what it made>. Added in step 6.

## F2 · <title> · Risk 5/10 · not proven
- …
- Decides it: <what the code cannot show>

# Disproved

## F7 · <title> · was Risk 6/10
- Area: <area>
- Files: <path:line>
- Claim: <one sentence>
- Reason: <the guard and its path:line, or the reason>
```

## Coverage file

`coverage.md` is what the next run reads to find the gaps. Build it from the coverage of each area agent.

```markdown
# Coverage: <repo> · <scope> · <date>

- Commit: <full hash>, <clean or dirty>
- Gaps: <count>

## Gaps
- Input that no agent followed: <input>
- Not reached: <area> · <item> · <reason>

## <area>
- Read: <folders and files>
- Inputs followed: <inputs>
- <checklist item>: <checked, guard at path:line | finding F2 | n/a, the reason | not reached, the reason>
```
