This file says how a run builds on the earlier runs of the same repo (steps 1 to 6 of `SKILL.md`). No single run finds everything: Cloudflare reports that one run found about half of what its repeated runs found in total (https://github.com/cloudflare/security-audit-skill, read on 2026-11-04). So a run starts where the earlier runs stopped.

## Read the earlier runs

An earlier run is a sibling of the run folder that has both `findings.md` and `coverage.md`. A folder without both did not finish, so skip it, even when it is the newest. Read them newest first. When two runs have the same finding or the same checklist item, the newest one counts. Each run is evidence only for its own scope, and a path scope says nothing about the rest of the repo.

For each earlier run, find what changed since its commit:

```sh
git diff --name-only <commit> --
git ls-files --others --exclude-standard
```

If the commit is gone, or the repo has no git, treat each file as changed. A file is unchanged only when this list leaves it out: the same commit name or the same date proves nothing.

## Sort the earlier work

Build `prior.md` in the run folder with this table. "Cited files" are the files of a finding, or the guard of a checklist item.

| Earlier state | Cited files | This run |
|---|---|---|
| finding: proven or not proven | unchanged | **Carried.** It goes to the shared carried re-check agent. It goes on the known list of its area. |
| finding: proven or not proven | changed | **Check again.** First work for its area, with the full claim. It stays off the known list. The hole may be fixed or may have moved. |
| finding: disproved, or picked as by design | unchanged | On the known list of its area. Do not report the same claim again. |
| finding: disproved, or picked as by design | changed | Nothing carries. It can come back as a new finding. |
| item: not reached | any | First work for its area. |
| item: checked | changed | First work for its area. |
| item: checked | unchanged | Last work for its area, after the rest of the checklist. |
| input: in this threat model, and no earlier run followed it | any | First work for each area that it touches. |

An input counts as followed when an earlier `coverage.md` lists it, or when an earlier finding starts at it. An item matches by its exact name. An item with no match is new work, so it goes with the rest of the checklist.

The known list holds only the ID, the title, and the files of each finding. An agent that reads the full claim tends to look for more of the same and to miss what is different. The list stops one path from being reported twice: a different path to the same sink is a new finding.

## Write prior.md

```markdown
# Earlier runs of <repo>

- Read: <run folder names, with commit and scope>
- Carried: <count>. Check again: <count>. Gaps: <count of items not reached, and inputs not followed. Count each input once.>

## <area>
- First work: <items, inputs, and the full claim of each finding to check again>
- Last work: <items>
- Known list: <ID, title, and files>

## Carried findings
<each finding in full, with its run and its ID>
```

## Carried findings in later steps

- Step 4: each carried finding gets its verdict from the current code. The agent reads the cited code again and corrects the lines. A verdict of disproved means that the hole is gone, and the reason names what closed it.
- `findings.md`: a carried finding gets a new ID, in order of risk with the rest, and a `Carried from` line.
- Step 6: a carried finding with an earlier pick of Vault note, Open issue, or Draft advisory keeps that pick and gets no new question, because the record already exists. Each other carried finding gets its question again, because the hole is still in the code.
