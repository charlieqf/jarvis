import { useEffect, useMemo, useRef, useState } from "react";

import eventAudit from "../../contracts/examples/desktop/event.audit.appended.json";
import eventPermission from "../../contracts/examples/desktop/event.permission.requested.json";
import eventSidecarStatus from "../../contracts/examples/desktop/event.sidecar.status.json";
import { DEMO_SCENARIOS } from "./scenarios";

type Mode = "general" | "code";
type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  text: string;
};

type RunCard = {
  run_id: string;
  kind: string;
  status: string;
  title: string;
  summary?: string;
};

type PermissionPrompt = {
  request_id: string;
  source: "general" | "opencode";
  tool: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    risk: "safe" | "risky" | "forbidden";
    reason?: string;
  };
  ui?: {
    title?: string;
    summary?: string;
    detail?: string;
  };
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function chunkText(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

export default function App() {
  const [mode, setMode] = useState<Mode>("general");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DEMO_SCENARIOS[0].id);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [permissionPrompt, setPermissionPrompt] = useState<PermissionPrompt | null>(null);
  const [runCards, setRunCards] = useState<RunCard[]>([]);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidecarHealth, setSidecarHealth] = useState("unknown");

  const pendingDecision = useRef<((decision: "allow_once" | "deny") => void) | null>(null);

  const activeScenario = useMemo(
    () => DEMO_SCENARIOS.find((scenario) => scenario.id === selectedScenarioId) ?? DEMO_SCENARIOS[0],
    [selectedScenarioId],
  );

  const modeLabel = useMemo(() => (mode === "general" ? "General" : "Code"), [mode]);

  useEffect(() => {
    setMode(activeScenario.mode);
    setInput(activeScenario.inputPlaceholder);
  }, [activeScenario]);

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  function updateAssistantMessage(id: string, nextText: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: nextText } : m)));
  }

  async function requestDecision(prompt: PermissionPrompt): Promise<"allow_once" | "deny"> {
    setPermissionPrompt(prompt);
    return new Promise((resolve) => {
      pendingDecision.current = resolve;
    });
  }

  function resolveDecision(decision: "allow_once" | "deny") {
    if (!pendingDecision.current) {
      return;
    }
    pendingDecision.current(decision);
    pendingDecision.current = null;
    setPermissionPrompt(null);
  }

  async function handleSend() {
    const text = input.trim() || activeScenario.inputPlaceholder;
    if (!text || isStreaming) {
      return;
    }

    setInput("");
    setIsStreaming(true);

    appendMessage({ id: `u-${Date.now()}`, role: "user", text });

    const assistantId = `a-${Date.now()}`;
    appendMessage({ id: assistantId, role: "assistant", text: "" });

    setSidecarHealth(eventSidecarStatus.payload.status.healthy ? "healthy" : "down");

    if (mode === "code" && activeScenario.runCard) {
      setRunCards([{ ...activeScenario.runCard }]);
    } else {
      setRunCards([]);
    }

    const chunks = chunkText(activeScenario.assistantText);
    let built = "";
    let denied = false;

    for (let i = 0; i < chunks.length; i += 1) {
      built += chunks[i];
      updateAssistantMessage(assistantId, built);
      await delay(70);

      if (activeScenario.permissionRequired && i === activeScenario.permissionTriggerChunk) {
        const decision = await requestDecision(eventPermission.payload.prompt as PermissionPrompt);

        const audit = {
          ...eventAudit.payload.entry,
          decision,
          agent: mode === "general" ? "general" : "code",
          timestamp: new Date().toISOString(),
        };

        setAuditLog((prev) => [
          `${audit.timestamp} | ${audit.agent} | ${audit.tool_name} | ${audit.decision}`,
          ...prev,
        ]);

        if (mode === "code") {
          setRunCards((prev) =>
            prev.map((r) =>
              r.run_id === activeScenario.runCard?.run_id
                ? { ...r, status: decision === "allow_once" ? "running" : "cancelled" }
                : r,
            ),
          );
        }

        if (decision === "deny") {
          denied = true;
          built += " I skipped that action because you denied permission.";
          updateAssistantMessage(assistantId, built);
          break;
        }
      }
    }

    if (mode === "code" && activeScenario.runCard && !denied) {
      setRunCards((prev) =>
        prev.map((r) =>
          r.run_id === activeScenario.runCard?.run_id ? { ...r, status: "success" } : r,
        ),
      );
    }

    setIsStreaming(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>JARVIS</h1>
        <p className="muted">M1 Interactive Fake Flow</p>
        <div className="status-block">
          <div className={`dot ${sidecarHealth === "healthy" ? "ok" : "warn"}`} />
          <span>Sidecars: {sidecarHealth}</span>
        </div>

        <div className="scenario-block">
          <h3>Demo Scripts</h3>
          <ul>
            {DEMO_SCENARIOS.map((scenario) => (
              <li key={scenario.id}>
                <button
                  className={scenario.id === activeScenario.id ? "scenario-active" : ""}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  type="button"
                >
                  {scenario.title}
                </button>
              </li>
            ))}
          </ul>
          <p className="muted">Selected script sets mode and starter prompt.</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mode-switch">
            <button
              className={mode === "general" ? "active" : ""}
              onClick={() => setMode("general")}
              type="button"
            >
              General
            </button>
            <button
              className={mode === "code" ? "active" : ""}
              onClick={() => setMode("code")}
              type="button"
            >
              Code
            </button>
          </div>
          <span className="mode-label">Mode: {modeLabel}</span>
        </header>

        <section className="chat-stream">
          {messages.length === 0 ? (
            <p className="muted">Type a message to run the M1 contract replay flow.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`bubble ${m.role}`}>
                <strong>{m.role === "user" ? "You" : "JARVIS"}</strong>
                <p>{m.text}</p>
              </div>
            ))
          )}
        </section>

        {runCards.length > 0 && (
          <section className="run-cards">
            {runCards.map((r) => (
              <article key={r.run_id} className="run-card">
                <div className="run-header">
                  <span>{r.title}</span>
                  <span className={`pill ${r.status}`}>{r.status}</span>
                </div>
                {r.summary && <p className="muted">{r.summary}</p>}
              </article>
            ))}
          </section>
        )}

        <section className="composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeScenario.inputPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSend();
              }
            }}
          />
          <button onClick={() => void handleSend()} disabled={isStreaming} type="button">
            {isStreaming ? "Streaming..." : "Send"}
          </button>
        </section>

        <section className="audit-log">
          <h3>Audit</h3>
          {auditLog.length === 0 ? (
            <p className="muted">No tool approvals yet.</p>
          ) : (
            <ul>
              {auditLog.slice(0, 5).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {permissionPrompt && (
        <div className="permission-sheet">
          <h2>{permissionPrompt.ui?.title ?? "Action Requires Approval"}</h2>
          <p>{permissionPrompt.ui?.summary ?? permissionPrompt.tool.name}</p>
          <p className="muted">{permissionPrompt.ui?.detail ?? permissionPrompt.tool.reason}</p>
          <div className="permission-actions">
            <button type="button" onClick={() => resolveDecision("deny")}>
              Deny
            </button>
            <button className="allow" type="button" onClick={() => resolveDecision("allow_once")}>
              Allow Once
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
