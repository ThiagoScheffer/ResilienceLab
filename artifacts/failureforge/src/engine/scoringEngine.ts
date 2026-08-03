import { Architecture, Pillar } from "../types/architecture";
import type { ScoreExplanation, SimulationResult } from "../types/simulation";

export const getInitialPillarScores = (): Record<Pillar, number> => ({
  "reliability": 50,
  "security": 60,
  "operational-excellence": 50,
  "performance": 55,
  "cost": 65,
  "sustainability": 60,
});

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const calculateArchitecturePosture = (architecture: Architecture): Record<Pillar, number> => {
  const scores = getInitialPillarScores();
  
  const nodes = architecture.nodes;
  const edges = architecture.edges;

  const webApps = nodes.filter(n => n.type === "web-app");
  const databases = nodes.filter(n => n.type === "database");
  const hasCache = nodes.some(n => n.type === "cache");
  const hasQueue = nodes.some(n => n.type === "queue");
  const hasBackup = nodes.some(n => n.type === "backup");
  const hasMonitoring = nodes.some(n => n.type === "monitoring");
  const hasLoadBalancer = nodes.some(n => n.type === "load-balancer");

  const webAppZones = new Set(webApps.map(n => n.zoneId));
  const hasWebAppAcrossZones = webAppZones.size > 1;

  const hasDbReplica = databases.length > 1 && edges.some(e => 
    e.type === "replication" && 
    nodes.find(n => n.id === e.source)?.type === "database" &&
    nodes.find(n => n.id === e.target)?.type === "database"
  );

  const allEncrypted = nodes.filter(n => n.type !== "users").every(n => n.configuration.encrypted);
  const anyDbPublic = databases.some(n => n.configuration.publiclyAccessible);
  const anyUnencryptedStores = nodes.some(n => 
    (n.type === "database" || n.type === "object-storage" || n.type === "cache") && !n.configuration.encrypted
  );

  const anyWebAppAutoscaling = webApps.some(n => n.configuration.autoscaling);

  const backupCount = nodes.filter(n => n.type === "backup").length;
  
  // Reliability
  if (webApps.length > 1) scores["reliability"] += 10;
  if (hasWebAppAcrossZones) scores["reliability"] += 10;
  if (hasDbReplica) scores["reliability"] += 12;
  if (hasBackup) scores["reliability"] += 8;
  if (hasMonitoring) scores["reliability"] += 5;
  if (databases.length === 1 && !hasDbReplica) scores["reliability"] -= 15;
  if (webApps.length === 1) scores["reliability"] -= 10;
  
  // Simplified check for critical component in one zone
  if (databases.length > 0 && new Set(databases.map(d => d.zoneId)).size === 1) {
      scores["reliability"] -= 10;
  }

  // Security
  if (allEncrypted && nodes.length > 1) scores["security"] += 10;
  if (databases.length > 0 && !anyDbPublic) scores["security"] += 15;
  if (hasMonitoring) scores["security"] += 8;
  if (anyDbPublic) scores["security"] -= 30;
  if (anyUnencryptedStores) scores["security"] -= 25;
  if (!hasMonitoring && nodes.length > 1) scores["security"] -= 10;

  // Operational Excellence
  if (hasMonitoring) scores["operational-excellence"] += 15;
  if (hasBackup) scores["operational-excellence"] += 10;
  if (anyWebAppAutoscaling) scores["operational-excellence"] += 10;
  if (!hasMonitoring && nodes.length > 1) scores["operational-excellence"] -= 20;
  if (!hasBackup && databases.length > 0) scores["operational-excellence"] -= 15;

  // Performance
  if (hasCache) scores["performance"] += 15;
  if (hasQueue) scores["performance"] += 10;
  if (anyWebAppAutoscaling) scores["performance"] += 8;
  if (hasLoadBalancer) scores["performance"] += 5;
  if (!hasCache && databases.length > 0) scores["performance"] -= 10;
  if (webApps.length === 1) scores["performance"] -= 8;

  // Cost
  if (anyWebAppAutoscaling) scores["cost"] += 8;
  if (hasQueue) scores["cost"] += 5;
  if (backupCount > 2) scores["cost"] -= 5;
  if (hasMonitoring && !hasBackup) scores["cost"] -= 5;
  
  // Check over-redundancy same zone
  const countsByZoneAndType: Record<string, number> = {};
  nodes.forEach(n => {
    const key = `${n.zoneId}-${n.type}`;
    countsByZoneAndType[key] = (countsByZoneAndType[key] || 0) + 1;
  });
  if (Object.values(countsByZoneAndType).some(c => c >= 3)) {
    scores["cost"] -= 10;
    scores["sustainability"] -= 8;
  }

  // Sustainability
  if (anyWebAppAutoscaling) scores["sustainability"] += 10;
  if (hasCache) scores["sustainability"] += 8;
  if (webApps.length > 3 && !hasLoadBalancer) scores["sustainability"] -= 6;

  // Trade-offs explicitly defined
  if (hasDbReplica) {
    scores["performance"] += 4;
    scores["cost"] -= 8;
    scores["sustainability"] -= 4;
  }

  // Clamp 0-100
  (Object.keys(scores) as Pillar[]).forEach(k => {
    scores[k] = clampScore(scores[k]);
  });

  return scores;
};

