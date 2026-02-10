# Tools and Safety Model

This document defines how JARVIS executes actions safely.

## Core rule

All actions that affect the OS or filesystem occur through explicit tools with:

- bounded inputs
- allowlists
- user confirmations for risky actions
- human-readable logs

## Tool categories

### Read-only tools

- read file (scoped)
- list directory (scoped)
- fetch URL (scoped)

These can often run without confirmation.

### Mutating tools

- write/edit files
- run commands
- launch apps

These should be either allowlisted or require confirmation.

## Confirmation policy

JARVIS should classify actions into:

- safe (auto)
- risky (confirm)
- forbidden (block)

Example policy:

- Safe: open a known app, read a file in allowed folder
- Risky: write/edit files, run commands that change state
- Forbidden: disk formatting tools, recursive delete, power operations

## Audit logs

JARVIS records an append-only log for:

- tool name + parameters
- requesting agent (general/code)
- timestamp
- user decision (auto/approved/denied)
- result + error

## OpenCode permissions vs JARVIS permissions

OpenCode has its own permission system. JARVIS must still enforce its own boundaries.

Practical approach:

- configure OpenCode permissions to be strict
- surface OpenCode permission requests in JARVIS UI
- do not allow OpenCode to reach outside the selected repository directory

## nanobot tool constraints

nanobot includes a shell tool with deny patterns, but the safest model is:

- remove/disable raw shell in MVP
- replace with Desktop-owned whitelisted actions
