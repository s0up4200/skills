This file is the checklist of the RPC and messaging area (step 3 of `SKILL.md`). It covers who a peer is, what a message means, and how it gets delivered. Check each item against the code in scope.

## Bar for a finding

"Internal" is not a login. Name the identity of the peer on each hop, and show how it becomes the user that the code checks. A valid schema proves the shape of a message, not who sent it or what it may touch. For a claim that two parsers disagree, cite both and the value that differs. When a broker ACL, a service mesh, or a topic setting outside the repo decides it, the verdict is not proven.

## Start here

For each kind of message, draw producer, transport, gateway, consumer, and storage. On each hop, write the peer that is checked, the field that names the user or the resource, and the side effect. Then compare the normal path with retry, dead letter, replay, migration, reflection, stream, and gateway paths: the same check has to hold on each.

## Meaning of a message

- Two components read one message in different ways: length, compression, duplicate or unknown fields, encoding, number width, or which of envelope and body wins. Find the user, resource, or operation that differs after decoding.
- Unknown variants, missing type fields, and zero values that reach code that assumes a checked case. In Protobuf and in Go, a missing field reads as zero, which can be a real role or ID.
- The check reads the routing data, and the handler acts on a different tenant, account, or object from the body.

## Identity and rights

- A login interceptor on unary calls that is missing from streams, reflection, health, gateway paths, or old services. Compare each registration.
- mTLS or a service token proves the channel, and a field from the caller picks the user or the tenant.
- A stream or a batch that is checked once, while later items name other resources or run after a revoke.
- A predictable or reused correlation ID that lets a reply, a webhook, or a cancel answer the pending call of another party.
- A webhook or an event that claims to come from a provider or an admin. Check the signature, the source, and replay protection before the handler acts.

## Queues and brokers

- A publisher or a subscriber that can pick the topic, wildcard, consumer group, or reply queue of another tenant. A tenant name in the payload is not isolation.
- A dead-letter queue, an error topic, or a trace that gives secrets or other tenants' messages to a lower-trust reader.

## Replay and order

- A retry or a second delivery that repeats a side effect: no dedupe, a dedupe after the change, or a key that collides across tenants. Check the delivery model first.
- An old message that overwrites new state: revoked membership, canceled work. Look for a version or sequence check.
- An acknowledge before the commit loses work. A commit before the acknowledge repeats it.
- Several consumers that together make one change, where a partial failure leaves it half done.
