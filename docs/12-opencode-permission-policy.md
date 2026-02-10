# OpenCode Permission Policy (Template)

This document defines a conservative OpenCode permission configuration for JARVIS.

Objective: OpenCode remains highly capable for code tasks, while JARVIS keeps explicit control over risky operations.

## Notes

- OpenCode permissions are separate from JARVIS permissions.
- Treat OpenCode as "code domain" only.
- Keep the server bound to loopback and require auth if ever exposed.

Reference docs in the OpenCode repo:

- Permissions: `jarvis/code_reference/opencode/packages/web/src/content/docs/permissions.mdx`
- Tools: `jarvis/code_reference/opencode/packages/web/src/content/docs/tools.mdx`

## Recommended policy approach

1. Default to asking for all bash commands.
2. Allow common read-only git commands.
3. Deny obviously destructive commands.
4. Require explicit approval for edits outside selected repository.
5. Use OpenCode's permission request API and surface prompts in JARVIS UI.

## Example opencode.json (project-level)

Place in a repo under `.opencode/opencode.json` (or merge into a JARVIS-managed generated config).

```
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",

    "read": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow"
    },

    "edit": {
      "*": "ask"
    },

    "webfetch": "ask",

    "bash": {
      "*": "ask",

      "git status*": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "git show*": "allow",
      "git branch*": "allow",
      "git remote -v*": "allow",

      "git commit*": "ask",
      "git push*": "ask",

      "rm *": "deny",
      "sudo *": "deny",
      "powershell *": "ask",
      "cmd.exe *": "ask",
      "shutdown *": "deny",
      "reboot *": "deny"
    }
  },
  "agent": {
    "plan": {
      "permission": {
        "bash": "deny",
        "edit": "deny",
        "webfetch": "deny"
      }
    },
    "build": {
      "permission": {
        "bash": { "*": "ask", "git status*": "allow", "git diff*": "allow" },
        "edit": { "*": "ask" }
      }
    }
  }
}
```

## How JARVIS uses this

- JARVIS starts `opencode serve` locally.
- When OpenCode requests permission, JARVIS UI presents:
  - what it wants to do
  - why
  - the exact command or file path
  - the approval options
- JARVIS replies via OpenCode permission routes:
  - list: `GET /permission`
  - reply: `POST /permission/:requestID/reply`

See reference: `jarvis/code_reference/opencode/packages/opencode/src/server/routes/permission.ts`.

## Additional hardening (recommended)

- Run OpenCode under a restricted OS user (future).
- For Windows, ensure loopback is excluded from proxy settings (NO_PROXY).
- Consider denying network tools (`webfetch`) by default and enabling per-session.
