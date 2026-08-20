---
name: go-proverbs
description: Question a Go plan, spec, or design with the Go proverbs from Rob Pike's Gopherfest 2015 talk. Use when the user invokes /go-proverbs on a plan or spec, asks to "question this plan" or "check this against Go proverbs" during planning. Also use in plan mode when a Go plan involves concurrency, interfaces, dependencies, errors, cgo, reflection, or package API design. Do not use for line-level code review — this skill interrogates plans before code exists.
---

# Go Proverbs: Question the Plan

Interrogate a plan or spec with the 19 Go proverbs before any code exists. The proverbs are cheap to apply at planning time and expensive to apply after implementation. A plan that survives them produces less code and fewer rewrites.

The proverbs come from Rob Pike's talk at Gopherfest SV 2015 ([video](https://www.youtube.com/watch?v=PAAkCSZUG1c), [list](https://go-proverbs.github.io/)). "Don't panic" comes from the [Go wiki](https://go.dev/wiki/CodeReviewComments#dont-panic). Each proverb below carries a timestamp into the talk.

## How to Run the Interrogation

1. Read the plan, spec, or design the user provides. If the user gives no context, ask for the plan.
2. Walk the catalog below. For each proverb, decide: does this plan create tension with it?
3. Keep only the proverbs that bite. Most plans trigger 3 to 6 proverbs. A report that cites all 19 buries the real risks.
4. For each proverb that bites, output the proverb, the specific part of the plan it challenges, and 1 to 3 pointed questions. Ask questions — do not lecture and do not rewrite the plan.
5. Close with the one or two questions that matter most. These are the questions that change the plan if the answer is wrong.

Pike said the proverbs can contradict each other, and that this is fine — sometimes one engineering decision is right, sometimes its exact opposite ([21:12](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=21m12s)). Treat them as lenses, not laws. When the user has a good answer to a question, the proverb is satisfied. Do not re-argue a decision the user has already defended.

## Output Format

```
## Proverbs that bite

### "<proverb>"
<what part of the plan this challenges, 1-2 sentences>
- <question>
- <question>

## The questions that matter most
1. <question>
2. <question>
```

## The Catalog

Meanings paraphrased from the talk transcript (Rob Pike, Gopherfest SV 2015, retrieved 2026-08-20).

### 1. Don't communicate by sharing memory, share memory by communicating ([2:48](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=2m48s))

Pass the address of a data structure on a channel. When the sender does not keep the pointer, only the receiver has access, so safe concurrency is inherent in the model. The proverb is about ownership transfer, not about channels being mandatory.

- After each hand-off in this plan, who owns the data? Can two goroutines still reach the same pointer?
- Where the plan uses a shared structure plus a lock, would ownership transfer remove the lock?

### 2. Concurrency is not parallelism ([3:42](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=3m42s))

Concurrency is a way to structure a program so it is easy to understand and scalable. Parallelism is only the simultaneous execution of goroutines. Beginners confuse the two.

- Is the concurrency in this plan a structure, or a speed hack? Does the structure still make sense on one core?
- If the goal is speed, is there a measurement that shows the serial version is too slow?

### 3. Channels orchestrate; mutexes serialize ([4:20](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=4m20s))

A mutex is fine-grained: it makes one thing happen at a time to one variable. Channels and goroutines arrange how the pieces of the whole program work together, as in the canonical select-for loop.

- Does the plan use a channel where it only guards one variable? A mutex is smaller.
- Does the plan use a mutex to coordinate program flow? That is orchestration — channels fit better.

### 4. The bigger the interface, the weaker the abstraction ([5:17](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=5m17s))

The three most important interfaces in the Go ecosystem (`io.Reader`, `io.Writer`, `interface{}`) average two-thirds of a method. Small interfaces get many implementations and become a powerful structuring plan. The culture of small interfaces matters more than implicit satisfaction.

- How many methods does each planned interface have? Which callers need all of them?
- How many implementations do you expect? An interface with one planned implementation is a speculative abstraction.
- Can the interface split into two smaller ones that compose?

### 5. Make the zero value useful ([6:25](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=6m25s))

`bytes.Buffer` and `sync.Mutex` work without a constructor. Zero values compose: a struct whose fields all have useful zero values is itself useful when declared. Constructors are fine, but every avoided constructor is less API.

- For each planned type: what happens when a caller writes `var x T` and uses it?
- Does the plan require constructors or `Init` calls that a useful zero value would remove?

### 6. interface{} says nothing ([7:36](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=7m36s))

The empty interface carries no information and forces no guarantees on the caller, so nothing is statically checked. Pike calls `map[string]interface{}` "names to meaningless objects". Sometimes it is necessary; it is overused.

