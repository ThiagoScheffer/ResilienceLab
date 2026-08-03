import { create } from 'zustand';
import { Architecture, ArchitectureNode, ArchitectureEdge, ComponentType, NodeConfiguration } from '../types/architecture';
import { FailureScenario, RecommendationAction, SimulationEvent, SimulationResult, ValidationIssue } from '../types/simulation';
import { sampleResilientEcommerce, sampleArchitectures } from '../data/sampleArchitectures';
import { runSimulation, SIMULATION_ENGINE_VERSION } from '../engine/simulationEngine';
import { hasBlockingValidationIssues, validateArchitecture } from '../engine/validationEngine';
import { DesignerMode } from '../engine/visualStorytelling';

interface ArchitectureState {
  architecture: Architecture;
  selectedNodeId: string | null;
  designerMode: DesignerMode;
  simulationState: "idle" | "running" | "complete";
  simulationResult: SimulationResult | null;
  activeScenario: FailureScenario | null;
  activeEvents: SimulationEvent[];
  validationIssues: ValidationIssue[];
  comparisonResult: SimulationResult | null;
  
  // Actions
  loadSampleArchitecture: (id: string) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  
  selectNode: (id: string | null) => void;
  setDesignerMode: (mode: DesignerMode) => void;
  addNode: (type: ComponentType, position: {x: number, y: number}, zoneId?: string) => void;
  updateNode: (id: string, updates: Partial<ArchitectureNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: {x: number, y: number}) => void;
  
  addEdge: (edge: ArchitectureEdge) => void;
  deleteEdge: (id: string) => void;
  updateEdge: (id: string, updates: Partial<Pick<ArchitectureEdge, "type" | "required">>) => void;
  addZone: () => void;
  
  setScenario: (scenario: FailureScenario | null) => void;
  runSimulation: (scenario?: FailureScenario) => void;
  resetSimulation: () => void;
  applyRecommendation: (action: RecommendationAction) => void;
}

