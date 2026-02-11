Here are the “must study / must replicate” files and concepts for a new project that integrates OpenCode as a service. I’m grouping them by what problem they solve.
In our integration code (this repo: C:\work\code\crewAI\.worktrees\opencode-task-context)
- src/crewai_enterprise/server/opencode_client.py
  - HTTP contract with OpenCode (/session/..., polling logic, abort semantics)
  - Agent vs model selection rules (how OPENCODE_AGENT disables OPENCODE_MODEL override)
  - Polling completion heuristics (why we don’t stop at Using skill: / short fragments, how we treat tool/patch activity)
- src/crewai_enterprise/server/task_worker.py
  - End-to-end orchestration: create/ensure session, send prompt, stream updates to DB, mark input done
  - “No text but files updated” handling + summary fallback logic
  - File sync timing: retry window to avoid missing files written slightly after the prompt loop
  - “Missing file” warning logic (what counts as a real file claim vs just intent)
- src/crewai_enterprise/server/opencode_file_sync.py
  - Mirrors workdir files into task storage (files/) and keeps a sync.json cursor
  - This is where file appearance delays and incremental sync behavior matter
- src/crewai_enterprise/server/task_viewer.py
  - API endpoints that serve files + the critical caveat we hit: query-based .../file?path= breaks relative CSS/JS
  - Raw serving route (/api/task/<id>/raw/...) so browsers can load ./style.css and ./app.js
- src/crewai_enterprise/server/task_store.py
  - DB persistence for tasks, inputs, messages
  - Streaming strategy: create-one-message + update-content (vs spamming many partial rows)
- src/crewai_enterprise/server/task_service.py
  - Task creation/append and how inputs get enqueued/marked done (integration boundaries)
- src/crewai_enterprise/server/handlers/task_handler.py
  - WeCom command -> task creation/append glue (how user messages map into task inputs)
- src/crewai_enterprise/server/handlers/aibot/aibot_callback.py
- src/crewai_enterprise/server/handlers/aibot/commands.py
  - “busy session” guardrails, /force behavior, session fallback logic (important if you build a chat UX, not just tasks)
Docs/runbooks worth copying into the new project
- docs/opencode_service_integration_notes.md
  - The behavior/caveats playbook (sessions, parts, polling vs streaming, storage coupling, file sync, raw file serving)
- docs/runbooks/opencode_inplace_upgrade_kamatera.md
  - Upgrade/rollback checklist for OpenCode service
OpenCode upstream source (to understand the real server behavior)
These are the most relevant files in C:\work\code\crewAI\temp_research\opencode:
- packages/opencode/src/server/server.ts
  - how the service is started and wired
- packages/opencode/src/server/routes/session.ts
  - the actual implementation of session create/message/status/abort routes
- packages/opencode/src/server/routes/config.ts
  - what /config really returns (this is the truth for agent/model availability)
- packages/opencode/src/config/config.ts
  - config precedence rules (files/env), agent definitions
- packages/opencode/src/storage/storage.ts
  - storage layout decisions and message persistence (what you’re coupling to if you read storage directly)
- packages/sdk/js/src/v2/server.ts
- packages/sdk/js/src/v2/gen/core/serverSentEvents.gen.ts
  - if you want to implement true SSE streaming (instead of polling)
Upstream docs that clarify intended usage:
- packages/web/src/content/docs/server.mdx
- packages/web/src/content/docs/config.mdx
VM/runtime config files (source of “agent/model confusion”)
- /etc/systemd/system/opencode.service (how the service runs, which user, port, env file)
- /root/.config/opencode/opencode.json (the service’s actual agent->model map; what /config reflects)
- /root/.config/opencode/oh-my-opencode.json (OMO config exists, but vanilla service won’t use it unless OMO plugin is actually loaded)
- /root/.local/share/opencode/storage/ and /root/.local/share/opencode/log/*.log (runtime evidence + debugging)