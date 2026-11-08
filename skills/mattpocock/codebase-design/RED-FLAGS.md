# Red Flags

Red flags from John Ousterhout's _A Philosophy of Software Design_ (1st edition, 2018) that the rest of this skill does not name. A red flag is a sign that code is more complex than it needs to be. Shallow Module is the **Depth** entry in `SKILL.md`, and Repetition is Duplicated Code.

Read the flags as friction prompts: each one points your reading at one kind of friction. They are not a checklist, and a flag with no hit is no result.

## Symptoms

When a finding names a flag, it also names the symptom, so that the reader knows why the friction costs time (ch. 2):

- **Change amplification**: a simple change needs edits in many places.
- **Cognitive load**: a developer must hold a lot in mind to make a change.
- **Unknown unknowns**: nothing shows which code a change must touch, or what a developer must know. This symptom is the worst of the three, because the developer finds out only from a bug.

## Flags

Each flag gives what it is, a test that you run at the code, and its usual symptom.

- **Information leakage** (ch. 5): one design decision, for example a format, a protocol, or an ordering, is in more than one module, so a change to it edits each one. Test: name the decision, then search for each place that knows it. Two places are a hit. Symptom: change amplification.
- **Back-door leakage** (ch. 5): information leakage with no import between the modules, for example a reader and a writer that both know one file format. Test: a file pair that changes in the same commits with no import between the two files. Symptom: unknown unknowns, because no reference shows the link.
- **Temporal decomposition** (ch. 5): modules split by the order of execution (read, modify, write), not by the knowledge that each one uses. Test: when the module names are steps in time, check whether two steps use the same knowledge. Symptom: change amplification.
- **Overexposure** (ch. 5): to use a common feature, a caller must learn about a rare one. Test: write the shortest correct call for the common case, and count the arguments, options, and setup that only a rare case needs. Symptom: cognitive load.
- **Pass-through method** (ch. 7): a method that only passes its arguments to another method with a similar signature. Test: replace each call with a direct call to the target. If no caller loses anything, it is a hit. Symptom: cognitive load.
- **Pass-through variable** (ch. 7): a value passed down a chain of methods that do not use it. Test: follow the value from where it is made to where it is read, and count the methods between that only forward it. A shared object or a context object removes it. Symptom: change amplification, because a new value of this kind goes through each method of the chain.
- **Conjoined methods** (ch. 9): two pieces of code that you can understand only together. Test: read one without the other. If you must open the other to know what the first does, it is a hit. Symptom: cognitive load.
- **Special-general mixture** (ch. 9): a general mechanism holds code for one particular use. Test: search the mechanism for a name, a case, or a flag that belongs to one caller. Symptom: change amplification, because a change to that use also changes the mechanism.
- **False abstraction** (ch. 4 and ch. 6): an interface claims to hide a detail that its callers need. Test: find the callers that work out the hidden detail again, or that read the implementation to get it. Symptom: unknown unknowns.
- **Hard to Describe** (ch. 15): a complete interface comment for the module must be long. Test: write the comment that a caller needs. If it needs more than a few lines, the module is shallow or does too many jobs: fix the design, not the words. Symptom: cognitive load.
- **Hard to Pick Name** (ch. 14): no precise, short name fits the entity. Test: try to name it. If each honest name is vague or joins two jobs with "and", the entity has no single clean job: fix the design, not the name. Symptom: cognitive load.
