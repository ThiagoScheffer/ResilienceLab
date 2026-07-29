import React from 'react';
import { Play, RotateCcw, AlertCircle } from 'lucide-react';
import { useArchitectureStore } from '../../store/architectureStore';
import { FailureScenario } from '../../types/simulation';

const scenarios: FailureScenario[] = [
  {
    id: "fs-1",
    type: "instance-failure",
    name: "Application Instance Failure",
    description: "Simulates a complete crash of a primary compute instance.",
    targetNodeIds: ["node-webapp-1", "node-app-a"], // Example dynamic mapping done in store later
    severity: "high"
  },
  {
    id: "fs-2",
    type: "database-outage",
    name: "Primary Database Outage",
    description: "Simulates connection loss or hardware failure of the primary database.",
    targetNodeIds: ["node-db-1", "node-db-primary"],
    severity: "critical"
  },
  {
    id: "fs-3",
    type: "zone-outage",
    name: "Availability Zone Outage",
    description: "Total loss of an entire AWS Availability Zone (AZ-A).",
    targetNodeIds: ["node-app-a"], // Target a node in AZ-A to trigger zone failure
    severity: "critical"
  }
];

export default function SimulationPanel() {
  const { architecture, simulationState, activeScenario, setScenario, runSimulation, resetSimulation, activeEvents, simulationResult } = useArchitectureStore();

  const handleRun = () => {
    if (simulationState === "idle" && activeScenario) {
      // Find actual nodes in current architecture to target
      let targetIds: string[] = [];
      if (activeScenario.type === "instance-failure") {
        const apps = architecture.nodes.filter(n => n.type === "web-app");
        if (apps.length > 0) targetIds = [apps[0].id];
      } else if (activeScenario.type === "database-outage") {
        const dbs = architecture.nodes.filter(n => n.type === "database");
        if (dbs.length > 0) targetIds = [dbs[0].id];
      } else if (activeScenario.type === "zone-outage") {
        const azA_nodes = architecture.nodes.filter(n => n.zoneId === "az-a");
        if (azA_nodes.length > 0) targetIds = [azA_nodes[0].id];
      }

      if (targetIds.length === 0) {
        alert("No suitable target found in current architecture for this scenario.");
        return;
      }

      setScenario({ ...activeScenario, targetNodeIds: targetIds });
      // We must call runSimulation immediately after state updates. Zustand batched updates might require a slight delay or synchronous handle.
      setTimeout(runSimulation, 50);
    } else {
      resetSimulation();
    }
  };

  return (
    <div className="h-48 border-t border-border bg-bg-panel shrink-0 flex">
      <div className="w-1/3 border-r border-border p-4 flex flex-col">
        <h3 className="text-sm font-semibold mb-3 text-text-secondary uppercase tracking-wider">Simulation Scenario</h3>
        
        <select 
          className="w-full bg-bg-deep border border-border rounded-md px-3 py-2 text-sm text-text-primary mb-3 focus:outline-none focus:border-app-blue transition-colors"
          value={activeScenario?.id || ""}
          onChange={(e) => setScenario(scenarios.find(s => s.id === e.target.value) || null)}
          disabled={simulationState !== "idle"}
        >
          <option value="" disabled>Select a failure scenario...</option>
          {scenarios.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {activeScenario && (
          <div className="text-xs text-text-secondary mb-4 leading-relaxed line-clamp-2">
            {activeScenario.description}
          </div>
        )}

        <button 
          onClick={handleRun}
          disabled={!activeScenario}
          className={`mt-auto py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            simulationState === "idle" 
              ? "bg-app-amber hover:bg-[#ffc86b] text-bg-deep shadow-[0_0_15px_rgba(247,184,75,0.3)] disabled:opacity-50 disabled:shadow-none" 
              : "bg-bg-elevated border border-border text-text-primary hover:bg-border"
          }`}
        >
          {simulationState === "idle" ? (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run Simulation
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              Reset Architecture
            </>
          )}
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <h3 className="text-sm font-semibold mb-3 text-text-secondary uppercase tracking-wider">
          {simulationState === "idle" ? "Legend" : "Simulation Timeline"}
        </h3>
        
        {simulationState === "idle" ? (
          <div className="grid grid-cols-3 gap-y-4 gap-x-8 mt-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-3 h-3 rounded-full bg-app-green" /> Healthy Node
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-3 h-3 rounded-full bg-app-amber" /> Degraded Performance
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-3 h-3 rounded-full bg-app-red animate-pulse" /> Failed Node
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-5 h-1 bg-app-blue rounded-full" /> Synchronous Request
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <div className="w-5 h-1 border-t-2 border-dashed border-app-cyan" /> Async / Replication
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {(simulationState === 'complete' ? simulationResult?.events : activeEvents)?.map((e, i) => (
              <div key={i} className="flex gap-3 text-sm bg-bg-deep p-2 rounded border border-border items-start">
                <span className="text-app-cyan font-mono text-xs mt-0.5">+{e.time}s</span>
                <span className={e.newStatus === "failed" ? "text-app-red" : "text-app-amber"}>
                  {e.message}
                </span>
              </div>
            ))}
            {simulationState === "running" && (
              <div className="flex items-center gap-2 text-sm text-text-secondary p-2">
                <div className="w-4 h-4 border-2 border-app-blue border-t-transparent rounded-full animate-spin" />
                Propagating failure...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