const STORAGE_KEY = 'failureforge_architecture';
let simulationTimer: ReturnType<typeof setInterval> | null = null;
const defaults: Pick<NodeConfiguration, "credentialProtected" | "healthChecksEnabled" | "failoverEnabled" | "failoverEndpointEnabled" | "deploymentStrategy" | "rollbackEnabled"> = { credentialProtected: false, healthChecksEnabled: false, failoverEnabled: false, failoverEndpointEnabled: false, deploymentStrategy: "all-at-once", rollbackEnabled: false };
const touch = (architecture: Architecture): Architecture => ({ ...architecture, updatedAt: new Date().toISOString() });
const normalizeArchitecture = (raw: Architecture): Architecture => ({ ...raw, createdAt: raw.createdAt ?? new Date().toISOString(), updatedAt: raw.updatedAt ?? new Date().toISOString(), nodes: raw.nodes.map(node => ({ ...node, status: node.status ?? "healthy", configuration: { ...defaults, ...node.configuration } })) });

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  architecture: normalizeArchitecture(sampleResilientEcommerce),
  selectedNodeId: null,
  designerMode: "edit",
  simulationState: "idle",
  simulationResult: null,
  activeScenario: null,
  activeEvents: [],
  validationIssues: validateArchitecture(normalizeArchitecture(sampleResilientEcommerce)),
  comparisonResult: null,

  loadSampleArchitecture: (id) => {
    const sample = sampleArchitectures.find(a => a.id === id);
    if (sample) {
      if (simulationTimer) clearInterval(simulationTimer);
      set({ 
        architecture: normalizeArchitecture(JSON.parse(JSON.stringify(sample))),
        selectedNodeId: null,
        designerMode: "edit",
        simulationState: "idle",
        simulationResult: null,
        activeScenario: null,
        activeEvents: [], validationIssues: validateArchitecture(normalizeArchitecture(sample)), comparisonResult: null
      });
    }
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const saved = JSON.parse(stored) as { version?: string; architecture?: Architecture } | Architecture;
        const parsed = normalizeArchitecture("architecture" in saved && saved.architecture ? saved.architecture : saved as Architecture);
        // Simulation result/timeline is never persisted, so a new engine version cannot display stale incident scores.
        set({ architecture: parsed, validationIssues: validateArchitecture(parsed), simulationState: "idle", simulationResult: null, activeEvents: [], comparisonResult: null });
      } catch (e) {
        console.error("Failed to parse architecture from local storage", e);
      }
    }
  },

  saveToLocalStorage: () => {
    const { architecture } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SIMULATION_ENGINE_VERSION, architecture }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  setDesignerMode: (mode) => set({ designerMode: mode }),

  addNode: (type, position, zoneId = "az-a") => {
    const newNode: ArchitectureNode = {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `New ${type}`,
      zoneId,
      position,
      status: "healthy",
      configuration: {
        capacity: 5,
        redundant: false,
        autoscaling: false,
        encrypted: true,
        publiclyAccessible: false,
        backupsEnabled: false,
        monitoringEnabled: false,
        recoveryTimeMinutes: 30,
        monthlyCostUnits: 50
      }
    };
    
    if (type === "users") {
      newNode.zoneId = "global";
      newNode.name = "Users";
    }

    set(state => ({
      architecture: touch({
        ...state.architecture,
        nodes: [...state.architecture.nodes, newNode]
      }), validationIssues: validateArchitecture({ ...state.architecture, nodes: [...state.architecture.nodes, newNode] })
    }));
  },

  updateNode: (id, updates) => set(state => {
    const architecture = touch({
      ...state.architecture,
      nodes: state.architecture.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }); return { architecture, validationIssues: validateArchitecture(architecture) };
  }),

  deleteNode: (id) => set(state => { const architecture = touch({
      ...state.architecture,
      nodes: state.architecture.nodes.filter(n => n.id !== id),
      edges: state.architecture.edges.filter(e => e.source !== id && e.target !== id)
    }); return { architecture, validationIssues: validateArchitecture(architecture),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  }; }),

  moveNode: (id, position) => set(state => ({
    architecture: touch({
      ...state.architecture,
      nodes: state.architecture.nodes.map(n => n.id === id ? { ...n, position } : n)
    })
  })),

  addEdge: (edge) => set(state => { const architecture = touch({
      ...state.architecture,
      edges: [...state.architecture.edges, edge]
    }); return { architecture, validationIssues: validateArchitecture(architecture) }; }),

  deleteEdge: (id) => set(state => { const architecture = touch({
      ...state.architecture,
      edges: state.architecture.edges.filter(e => e.id !== id)
    }); return { architecture, validationIssues: validateArchitecture(architecture) }; }),
  updateEdge: (id, updates) => set(state => { const architecture = touch({ ...state.architecture, edges: state.architecture.edges.map(edge => edge.id === id ? { ...edge, ...updates } : edge) }); return { architecture, validationIssues: validateArchitecture(architecture) }; }),
  addZone: () => set(state => { const next = state.architecture.zones.filter(zone => zone.id !== "global").length + 1; const zone = { id: `az-${String.fromCharCode(96 + next)}`, name: `AZ-${String.fromCharCode(64 + next)}`, color: "#121F30" }; const architecture = touch({ ...state.architecture, zones: [...state.architecture.zones, zone] }); return { architecture }; }),

  setScenario: (scenario) => set({ activeScenario: scenario }),

  runSimulation: (scenarioOverride) => {
    const { architecture, activeScenario } = get();
    const scenario = scenarioOverride ?? activeScenario;
    if (!scenario || hasBlockingValidationIssues(get().validationIssues)) return;
    if (simulationTimer) clearInterval(simulationTimer);

    set({ designerMode: "simulate", simulationState: "running", simulationResult: null, activeEvents: [], activeScenario: scenario });

    const result = runSimulation(architecture, scenario);

    // Animate events sequentially (1 event per second)
    const events = result.events;
    let currentEventIndex = 0;

    simulationTimer = setInterval(() => {
      if (currentEventIndex >= events.length) {
        if (simulationTimer) clearInterval(simulationTimer);
        simulationTimer = null;
        set({ simulationState: "complete", simulationResult: result });
        return;
      }

      const event = events[currentEventIndex];
      
      // Update architecture with the new status from this event
      set(state => ({
        architecture: {
          ...state.architecture,
          nodes: state.architecture.nodes.map(n => 
            n.id === event.affectedNodeId ? { ...n, status: event.newStatus } : n
          )
        },
        activeEvents: [...state.activeEvents, event]
      }));

      currentEventIndex++;
    }, 1000);
  },

  resetSimulation: () => {
    if (simulationTimer) clearInterval(simulationTimer);
    simulationTimer = null;
    set(state => ({
      simulationState: "idle",
      simulationResult: null,
      activeEvents: [],
      architecture: touch({
        ...state.architecture,
        nodes: state.architecture.nodes.map(n => ({ ...n, status: "healthy" }))
      })
    }));
  },

  applyRecommendation: (action) => {
    const state = get();
    if (state.simulationResult) set({ comparisonResult: state.simulationResult });
    if (action.type === "update-config") {
      if (action.nodeId === "all") state.architecture.nodes.forEach(node => state.updateNode(node.id, { configuration: { ...node.configuration, ...action.changes } }));
      else { const node = state.architecture.nodes.find(item => item.id === action.nodeId); if (node) state.updateNode(node.id, { configuration: { ...node.configuration, ...action.changes } }); }
    } else if (action.type === "add-node") {
      const id = `recommended-${Math.random().toString(36).slice(2, 9)}`;
      const node: ArchitectureNode = { id, type: action.componentType, name: `Recommended ${action.componentType}`, zoneId: action.zoneId ?? "az-a", position: { x: 400 + state.architecture.nodes.length * 15, y: 300 }, status: "healthy", configuration: { capacity: 5, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 20, monthlyCostUnits: 50, ...defaults, ...action.configurationPreset } };
      set(current => { const edges = [...current.architecture.edges, ...(action.connectTo ?? []).map((connection, index) => ({ id: `${id}-edge-${index}`, source: connection.direction === "from" ? id : connection.nodeId, target: connection.direction === "from" ? connection.nodeId : id, type: connection.dependencyType ?? "synchronous", required: connection.required ?? true }))]; const zones = current.architecture.zones.some(zone => zone.id === node.zoneId) ? current.architecture.zones : [...current.architecture.zones, { id: node.zoneId, name: node.zoneId.toUpperCase(), color: "#121F30" }]; const architecture = touch({ ...current.architecture, zones, nodes: [...current.architecture.nodes, node], edges }); return { architecture, validationIssues: validateArchitecture(architecture) }; });
    } else {
      set(current => {
        const existing = current.architecture; const knownZones = [...existing.zones];
        action.zones?.forEach(zone => { if (!knownZones.some(existingZone => existingZone.id === zone.id)) knownZones.push(zone); });
        const additions = action.nodes.map((node, index) => ({ ...node, id: node.id ?? `recommended-${action.name}-${index}`, status: "healthy" as const, configuration: { ...defaults, ...node.configuration } }));
        const edges = [...existing.edges, ...action.edges.map((edge, index) => ({ ...edge, id: `recommended-${action.name}-edge-${index}` }))];
        const architecture = touch({ ...existing, zones: knownZones, nodes: [...existing.nodes, ...additions], edges });
        return { architecture, validationIssues: validateArchitecture(architecture) };
      });
    }
    get().resetSimulation();
  }

}));
