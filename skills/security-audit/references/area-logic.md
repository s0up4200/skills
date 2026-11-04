This file is the checklist of the logic and feature abuse area (step 3 of `SKILL.md`). A scanner cannot find these holes, because each line of code does what it says and the flaw is in the design. Check each item against the code in scope.

## Bar for a finding

A finding here can be a state change, not only a path from an input to a sink. Name the party, the step or the feature that it uses, the rule that breaks, and the effect on another party or on shared state. A missing best practice with no such effect is not a finding. A flag is not a finding until you trace the impact.

## Flows

Start here: list each flow of more than one step (setup, an import, a job, a payment, an approval, a delete) and read it from start to end.

- Can a party skip a step, go back, or replay a finished step? What state does that leave?
- If step 2 of 3 fails, does step 1 roll back? Compare the error, retry, cancel, and resume paths with the normal path.
- Check then act with no lock or transaction: two requests at once can both pass the check (a double approve, a lost update, a limit that two requests both pass).
- Negative, zero, huge, and duplicate values in a number or a list. A conversion between a string and a number, or a narrowing to a smaller integer type.
- Expiry, schedule, and rate windows: what happens at the exact boundary, and when two components disagree on the time.
- Defaults and fallbacks: what the app does when a setting is missing, when a feature is off, when a dependency is down, or during a migration. A failure that turns a check off is a finding.

## Trust between components

- Component A checks a value and passes it to component B. Compare what A guarantees with what B assumes: truncation, type changes, normalization, and scope.
- Data that was safe when stored and dangerous later: a name that becomes a path, a stored string that becomes a URL, a regular expression, a template, or a query.
- Data from the database, the config, or a plugin that the code trusts because "it was checked on the way in". Find the other code that writes the same data.
- Two paths to the same effect with different checks: the UI and the API, one item and a batch, the normal route and an import.
- A token, an API key, or a plugin that gains more power after a refresh, a role change, or a delegation. Name the exact action that it should not be able to do.
- A chain of allowed steps: connect the concrete output of one step to the trust decision of the next. Prove each link, and assume none.

## Features used for another purpose

- Export and backup: can a user with few rights export data above those rights, the data of another user, or deleted data?
- Import and restore: can it overwrite data, skip the validation of the normal path, or write where the user cannot write? Treat the content of the archive as input from an attacker.
- Search, filter, and sort: can they show that a hidden object exists, or show its hidden value through the order of the results?
- Differences that show a secret fact: "not found" against "no access", and differences in time, size, or status code. Name the confidential fact. That an account exists is often public.
- Preview and share links: do they unlock more than one item, and do they stop working after a revoke?
- Undelete, restore, and rollback: do they apply the current owner, validation, and rights?

## Odd corners

Read the code that looks boring or half done. It got the least review.

- The strangest code in scope: why it exists, and what happens if someone uses it in the wrong way.
- Calls that the API accepts but the UI never makes: fields, parameters, and routes that the client does not use. The UI limits a user, but the API does not.
- Routes, headers, and parameters that are in the code but not in the docs.
- Features that nobody designed to work together, for example an import with a webhook, or an API key with impersonation.
- `TODO`, `FIXME`, and `HACK` comments that name a check. A comment that says why a thing is safe: verify the claim. A debug or dev mode: what turns it on in production.
- Test and seed credentials that the production build accepts.
- What the tests leave out: compare the edge cases that the tests cover with the ones that they do not.
