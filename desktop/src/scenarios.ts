export type ScenarioMode = "general" | "code";

export type ScenarioRunCard = {
  run_id: string;
  kind: "command" | "patch" | "test" | "permission" | "info";
  status: "running" | "pending_approval" | "success" | "error" | "cancelled";
  title: string;
  summary?: string;
};

export type DemoScenario = {
  id: string;
  title: string;
  mode: ScenarioMode;
  inputPlaceholder: string;
  assistantText: string;
  permissionRequired: boolean;
  permissionTriggerChunk: number;
  runCard?: ScenarioRunCard;
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "general-day-plan",
    title: "General: Daily planning",
    mode: "general",
    inputPlaceholder: "Plan my day with two deep-work blocks",
    assistantText:
      "Great. I will build a focused day plan. I want to open your calendar first to avoid overlap, then I will give a concise schedule with priorities and break windows.",
    permissionRequired: true,
    permissionTriggerChunk: 9,
  },
  {
    id: "general-brief",
    title: "General: Research brief",
    mode: "general",
    inputPlaceholder: "Summarize this topic into five practical takeaways",
    assistantText:
      "Understood. Here is a compact brief with five practical takeaways, one risk to watch, and one action you can do today to validate the approach.",
    permissionRequired: false,
    permissionTriggerChunk: -1,
  },
  {
    id: "code-fix-tests",
    title: "Code: Fix failing tests",
    mode: "code",
    inputPlaceholder: "Fix the failing tests and explain the patch",
    assistantText:
      "I can handle this. I will run the test suite, isolate the failing case, apply a targeted patch, then report exactly what changed and why it resolves the failure.",
    permissionRequired: true,
    permissionTriggerChunk: 8,
    runCard: {
      run_id: "run_fix_tests",
      kind: "command",
      status: "running",
      title: "Run tests",
      summary: "pnpm test",
    },
  },
];
