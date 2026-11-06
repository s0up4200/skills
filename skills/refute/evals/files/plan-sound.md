# Plan: count the waiting jobs

`jobs.py` holds the queue. A job that no worker claimed has the state `pending`.

1. Add `Queue.pending_count()`. It runs `SELECT COUNT(*) FROM jobs WHERE state = 'pending'` and returns the number.
2. Add a test on a temporary database file. It adds two jobs, claims one, and expects `pending_count()` to return 1.
