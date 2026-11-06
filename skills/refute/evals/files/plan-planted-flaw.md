# Plan: recover report jobs after a worker crash

## Requirements

- After a worker crash, each unfinished job runs again when the worker restarts.
- A customer never gets the same report email twice, also after a crash.
- A lost email is acceptable, because support can send it again.

## Plan

`jobs.py` holds the queue. A job that a worker claims has the state `running`.

1. Add `Queue.requeue_running()`. It sets each `running` job back to `pending`. The worker calls it once at start.
2. In the worker, after `claim()`, call `was_sent(job_id)`. If it returns true, call `ack(job_id)` and go to the next job.
3. Otherwise call `mark_sent(job_id)`, then send the email, then call `ack(job_id)`. The order means that a crash can lose an email but cannot send it twice.
4. `mark_sent()` already stores the sent flag in the jobs table, so the flag is still there after a restart. This step needs no change to the queue.
5. Add a test that claims a job, calls `mark_sent()`, opens a new `Queue` on the same file, and calls `requeue_running()`. The next `claim()` returns the job, and `was_sent()` returns true.
