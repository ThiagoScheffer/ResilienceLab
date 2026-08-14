import React from 'react';
import { Play, RotateCcw, AlertTriangle, Clock, ShieldAlert, X, Activity, Gauge, TrendingDown } from 'lucide-react';
import { useArchitectureStore } from '../../store/architectureStore';
import { FailureScenario } from '../../types/simulation';
import { getIncidentHealthLabel, getLiveIncidentHealth, getScoreSeverity } from '../../engine/scoringEngine';
import { Pillar } from '../../types/architecture';

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
  },
  {
    id: "fs-4",
    type: "traffic-spike",
    name: "Sudden Traffic Spike",
    description: "Pushes demand beyond the effective capacity of the application tier.",
    targetNodeIds: [],
    severity: "high"
  },
  {
    id: "fs-5",
    type: "credential-compromise",
    name: "Credential Compromise",
    description: "Contains an exposed application credential and restricts connected data stores.",
    targetNodeIds: [],
    severity: "critical"
  },
  {
    id: "fs-6",
    type: "deployment-regression",
    name: "Deployment Regression",
    description: "Rolls out a faulty release to the application deployment cohort.",
    targetNodeIds: [],
    severity: "high"
  }
];

export default function SimulationPanel() {
  const { architecture, simulationState, activeScenario, setScenario, runSimulation, resetSimulation, activeEvents, simulationResult, validationIssues, applyRecommendation, comparisonResult, designerMode } = useArchitectureStore();
  const applicable = (scenario: FailureScenario) => {
    if (scenario.type === "database-outage") return architecture.nodes.some(node => node.type === "database");
    if (scenario.type === "traffic-spike" || scenario.type === "instance-failure" || scenario.type === "deployment-regression") return architecture.nodes.some(node => node.type === "web-app");
    if (scenario.type === "zone-outage") return architecture.zones.some(zone => zone.id !== "global" && architecture.nodes.some(node => node.zoneId === zone.id));
    return architecture.nodes.some(node => node.type !== "users" && (node.configuration.publiclyAccessible || !node.configuration.credentialProtected));
  };
  const hasBlockingError = validationIssues.some(issue => issue.severity === "error");
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && simulationState === "complete") resetSimulation(); };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [simulationState, resetSimulation]);

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
        const targetZone = architecture.zones.find(zone => zone.id !== "global")?.id;
        const zoneNodes = architecture.nodes.filter(n => n.zoneId === targetZone);
        if (zoneNodes.length > 0) targetIds = [zoneNodes[0].id];
      } else if (activeScenario.type === "traffic-spike") {
        targetIds = architecture.nodes.filter(n => n.type === "web-app").map(n => n.id);
      } else if (activeScenario.type === "credential-compromise") {
        const exposedApp = architecture.nodes.find(n => n.type === "web-app" && n.configuration.publiclyAccessible);
        const anyApp = architecture.nodes.find(n => n.type === "web-app");
        if (exposedApp || anyApp) targetIds = [(exposedApp ?? anyApp)!.id];
      } else if (activeScenario.type === "deployment-regression") {
        targetIds = architecture.nodes.filter(n => n.type === "web-app").map(n => n.id);
      }

      if (targetIds.length === 0) {
        alert("No suitable target found in current architecture for this scenario.");
        return;
      }

      const resolvedScenario = { ...activeScenario, targetNodeIds: targetIds, parameters: { ...activeScenario.parameters, trafficMultiplier: activeScenario.parameters?.trafficMultiplier ?? 5, targetZoneId: activeScenario.type === "zone-outage" ? architecture.nodes.find(node => node.id === targetIds[0])?.zoneId : undefined } };
      setScenario(resolvedScenario);
      runSimulation(resolvedScenario);
    } else {
      resetSimulation();
    }
  };

  return (
    <>
    {(simulationState !== "idle" || simulationResult || designerMode === "present") && (
      <IncidentStrip simulationResult={simulationResult} simulationState={simulationState} activeScenario={activeScenario} />
    )}
    <div id="simulation-panel" className="h-full border-t border-border bg-bg-panel shrink-0 flex">
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
            <option key={s.id} value={s.id} disabled={!applicable(s)}>{s.name}{!applicable(s) ? " (not applicable)" : ""}</option>
          ))}
        </select>

        {activeScenario && (
          <div className="text-xs text-text-secondary mb-4 leading-relaxed line-clamp-2">
            {activeScenario.description}
          </div>
        )}
        {activeScenario?.type === "traffic-spike" && (
          <label className="text-xs text-text-secondary mb-2">Traffic multiplier
            <input type="number" min="2" max="10" value={activeScenario.parameters?.trafficMultiplier ?? 5} onChange={event => setScenario({ ...activeScenario, parameters: { ...activeScenario.parameters, trafficMultiplier: Number(event.target.value) } })} className="ml-2 w-14 bg-bg-deep border border-border rounded px-1 text-text-primary" />×
          </label>
        )}
        {hasBlockingError && <p className="text-xs text-app-red">Resolve architecture errors before simulating.</p>}

        <button 
          onClick={handleRun}
          disabled={!activeScenario || (simulationState === "idle" && (hasBlockingError || !applicable(activeScenario)))}
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
    {simulationState === "complete" && simulationResult && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) resetSimulation(); }}>
        <div className="w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-xl border border-border bg-bg-panel shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="impact-report-title">
          <div className="sticky top-0 bg-bg-panel border-b border-border px-6 py-4 flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-app-amber font-semibold">Impact report</div>
              <h2 id="impact-report-title" className="text-xl font-bold text-text-primary mt-1">{simulationResult.scenario.name}</h2>
            </div>
            <button onClick={resetSimulation} className="p-2 rounded-md hover:bg-bg-elevated text-text-secondary" aria-label="Close and reset simulation">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {simulationResult.customerAvailability < 25 && <div className="rounded-lg border border-app-red bg-app-red/15 px-4 py-3 text-app-red"><span className="font-bold uppercase tracking-wide">Critical customer-path outage</span><p className="text-sm mt-1">No healthy route from users to a writable application dependency remains.</p></div>}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border bg-bg-deep p-4">
                <div className="text-xs text-text-secondary uppercase">Customer availability</div>
                <div className={`text-3xl font-bold mt-2 ${simulationResult.customerAvailability >= 90 ? "text-app-green" : simulationResult.customerAvailability >= 50 ? "text-app-amber" : "text-app-red"}`}>
                  {simulationResult.customerAvailability}%
                </div>
              </div>
              <div className="rounded-lg border border-border bg-bg-deep p-4">
                <div className="text-xs text-text-secondary uppercase">Monthly cost</div>
                <div className="text-2xl font-bold mt-2 text-text-primary">{simulationResult.costBefore} units</div>
                <div className="text-xs text-text-secondary mt-1">Incident loss: {simulationResult.liveIncident.estimatedBusinessImpactUnits} units</div>
              </div>
              <div className="rounded-lg border border-border bg-bg-deep p-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary uppercase"><Clock className="w-4 h-4" /> Recovery estimate</div>
                <div className="text-2xl font-bold mt-2 text-text-primary">{simulationResult.estimatedRecoveryMinutes} min</div>
              </div>
              <div className="rounded-lg border border-border bg-bg-deep p-4">
                <div className="flex items-center gap-2 text-xs text-text-secondary uppercase"><ShieldAlert className="w-4 h-4" /> Data-loss risk</div>
                <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-sm font-bold uppercase ${
                  simulationResult.dataLossRisk === "none" ? "bg-app-green/15 text-app-green" :
                  simulationResult.dataLossRisk === "low" ? "bg-app-cyan/15 text-app-cyan" :
                  "bg-app-red/15 text-app-red"
                }`}>{simulationResult.dataLossRisk}</span>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary"><AlertTriangle className="w-4 h-4 text-app-amber" /> Root cause</div>
              <p className="text-sm text-text-secondary mt-2">{simulationResult.rootCause}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-app-red/30 bg-app-red/5 p-3"><div className="text-xs uppercase text-text-secondary">Live incident impact</div><div className="mt-1 text-lg font-bold text-app-red capitalize">{simulationResult.impactSeverity}</div><p className="mt-1 text-xs text-text-secondary">{simulationResult.customerImpact}</p></div>
              <div className="rounded-lg border border-border bg-bg-deep p-3"><div className="text-xs uppercase text-text-secondary">Capacity headroom</div><div className={`mt-1 text-lg font-bold ${simulationResult.liveIncident.capacityHeadroomPercent < 0 ? "text-app-red" : "text-app-green"}`}>{simulationResult.liveIncident.capacityHeadroomPercent}%</div><p className="mt-1 text-xs text-text-secondary">{simulationResult.liveIncident.healthyCapacity + simulationResult.liveIncident.degradedCapacity} of {simulationResult.liveIncident.demandCapacity} demand units served</p></div>
              <div className="rounded-lg border border-border bg-bg-deep p-3"><div className="text-xs uppercase text-text-secondary">Latency band</div><div className="mt-1 text-lg font-bold text-app-amber capitalize">{simulationResult.liveIncident.latencyBand}</div><p className="mt-1 text-xs text-text-secondary">Failed request path: {simulationResult.liveIncident.failedRequestPaths.join(", ") || "none"}</p></div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">Affected components</h3>
              {simulationResult.affectedComponents.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {simulationResult.affectedComponents.map(component => (
                    <div key={component.id} className="flex items-center justify-between rounded-md border border-border bg-bg-deep px-3 py-2">
                      <span className="text-sm text-text-primary">{component.name}</span>
                      <span className={`text-xs font-semibold uppercase ${component.status === "failed" ? "text-app-red" : "text-app-amber"}`}>{component.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-text-secondary">No components were affected.</p>}
            </div>

            {simulationResult.exposedComponents.length > 0 && <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">Security exposure</h3>
              <p className="text-sm text-text-secondary">{simulationResult.exposedComponents.map(component => `${component.name} (${component.exposure})`).join(", ")}</p>
            </div>}
            {simulationResult.liveIncident.protectedComponents.length > 0 && <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-2">Protected components</h3>
              <p className="text-sm text-text-secondary">{simulationResult.liveIncident.protectedComponents.slice(0, 5).map(component => component.name).join(", ")}{simulationResult.liveIncident.protectedComponents.length > 5 ? "…" : ""}</p>
            </div>}

            <div className="rounded-lg border border-border bg-bg-deep p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-1">Live incident health</h3>
              <p className="text-xs text-text-secondary mb-3">Incident health excludes Security, Cost, and Sustainability when they are posture-only or unaffected.</p>
              <div className="flex items-center justify-between rounded-md bg-bg-panel p-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-text-secondary">Weighted live score</div>
                  <div className="text-sm text-text-secondary">Reliability 60% · Performance 25% · Operational Excellence 15%</div>
                </div>
                <div className={`text-right ${getScoreSeverity(getLiveIncidentHealth(simulationResult)).textClass}`}>
                  <div className="text-3xl font-black">{getLiveIncidentHealth(simulationResult)}</div>
                  <div className="text-xs font-bold uppercase">{getIncidentHealthLabel(getLiveIncidentHealth(simulationResult), simulationResult.customerAvailability)}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["reliability", "performance", "operational-excellence"] as Pillar[]).map(pillar => (
                  <ReportScoreCard key={pillar} pillar={pillar} before={simulationResult.architecturePosture[pillar]} after={simulationResult.liveIncident.pillarScores[pillar]} explanation={simulationResult.scoreExplanations.find(item => item.pillar === pillar)?.reason ?? ""} />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <ReportScoreCard pillar="security" before={simulationResult.architecturePosture.security} after={simulationResult.liveIncident.pillarScores.security} explanation={simulationResult.scoreExplanations.find(item => item.pillar === "security")?.reason ?? ""} unaffected={simulationResult.scenario.type !== "credential-compromise"} />
                <ReportScoreCard pillar="cost" before={simulationResult.architecturePosture.cost} after={simulationResult.architecturePosture.cost} explanation="Architecture posture value. Incident-loss units are displayed separately." unaffected />
                <ReportScoreCard pillar="sustainability" before={simulationResult.architecturePosture.sustainability} after={simulationResult.architecturePosture.sustainability} explanation="Architecture posture value unless emergency scaling or recovery waste occurs." unaffected />
              </div>
            </div>
            {comparisonResult && <div className="rounded-lg border border-app-cyan/30 bg-app-cyan/5 p-4"><h3 className="text-sm font-semibold text-app-cyan">Before-and-after comparison</h3><p className="text-sm text-text-secondary mt-1">Availability: {comparisonResult.customerAvailability}% → {simulationResult.customerAvailability}% · Monthly cost: {comparisonResult.costBefore} → {simulationResult.costBefore} units · Incident loss: {comparisonResult.liveIncident.estimatedBusinessImpactUnits} → {simulationResult.liveIncident.estimatedBusinessImpactUnits} units</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">{Object.keys(simulationResult.pillarScoresAfter).map(pillar => <div key={pillar} className="text-xs text-text-secondary capitalize">{pillar.replace("-", " ")}: {comparisonResult.pillarScoresAfter[pillar as keyof typeof comparisonResult.pillarScoresAfter]} → {simulationResult.pillarScoresAfter[pillar as keyof typeof simulationResult.pillarScoresAfter]}</div>)}</div></div>}
            {simulationResult.recommendations.length > 0 && <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3">Recommended fixes</h3>
              <div className="space-y-2">{simulationResult.recommendations.slice(0, 3).map(recommendation => <div key={recommendation.id} className="rounded-md border border-border bg-bg-deep p-3 flex items-center gap-3"><div className="flex-1"><div className="font-semibold text-sm text-app-cyan">{recommendation.title}</div><div className="text-xs text-text-secondary">{recommendation.description}</div><div className="mt-1 flex gap-2 text-[10px] text-text-secondary"><span>Capacity +{recommendation.estimatedCapacityGain ?? 0}</span><span>Cost {recommendation.estimatedMonthlyCostDelta ? `+${recommendation.estimatedMonthlyCostDelta}` : "—"}</span><span>Loss avoided {recommendation.estimatedOutageLossReduction ?? 0}</span></div></div><button onClick={() => applyRecommendation(recommendation.action)} className="px-3 py-1.5 rounded bg-app-blue text-white text-xs font-semibold">Apply</button></div>)}</div>
            </div>}

            <button onClick={resetSimulation} className="w-full py-2.5 rounded-md bg-bg-elevated border border-border text-text-primary font-semibold hover:bg-border flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset architecture
            </button>
            <p className="text-center text-[10px] text-text-secondary">Simulation engine {simulationResult.engineVersion}</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function IncidentStrip({ simulationResult, simulationState, activeScenario }: { simulationResult: ReturnType<typeof useArchitectureStore.getState>["simulationResult"]; simulationState: "idle" | "running" | "complete"; activeScenario: FailureScenario | null }) {
  const availability = simulationResult?.customerAvailability ?? (simulationState === "running" ? 0 : 100);
  const severity = simulationResult?.impactSeverity ?? activeScenario?.severity ?? "high";
  const checkoutSuccess = simulationResult ? Math.max(0, Math.min(100, simulationResult.customerAvailability - (simulationResult.liveIncident.latencyBand === "severe" ? 12 : 0))) : availability;
  const headroom = simulationResult?.liveIncident.capacityHeadroomPercent ?? 0;
  const latency = simulationResult?.liveIncident.latencyBand ?? (simulationState === "running" ? "evaluating" : "normal");
  const dataRisk = simulationResult?.dataLossRisk ?? "evaluating";
  const recovery = simulationResult ? `${simulationResult.estimatedRecoveryMinutes} min` : "calculating";
  const loss = simulationResult?.liveIncident.estimatedBusinessImpactUnits ?? 0;
  const isCritical = availability < 25 || severity === "critical";

  return (
    <div className={`border-t border-border px-4 py-3 ${isCritical ? "bg-app-red/12" : "bg-bg-panel"}`}>
      <div className="flex flex-wrap items-center gap-3">
        <div className={`rounded border px-3 py-2 ${isCritical ? "border-app-red/50 bg-app-red/15 text-app-red" : "border-app-amber/40 bg-app-amber/10 text-app-amber"}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest">Live incident</div>
          <div className="text-lg font-black uppercase leading-none">{isCritical ? "Critical" : severity}</div>
        </div>
        <StripMetric icon={Activity} label="Availability" value={`${availability}%`} danger={availability < 25} />
        <StripMetric icon={Gauge} label="Checkout success" value={`${checkoutSuccess}%`} danger={checkoutSuccess < 25} />
        <StripMetric icon={TrendingDown} label="Headroom" value={`${headroom}%`} danger={headroom < 0} />
        <StripMetric icon={Clock} label="Latency" value={latency} danger={latency === "severe" || latency === "unavailable"} />
        <StripMetric icon={ShieldAlert} label="Data risk" value={dataRisk} danger={dataRisk === "high" || dataRisk === "critical"} />
        <StripMetric icon={Clock} label="Recovery" value={recovery} danger={availability < 25} />
        <StripMetric icon={TrendingDown} label="Incident loss" value={`${loss} units`} danger={loss > 0} />
      </div>
    </div>
  );
}

