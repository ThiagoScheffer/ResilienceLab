import { Architecture, ArchitectureNode, Pillar } from "../types/architecture";
import { FailureScenario, ScoreExplanation, SimulationComponentImpact, SimulationEvent, SimulationResult } from "../types/simulation";
import { calculateScores } from "./scoringEngine";
import { generateRecommendations } from "./recommendationEngine";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const riskOrder = ["none", "low", "medium", "high", "critical"] as const;

export const runSimulation = (architecture: Architecture, scenario: FailureScenario): SimulationResult => {
  const nodes: ArchitectureNode[] = architecture.nodes.map(node => ({ ...node, configuration: { ...node.configuration }, status: "healthy" }));
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const events: SimulationEvent[] = [];
  const affected = new Set<string>();
  const exposed = new Map<string, SimulationComponentImpact["exposure"]>();
  let time = 0;
  const log = (node: ArchitectureNode, message: string) => events.push({ time: time++, message, affectedNodeId: node.id, newStatus: node.status });
  const change = (id: string, status: ArchitectureNode["status"], message: string) => {
    const node = nodeById.get(id);
    if (!node || node.status === status) return;
    node.status = status; affected.add(id); log(node, message);
  };
  const expose = (node: ArchitectureNode, level: NonNullable<SimulationComponentImpact["exposure"]>, message: string) => {
    const current = exposed.get(node.id) ?? "none";
    if (riskOrder.indexOf(level) > riskOrder.indexOf(current)) { exposed.set(node.id, level); log(node, message); }
  };
  const targetIds = scenario.targetNodeIds;
  const webApps = () => nodes.filter(node => node.type === "web-app");
  const databases = () => nodes.filter(node => node.type === "database");
  const hasHealthyReplica = (database: ArchitectureNode) => databases().some(candidate => candidate.id !== database.id && candidate.status === "healthy" && architecture.edges.some(edge => edge.source === database.id && edge.target === candidate.id && edge.type === "replication"));

  if (scenario.type === "zone-outage") {
    const zoneId = scenario.parameters?.targetZoneId ?? nodeById.get(targetIds[0])?.zoneId;
    nodes.filter(node => node.zoneId === zoneId && node.type !== "users").forEach(node => change(node.id, "failed", `${node.name} failed during the ${zoneId} availability-zone outage.`));
  } else if (scenario.type === "traffic-spike") {
    const multiplier = Number(scenario.parameters?.trafficMultiplier ?? 5);
    const normalCapacity = webApps().reduce((total, node) => total + node.configuration.capacity, 0);
    const available = webApps().reduce((total, node) => total + node.configuration.capacity * (node.configuration.autoscaling ? 1.5 : 1), 0);
    const ratio = normalCapacity ? available / (normalCapacity * multiplier) : 0;
    const status = ratio >= 1 ? "healthy" : ratio >= .7 ? "degraded" : "failed";
    if (status === "healthy") webApps().forEach(node => log(node, `${node.name} absorbed the ${multiplier}x traffic spike with available capacity.`));
    else webApps().forEach(node => change(node.id, status, `${node.name} ${status === "failed" ? "exhausted" : "strained"} under the ${multiplier}x traffic spike.`));
    nodes.filter(node => node.type === "load-balancer" && status !== "healthy").forEach(node => change(node.id, "degraded", `${node.name} is throttling overloaded requests.`));
  } else if (scenario.type === "credential-compromise") {
    const queue = [...targetIds]; const visited = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!; if (visited.has(id)) continue; visited.add(id);
      const node = nodeById.get(id); if (!node) continue;
      const level = node.configuration.credentialProtected ? "low" : node.configuration.encrypted ? "medium" : "high";
      expose(node, level, `${node.name} has ${level} exposure from compromised credentials.`);
      architecture.edges.filter(edge => edge.source === id).forEach(edge => queue.push(edge.target));
    }
  } else if (scenario.type === "deployment-regression") {
    targetIds.forEach(id => {
      const node = nodeById.get(id); if (!node) return;
      const safeDeployment = node.configuration.healthChecksEnabled && node.configuration.rollbackEnabled && node.configuration.deploymentStrategy !== "all-at-once";
      change(id, safeDeployment ? "degraded" : "failed", safeDeployment ? `${node.name} rolled back an unhealthy deployment.` : `${node.name} failed after an unhealthy deployment.`);
    });
  } else {
    targetIds.forEach(id => { const node = nodeById.get(id); if (node) change(id, "failed", `${node.name} became unavailable.`); });
  }

  // Queue-style deterministic propagation from every unavailable dependency.
  let changed = true;
  while (changed) {
    changed = false;
    for (const dependant of nodes) {
      if (dependant.status === "failed") continue;
      const dependencies = architecture.edges.filter(edge => edge.source === dependant.id);
      const failedRequired = dependencies.filter(edge => edge.required && nodeById.get(edge.target)?.status === "failed");
      const failedOptional = dependencies.filter(edge => !edge.required && nodeById.get(edge.target)?.status === "failed");
      const unrecoverable = failedRequired.filter(edge => {
        const dependency = nodeById.get(edge.target)!;
        if (dependency.type !== "database" || !hasHealthyReplica(dependency) || !(dependency.configuration.failoverEnabled ?? dependency.configuration.redundant)) return true;
        log(dependant, `${dependant.name} failed over to a healthy database replica.`); return false;
      });
      if (unrecoverable.length) { const before = dependant.status; change(dependant.id, "failed", `${dependant.name} lost a required dependency.`); changed ||= before !== "failed"; }
      else if (failedOptional.length && dependant.status === "healthy") { change(dependant.id, "degraded", `${dependant.name} lost an optional dependency.`); changed = true; }
    }
  }

  const totalCapacity = architecture.nodes.filter(node => node.type === "web-app").reduce((total, node) => total + node.configuration.capacity, 0);
  const originalCapacity = scenario.type === "traffic-spike" ? totalCapacity * Number(scenario.parameters?.trafficMultiplier ?? 5) : Math.max(0, ...architecture.nodes.filter(node => node.type === "web-app").map(node => node.configuration.capacity));
  const activeCapacity = webApps().reduce((total, node) => total + (node.status === "healthy" ? node.configuration.capacity : node.status === "degraded" ? node.configuration.capacity * .5 : 0), 0);
  const customerAvailability = originalCapacity ? clamp(activeCapacity / originalCapacity * 100) : 0;
  const failed = nodes.filter(node => node.status === "failed");
  const degraded = nodes.filter(node => node.status === "degraded");
  const componentImpact = (node: ArchitectureNode): SimulationComponentImpact => ({ id: node.id, name: node.name, status: node.status, exposure: exposed.get(node.id) });
  const failedComponents = failed.map(componentImpact); const degradedComponents = degraded.map(componentImpact);
  const exposedComponents = nodes.filter(node => exposed.has(node.id)).map(componentImpact);
  const affectedComponents = nodes.filter(node => affected.has(node.id) || exposed.has(node.id)).map(componentImpact);
  const primaryDatabaseFailed = failed.filter(node => node.type === "database");
  const dataLossRisk = scenario.type === "credential-compromise"
    ? (exposedComponents.some(component => nodeById.get(component.id)?.type === "database") ? "high" : "medium")
    : primaryDatabaseFailed.length ? (primaryDatabaseFailed.some(node => !hasHealthyReplica(node)) ? (architecture.edges.some(edge => primaryDatabaseFailed.some(db => db.id === edge.source) && edge.type === "backup") ? "high" : "critical") : "low") : "none";
  const before = calculateScores(architecture); const after = { ...before };
  const penalties: Record<FailureScenario["type"], Partial<Record<Pillar, number>>> = {
    "instance-failure": { reliability: 15 }, "database-outage": { reliability: 25, performance: 10 }, "traffic-spike": { performance: 20, reliability: 10 }, "zone-outage": { reliability: 30, "operational-excellence": 10 }, "credential-compromise": { security: 30, "operational-excellence": 10 }, "deployment-regression": { "operational-excellence": 20, reliability: 15 }
  };
  const explanations: ScoreExplanation[] = Object.entries(penalties[scenario.type]).map(([pillar, delta]) => ({ pillar: pillar as Pillar, delta: -(delta ?? 0), reason: `${scenario.name} reduced ${pillar.replace("-", " ")} confidence.` }));
  explanations.forEach(explanation => after[explanation.pillar] = clamp(after[explanation.pillar] + explanation.delta));
  const costBefore = architecture.nodes.reduce((total, node) => total + node.configuration.monthlyCostUnits, 0);
  const impactSeverity: SimulationResult["impactSeverity"] = customerAvailability < 25 || dataLossRisk === "critical" ? "critical" : customerAvailability < 70 || dataLossRisk === "high" ? "high" : affectedComponents.length || exposedComponents.length ? "medium" : "low";
  const rootCauses: Record<FailureScenario["type"], string> = { "instance-failure": "An application compute instance became unavailable.", "database-outage": "The primary database stopped accepting connections.", "traffic-spike": "Incoming demand exceeded the configured application capacity.", "zone-outage": "An availability zone became unavailable.", "credential-compromise": "Application credentials were exposed and required containment.", "deployment-regression": "A release introduced unhealthy application behavior." };
  const result: SimulationResult = { scenario, events, affectedNodes: [...affected], affectedComponents, failedComponents, degradedComponents, exposedComponents, impactSeverity, customerImpact: customerAvailability === 0 ? "Complete customer outage." : customerAvailability < 100 ? `${100 - customerAvailability}% of application capacity is unavailable.` : "No customer-visible availability loss.", rootCause: rootCauses[scenario.type], customerAvailability, estimatedRecoveryMinutes: Math.max(0, ...affectedComponents.map(component => nodeById.get(component.id)?.configuration.recoveryTimeMinutes ?? 0)), dataLossRisk, pillarScoresBefore: before, pillarScoresAfter: after, scoreExplanations: explanations, costBefore, costAfter: costBefore, costDelta: 0, recommendations: [] };
  result.recommendations = generateRecommendations(architecture, result);
  return result;
};
