export type AppPhase =
  | "idle"
  | "intake"
  | "researching"
  | "evaluating"
  | "revising"
  | "synthesizing"
  | "done"
  | "error";

export type AgentKey = "planner" | "compress" | "cost" | "arch" | "ops" | "strategy" | "evaluator" | "synthesis";
export type AgentStatus = "pending" | "searching" | "analyzing" | "working" | "done" | "error";
export type AgentProgressMap = Record<AgentKey, AgentStatus>;

export interface AppContext {
  budget: string;
  teamSize: string;
  compliance: string[];
  timeline: string;
  riskAppetite: string;
  cloud: string;
  currentInstanceType: string;
  currentNodeCount: string;
  currentStorageGb: string;
  currentRegion: string;
  proposedTier: string;
  proposedSearchUnits: string;
  proposedStorageGb: string;
  proposedRegion: string;
  workloadDocCount: string;
  workloadQps: string;
  workloadGrowth3yMultiplier: string;
  uploadedData: { name: string; content: string } | null;
  featureInventoryData: { name: string; content: string } | null;
  benchmarkReportData: { name: string; content: string } | null;
  guidedStep1: string;
  guidedStep2: string;
  guidedStep3: string;
}

export interface ScenarioOverrides {
  trafficMultiplier?: string;
  timelineChange?: string;
  teamChange?: string;
  addCompliance?: string;
}

export interface SearchEntry {
  agent: string;
  query: string;
  ts: number;
}

export interface SearchResultEntry {
  agent: string;
  provider?: string;
  results: Array<{ title?: string; url?: string }>;
  ts: number;
}

export interface SharedEvidenceItem {
  agent: string;
  results: Array<{ title?: string; url?: string }>;
}

export type WorkflowNodeStatus = "pending" | "running" | "done" | "error";

export interface WorkflowNode {
  id: string;
  label: string;
  stage: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
}

export interface WorkflowGraphState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  state: Record<string, WorkflowNodeStatus>;
  runtime: Record<string, { durationMs?: number; lastError?: string; lastTs?: string }>;
}

export interface Alternative {
  name: string;
  approach?: string;
  cost_vs_proposed?: string;
  timeline_vs_proposed?: string;
  pros?: string[];
  cons?: string[];
  when_to_prefer?: string;
}