function StripMetric({ icon: Icon, label, value, danger }: { icon: React.ElementType; label: string; value: string; danger?: boolean }) {
  return (
    <div className="min-w-[118px] rounded-md border border-border bg-bg-deep px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-text-secondary">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`mt-0.5 truncate text-sm font-bold capitalize ${danger ? "text-app-red" : "text-text-primary"}`}>{value}</div>
    </div>
  );
}

const reportPillarLabels: Record<Pillar, string> = {
  reliability: "Reliability",
  security: "Security",
  "operational-excellence": "Operational Excellence",
  performance: "Performance",
  cost: "Cost Optimization",
  sustainability: "Sustainability"
};

function ReportScoreCard({ pillar, before, after, explanation, unaffected = false }: { pillar: Pillar; before: number; after: number; explanation: string; unaffected?: boolean }) {
  const severity = getScoreSeverity(after);
  const delta = after - before;
  const tone = unaffected ? "text-app-cyan" : severity.textClass;
  const bar = unaffected ? "bg-app-cyan" : severity.barClass;

  return (
    <div className="rounded-md border border-border bg-bg-panel p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-text-secondary">{reportPillarLabels[pillar]}</div>
          <div className="mt-1 text-xs text-text-secondary">{before}{" -> "}{after}</div>
        </div>
        <div className={`text-right ${tone}`}>
          <div className="text-xl font-black">{after}</div>
          <div className="text-[10px] font-bold uppercase">{unaffected ? "Unaffected" : severity.label}</div>
          {delta !== 0 && <div className={`text-[10px] ${delta < 0 ? "text-app-red" : "text-app-green"}`}>{delta > 0 ? "+" : ""}{delta}</div>}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-deep">
        <div className={`h-full ${bar}`} style={{ width: `${after}%` }} />
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-text-secondary">{explanation}</p>
    </div>
  );
}
