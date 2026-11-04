This file is the checklist of the AI and agents area (step 3 of `SKILL.md`). The path to follow is untrusted text, then the model or its memory, then an action, an authority, or a sink. Check each item against the code in scope.

## Bar for a finding

Prompt injection alone is not a finding. A finding needs a failure in the code: the text reaches the context of another party, uses an authority that the requester does not have, shows data that the requester cannot read, or drives a sink. A prompt that tells the model to behave is not a guard. Count only code that decides: a check, an allow list, a scope, or a limited credential. Name the attacker, the affected party, the identity that the action runs as, the resource, and the exact action. A user who asks the model to use that user's own rights has no boundary to cross. When the behavior of a provider or a model decides it, the verdict is not proven.

## Start here

Draw four maps: each identity that runs an action, each tool or capability, each place that can write to the context or the memory, and each place the output goes. Then start at the tools with side effects and read backward through the dispatcher, schema, confirmation, context, and retrieval.

## Context and memory

- Text that another party wrote reaches the context: a RAG document, a page, a file, an email, an issue, or a tool reply. Find who can write each source, and whose session reads it.
- History, embeddings, retrieval results, or prompt caches with a key that is too wide. Check the tenant filter in the query itself and in each cache key.
- Memory that a low-trust source can write, and that later shapes the task of another user or a session with more rights. Cite the write and the later read. Memory that a user saved for that user's own requests is not a finding.
- Prompt assembly that lets input pose as a system message, a tool result, or a policy: string joins, and role fields that a caller sets. Show that this changes a decision in the code.

## Tools and actions

- Tool arguments from the model that reach SQL, a shell, a file, a URL fetch, or a privileged API with no check in the handler. A schema limits the shape. It does not give rights or a safe path.
- A tool that runs with a service identity and does not check the rights of the requester on the named resource. A shared credential with a scope enforced per user is not a finding.
- Approval that does not bind the exact action: a user approves one call, and the code runs changed arguments, another resource, a retry, or a later turn. Text from an attacker that makes a tool act under the rights of a victim, with no request from the victim, is the same hole.
- The schema and the handler read a value in different ways: aliases, extra fields, duplicate keys, or type changes.
- A loop in which one request starts repeated spend, sends, or changes with no budget, no cancel, and no idempotency key.

## MCP and subagents

- A subagent that gets the whole session, its credentials, or its memory in place of the least it needs. Its result is untrusted input on return.
- A call or a reply routed by a server name, a tool name, or an ID that a peer can influence. Can two servers claim one tool? Can a reply from one server answer the call of another?
- Tool descriptions, schemas, and hints from a peer that the code treats as policy. Find the allow list that stays in force when they conflict.

## Output

- Model output in an HTML, Markdown, template, URL, or command sink without the escape that the sink needs. Auto-loaded images and links can send data out.
- A context that holds credentials or another user's data, and output that a user can steer. Showing the generic system prompt crosses no data boundary.