export const calculateScores = calculateArchitecturePosture;

export interface LiveIncidentScoreInput {
  architecturePosture: Record<Pillar, number>;
  customerAvailability: number;
  demandCapacity: number;
  healthyCapacity: number;
  degradedCapacity: number;
  healthyCustomerPathCount: number;
  writableDatabaseRequired: boolean;
  writableDatabaseAvailable: boolean;
  latencyBand: "normal" | "elevated" | "severe" | "unavailable";
  detectionTimeSeconds: number | null;
  automatedRecoveryStarted: boolean;
  recoverySucceeded: boolean;
  failoverOrRollbackSucceeded: boolean;
  recoveryMinutes: number;
  dataLossRisk: SimulationResult["dataLossRisk"];
  exposureCount: number;
  isCredentialIncident: boolean;
}

export const calculateLiveIncidentScores = (input: LiveIncidentScoreInput): { scores: Record<Pillar, number>; explanations: ScoreExplanation[] } => {
  const servedDemandPercent = input.demandCapacity > 0
    ? clampScore(((input.healthyCapacity + input.degradedCapacity) / input.demandCapacity) * 100)
    : input.customerAvailability;
  const noHealthyCustomerPath = input.healthyCustomerPathCount === 0;
  const noWritableDatabasePath = input.writableDatabaseRequired && !input.writableDatabaseAvailable;

  let reliability = servedDemandPercent;
  if (input.customerAvailability === 0) reliability = 0;
  else if (noHealthyCustomerPath || noWritableDatabasePath) reliability = Math.min(reliability, 5);

  let performance = 0;
  if (servedDemandPercent > 0 && input.customerAvailability > 0) {
    const latencyPenalty = input.latencyBand === "normal" ? 0 : input.latencyBand === "elevated" ? 18 : input.latencyBand === "severe" ? 45 : 100;
    const degradedPenalty = input.degradedCapacity > 0 ? 10 : 0;
    const headroomPercent = input.demandCapacity > 0 ? ((input.healthyCapacity + input.degradedCapacity) / input.demandCapacity) * 100 - 100 : 0;
    const headroomPenalty = headroomPercent < 0 ? Math.min(35, Math.abs(headroomPercent)) : 0;
    performance = clampScore(servedDemandPercent - latencyPenalty - degradedPenalty - headroomPenalty);
  }

  const detectionTimeSeconds = input.detectionTimeSeconds;
  const detected = detectionTimeSeconds !== null;
  let operationalExcellence = 0;
  if (detected) operationalExcellence += detectionTimeSeconds <= 5 ? 30 : 20;
  if (input.automatedRecoveryStarted) operationalExcellence += 20;
  if (input.failoverOrRollbackSucceeded) operationalExcellence += 30;
  if (input.recoverySucceeded) operationalExcellence += 10;
  operationalExcellence -= Math.min(35, input.recoveryMinutes / 2);
  operationalExcellence = clampScore(operationalExcellence);
  if (input.customerAvailability === 0 && !input.automatedRecoveryStarted) operationalExcellence = Math.min(operationalExcellence, 35);

  const securityPenalty = input.isCredentialIncident ? input.exposureCount * 12 : 0;
  const scores: Record<Pillar, number> = {
    reliability,
    performance,
    "operational-excellence": operationalExcellence,
    security: clampScore(input.architecturePosture.security - securityPenalty),
    cost: input.architecturePosture.cost,
    sustainability: input.architecturePosture.sustainability
  };

  const explanations: ScoreExplanation[] = [
    {
      pillar: "reliability",
      delta: scores.reliability - input.architecturePosture.reliability,
      reason: noHealthyCustomerPath
        ? "No healthy customer request path remained after the incident."
        : noWritableDatabasePath
          ? "No writable database path remained for the customer workload."
          : `${servedDemandPercent}% of customer demand remains served.`
    },
    {
      pillar: "performance",
      delta: scores.performance - input.architecturePosture.performance,
      reason: scores.performance === 0
        ? "No customer workload is being served, so live performance is unavailable."
        : `Performance reflects served capacity, ${input.latencyBand} latency, and degraded capacity.`
    },
    {
      pillar: "operational-excellence",
      delta: scores["operational-excellence"] - input.architecturePosture["operational-excellence"],
      reason: input.customerAvailability === 0 && !input.automatedRecoveryStarted
        ? "The incident was detected, but no automated recovery path restored service."
        : input.failoverOrRollbackSucceeded
          ? "Automated recovery executed and restored the serving path."
          : "Operational score reflects detection, recovery progress, and recovery duration."
    },
    {
      pillar: "security",
      delta: scores.security - input.architecturePosture.security,
      reason: input.isCredentialIncident
        ? "Credential or data exposure reduced live security confidence."
        : "Encryption, network, and credential controls were unaffected by this availability incident."
    },
    { pillar: "cost", delta: 0, reason: "Cost Optimization remains an architecture posture value; incident loss is shown separately." },
    { pillar: "sustainability", delta: 0, reason: "Sustainability remains an architecture posture value for this incident." }
  ];

  return { scores, explanations };
};

