// Hand-maintained TypeScript types mirroring JSON Schemas in `jarvis/contracts/schemas/`.

export type AgentMode = "general" | "code";

export type RiskLevel = "safe" | "risky" | "forbidden";

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  risk: RiskLevel;
  reason?: string;
};

export type ToolResult = {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: null | string | { code: string; message: string; details?: unknown };
};

export type PermissionDecision = "allow_once" | "deny";

export type PermissionPrompt = {
  request_id: string;
  source: "general" | "opencode";
  tool: ToolCall;
  ui?: {
    title?: string;
    summary?: string;
    detail?: string;
  };
};

export type PermissionReply = {
  request_id: string;
  decision: PermissionDecision;
};

export type SidecarName = "general_agent" | "opencode";

export type SidecarStatus = {
  name: SidecarName;
  healthy: boolean;
  detail?: string;
  port?: number;
};

export type RunCardKind = "command" | "patch" | "test" | "permission" | "info";
export type RunCardStatus = "running" | "pending_approval" | "success" | "error" | "cancelled";

export type RunCard = {
  run_id: string;
  kind: RunCardKind;
  status: RunCardStatus;
  title: string;
  summary?: string;
  detail?: string;
  meta?: Record<string, unknown>;
};

export type DesktopCommandEnvelope =
  | {
      command: "send_chat_message";
      args: {
        mode: AgentMode;
        text: string;
        repo_path?: string;
        conversation_id?: string;
      };
    }
  | { command: "switch_mode"; args: { mode: AgentMode } }
  | { command: "reply_permission"; args: PermissionReply };

export type DesktopEventEnvelope =
  | { event: "sidecar.status"; payload: { status: SidecarStatus } }
  | {
      event: "chat.delta";
      payload: { mode: AgentMode; text: string; conversation_id?: string; message_id?: string };
    }
  | {
      event: "chat.final";
      payload: { mode: AgentMode; text: string; conversation_id?: string; message_id?: string };
    }
  | { event: "run.card"; payload: { mode: AgentMode; run: RunCard; conversation_id?: string } }
  | { event: "permission.requested"; payload: { prompt: PermissionPrompt } }
  | {
      event: "audit.appended";
      payload: {
        entry: {
          timestamp: string;
          tool_name: string;
          agent: "general" | "code";
          risk: string;
          decision: string;
          parameters?: Record<string, unknown>;
          result?: unknown;
          error?: unknown;
        };
      };
    };
