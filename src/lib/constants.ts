import {
  COST_AGENT_PROMPT,
  ARCH_AGENT_PROMPT,
  OPERATIONS_AGENT_PROMPT,
  STRATEGY_AGENT_PROMPT,
} from "./prompts";
import type { Module } from "../types";

// Maps used by the optimizer loop to re-run specific agents after evaluator feedback
export const AGENT_PROMPTS: Record<string, string> = {
  cost: COST_AGENT_PROMPT,
  arch: ARCH_AGENT_PROMPT,
  ops: OPERATIONS_AGENT_PROMPT,
  strategy: STRATEGY_AGENT_PROMPT,
};

export const AGENT_BRIEF_KEYS: Record<string, string> = {
  cost: "cost",
  arch: "architecture",
  ops: "operations",
  strategy: "strategy",
};

export const SCENARIOS = [
  {
    label: "Monolith → EKS",
    text: "We're proposing to migrate our monolithic Java Spring Boot application (serving 50K RPM, 99.9% SLA) from on-prem VMs (8 bare metal servers) to Kubernetes on AWS EKS. The app has a PostgreSQL 14 database (2TB), Redis cluster for caching, and RabbitMQ for async jobs. Team: 8 backend devs (3 senior), 2 DevOps engineers, 1 DBA. Current infra cost ~$15K/mo. No containerization experience. Data center lease expires in 14 months.",
  },
  {
    label: "Azure AI Search vs OpenSearch",
    text: "We need enterprise search across 10M documents (PDFs, emails, structured data). Evaluating Azure AI Search vs AWS OpenSearch vs Elasticsearch Cloud. Requirements: semantic/vector search, 500ms P99, RBAC, 50 concurrent users, existing Azure environment. Budget: $8K/mo. Need RAG for AI assistant. Team: 3 backend devs, 1 ML engineer.",
  },
  {
    label: "Data Lakehouse Migration",
    text: "Proposal to implement Databricks lakehouse (AWS) replacing Snowflake + Airflow + dbt. Process 5TB/day events, 50 analysts, 10 ML engineers. Snowflake: $45K/mo growing 15% quarterly. Need real-time streaming, ML feature serving, cost controls. HIPAA required. Also considering BigQuery + Dataflow.",
  },
];

export const MODULES: Module[] = [
  { id: "currentArch", label: "Add current architecture", key: "guidedStep1", placeholder: "Technologies, scale, team, and how things run today…" },
  { id: "proposed", label: "Add proposed solution", key: "guidedStep2", placeholder: "Target architecture, vendor, or migration you're evaluating…" },
  { id: "constraints", label: "Add constraints", key: "guidedStep3", placeholder: "Budget, timeline, compliance, risk appetite…" },
  { id: "upload", label: "Upload cost report", key: null, placeholder: null },
];