export interface Brief {
  _timestamp?: string;
  _run_id?: string;
  decision_statement?: string;
  context?: {
    current_state?: string;
    what_changed?: string;
    constraints?: string[];
    strategic_alignment?: string;
  };
  decision_criteria?: Array<{
    criterion?: string;
    weight_pct?: number;
    why_it_matters?: string;
  }>;
  options_comparison?: {
    options?: string[];
    dimensions?: Array<{
      dimension?: string;
      option_a?: string;
      option_b?: string;
      assessment?: string;
    }>;
  };
  financial_assumptions?: {
    assumptions?: string[];
    monthly_baseline?: string;
    traffic_assumption?: string;
    storage_assumption?: string;
    growth_assumption?: string;
    migration_cost?: string;
    tco_3y?: string;
  };
  feature_parity_validation?: {
    critical_features?: Array<{
      feature?: string;
      current_support?: string;
      proposed_support?: string;
      gap_risk?: string;
      mitigation?: string;
    }>;
    unresolved_gaps?: string[];
    gate_status?: string;
    required_actions?: string[];
  };
  benchmark_validation?: {
    benchmark_runs?: Array<{
      scenario?: string;
      dataset_size_docs?: string;
      query_mix?: string;
      target_slo?: string;
      result?: string;
    }>;
    gate_status?: string;
    required_actions?: string[];
  };
  artifact_validation?: {
    valid?: boolean;
    feature_inventory?: {
      valid?: boolean;
      errors?: string[];
      coverage_count?: number;
    };
    benchmark_report?: {
      valid?: boolean;
      errors?: string[];
      run_count?: number;
      pass_count?: number;
    };
  };
  meta?: {
    title?: string;
    proposal_summary?: string;
    verdict?: string;
    confidence_score?: number;
    executive_summary?: string;
    policy?: {
      mode?: string;
      tier?: string;
      path?: string;
      enforced?: boolean;
      enforced_full?: boolean;
      selection_reason?: string;
      constraints?: string[];
    };
    run_metrics?: {
      elapsed_ms?: number;
      stage_failures?: number;
      specialists_available?: number;
    };
    guarantees?: {
      risk_tier?: string;
      pass?: boolean;
      violations?: string[];
      metrics?: Record<string, unknown>;
      contract?: Record<string, unknown>;
    };
    lineage?: {
      run_id?: string;
      parent_run_id?: string | null;
      checkpoint_id?: string | null;
      policy_version?: string;
      schema_version?: string;
      prompt_bundle_version?: string;
      source_snapshot_id?: string;
      review_state?: string;
      input_context_hash?: string;
      review_history?: Array<{ review_id?: string; stage?: string; action?: string; reason?: string }>;
      specialist_to_synthesis_map?: Record<string, boolean>;
      scenario_id?: string;
      scenario_parent_run_id?: string | null;
      assumption_deltas?: Record<string, unknown>;
    };
    replay_fidelity?: {
      mode?: string;
      status?: string;
      tool_hits?: number;
      tool_misses?: number;
      tool_recorded?: number;
      llm_hits?: number;
      llm_misses?: number;
      llm_recorded?: number;
    };
    trust_contract?: {
      advisory_not_authoritative?: boolean;
      governance_not_legal_certification?: boolean;
      degraded_not_approval?: boolean;
      recommendation_bounded_by_evidence_and_policy?: boolean;
      human_review_required_for_high_risk_adoption?: boolean;
      degraded_result?: boolean;
      governance_pass?: boolean;
      confidence_score?: number;
    };
    decision_grade_contract?: {
      status?: string;
      decision_grade?: boolean;
      reasons?: string[];
      contract?: {
        recommendation_gate_pass?: boolean;
        feature_inventory_valid?: boolean;
        benchmark_report_valid?: boolean;
        explicit_cost_foundation?: boolean;
        evidence_governance_pass?: boolean;
      };
    };
    brief_quality?: {
      required_sections?: string[];
      missing_sections?: string[];
      present_sections?: string[];
      gaps?: string[];
      completeness_score?: number;
      recommendation_gate_pass?: boolean;
      recommendation_gate_reason?: string;
    };
  };
  quality_gaps?: string[];
  quality_contract?: {
    required_sections?: string[];
    missing_sections?: string[];
    present_sections?: string[];
    gaps?: string[];
    completeness_score?: number;
    recommendation_gate_pass?: boolean;
    recommendation_gate_reason?: string;
  };
  cost_analysis?: {
    narrative?: string;
    current_cost_breakdown?: {
      monthly_baseline?: string | number;
      components?: Record<string, string | number>;
      data_source?: string;
    };
    proposed_cost_breakdown?: {
      monthly_baseline?: string | number;
      components?: Record<string, string | number>;
      data_source?: string;
    };
    migration_cost?: {
      engineering_hours?: string | number;
      hourly_rate?: string | number;
      dual_running_days?: string | number;
      total?: string | number;
    };
    "3_year_tco"?: {
      aws?: string | number;
      azure?: string | number;
      savings?: string | number;
    };
    break_even_month?: string | number;
    current_state_monthly?: string;
    proposed_monthly?: string;
    year_1_total?: string;
    year_3_total?: string;
    month_24_total?: string;
    current_24_total?: string;
    migration_one_time?: string;
    roi_timeline?: string;
    foundation_status?: string;
    cost_mode?: string;
    source_type?: Record<string, string>;
    cost_basis?: {
      current?: {
        service?: string;
        sku_or_tier?: string;
        instance_type?: string;
        tier?: string;
        node_count?: number;
        search_units?: number;
        replicas?: number;
        partitions?: number;
        storage_gb?: number;
        monthly_cost_usd?: number;
        region?: string;
        source?: string;
      };
      proposed?: {
        service?: string;
        sku_or_tier?: string;
        instance_type?: string;
        tier?: string;
        node_count?: number;
        search_units?: number;
        replicas?: number;
        partitions?: number;
        storage_gb?: number;
        monthly_cost_usd?: number;
        region?: string;
        source?: string;
      };
      completeness_score?: number;
      missing?: string[];
      assumption_notes?: string[];
      foundation_source?: string;
      explicit_complete?: boolean;
      evidence_rows?: Array<{
        service?: string;
        sku_or_tier?: string;
        monthly_cost_usd?: number;
        source?: string;
      }>;
    };
    custom_cost_estimate?: {
      inputs?: Record<string, unknown>;
      monthly_current_usd?: number;
      monthly_proposed_usd?: number;
      monthly_delta_usd?: number;
      migration_one_time_usd?: number;
      people_ops_cost?: {
        hourly_rate_usd?: number;
        current_hours_monthly?: number;
        proposed_hours_monthly?: number;
        current_monthly_usd?: number;
        proposed_monthly_usd?: number;
        monthly_delta_usd?: number;
      };
      migration_execution_cost?: {
        hours_low?: number;
        hours_base?: number;
        hours_high?: number;
        cost_low_usd?: number;
        cost_base_usd?: number;
        cost_high_usd?: number;
      };
      total_economics_3y?: {
        infra_current_usd?: number;
        infra_proposed_usd?: number;
        people_current_usd?: number;
        people_proposed_usd?: number;
        total_current_usd?: number;
        total_proposed_usd?: number;
        delta_usd?: number;
      };
      totals_usd?: {
        current_12_month?: number;
        proposed_12_month?: number;
        current_24_month?: number;
        proposed_24_month?: number;
        current_36_month?: number;
        proposed_36_month?: number;
      };
      scaling_model?: {
        current_platform?: {
          unit?: string;
          base_units?: number;
          base_unit_cost_usd?: number;
          max_units_36m?: number;
        };
        proposed_platform?: {
          unit?: string;
          base_units?: number;
          base_unit_cost_usd?: number;
          max_units_36m?: number;
        };
        sensitivity_3y?: Record<string, {
          current_36_month?: number;
          proposed_36_month?: number;
          delta_36_month?: number;
          current_final_units?: number;
          proposed_final_units?: number;
        }>;
      };
      risk_adjusted_3y?: {
        low?: { proposed_total_usd?: number; notes?: string };
        base?: { proposed_total_usd?: number; notes?: string };
        high?: { proposed_total_usd?: number; notes?: string };
        current_baseline_usd?: number;
      };
      break_even_month?: number;
      assumptions?: string[];
      sources?: string[];
    };
    pricing_details?: Array<{
      service: string;
      sku_or_tier: string;
      unit_price: string;
      estimated_usage: string;
      monthly_cost: string;
      source?: string;
    }>;
    cost_options?: Array<{
      provider?: string;
      service?: string;
      tier_or_plan?: string;
      capacity_units?: number | null;
      region?: string;
      unit_price_usd?: number | null;
      estimated_monthly_usd?: number | null;
      source?: string;
    }>;
    hidden_costs?: Array<{ item: string; estimated: string; why_hidden?: string }>;
    savings_opportunities?: Array<{ opportunity: string; potential_savings: string; effort?: string }>;
  };
  cost_options?: Array<{
    provider?: string;
    service?: string;
    tier_or_plan?: string;
    capacity_units?: number | null;
    region?: string;
    unit_price_usd?: number | null;
    estimated_monthly_usd?: number | null;
    source?: string;
  }>;
  architecture_review?: {
    pattern_name?: string;
    pattern_rationale?: string;
    scores?: Record<string, { rating?: number; notes?: string; [key: string]: unknown }>;
    failure_modes?: Array<{ scenario: string; impact: string; mitigation: string }>;
  };
  technical_comparison?: {
    summary?: string;
    dimensions?: Array<{
      dimension: string;
      current: string;
      proposed: string;
      assessment: string;
      winner: string;
    }>;
  };
  strategic_assessment?: {
    business_alignment?: { score?: number; rationale?: string };
    time_to_value?: { estimate?: string; breakdown?: string };
    competitive_impact?: string;
    vendor_lock_in?: {
      risk_level?: string;
      locked_services?: string[];
      exit_strategy?: string;
      portability_notes?: string;
    };
    organizational_readiness?: {
      score?: number;
      gaps?: string[];
      change_management_needs?: string;
    };
    opportunity_cost?: string;
    market_timing?: string;
    alternatives?: Alternative[];
  };
  devops_sre_assessment?: {
    ci_cd?: {
      complexity?: string;
      recommended_toolchain?: string;
      pipeline_design?: string;
      estimated_setup?: string;
    };
    infrastructure_as_code?: {
      recommended_tool?: string;
      state_management?: string;
      module_strategy?: string;
    };
    deployment_strategy?: {
      method?: string;
      rollback_plan?: string;
      canary_percentage?: string;
      deployment_frequency_target?: string;
    };
    observability_stack?: {
      metrics?: string;
      logs?: string;
      traces?: string;
      alerting?: string;
      dashboards?: string;
      estimated_monthly?: string;
      [key: string]: string | undefined;
    };
    reliability_engineering?: {
      disaster_recovery?: { rpo?: string; rto?: string; dr_strategy?: string };
    };
    sre_risks?: Array<{ risk: string; severity: string; mitigation?: string }>;
  };
  risk_register?: Array<{
    id: string;
    category?: string;
    risk: string;
    probability?: string;
    impact?: string;
    risk_score?: number;
    mitigation?: string;
    owner?: string;
  }>;
  alternatives?: Alternative[];
  decision_boundary?: {
    recommend_option_a_if?: string[];
    recommend_option_b_if?: string[];
    what_flips_decision?: string[];
  };
  implementation_roadmap?: {
    total_duration?: string;
    phases?: Array<{
      name: string;
      duration?: string;
      objectives?: string[];
      deliverables?: string[];
      gate_criteria?: string;
      team_needed?: string;
      risks?: string[];
    }>;
    quick_wins?: string[];
    critical_path?: string;
  };
  recommendation?: {
    decision?: string;
    rationale?: string;
    conditions?: string[];
    next_steps?: Array<{ step: string; owner?: string; deadline?: string }>;
    decision_deadline?: string;
    what_happens_if_we_wait?: string;
  };
  evidence_governance?: {
    risk_tier?: string;
    citations_total?: number;
    trusted_count?: number;
    primary_count?: number;
    tier_counts?: Record<string, number>;
    blocked_urls?: string[];
    min_citations_required?: number;
    min_trusted_required?: number;
    high_risk_claims_total?: number;
    high_risk_claims_mapped?: number;
    claim_citation_graph?: Array<{
      claim_id?: string;
      run_id?: string;
      brief_section?: string;
      claim_text?: string;
      claim_class?: string;
      source_id?: string;
      source_url?: string;
      source_span?: string;
      support_strength?: string;
      contradiction_status?: string;
      governance_status?: string;
    }>;
    unsupported_claims_visible?: Array<{
      claim_id?: string;
      brief_section?: string;
      claim_text?: string;
      claim_class?: string;
      source_url?: string;
      governance_status?: string;
      contradiction_status?: string;
    }>;
    violations?: string[];
    pass?: boolean;
  };
  research_sources?: Array<{ url?: string; title?: string; key_data?: string }>;
  devils_advocate?: {
    overall_assessment?: string;
    challenges?: Array<{
      claim: string;
      challenge: string;
      severity: string;
      suggestion: string;
    }>;
    missing_considerations?: string[];
    cost_flags?: string[];
    timeline_flags?: string[];
    revised_confidence?: number;
    revised_verdict?: string;
    revision_needed?: Record<string, string | null>;
  };
  verifier_claim_class_scores?: Record<string, { total?: number; supported?: number; score?: number }>;
  field_provenance?: Record<string, {
    status?: string;
    claims?: number;
    supported_ratio?: number;
    weak_claims?: number;
    contradicted_claims?: number;
  }>;
}

