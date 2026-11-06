import sqlite3


class Queue:
    def __init__(self, path):
        self.db = sqlite3.connect(path)
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS jobs ("
            "id INTEGER PRIMARY KEY, customer TEXT, state TEXT DEFAULT 'pending')"
        )
        self._sent = set()

    def add(self, customer):
        self.db.execute("INSERT INTO jobs (customer) VALUES (?)", (customer,))
        self.db.commit()

    def claim(self):
        row = self.db.execute(
            "SELECT id, customer FROM jobs WHERE state = 'pending' LIMIT 1"
        ).fetchone()
        if row:
            self.db.execute("UPDATE jobs SET state = 'running' WHERE id = ?", (row[0],))
            self.db.commit()
        return row

    def mark_sent(self, job_id):
        self._sent.add(job_id)

    def was_sent(self, job_id):
        return job_id in self._sent

    def ack(self, job_id):
        self.db.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
        self.db.commit()
