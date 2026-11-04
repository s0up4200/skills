This file is the checklist of the native code area (step 3 of `SKILL.md`). It covers untrusted bytes in memory-unsafe code, and the code that crosses into it. Check each item against the code in scope.

## Bar for a finding

Derive each bound and each lifetime again from the input and from all callers, and test against the worst case that the code accepts. A crash or a sanitizer report counts only when a realistic untrusted input reaches it. Name the effect that you saw: an invalid read, an invalid write, a stale pointer, a wrong type, or a clean exit. Do not claim code execution from a label. When the ABI, a build flag, or the deployment decides it, the verdict is not proven.

To prove a hole, use the smallest harness, an existing test, or an existing fuzz target, with a sanitizer on, in the copy of the repo. Stop when the broken rule shows.

Go is memory-safe only without `unsafe`, cgo, and data races: a race on a slice or an interface value can corrupt memory.

## Bounds and integers

- A length, offset, or index from input that reaches a buffer with a wrong check. Count the space again after prefixes, padding, and terminators. Check whether the code reads a short input before it trusts its declared length.
- Arithmetic before an allocation, a copy, or an index: `a - b` with `b > a`, `count * size`, a sum near the maximum, a negative number turned unsigned, a 64-bit length cut to 32 bits, and `-1` as a size.
- Mixed units: bytes against elements, code units, or pages. A check in the same wrong unit as the allocation is still wrong.
- Uninitialized memory that goes out or across a boundary: padding, struct fields, or spare capacity. Name the consumer.

## Lifetime and concurrency

- A value freed while a callback, timer, iterator, or raw pointer can still use it. Read each error, cancel, and close path. A double free.
- A type tag or a cast that the code checks in one form and reads in another. In Go, `unsafe.Pointer` casts, and `unsafe.Slice` or `unsafe.String` with a length from input.
- A check and a later use with no lock across them, or a shared cache or lazy init that invalidates a bound. Prove it with a fixed schedule or a race detector (`go test -race`). A race with no security effect is not a finding.

## Foreign calls

- Each cgo, FFI, JNI, or generated binding: who allocates, who frees, how long a pointer stays valid, and whether a length is in bytes or elements. Check null, zero length, and callbacks that keep a pointer.
- A struct, enum, or callback signature that differs on the two sides by architecture or by build flag.
- A panic or an exception that crosses a boundary that forbids it.

## Loading code and binaries

- A privileged process that loads a library, plugin, or helper from a path that a lower-trust party can write, or that finds a bare name through the working directory or `PATH`. A user who loads a plugin into that user's own process crosses no boundary.
- A check on one file and a load of another: a path that changes, a file replaced after the check.
- Offsets, counts, sections, and relocations in a binary format that the parser trusts before it checks range and overlap.
- A JIT or an optimizer that disagrees with the interpreter on types or bounds. Compare both on the same input.
- A function pointer, a callback, or a thread that survives an unload or a reset.

## Kernel and privileged interfaces

- A syscall, an ioctl, or a driver that reads a value from user memory, checks it, and reads it again. Copy once, or check the later copy.
- Unchecked table indices, and unbalanced retain and release, in code that a user can reach.
- A device node, admin socket, or helper that checks the shape of a request and not the rights of the caller.
