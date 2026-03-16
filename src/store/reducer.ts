import type { AppState, Action } from "../types";

export const initialState: AppState = {
  phase: "idle", // idle | intake | researching | evaluating | revising | synthesizing | done | error
  input: "",
  context: {
    budget: "",
    teamSize: "",
    compliance: [],
    timeline: "12",
    riskAppetite: "moderate",
    cloud: "",
    currentInstanceType: "",
    currentNodeCount: "",
    currentStorageGb: "",
    currentRegion: "",
    proposedTier: "",
    proposedSearchUnits: "",
    proposedStorageGb: "",
    proposedRegion: "",
    workloadDocCount: "",
    workloadQps: "",
    workloadGrowth3yMultiplier: "",
    uploadedData: null,
    featureInventoryData: null,
    benchmarkReportData: null,
    guidedStep1: "",
    guidedStep2: "",
    guidedStep3: "",
  },
  brief: null,
  history: [],
  searchLog: [],
  searchResults: [],
  agentProgress: {
    planner: "pending",
    compress: "pending",
    cost: "pending",
    arch: "pending",
    ops: "pending",
    strategy: "pending",
    evaluator: "pending",
    synthesis: "pending",
  },
  error: null,
  evalCritiques: null,   // [["cost"|"arch"|"ops"|"strategy", "critique text"], ...]
  compareWith: null,     // history brief selected for diff comparison
  scenarioOverrides: {},
  activeTab: "brief",
  showIntake: true,
  expandedModule: null,
  workflowGraph: null,
  sharedEvidence: {
    globalSearchPreview: [],
    byAgent: [],
  },
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_INPUT": return { ...state, input: action.value };
    case "SET_CONTEXT": return { ...state, context: { ...state.context, ...action.value } };
    case "SET_PHASE": return { ...state, phase: action.value };
    case "SET_BRIEF": return { ...state, brief: action.value, phase: "done" };
    case "SET_ERROR": return { ...state, error: action.value, phase: action.value != null ? "error" : "idle" };
    case "ADD_SEARCH": return { ...state, searchLog: [...state.searchLog, action.value] };
    case "ADD_SEARCH_RESULTS": return { ...state, searchResults: [...state.searchResults, action.value] };
    case "CLEAR_SEARCHES": return { ...state, searchLog: [], searchResults: [] };
    case "UPDATE_AGENT": return { ...state, agentProgress: { ...state.agentProgress, [action.agent]: action.status } };
    case "RESET_AGENTS": return {
      ...state,
      evalCritiques: null,
      agentProgress: {
        planner: "pending",
        compress: "pending",
        cost: "pending", arch: "pending", ops: "pending",
        strategy: "pending", evaluator: "pending", synthesis: "pending",
      },
    };
    case "SET_EVAL_CRITIQUES": return { ...state, evalCritiques: action.value };
    case "SET_COMPARE": return { ...state, compareWith: action.value };
    case "SET_TAB": return { ...state, activeTab: action.value };
    case "TOGGLE_INTAKE": return { ...state, showIntake: !state.showIntake };
    case "ADD_HISTORY": return { ...state, history: [action.value, ...state.history].slice(0, 20) };
    case "SET_SCENARIO": return { ...state, scenarioOverrides: { ...state.scenarioOverrides, ...action.value } };
    case "SET_EXPANDED_MODULE": return { ...state, expandedModule: action.value };
    case "SET_WORKFLOW_GRAPH": return { ...state, workflowGraph: action.value };
    case "UPDATE_WORKFLOW_NODE":
      if (!state.workflowGraph) return state;
      {
        const prev = state.workflowGraph.runtime[action.nodeId] || {};
        const nextRuntime = {
          ...prev,
          durationMs: action.durationMs ?? prev.durationMs,
          lastError: action.reason ?? prev.lastError,
          lastTs: action.ts ?? prev.lastTs,
        };
      return {
        ...state,
        workflowGraph: {
          ...state.workflowGraph,
          state: { ...state.workflowGraph.state, [action.nodeId]: action.status },
          runtime: { ...state.workflowGraph.runtime, [action.nodeId]: nextRuntime },
        },
      };
      }
    case "RESET_WORKFLOW_GRAPH": return { ...state, workflowGraph: null };
    case "SET_SHARED_EVIDENCE": return { ...state, sharedEvidence: action.value };
    case "RESET_SHARED_EVIDENCE": return { ...state, sharedEvidence: { globalSearchPreview: [], byAgent: [] } };
    case "RESET": return { ...initialState, history: state.history };
    default: return state;
  }
}