export interface AppState {
  phase: AppPhase;
  input: string;
  context: AppContext;
  brief: Brief | null;
  history: Brief[];
  searchLog: SearchEntry[];
  searchResults: SearchResultEntry[];
  agentProgress: AgentProgressMap;
  error: string | null;
  evalCritiques: [string, string][] | null;
  compareWith: Brief | null;
  scenarioOverrides: ScenarioOverrides;
  activeTab: string;
  showIntake: boolean;
  expandedModule: string | null;
  workflowGraph: WorkflowGraphState | null;
  sharedEvidence: {
    globalSearchPreview: Array<{ title?: string; url?: string }>;
    byAgent: SharedEvidenceItem[];
  };
  assistantStreamText: string;
}

export type Action =
  | { type: "SET_INPUT"; value: string }
  | { type: "SET_CONTEXT"; value: Partial<AppContext> }
  | { type: "SET_PHASE"; value: AppPhase }
  | { type: "SET_BRIEF"; value: Brief }
  | { type: "SET_ERROR"; value: string | null }
  | { type: "ADD_SEARCH"; value: SearchEntry }
  | { type: "ADD_SEARCH_RESULTS"; value: SearchResultEntry }
  | { type: "CLEAR_SEARCHES" }
  | { type: "UPDATE_AGENT"; agent: AgentKey; status: AgentStatus }
  | { type: "RESET_AGENTS" }
  | { type: "SET_EVAL_CRITIQUES"; value: [string, string][] | null }
  | { type: "SET_COMPARE"; value: Brief | null }
  | { type: "SET_TAB"; value: string }
  | { type: "TOGGLE_INTAKE" }
  | { type: "ADD_HISTORY"; value: Brief }
  | { type: "SET_SCENARIO"; value: Partial<ScenarioOverrides> }
  | { type: "SET_EXPANDED_MODULE"; value: string | null }
  | { type: "SET_WORKFLOW_GRAPH"; value: WorkflowGraphState }
  | { type: "UPDATE_WORKFLOW_NODE"; nodeId: string; status: WorkflowNodeStatus; durationMs?: number; reason?: string; ts?: string }
  | { type: "RESET_WORKFLOW_GRAPH" }
  | { type: "SET_SHARED_EVIDENCE"; value: { globalSearchPreview: Array<{ title?: string; url?: string }>; byAgent: SharedEvidenceItem[] } }
  | { type: "RESET_SHARED_EVIDENCE" }
  | { type: "APPEND_ASSISTANT_STREAM"; value: string }
  | { type: "RESET_ASSISTANT_STREAM" }
  | { type: "RESET" };

