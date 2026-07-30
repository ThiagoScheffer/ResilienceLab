import React, { useMemo, useState } from "react";
import { BarChart3, DollarSign, Gauge, Zap } from "lucide-react";
import { useArchitectureStore } from "../../store/architectureStore";

export default function ResilienceLab() {
  const [tab, setTab] = useState<"performance" | "cost">("performance");
  const { architecture, activeScenario, setScenario, simulationResult } = useArchitectureStore();
  const metrics = useMemo(() => {
    const webApps = architecture.nodes.filter(node => node.type === "web-app");
    const normalDemand = Math.max(1, ...webApps.map(node => node.configuration.capacity));
    const capacity = webApps.reduce((total, node) => total + node.configuration.capacity * (node.configuration.autoscaling ? 1.5 : 1), 0);
    const monthlyCost = architecture.nodes.reduce((total, node) => total + node.configuration.monthlyCostUnits, 0);
    const resilienceSpend = architecture.nodes.filter(node => ["backup", "monitoring", "cache", "queue"].includes(node.type) || node.configuration.redundant || node.configuration.autoscaling).reduce((total, node) => total + node.configuration.monthlyCostUnits, 0);
    const duplicates = architecture.nodes.reduce<Record<string, number>>((counts, node) => ({ ...counts, [`${node.zoneId}:${node.type}`]: (counts[`${node.zoneId}:${node.type}`] ?? 0) + 1 }), {});
    const waste = Object.values(duplicates).some(count => count >= 3) ? "Three or more duplicate components share a failure domain." : architecture.nodes.filter(node => node.type === "web-app").some(node => node.configuration.capacity > normalDemand * 2) ? "Application capacity substantially exceeds normal demand." : "No obvious capacity waste detected.";
    return { normalDemand, capacity, monthlyCost, resilienceSpend, waste };
  }, [architecture]);
  const multiplier = activeScenario?.type === "traffic-spike" ? activeScenario.parameters?.trafficMultiplier ?? 5 : 5;
  const incident = simulationResult?.liveIncident;
  const latency = incident?.latencyBand ?? (metrics.capacity >= metrics.normalDemand * multiplier ? "normal" : "severe");

  return <div className="absolute left-4 top-4 z-20 w-72 rounded-xl border border-border bg-bg-panel/95 shadow-xl backdrop-blur">
    <div className="flex border-b border-border">
      <button onClick={() => setTab("performance")} className={`flex-1 px-3 py-2 text-xs font-semibold ${tab === "performance" ? "text-app-cyan border-b-2 border-app-cyan" : "text-text-secondary"}`}><Gauge className="inline w-3.5 h-3.5 mr-1" />Performance Lab</button>
      <button onClick={() => setTab("cost")} className={`flex-1 px-3 py-2 text-xs font-semibold ${tab === "cost" ? "text-app-green border-b-2 border-app-green" : "text-text-secondary"}`}><DollarSign className="inline w-3.5 h-3.5 mr-1" />Cost Lab</button>
    </div>
    <div className="p-3 space-y-3 text-xs">
      {tab === "performance" ? <>
        <div className="flex justify-between text-text-secondary"><span>Traffic multiplier</span><span className="text-text-primary font-bold">{multiplier}x</span></div>
        <input type="range" min="1" max="10" value={multiplier} onChange={event => setScenario({ id: "fs-4", type: "traffic-spike", name: "Sudden Traffic Spike", description: "Tests application capacity under higher demand.", severity: "high", targetNodeIds: [], parameters: { trafficMultiplier: Number(event.target.value) } })} className="w-full accent-app-cyan" />
        <div className="grid grid-cols-2 gap-2"><Metric label="Demand" value={`${incident?.demandCapacity ?? metrics.normalDemand * multiplier}`} /><Metric label="Effective capacity" value={`${incident ? incident.healthyCapacity + incident.degradedCapacity : metrics.capacity}`} /></div>
        <div><div className="flex justify-between text-text-secondary mb-1"><span>Headroom</span><span className={incident && incident.capacityHeadroomPercent < 0 ? "text-app-red" : "text-app-green"}>{incident?.capacityHeadroomPercent ?? Math.round((metrics.capacity / (metrics.normalDemand * multiplier) - 1) * 100)}%</span></div><div className="h-1.5 bg-bg-deep rounded overflow-hidden"><div className={`h-full ${latency === "normal" ? "bg-app-green" : latency === "elevated" ? "bg-app-amber" : "bg-app-red"}`} style={{ width: `${Math.min(100, Math.max(0, simulationResult?.customerAvailability ?? metrics.capacity / (metrics.normalDemand * multiplier) * 100))}%` }} /></div></div>
        <div className="rounded bg-bg-deep p-2 text-text-secondary"><Zap className="inline w-3.5 h-3.5 text-app-amber mr-1" />Latency: <span className="text-text-primary capitalize">{latency}</span>. Autoscaling, cache, queue, and balanced targets raise served capacity.</div>
      </> : <>
        <div className="grid grid-cols-2 gap-2"><Metric label="Monthly cost" value={`${metrics.monthlyCost} units`} /><Metric label="Resilience spend" value={`${metrics.resilienceSpend} units`} /></div>
        <div className="rounded bg-bg-deep p-2 text-text-secondary"><BarChart3 className="inline w-3.5 h-3.5 text-app-cyan mr-1" />Estimated incident loss: <span className="text-app-red font-bold">{incident?.estimatedBusinessImpactUnits ?? 0} units</span></div>
        <div className="rounded bg-bg-deep p-2 text-text-secondary">Waste check: {metrics.waste}</div>
        <p className="text-[10px] text-text-secondary">Cost units are illustrative, not AWS pricing. Resilience spend trades monthly cost for lower outage loss.</p>
      </>}
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded bg-bg-deep p-2"><div className="text-text-secondary">{label}</div><div className="text-text-primary font-bold mt-1">{value}</div></div>;
}
