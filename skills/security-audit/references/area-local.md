This file is the checklist of the local apps and IPC area (step 3 of `SKILL.md`). It covers desktop and mobile apps, privileged helpers, updaters, local daemons, webviews, deep links, and local sockets. Check each item against the code in scope.

## Bar for a finding

Name the attacker exactly: another app, another OS user, a sandboxed child, a downloaded document, or a remote page. Harm that a user does to that user's own account crosses no boundary. A path, a process name, a package ID, or a sender field is not proof of who a peer is. OS credentials of the peer, code identity, and protected channels are. When signing, a merged manifest, the OS version, or installer permissions decide it, the verdict is not proven.

## Start here

List each process, app component, local endpoint, URI scheme, file association, webview origin, and helper, with its OS identity, its privilege, who can call it, and what it can do. Read the final packaging files as well: merged manifests, entitlements, installer rules, and protocol handlers can override the source.

## Links and callbacks

- A deep link or a custom scheme from another app or a page that changes state, imports data, finishes a login, or picks an account with no one-time value tied to the current session. Check URI parsing, duplicate fields, and replay.
- An OAuth, invite, pairing, or magic-link callback that returns to the wrong app, profile, or pending transaction.
- A file open, a share, a drop, a clipboard item, or a notification action that starts a privileged action with no check of the type, the target, and what the user meant to do.

## Webviews

- Remote pages or frames that reach a bridge meant for packaged content. Check the origin at each call, and after each navigation, redirect, popup, and error page. A check on the URL prefix or only on the first load is not enough.
- A generic bridge that lets web content pick any file, command, or system action. Look for an allow list of methods, and a check of the arguments.
- A remote page that can read local files or internal origins through file access, universal access, a custom scheme, or a debug interface. A loose setting with nothing protected behind it is not a finding.

## Local sockets and IPC

- Unix sockets, named pipes, D-Bus, XPC, Binder, native messaging, shared memory, or a loopback port that accepts a lower-trust peer with no check of its OS credentials. A loopback port is open to each user on the host and, through DNS rebinding, to web pages: check for the login and for the `Host` header.
- The channel belongs to one app or user, and a request field picks another.
- An exported Android service, activity, receiver, or provider, or a local automation endpoint, that does an action meant for the app itself.
- A predictable request ID, a stale channel, an inherited descriptor, or a socket path in a folder that others can write.

## Helpers and local files

- A privileged helper that lets a caller pick a command, a file, a service, or a user with no check on each operation. Read the sudo, polkit, or UAC rules, and check that the helper validates the final arguments on its own.
- An installer, an updater, or a repair step that reads scripts, packages, or manifests that a lower-trust party can write after the approval.
- A check on a file path followed by a privileged read or write: another party can swap in a symlink between the two. Use a descriptor-relative open.
- A token file, a keystore item, a backup, a log, or a notification preview that a party with fewer rights can read. A plain file that only the same OS account can read is not automatically a finding. Name the reader.

## Account and device state

- Data, background jobs, widgets, notifications, and webview storage that survive a logout or an account switch and show under the next account.
- A notification, a shortcut, or a biometric prompt that approves a different action from the one on screen, or that runs after it expires.
