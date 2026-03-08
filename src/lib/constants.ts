/** Single example decision for the sidebar */
export type Scenario = { label: string; text: string };

/** Example decision prompts for the "Example Decisions" sidebar */
export const SCENARIOS: Scenario[] = [
  {
    label: "Search migration",
    text: "Should we migrate from OpenSearch to Azure AI Search to enable semantic search across 5000 documents? We need to keep latency under 200ms p99.",
  },
  {
    label: "Event streaming",
    text: "Evaluate Kafka vs EventBridge vs Confluent Cloud for our event streaming. We have 10 producers, 50 consumers, and need exactly-once semantics.",
  },
  {
    label: "Observability stack",
    text: "We're considering consolidating on Datadog vs keeping Grafana + Prometheus + PagerDuty. Team of 5 SREs, 200 services, need strong APM and log correlation.",
  },
];

/** Intake form expandable modules (current arch, proposed, constraints, upload) */
export const MODULES = [
  { id: "currentArch", label: "Current architecture", key: "guidedStep1" as const, placeholder: "Describe current setup, pain points, scale…" },
  { id: "proposed", label: "Proposed direction", key: "guidedStep2" as const, placeholder: "Options you're considering, must-haves…" },
  { id: "constraints", label: "Constraints & context", key: "guidedStep3" as const, placeholder: "Timeline, budget, compliance, risk appetite…" },
  { id: "upload", label: "Attach document", key: null, placeholder: null },
];
