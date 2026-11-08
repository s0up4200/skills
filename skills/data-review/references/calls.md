# Calls to other systems

Check each call to another system against these rules: an HTTP or API client (a torrent client, a media server, a webhook), a fetch or a mutation in the web app, and the retries, fan-outs, queues, and worker loops around them. A network call has an outcome that a local call does not have: it can return nothing, and then the caller cannot know whether the request got through (DDIA ch. 5, "The problems with remote procedure calls").

Each rule gives what it is, a test at the diff, and the fix. A hit needs a scenario with concrete values: which call fails, when, and what the user or the stored state shows afterwards.

### Remote error read as success

The code reports success for a change that the other system refused or has not answered yet. The usual forms: it checks only the transport error and not the status code; it reads a 200 whose body says the call failed (some APIs answer `Fails.`, `{"ok": false}`, or an error object with status 200); it ignores the error of a call that changes remote state; or it tells the user "saved" before the remote call returns, and nothing corrects the message when the call fails. DDIA ch. 9, "Unreliable Networks", says an error response can come at any level of the stack, or not at all.

**Test:** for each call that changes remote state, find where the code reads the status, the body, and the error, and where it reports success to the user or writes "done" to the store. A hit is a success path that runs before the answer, or that runs for a non-success status, for an error body, or for a swallowed error. In a web app, an optimistic update with no rollback on a failed response is a hit.

**Fix:** map each non-success status and each error body to an error in the client, at one place. Report success, and write any "done" state, only after a positive answer. When the UI updates before the answer, roll it back and show the error when the call fails.

### Blind retry

A retry loop has no cap, no growing delay, no jitter, or no check of `ctx`, or it retries errors that will not change (a 401, a 400, a validation error). Or it repeats a call that is not idempotent (not safe to run twice): after a timeout, the first attempt may have succeeded, and the retry adds, sends, or pushes a second time. An overloaded system that every client retries at a fixed rate stays overloaded (DDIA ch. 2, "When an Overloaded System Won't Recover").

**Test:** for each new retry: a cap, a growing delay with jitter, a `ctx` check, and a split between transient and permanent errors. For each retried call that changes state: either it is idempotent (a set, a delete, an add keyed by a hash that the remote dedupes), or it carries a key that the receiver uses to drop duplicates, or the code reads the remote state before it retries and the remote drops a duplicate that lands late. A read alone makes the window smaller but does not close it, because the first call can still land after the read. Each outbound call has a deadline. A timeout branch that runs the same compensation as a definite failure is a hit.

**Fix:** put the policy in one retry helper with a cap, backoff, jitter, and error classes. Give a non-idempotent call a dedupe key. Read the remote state first only when the remote also drops a late duplicate. Treat a timeout as an unknown outcome, not as a failure.

**Against APOSD:** APOSD says to mask an error at a low level. A retry masks the error correctly only when the call is idempotent. For any other call, the caller must see three outcomes: ok, failed, and unknown. Flag a client that hides a timeout of a call that changes state.

### One result per target

A request waits for every call of a fan-out (`errgroup.Wait`, `Promise.all`) over several instances or targets, so one slow or dead instance sets the response time of the whole page, and one error cancels the others. Or a batch write over several targets returns on the first error, or returns one boolean. Half the targets changed, the user sees "failed", and a retry runs the action again on the half that already changed (DDIA ch. 2, "Use of Response Time Metrics": one slow call makes the whole request slow; ch. 6, quorum limits: a write that reports failure may still have been applied).

**Test:** a fan-out over remote calls on a request path with no deadline for each call, or where one error or one delay stops the others. A batch write that returns on the first error, or returns one status for all targets.

**Fix:** give each call its own deadline, shorter than the request's. Collect a result for each instance or target (`Promise.allSettled`, a slice of per-item errors), and return all of them. Make the retry of a batch safe to repeat on the targets that already changed.

**Against APOSD:** a partial result that leaves out the failed instance hides an error. Aggregate the error high: the result names each instance or target that is missing or failed, and why.

### Slow is not dead

After one timeout or one failed health check, the code declares the other system down and starts expensive work: a re-login, a full resync, a reconnect storm. The other system was slow because it was overloaded, and the reaction adds load, so it stays slow and the instance flaps (DDIA ch. 6, "Leader failure: Failover": an unnecessary failover makes things worse).

**Test:** for each timeout or health check whose failure starts expensive work: is there a threshold of several failures, a backoff, or a cheap probe before the expensive call?

**Fix:** require several failures in a row, probe with the cheapest call first, and back off between expensive recoveries. Put the threshold inside the module as a computed default, not as a setting.

### Poison item

One item that fails each time blocks a loop: the loop returns on the first error, or panics on bad input, and each tick starts at the same item, so nothing after it ever runs (DDIA ch. 12, "Acknowledgments and redelivery": move the failing message aside to unblock the consumers).

**Test:** a loop over work items where one item that fails each time stays first with no limit, or ends the loop. A parked item that no log, status, or UI shows is a hit too.

**Fix:** count the attempts for each item, park the item in a failed state that the user can see after a cap, log it, and continue with the next item.

**Against APOSD:** "just crash" is right when the program's own state is broken. One bad input item is not broken state: park it and log it, and crash only on a broken invariant of the program.

### Queue with no full rule

A new channel, buffer, or array queue has no rule for when it is full. It grows with no limit, or a `select` with a `default:` branch drops items with no count (DDIA ch. 12, "Messaging Systems": the choices are to drop, to buffer, or to apply backpressure, and drops can go unnoticed).

**Test:** name the full behavior of each new queue. An append with no limit is a hit. A drop with no counter or log is a hit.

**Fix:** pick one rule and make it visible: block the producer, drop and count (log or expose the count), or spill to disk. Give an unbounded buffer a limit.

### Notify before visible

One component signals another, and the receiver reads the subject from a different store that may not show it yet. For example, the code adds an item through an API and then lists the items to find it, and the remote has not listed it yet, so the code reports a failure that a retry would not show (DDIA ch. 10, "Cross-channel timing dependencies").

**Test:** a signal and its data travel on different paths: an add followed by a read of a list, a message that carries an ID that the receiver then reads from a cache or a replica.

**Fix:** carry the data in the signal, or carry its key (the hash or the ID that the add already knows) and read it from the store that took the write. When the receiver reads from a cache or a replica, make it wait for a version at least as new as the write, with a deadline.

## Sources

- Martin Kleppmann and Chris Riccomini, _Designing Data-Intensive Applications_, 2nd edition, O'Reilly, February 2026, ISBN 9781098119065: https://oreilly.com/catalog/errata.csp?isbn=9781098119065
