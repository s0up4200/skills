This file is the checklist of the files area (step 3 of `SKILL.md`). The area covers each place where input from outside or stored data reaches the file system as a path, and where input from outside reaches a parser, a command, or SQL. Check each item against the code in scope.

## Paths from input or stored data

- `filepath.Join(base, input)` does not stop `..`: `Join("/data", "../../etc/passwd")` is `/etc/passwd`. Guards that work: `filepath.IsLocal(input)` (Go 1.20), `os.Root` or `os.OpenInRoot` (Go 1.24), or `filepath.Rel(base, joined)` with a check that the result does not start with `..`. A `strings.HasPrefix(joined, base)` check passes `/data-other` when the base is `/data`; add the separator.
- An absolute path from input: `Join` keeps the base, but `os.Open(input)` and `filepath.Abs(input)` do not.
- A symlink inside the base that points out of it: path cleaning does not see it. `os.Root` does.
- Torrents: each file path inside a `.torrent` (the `path` list of `files`) and the torrent name can hold `..`, a `/`, or an absolute path. Follow them to each create, move, rename, link, and delete.
- An HTTP file route: `http.FileServer` cleans the path, but a handler that builds a path from `r.URL.Query()` or a route value does not.
- Before a delete, move or overwrite on a path that comes from data, confirm that the resolved path is under an allowed root, is at least one level below it, and has ownership evidence read before the operation. On refusal, log the path and stop, with no fallback to a broader path.

## Archives and uploads

- Zip and tar extraction (zip slip): each entry name needs the same guard as a path from input. A symlink entry can point out of the target, and a later entry can write through it.
- Size limits: `http.MaxBytesReader` on uploads, and a limit on the total size and the number of entries in an archive.
- Where an upload is saved, and how it is served back. An upload served inline is an item of the browser area.

## Parsers of untrusted files

- Bencode and other length-prefixed formats: a huge length makes the parser allocate before it reads. Deep nesting can exhaust the stack.
- XML: Go `encoding/xml` reads no external entities, but has no size limit. In other languages, check that external entities are off.
- YAML: anchors and aliases can grow a small file into a large value. Score it low when only an admin supplies the file.
- Images: `image.DecodeConfig` before `image.Decode`, to refuse huge dimensions.
- Regular expressions from input: Go `regexp` runs in linear time. JavaScript regular expressions on a Node server can take exponential time (ReDoS).

## Commands

- `exec.Command("sh", "-c", ...)`, `bash -c`, or `os/exec` with a string that holds input: shell injection. A torrent name in a shell string runs commands.
- `exec.Command(prog, args...)` with input as an argument: no shell, but an argument that starts with `-` can be an option, for example `--upload-pack` for `git`. Look for `--` before the input.
- External programs that a user configures with placeholders such as `{name}` or `{path}`: who can set the program, and whether the placeholders go into a shell string or into separate arguments. Only an admin who can already run commands makes it by design.

## SQL and templates

- SQL built with `fmt.Sprintf`, `+`, or a template, with input in it. Placeholders (`?`, `$1`) are the guard.
- Column names and `ORDER BY` from input: a placeholder cannot hold them, so the guard is an allow list.
- `LIKE` with input: `%` and `_` in the input change the match. Score it low.
- `text/template` or another template engine that runs a template from a user, with functions that read files or run commands.

## File modes

- Files that hold secrets (the config, the database, backups) written with mode `0644` or in a folder with `0755`: each local user can read them. `0600` and `0700` are the guard.
- A temp file at a fixed name in a shared `/tmp`: another local user can create it first. `os.CreateTemp` is the guard.

## Sources

Checked on 2026-11-02. Read the source again when a version is newer than the one named here.

- `filepath.IsLocal` came in Go 1.20: https://go.dev/doc/go1.20
- `os.Root` and `os.OpenInRoot` came in Go 1.24: https://go.dev/doc/go1.24