export const getOverallHealth = (scores: Record<Pillar, number>): number => {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

export const getLiveIncidentHealth = (result: Pick<SimulationResult, "customerAvailability" | "customerImpact" | "liveIncident">): number => {
  const noHealthyCustomerPath = result.customerAvailability === 0 || result.customerImpact.toLowerCase().includes("no healthy customer request path");
  if (noHealthyCustomerPath) return 0;

  const scores = result.liveIncident.pillarScores;
  let health = Math.round(scores.reliability * 0.6 + scores.performance * 0.25 + scores["operational-excellence"] * 0.15);
  if (result.customerAvailability < 25) health = Math.min(health, 20);
  else if (result.customerAvailability < 50) health = Math.min(health, 40);
  else if (result.customerAvailability < 75) health = Math.min(health, 65);
  return clampScore(health);
};

export const getHealthLabel = (score: number) => {
  if (score >= 80) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
};

export const getIncidentHealthLabel = (score: number, availability: number) => {
  if (availability < 25 || score <= 20) return "Critical";
  if (availability < 50 || score <= 40) return "Severe";
  if (availability < 90 || score <= 69) return "Degraded";
  return "Contained";
};

export const getScoreSeverity = (score: number) => {
  if (score <= 20) return { label: "Critical", barClass: "bg-app-red", textClass: "text-app-red" };
  if (score <= 40) return { label: "Poor", barClass: "bg-orange-500", textClass: "text-orange-400" };
  if (score <= 69) return { label: "Degraded", barClass: "bg-app-amber", textClass: "text-app-amber" };
  if (score <= 84) return { label: "Good", barClass: "bg-app-green", textClass: "text-app-green" };
  return { label: "Excellent", barClass: "bg-emerald-300", textClass: "text-emerald-300" };
};
