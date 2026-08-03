import { Architecture, ArchitectureNode, Pillar } from "../types/architecture";
import { FailureScenario, ScoreExplanation, SimulationComponentImpact, SimulationEvent, SimulationResult } from "../types/simulation";
import { calculateArchitecturePosture, calculateLiveIncidentScores } from "./scoringEngine";
import { generateRecommendations } from "./recommendationEngine";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const riskOrder = ["none", "low", "medium", "high", "critical"] as const;
export const SIMULATION_ENGINE_VERSION = "2026.08.db-failover-v2";

export const runSimulation = (architecture: Architecture, scenario: FailureScenario): SimulationResult => {
  const nodes: ArchitectureNode[] = architecture.nodes.map(node => ({ ...node, configuration: { ...node.configuration }, status: "healthy" }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const events: SimulationEvent[] = [];
  const affected = new Set<string>();
  const exposed = new Map<string, NonNullable<SimulationComponentImpact["exposure"]>>();
  let time = 0;
  const log = (node: ArchitectureNode, message: string) => events.push({ time: time++, message, affectedNodeId: node.id, newStatus: node.status });
  const change = (id: string, status: ArchitectureNode["status"], message: string) => {
    const node = byId.get(id); if (!node || node.status === status) return false;
    node.status = status; affected.add(id); log(node, message); return true;
  };
  const edgeFrom = (id: string) => architecture.edges.filter(edge => edge.source === id);
  const webApps = () => nodes.filter(node => node.type === "web-app");
  const databases = () => nodes.filter(node => node.type === "database");
  const healthyEquivalent = (dependant: ArchitectureNode, dependency: ArchitectureNode) => edgeFrom(dependant.id).some(edge => {
    const candidate = byId.get(edge.target);
    return candidate?.id !== dependency.id && candidate?.type === dependency.type && candidate.status !== "failed";
  });
  const promotedDatabases = new Set<string>();
  const canFailOver = (dependant: ArchitectureNode, database: ArchitectureNode) => {
    const replica = databases().find(candidate => candidate.id !== database.id && candidate.zoneId !== database.zoneId && candidate.status !== "failed" && architecture.edges.some(edge => edge.source === database.id && edge.target === candidate.id && edge.type === "replication"));
    return Boolean(replica && database.configuration.failoverEnabled && dependant.configuration.failoverEndpointEnabled);
  };
  const hasReachableReplica = (database: ArchitectureNode) => databases().some(replica => replica.id !== database.id && replica.zoneId !== database.zoneId && replica.status !== "failed" && database.configuration.failoverEnabled && architecture.edges.some(edge => edge.source === database.id && edge.target === replica.id && edge.type === "replication"));

  if (scenario.type === "zone-outage") {
    const zoneId = scenario.parameters?.targetZoneId ?? byId.get(scenario.targetNodeIds[0])?.zoneId;
    nodes.filter(node => node.zoneId === zoneId && node.type !== "users").forEach(node => change(node.id, "failed", `${node.name} failed when ${zoneId} became unavailable.`));
  } else if (scenario.type === "traffic-spike") {
    const multiplier = Number(scenario.parameters?.trafficMultiplier ?? 5);
    const normalDemand = Math.max(1, ...webApps().map(node => node.configuration.capacity));
    const availableCapacity = webApps().reduce((total, node) => total + node.configuration.capacity * (node.configuration.autoscaling ? 1.5 : 1), 0);
    const ratio = availableCapacity / (normalDemand * multiplier);
    const status = ratio >= 1 ? "healthy" : ratio >= .7 ? "degraded" : "failed";
    webApps().forEach(node => status === "healthy" ? log(node, `${node.name} absorbed the ${multiplier}x traffic spike.`) : change(node.id, status, `${node.name} ${status === "failed" ? "exhausted" : "strained"} under the ${multiplier}x traffic spike.`));
  } else if (scenario.type === "credential-compromise") {
    const queue = [...scenario.targetNodeIds]; const seen = new Set<string>();
    while (queue.length) {
      const id = queue.shift()!; if (seen.has(id)) continue; seen.add(id);
      const node = byId.get(id); if (!node) continue;
      const risk = node.configuration.credentialProtected ? "low" : node.configuration.encrypted ? "medium" : "high";
      exposed.set(node.id, risk); log(node, `${node.name} has ${risk} exposure from compromised credentials.`);
      edgeFrom(id).forEach(edge => queue.push(edge.target));
    }
  } else if (scenario.type === "deployment-regression") {
    scenario.targetNodeIds.forEach(id => {
      const node = byId.get(id); if (!node) return;
      const protectedRelease = Boolean(node.configuration.healthChecksEnabled && node.configuration.rollbackEnabled && node.configuration.deploymentStrategy !== "all-at-once");
      change(id, protectedRelease ? "degraded" : "failed", protectedRelease ? `${node.name} rolled back after failing health checks.` : `${node.name} failed after an unhealthy release.`);
    });
  } else if (scenario.type === "database-outage") {
    scenario.targetNodeIds.forEach(id => {
      const node = byId.get(id); if (!node) return;
      change(id, "failed", `${node.name} failed.`);
      const replica = databases().find(candidate => candidate.id !== node.id && candidate.zoneId !== node.zoneId && architecture.edges.some(edge => edge.source === node.id && edge.target === candidate.id && edge.type === "replication"));
      if (replica) log(replica, `${replica.name} detected as a standby replica.`);
      if (!node.configuration.failoverEnabled) log(node, "Automatic failover not configured.");
      const applicationEndpointReady = webApps().some(app => app.configuration.failoverEndpointEnabled);
      if (!applicationEndpointReady) log(node, "No writable failover endpoint is available to applications.");
      if (replica && node.configuration.failoverEnabled && applicationEndpointReady) {
        log(replica, `${replica.name} is eligible for promotion.`);
      }
    });
  } else {
    scenario.targetNodeIds.forEach(id => { const node = byId.get(id); if (node) change(id, "failed", `${node.name} became unavailable.`); });
  }

  // Evaluate direct dependants until stable. Healthy equivalents and reachable database replicas prevent false cascades.
  let changed = true;
  while (changed) {
    changed = false;
    for (const dependant of nodes) {
      if (dependant.type === "users" || dependant.status === "failed") continue;
      const dependencies = edgeFrom(dependant.id);
      const lostRequired = dependencies.filter(edge => edge.required && byId.get(edge.target)?.status === "failed");
      const lostOptional = dependencies.filter(edge => !edge.required && byId.get(edge.target)?.status === "failed");
      const unrecoverable = lostRequired.filter(edge => {
        const dependency = byId.get(edge.target)!;
        if (healthyEquivalent(dependant, dependency)) {
          log(dependant, `${dependant.name} rerouted around the failed ${dependency.name}.`); return false;
        }
        if (dependency.type === "database" && canFailOver(dependant, dependency)) {
          if (!promotedDatabases.has(dependency.id)) {
            promotedDatabases.add(dependency.id);
            const replica = databases().find(candidate => candidate.id !== dependency.id && candidate.zoneId !== dependency.zoneId && candidate.status !== "failed")!;
            log(replica, "Failure detected by monitoring automation.");
            log(replica, `${replica.name} promoted to writable primary.`);
            log(replica, "Database endpoint updated to the promoted standby.");
          }
          log(dependant, `${dependant.name} switched to the failover database endpoint; writes continue.`); return false;
        }
        if (dependency.type === "database") log(dependency, `No reachable writable replica is available for ${dependant.name}.`);
        return true;
      });
      if (unrecoverable.length) changed ||= change(dependant.id, "failed", `${dependant.name} lost a required dependency.`);
      else if (lostOptional.length && dependant.status === "healthy") changed ||= change(dependant.id, "degraded", `${dependant.name} lost an optional dependency.`);
    }
  }

  const users = nodes.filter(node => node.type === "users");
  const reachable = new Set<string>(users.map(node => node.id));
  const queue = [...reachable];
  while (queue.length) edgeFrom(queue.shift()!).forEach(edge => {
    const target = byId.get(edge.target);
    if (target && target.status !== "failed" && !reachable.has(target.id)) { reachable.add(target.id); queue.push(target.id); }
  });
  const normalDemand = Math.max(1, ...webApps().map(node => node.configuration.capacity));
  const demandCapacity = scenario.type === "traffic-spike" ? normalDemand * Number(scenario.parameters?.trafficMultiplier ?? 5) : normalDemand;
  const reachableApps = webApps().filter(node => reachable.has(node.id));
  const healthyCapacity = reachableApps.filter(node => node.status === "healthy").reduce((total, node) => total + node.configuration.capacity, 0);
  const degradedCapacity = reachableApps.filter(node => node.status === "degraded").reduce((total, node) => total + node.configuration.capacity * .5, 0);
  const servedCapacity = healthyCapacity + degradedCapacity;
  const customerAvailability = clamp(servedCapacity / demandCapacity * 100);
  const healthyCustomerPathCount = reachableApps.filter(node => node.status === "healthy").length;
  if (customerAvailability === 0 && users[0]) log(users[0], "No healthy customer request path.");
  const headroom = Math.round(servedCapacity / demandCapacity * 100 - 100);
  const latencyBand = customerAvailability === 0 ? "unavailable" : customerAvailability < 70 ? "severe" : customerAvailability < 100 || degradedCapacity > 0 ? "elevated" : "normal";
  const failed = nodes.filter(node => node.status === "failed"); const degraded = nodes.filter(node => node.status === "degraded");
  const impact = (node: ArchitectureNode): SimulationComponentImpact => ({ id: node.id, name: node.name, status: node.status, exposure: exposed.get(node.id) });
  const failedComponents = failed.map(impact); const degradedComponents = degraded.map(impact);
  const exposedComponents = nodes.filter(node => exposed.has(node.id)).map(impact);
  const protectedComponents = nodes.filter(node => node.status === "healthy" && (node.configuration.redundant || node.configuration.monitoringEnabled || node.configuration.encrypted)).map(impact);
  const affectedComponents = nodes.filter(node => affected.has(node.id) || exposed.has(node.id)).map(impact);
  const recovery = Math.max(0, ...affectedComponents.map(component => byId.get(component.id)?.configuration.recoveryTimeMinutes ?? 0));
  const failedDatabases = failed.filter(node => node.type === "database");
  const dataLossRisk = scenario.type === "credential-compromise" ? (exposedComponents.some(component => byId.get(component.id)?.type === "database") ? "high" : "medium") : failedDatabases.length ? (failedDatabases.some(database => !hasReachableReplica(database)) ? "critical" : "low") : "none";
  const architecturePosture = calculateArchitecturePosture(architecture);
  const writableDatabaseRequired = architecture.edges.some(edge => edge.required && nodes.find(node => node.id === edge.target)?.type === "database");
  const writableDatabaseAvailable = !writableDatabaseRequired || failedDatabases.length === 0 || promotedDatabases.size > 0;
  const automatedRecoveryStarted = events.some(event => /promoted|rolled back|rerouted|endpoint updated/i.test(event.message));
  const failoverOrRollbackSucceeded = events.some(event => /promoted|rolled back|switched to the failover database endpoint/i.test(event.message));
  const detectionEvent = events.find(event => /detected|monitoring|alert/i.test(event.message));
  const { scores: livePillars, explanations } = calculateLiveIncidentScores({
    architecturePosture,
    customerAvailability,
    demandCapacity,
    healthyCapacity,
    degradedCapacity,
    healthyCustomerPathCount,
    writableDatabaseRequired,
    writableDatabaseAvailable,
    latencyBand,
    detectionTimeSeconds: detectionEvent?.time ?? (architecture.nodes.some(node => node.type === "monitoring") ? 3 : null),
    automatedRecoveryStarted,
    recoverySucceeded: customerAvailability > 0,
    failoverOrRollbackSucceeded,
    recoveryMinutes: recovery,
    dataLossRisk,
    exposureCount: exposedComponents.length,
    isCredentialIncident: scenario.type === "credential-compromise"
  });
  const costBefore = architecture.nodes.reduce((total, node) => total + node.configuration.monthlyCostUnits, 0);
  const estimatedBusinessImpactUnits = Math.round((100 - customerAvailability) / 100 * demandCapacity * Math.max(1, recovery) * 2);
  const failedRequestPaths = failedComponents.filter(component => ["web-app", "load-balancer", "database"].includes(byId.get(component.id)?.type ?? "")).map(component => component.name);
  const impactSeverity: SimulationResult["impactSeverity"] = customerAvailability < 25 || dataLossRisk === "critical" ? "critical" : customerAvailability < 70 || dataLossRisk === "high" ? "high" : affectedComponents.length || exposedComponents.length ? "medium" : "low";
  const rootCauses: Record<FailureScenario["type"], string> = { "instance-failure": "An application compute instance became unavailable.", "database-outage": "The primary database stopped accepting connections.", "traffic-spike": "Incoming demand exceeded configured application capacity.", "zone-outage": "An availability zone became unavailable.", "credential-compromise": "Application credentials were exposed and required containment.", "deployment-regression": "A release introduced unhealthy application behavior." };
  const result: SimulationResult = {
    scenario, events, affectedNodes: [...affected], affectedComponents, failedComponents, degradedComponents, exposedComponents, impactSeverity,
    customerImpact: customerAvailability === 0 ? "No healthy customer request path remains." : customerAvailability < 100 ? `${100 - customerAvailability}% of customer demand is unserved.` : promotedDatabases.size ? "Database failover succeeded; customer demand remains fully served." : "Customer demand remains fully served.",
    rootCause: rootCauses[scenario.type], customerAvailability, estimatedRecoveryMinutes: recovery, dataLossRisk,
    engineVersion: SIMULATION_ENGINE_VERSION, pillarScoresBefore: architecturePosture, pillarScoresAfter: livePillars, architecturePosture,
    liveIncident: { demandCapacity, healthyCapacity, degradedCapacity, demandServedPercent: customerAvailability, healthyCustomerPathCount, capacityHeadroomPercent: headroom, latencyBand, failedRequestPaths, protectedComponents, estimatedBusinessImpactUnits, pillarScores: livePillars, pillarExplanations: explanations },
    scoreExplanations: explanations, costBefore, costAfter: costBefore, costDelta: 0, recommendations: []
  };
  result.recommendations = generateRecommendations(architecture, result);
  return result;
};
