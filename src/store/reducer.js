export const initialState = {
  phase: "idle", // idle | intake | researching | evaluating | revising | synthesizing | done | error
  input: "",
  context: {
    budget: "",
    teamSize: "",
    compliance: [],
    timeline: "12",
    riskAppetite: "moderate",
    cloud: "",
    uploadedData: null,
    guidedStep1: "",
    guidedStep2: "",
    guidedStep3: "",
  },
  brief: null,
  history: [],
  searchLog: [],
  agentProgress: {
    cost: "pending",
    arch: "pending",
    sre: "pending",
    devops: "pending",
    strategy: "pending",
    evaluator: "pending",
    synthesis: "pending",
  },
  error: null,
  scenarioOverrides: {},
  activeTab: "brief",
  showIntake: true,
  expandedModule: null,
};

export function reducer(state, action) {
  switch (action.type) {
    case "SET_INPUT": return { ...state, input: action.value };
    case "SET_CONTEXT": return { ...state, context: { ...state.context, ...action.value } };
    case "SET_PHASE": return { ...state, phase: action.value };
    case "SET_BRIEF": return { ...state, brief: action.value, phase: "done" };
    case "SET_ERROR": return { ...state, error: action.value, phase: action.value != null ? "error" : "idle" };
    case "ADD_SEARCH": return { ...state, searchLog: [...state.searchLog, action.value] };
    case "CLEAR_SEARCHES": return { ...state, searchLog: [] };
    case "UPDATE_AGENT": return { ...state, agentProgress: { ...state.agentProgress, [action.agent]: action.status } };
    case "RESET_AGENTS": return {
      ...state,
      agentProgress: {
        cost: "pending", arch: "pending", sre: "pending", devops: "pending",
        strategy: "pending", evaluator: "pending", synthesis: "pending",
      },
    };
    case "SET_TAB": return { ...state, activeTab: action.value };
    case "TOGGLE_INTAKE": return { ...state, showIntake: !state.showIntake };
    case "ADD_HISTORY": return { ...state, history: [action.value, ...state.history].slice(0, 20) };
    case "SET_SCENARIO": return { ...state, scenarioOverrides: { ...state.scenarioOverrides, ...action.value } };
    case "SET_EXPANDED_MODULE": return { ...state, expandedModule: action.value };
    case "RESET": return { ...initialState, history: state.history };
    default: return state;
  }
}
