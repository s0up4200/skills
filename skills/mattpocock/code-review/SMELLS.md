# Smell Baseline

The Standards axis of `code-review` carries these smells, also when a repo documents nothing. The rules that bind them are in step 3 of `SKILL.md`. Each smell reads *what it is* → *how to fix*; match it against the diff.

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.
- **Moved Complexity**: a refactor that moves complexity but leaves as much for the reader to hold. → remove a concept, or keep the old shape.
- **Bolted-on Conditional**: a conditional added to an unrelated flow. → move the logic into its own helper, state, or policy.
- **Near-Copy**: a new function that nearly repeats an existing helper. → call or extend that helper.
- **Silent Fallback**: a fallback that hides a failure that a caller or the user needs to know about. A low-level retry that no caller can act on is not this smell. → return the error, or log it and name the fallback.
- **Information Leakage**: one design decision (a format, a protocol, an ordering) is coded in more than one module, with or without an import between them. → move the knowledge into one module that the others call.
- **Temporal Decomposition**: code split by the order of execution (read, modify, write), where the steps use the same knowledge. → split by knowledge: one module owns what the steps share.
- **Overexposure**: an interface that makes callers of the common case learn about a rare option or setup step. → give the rare case a default, or its own entry point.
- **Conjoined Methods**: two functions that make sense only when read together. → join them, or move the shared knowledge so that each one reads alone.
- **Symptom Patch**: a fix that adds a case or a guard next to the cause that the bug or a comment names. → fix at the cause, or give the reason. Read the whole function around each new branch, not only the hunk.
