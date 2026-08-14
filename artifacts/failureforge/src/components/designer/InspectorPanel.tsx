import React from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import { calculateArchitecturePosture, getIncidentHealthLabel, getLiveIncidentHealth, getOverallHealth, getHealthLabel, getScoreSeverity } from '../../engine/scoringEngine';
import { AwsServicePreset, Pillar } from '../../types/architecture';
import { Shield, Settings, Activity, Zap, DollarSign, Leaf, Trash2, AlertTriangle } from 'lucide-react';
import { getSolutionPlaybook } from '../../engine/solutionPlaybooks';
import { awsServicePresets, getDefaultAwsPreset } from '../../lib/awsServicePresets';

const pillarIcons: Record<Pillar, React.ElementType> = {
  "reliability": Shield,
  "security": Settings,
  "operational-excellence": Activity,
  "performance": Zap,
  "cost": DollarSign,
  "sustainability": Leaf
};

const pillarLabels: Record<Pillar, string> = {
  "reliability": "Reliability",
  "security": "Security",
  "operational-excellence": "Operational Excellence",
  "performance": "Performance",
  "cost": "Cost Optimization",
  "sustainability": "Sustainability"
};

export default function InspectorPanel() {
  const { architecture, selectedNodeId, updateNode, deleteNode, simulationResult, applyRecommendation, validationIssues, activeEvents, simulationState, designerMode } = useArchitectureStore();
  const [eventTab, setEventTab] = React.useState<"incident" | "timeline" | "why" | "fix">("incident");
  
  const selectedNode = architecture.nodes.find(n => n.id === selectedNodeId);
  const scores = calculateArchitecturePosture(architecture);
  const overallHealth = getOverallHealth(scores);
  
  const displayScores = scores;
  const displayHealth = getOverallHealth(displayScores);
  const healthColor = displayHealth >= 80 ? "text-app-green" : displayHealth >= 50 ? "text-app-amber" : "text-app-red";

  if (simulationState !== "idle" || simulationResult || designerMode === "present") {
    const events = simulationResult?.events ?? activeEvents;
    const topRecommendation = simulationResult?.recommendations[0];
    const incidentHealth = simulationResult ? getLiveIncidentHealth(simulationResult) : 0;
    const incidentLabel = simulationResult ? getIncidentHealthLabel(incidentHealth, simulationResult.customerAvailability) : "Evaluating";
    const isCritical = incidentLabel === "Critical";
    const playbook = getSolutionPlaybook(simulationResult?.scenario ?? null, simulationResult);
    const whySteps = simulationResult?.scoreExplanations.slice(0, 4).map(explanation => explanation.reason) ?? [
      "The selected failure is being evaluated against required dependencies.",
      "The engine checks reachable alternatives, routing, monitoring, and failover controls.",
      "Customer-path availability is calculated from served demand, not static architecture posture."
    ];

    return (
      <div className="w-80 bg-bg-panel border-l border-border flex flex-col h-full shrink-0 overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-app-cyan">The Checkout That Could Not Fail</div>
          <div className={`mt-2 rounded-lg border p-3 ${isCritical ? "border-app-red/50 bg-app-red/10" : "border-app-green/40 bg-app-green/10"}`}>
            <div className={`text-2xl font-black uppercase ${isCritical ? "text-app-red" : "text-app-green"}`}>
              {incidentLabel}
            </div>
            <div className="mt-1 text-xs text-text-secondary">Live Incident Health: {incidentHealth}/100</div>
            <div className="mt-1 text-xs text-text-secondary">{simulationResult?.customerImpact ?? "Running deterministic dependency checks..."}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded bg-bg-deep p-2"><div className="text-text-secondary">Availability</div><div className="text-lg font-bold">{simulationResult?.customerAvailability ?? 0}%</div></div>
            <div className="rounded bg-bg-deep p-2"><div className="text-text-secondary">Recovery</div><div className="text-lg font-bold">{simulationResult ? `${simulationResult.estimatedRecoveryMinutes}m` : "..."}</div></div>
          </div>
        </div>

        <div className="grid grid-cols-4 border-b border-border text-xs">
          {(["incident", "timeline", "why", "fix"] as const).map(tab => (
            <button key={tab} onClick={() => setEventTab(tab)} className={`px-2 py-2 font-semibold capitalize transition-colors ${eventTab === tab ? "bg-bg-elevated text-white" : "text-text-secondary hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {eventTab === "incident" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-bg-deep p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">Live Incident Health</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <PanelMetric label="Customer path" value={simulationResult?.customerAvailability === 0 ? "No healthy request path" : simulationResult ? "Serving checkout traffic" : "Evaluating path"} tone={isCritical ? "text-app-red" : "text-app-green"} />
                  <PanelMetric label="Healthy paths" value={simulationResult?.liveIncident.healthyCustomerPathCount ?? 0} />
                  <PanelMetric label="Demand served" value={`${simulationResult?.liveIncident.demandServedPercent ?? 0}%`} />
                  <PanelMetric label="Recovery" value={simulationResult ? `${simulationResult.estimatedRecoveryMinutes} min` : "calculating"} />
                </div>
              </div>

              {simulationResult && (
                <div className="rounded-lg border border-border bg-bg-deep p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">Live Incident Impact</div>
                  <div className="mt-3 space-y-3">
                    {(["reliability", "performance", "operational-excellence"] as Pillar[]).map(pillar => (
                      <ScoreRow
                        key={pillar}
                        pillar={pillar}
                        before={simulationResult.architecturePosture[pillar]}
                        after={simulationResult.liveIncident.pillarScores[pillar]}
                        explanation={simulationResult.scoreExplanations.find(item => item.pillar === pillar)?.reason ?? ""}
                      />
                    ))}
                  </div>
                </div>
              )}

              {simulationResult && (
                <div className="rounded-lg border border-app-cyan/30 bg-app-cyan/5 p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-app-cyan">Controls Unaffected</div>
                  <ScoreRow
                    pillar="security"
                    before={simulationResult.architecturePosture.security}
                    after={simulationResult.liveIncident.pillarScores.security}
                    explanation={simulationResult.scoreExplanations.find(item => item.pillar === "security")?.reason ?? ""}
                    unaffected={simulationResult.scenario.type !== "credential-compromise"}
                  />
                </div>
              )}

              <div className="rounded-lg border border-border bg-bg-deep p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-text-secondary">Architecture Posture</div>
                <div className="mt-3 space-y-3">
                  {(["cost", "sustainability"] as Pillar[]).map(pillar => (
                    <ScoreRow
                      key={pillar}
                      pillar={pillar}
                      before={(simulationResult?.architecturePosture ?? scores)[pillar]}
                      after={(simulationResult?.architecturePosture ?? scores)[pillar]}
                      explanation={simulationResult?.scoreExplanations.find(item => item.pillar === pillar)?.reason ?? "Structural posture score, not part of live incident health."}
                      unaffected
                    />
                  ))}
                </div>
              </div>

              <PanelMetric label="Incident loss" value={`${simulationResult?.liveIncident.estimatedBusinessImpactUnits ?? 0} units`} />
            </div>
          )}

          {eventTab === "timeline" && (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div key={`${event.time}-${index}`} className="rounded border border-border bg-bg-deep p-2 text-sm">
                  <div className="font-mono text-xs text-app-cyan">T+{String(event.time).padStart(2, "0")}</div>
                  <div className={event.newStatus === "failed" ? "text-app-red" : event.newStatus === "recovering" ? "text-app-blue" : "text-text-secondary"}>{event.message}</div>
                </div>
              ))}
              {events.length === 0 && <div className="text-sm text-text-secondary">Timeline will appear as the incident unfolds.</div>}
            </div>
          )}

          {eventTab === "why" && (
            <div className="space-y-3">
              {whySteps.map((step, index) => (
                <div key={index} className="flex gap-3 rounded border border-border bg-bg-deep p-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-bg-elevated text-xs font-bold text-app-cyan">{index + 1}</span>
                  <span className="text-text-secondary">{step}</span>
                </div>
              ))}
            </div>
          )}

          {eventTab === "fix" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-app-orange/40 bg-app-orange/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-app-orange">Solution playbook</div>
                <h3 className="mt-2 text-base font-bold">{playbook.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{playbook.problem}</p>
                <div className="mt-3 rounded bg-bg-deep p-2 text-xs"><span className="font-semibold text-app-cyan">AWS pattern: </span>{playbook.awsPattern}</div>
                <ol className="mt-3 space-y-2 text-xs text-text-secondary list-decimal list-inside">{playbook.steps.map(step => <li key={step}>{step}</li>)}</ol>
                <div className="mt-3 text-xs text-app-green">Expected: {playbook.outcome}</div>
                <div className="mt-1 text-xs text-app-amber">Trade-off: {playbook.tradeoff}</div>
                <div className="mt-2 flex flex-wrap gap-1">{playbook.pillars.map(pillar => <span key={pillar} className="rounded bg-bg-deep px-1.5 py-0.5 text-[10px] text-text-secondary">{pillar}</span>)}</div>
              </div>
              {topRecommendation ? (
                <div className="rounded-lg border border-app-cyan/40 bg-app-cyan/10 p-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-app-cyan">Apply locally, then rerun</div>
                  <h3 className="mt-2 text-lg font-bold">{topRecommendation.title === "Enable application database failover" ? "Apply Resilience Upgrade" : topRecommendation.title}</h3>
                  <p className="mt-2 text-sm text-text-secondary">{topRecommendation.description}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <PanelMetric label="Reliability gain" value={`+${topRecommendation.estimatedScoreImpact.reliability ?? 0}`} />
                    <PanelMetric label="Monthly delta" value={`${topRecommendation.estimatedMonthlyCostDelta ?? 0} units`} />
                    <PanelMetric label="Outage loss cut" value={`${topRecommendation.estimatedOutageLossReduction ?? 0} units`} />
                    <PanelMetric label="Trade-off" value="Higher standby cost" />
                  </div>
                  <button onClick={() => applyRecommendation(topRecommendation.action)} className="mt-3 w-full rounded-md bg-app-cyan px-3 py-2 text-sm font-bold text-bg-deep hover:opacity-90">
                    Apply Resilience Upgrade
                  </button>
                </div>
              ) : (
                <div className="text-sm text-text-secondary">Run a scenario to generate the highest-value fix.</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-bg-panel border-l border-border flex flex-col h-full shrink-0 overflow-y-auto">
      
      {!selectedNode ? (
        <div className="p-5 flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-bg-deep rounded-xl border border-border">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r="56" fill="none" 
                  stroke="currentColor" strokeWidth="12" 
                  strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * displayHealth) / 100}
                  className={healthColor + " transition-all duration-1000"}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{displayHealth}</span>
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{getHealthLabel(displayHealth)}</span>
              </div>
            </div>
            <h3 className="mt-4 font-semibold">Architecture Posture</h3>
          </div>

          <div className="space-y-4">
            {validationIssues.length > 0 && <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Architecture checks</h3>
              {validationIssues.slice(0, 5).map(issue => <div key={issue.id} className={`text-xs p-2 rounded border flex gap-2 ${issue.severity === "error" ? "border-app-red/40 text-app-red" : "border-app-amber/40 text-app-amber"}`}><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{issue.message}</div>)}
            </div>}
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Architecture Posture</h3>
            {(Object.keys(pillarLabels) as Pillar[]).map(pillar => {
              const Icon = pillarIcons[pillar];
              const score = displayScores[pillar];
              const delta = 0;
              const severity = getScoreSeverity(score);

              return (
                <div key={pillar} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-text-secondary" />
                      <span className="font-medium">{pillarLabels[pillar]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {delta !== 0 && (
                        <span className={`text-xs ${delta > 0 ? 'text-app-green' : 'text-app-red'}`}>
                          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                        </span>
                      )}
                      <span className="font-bold">{score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden">
                    <div className={`h-full ${severity.barClass} transition-all duration-500`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Selected Node</h3>
              <input 
                type="text" 
                value={selectedNode.name}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="w-full bg-bg-deep border border-border rounded-md px-3 py-2 font-bold focus:border-app-blue focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 bg-bg-deep border border-border rounded text-xs text-text-secondary font-medium uppercase tracking-wider">
                {selectedNode.type}
              </span>
              <select value={selectedNode.zoneId} onChange={event => updateNode(selectedNode.id, { zoneId: event.target.value })} className="bg-bg-deep border border-border rounded text-xs text-text-secondary px-2">
                {architecture.zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
              </select>
            </div>

            <label className="block text-xs text-text-secondary">AWS service preset
              <select value={selectedNode.configuration.awsServicePreset ?? getDefaultAwsPreset(selectedNode.type)} onChange={event => updateNode(selectedNode.id, { configuration: { ...selectedNode.configuration, awsServicePreset: event.target.value as AwsServicePreset } })} className="mt-1 w-full bg-bg-deep border border-border rounded px-2 py-1.5 text-sm text-text-primary">
                {Object.values(awsServicePresets).map(preset => <option key={preset.id} value={preset.id}>{preset.shortName}</option>)}
              </select>
            </label>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Configuration</h3>
              <label className="flex items-center justify-between text-sm"><span className="text-text-secondary">Capacity</span><input type="number" min="1" max="100" value={selectedNode.configuration.capacity} onChange={event => updateNode(selectedNode.id, { configuration: { ...selectedNode.configuration, capacity: Number(event.target.value) } })} className="w-16 bg-bg-deep border border-border rounded px-2 py-1" /></label>
              
              <label className="flex items-center justify-between text-sm cursor-pointer group">
                <span className="text-text-secondary group-hover:text-text-primary transition-colors">High Availability</span>
                <input 
                  type="checkbox" 
                  checked={selectedNode.configuration.redundant}
                  onChange={(e) => updateNode(selectedNode.id, { 
                    configuration: { ...selectedNode.configuration, redundant: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                />
              </label>

              {['web-app', 'load-balancer', 'queue'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Auto-scaling</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.autoscaling}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, autoscaling: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}

              {['database', 'object-storage', 'cache'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Encryption at Rest</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.encrypted}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, encrypted: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}
              
              {['database'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Automated Backups</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.backupsEnabled}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, backupsEnabled: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}
              {[
                ["Public exposure", "publiclyAccessible"], ["Monitoring enabled", "monitoringEnabled"], ["Credential protection", "credentialProtected"], ["Health checks", "healthChecksEnabled"], ["Automatic rollback", "rollbackEnabled"],
                ...(selectedNode.type === "database" ? [["Automatic failover", "failoverEnabled"]] : [])
              ].map(([label, key]) => <label key={key} className="flex items-center justify-between text-sm cursor-pointer"><span className="text-text-secondary">{label}</span><input type="checkbox" checked={Boolean(selectedNode.configuration[key as keyof typeof selectedNode.configuration])} onChange={event => updateNode(selectedNode.id, { configuration: { ...selectedNode.configuration, [key]: event.target.checked } })} className="w-4 h-4" /></label>)}
              {selectedNode.type === "web-app" && <label className="flex items-center justify-between text-sm"><span className="text-text-secondary">Deployment</span><select value={selectedNode.configuration.deploymentStrategy ?? "all-at-once"} onChange={event => updateNode(selectedNode.id, { configuration: { ...selectedNode.configuration, deploymentStrategy: event.target.value as "all-at-once" | "rolling" | "blue-green" } })} className="bg-bg-deep border border-border rounded px-1"><option value="all-at-once">All at once</option><option value="rolling">Rolling</option><option value="blue-green">Blue/green</option></select></label>}
              <label className="flex items-center justify-between text-sm"><span className="text-text-secondary">Recovery minutes</span><input type="number" min="0" value={selectedNode.configuration.recoveryTimeMinutes} onChange={event => updateNode(selectedNode.id, { configuration: { ...selectedNode.configuration, recoveryTimeMinutes: Number(event.target.value) } })} className="w-16 bg-bg-deep border border-border rounded px-2 py-1" /></label>
              <button onClick={() => deleteNode(selectedNode.id)} className="w-full mt-3 py-2 text-sm text-app-red border border-app-red/40 rounded flex justify-center gap-2"><Trash2 className="w-4 h-4" /> Delete component</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelMetric({ label, value, tone = "text-text-primary" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-deep p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{label}</div>
      <div className={`mt-1 text-sm font-bold capitalize ${tone}`}>{value}</div>
    </div>
  );
}

function ScoreRow({ pillar, before, after, explanation, unaffected = false }: { pillar: Pillar; before: number; after: number; explanation: string; unaffected?: boolean }) {
  const severity = getScoreSeverity(after);
  const delta = after - before;
  const tone = unaffected ? "text-app-cyan" : severity.textClass;
  const barClass = unaffected ? "bg-app-cyan" : severity.barClass;

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{pillarLabels[pillar]}</div>
          <div className="mt-0.5 text-xs text-text-secondary">{before}{" -> "}{after}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-lg font-black ${tone}`}>{after}</div>
          <div className={`text-[10px] font-bold uppercase ${tone}`}>{unaffected ? "Unaffected" : severity.label}</div>
          {delta !== 0 && <div className={`text-[10px] ${delta < 0 ? "text-app-red" : "text-app-green"}`}>{delta > 0 ? "+" : ""}{delta}</div>}
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-panel">
        <div className={`h-full ${barClass} transition-all duration-500`} style={{ width: `${after}%` }} />
      </div>
      {explanation && <p className="text-xs leading-relaxed text-text-secondary">{explanation}</p>}
    </div>
  );
}
