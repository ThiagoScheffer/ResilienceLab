import { create } from 'zustand';
import { Architecture, ArchitectureNode, ArchitectureEdge, ComponentType } from '../types/architecture';
import { FailureScenario, SimulationEvent, SimulationResult } from '../types/simulation';
import { sampleResilientEcommerce, sampleArchitectures } from '../data/sampleArchitectures';
import { runSimulation } from '../engine/simulationEngine';

interface ArchitectureState {
  architecture: Architecture;
  selectedNodeId: string | null;
  simulationState: "idle" | "running" | "complete";
  simulationResult: SimulationResult | null;
  activeScenario: FailureScenario | null;
  activeEvents: SimulationEvent[];
  
  // Actions
  loadSampleArchitecture: (id: string) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  
  selectNode: (id: string | null) => void;
  addNode: (type: ComponentType, position: {x: number, y: number}, zoneId?: string) => void;
  updateNode: (id: string, updates: Partial<ArchitectureNode>) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, position: {x: number, y: number}) => void;
  
  addEdge: (edge: ArchitectureEdge) => void;
  deleteEdge: (id: string) => void;
  
  setScenario: (scenario: FailureScenario | null) => void;
  runSimulation: () => void;
  resetSimulation: () => void;
  applyRecommendation: (action: any) => void;
}

const STORAGE_KEY = 'failureforge_architecture';

export const useArchitectureStore = create<ArchitectureState>((set, get) => ({
  architecture: sampleResilientEcommerce,
  selectedNodeId: null,
  simulationState: "idle",
  simulationResult: null,
  activeScenario: null,
  activeEvents: [],

  loadSampleArchitecture: (id) => {
    const sample = sampleArchitectures.find(a => a.id === id);
    if (sample) {
      set({ 
        architecture: JSON.parse(JSON.stringify(sample)), 
        selectedNodeId: null,
        simulationState: "idle",
        simulationResult: null,
        activeScenario: null,
        activeEvents: []
      });
    }
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        set({ architecture: parsed });
      } catch (e) {
        console.error("Failed to parse architecture from local storage", e);
      }
    }
  },

  saveToLocalStorage: () => {
    const { architecture } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(architecture));
  },

  selectNode: (id) => set({ selectedNodeId: id }),

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
      architecture: {
        ...state.architecture,
        nodes: [...state.architecture.nodes, newNode]
      }
    }));
  },

  updateNode: (id, updates) => set(state => ({
    architecture: {
      ...state.architecture,
      nodes: state.architecture.nodes.map(n => n.id === id ? { ...n, ...updates } : n)
    }
  })),

  deleteNode: (id) => set(state => ({
    architecture: {
      ...state.architecture,
      nodes: state.architecture.nodes.filter(n => n.id !== id),
      edges: state.architecture.edges.filter(e => e.source !== id && e.target !== id)
    },
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId
  })),

  moveNode: (id, position) => set(state => ({
    architecture: {
      ...state.architecture,
      nodes: state.architecture.nodes.map(n => n.id === id ? { ...n, position } : n)
    }
  })),

  addEdge: (edge) => set(state => ({
    architecture: {
      ...state.architecture,
      edges: [...state.architecture.edges, edge]
    }
  })),

  deleteEdge: (id) => set(state => ({
    architecture: {
      ...state.architecture,
      edges: state.architecture.edges.filter(e => e.id !== id)
    }
  })),

  setScenario: (scenario) => set({ activeScenario: scenario }),

  runSimulation: () => {
    const { architecture, activeScenario } = get();
    if (!activeScenario) return;

    set({ simulationState: "running", simulationResult: null, activeEvents: [] });

    const result = runSimulation(architecture, activeScenario);

    // Animate events sequentially (1 event per second)
    const events = result.events;
    let currentEventIndex = 0;

    const interval = setInterval(() => {
      if (currentEventIndex >= events.length) {
        clearInterval(interval);
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

  resetSimulation: () => set(state => ({
    simulationState: "idle",
    simulationResult: null,
    activeEvents: [],
    architecture: {
      ...state.architecture,
      nodes: state.architecture.nodes.map(n => ({ ...n, status: "healthy" }))
    }
  })),

  applyRecommendation: (action) => {
    const state = get();
    if (action.type === "add-node") {
      state.addNode(action.componentType, { x: 400, y: 300 }, action.zoneId);
    } else if (action.type === "update-config") {
      if (action.nodeId === "all") {
        // Example: distribute across zones - dummy action just adds a zone or we just dismiss
      } else {
        state.updateNode(action.nodeId, { configuration: { ...state.architecture.nodes.find(n => n.id === action.nodeId)?.configuration, ...action.changes } as any });
      }
    }
  }

}));