export interface AltConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export interface PolicyPreview {
  mode: string;
  tier: string;
  path: string;
  selection_reason: string;
  constraints: string[];
  max_refinement_cycles: number;
  budgets: {
    tokens: Record<string, number>;
    tools: Record<string, number | boolean>;
    timeouts: Record<string, number>;
  };
}

export interface ToolAudit {
  status: string;
  summary: {
    tool_count?: number;
    overlap_warnings?: number;
    violations?: number;
  };
  tool_registry: Record<string, {
    name?: string;
    description?: string;
    best_for?: string[];
    avoid_for?: string[];
    output_contract?: string[];
  }>;
  description_overlap: Array<{
    left?: string;
    right?: string;
    similarity?: number;
    risk?: string;
    reason?: string;
  }>;
  per_agent: Array<{
    agent?: string;
    tools?: string[];
    tool_count?: number;
    unknown_tools?: string[];
    within_recommended_scope?: boolean;
  }>;
  violations: Array<{
    type?: string;
    agent?: string;
    message?: string;
    tools?: string[];
    unknown_tools?: string[];
  }>;
}

export interface Provider {
  name: string;
  defaultModel: string;
  models: string[];
  devEndpoint: string;
  prodEndpoint: string;
}

export interface Module {
  id: string;
  label: string;
  key: "guidedStep1" | "guidedStep2" | "guidedStep3" | null;
  placeholder: string | null;
}

export interface ApiError extends Error {
  status?: number;
  /** Seconds to wait (from Retry-After header). */
  retryAfter?: number | null;
  /** Epoch ms when input token limit will be replenished (from anthropic-ratelimit-input-tokens-reset). */
  rateLimitResetAt?: number | null;
}