- Where does the plan use `any`? What is the one method that captures the real requirement?
- Would a generic type parameter or a small interface give the same flexibility with static checks?

### 7. Gofmt's style is no one's favorite, yet gofmt is everyone's favorite ([8:43](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=8m43s))

The value is in consistency, not in the specific choices. Experienced Go programmers name gofmt as their favorite feature even though nobody likes its output.

- Does the plan invent a convention, format, or style where a standard tool or an established convention exists?
- Is any part of the plan a preference argument in disguise?

### 8. A little copying is better than a little dependency ([9:28](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=9m28s))

A small dependency tree makes programs compile faster and easier to maintain. `strconv` copies its own ~10-line `isPrint` instead of importing 150 KB of Unicode tables — and a test keeps the copy in agreement, so the test has the dependency but the package does not.

- For each planned dependency: how many lines of it does the plan actually use? Would copying those lines cost less than the dependency?
- If a copy drifts from its source, what catches it? (The strconv pattern: a test that compares.)

### 9. Syscall must always be guarded with build tags ([11:10](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=11m10s))

`syscall` is system-specific by design — that is the point. If the plan needs portable behavior, it is using the wrong package; use `os` or another portable layer.

- Which OS and architecture does each syscall-touching piece of the plan assume? Where are the build tags?
- Should this use `os` or `golang.org/x/sys` instead?

### 10. Cgo must always be guarded with build tags ([11:53](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=11m53s))

Same reason: C is not portable. A build failure on an unsupported platform is better than a binary that builds and then breaks at runtime.

- On which platforms must this build? What happens on the ones the C code does not support?

### 11. Cgo is not Go ([12:37](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=12m37s))

With cgo you give up memory safety, correctness guarantees, stability, and garbage collection. Pike: about ninety percent of "my runtime corrupted" reports inside Google turned out to be cgo or SWIG problems. Sometimes a C library deserves use rather than a rewrite — but it is a trap to reach for it early.

- Is there a pure-Go path, even a slower one? What exactly does the C library buy?
- Who debugs the crashes that Go tooling can no longer explain?

### 12. With the unsafe package there are no guarantees ([13:49](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=13m49s))

Code that uses `unsafe` can break on any release, and the Go team would like to break more of it than they do.

- Is there a measurement that justifies `unsafe` in this plan? What is the fallback when a release breaks it?

### 13. Clear is better than clever ([14:35](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=14m35s))

Some languages treat compact, clever code as a virtue. Go does not: clarity is what gives maintainability, stability, and the ability of other people to read the code.

- Which part of this plan will a new reader misread first?
- Where is the plan clever — dense, tricky, compressed — when a dumber design does the job?

### 14. Reflection is never clear ([15:22](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=15m22s))

Reflection has almost no compile-time checking and the code is, in Pike's words, utterly impenetrable — and he has written more of it than almost anyone. It is very powerful and for very few people.

- Can generics, a small interface, or code generation replace the planned reflection?
- Who maintains the reflect code after the author leaves?

### 15. Errors are values ([16:13](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=16m13s))

An error is a value you can program with: store it, put it in a loop, cache it, aggregate it. A try/catch is a control structure — you cannot program it. Writing `if err != nil` everywhere means you are writing code, not programming.

- Does the plan design its error values (types, wrapping, aggregation), or does it assume `if err != nil { return err }` throughout?
- Where would a programmed error (an errWriter-style accumulator, a sentinel, a typed error) remove repetition?

### 16. Don't just check errors, handle them gracefully ([17:25](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=17m25s))

Do not only return the error up the tree and forget it. Decorate it with information, remember it for later, decide what the program does next. Error handling is a big part of real programming and belongs up front in the design.

- For each error path in the plan: what does the caller do with it — retry, degrade, report, stop?
- What context does each error carry when it reaches a human?

### 17. Design the architecture, name the components, document the details ([18:09](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=18m09s))

Design the structure, then find really good names for the pieces — the names appear on the page and carry the weight of the design. Documentation fills in the details the names cannot express, like fine print on an engineering diagram.

- Do the names in this plan carry the design? Which component needs a paragraph to explain what its name should say?
- Is the plan documenting details before the architecture and names are settled?

### 18. Documentation is for users ([19:07](https://www.youtube.com/watch?v=PAAkCSZUG1c&t=19m07s))

Write documentation as the user of the package, not the writer. Not "this function returns X" but why you would call it and what to use instead when you should not.

- Does the planned documentation answer "when do I use this?" or only "what does this do?"

### 19. Don't panic ([Go wiki](https://go.dev/wiki/CodeReviewComments#dont-panic))

Use error returns, not panic, for normal error handling.

- Which planned panics are ordinary errors in disguise? Does any public API panic on bad input instead of returning an error?
