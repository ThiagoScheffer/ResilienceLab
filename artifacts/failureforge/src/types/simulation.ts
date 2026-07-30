import { ArchitectureNode, ComponentType, FailureType, NodeConfiguration, Pillar } from "./architecture";

export interface ScenarioParameters {
  trafficMultiplier?: number;
  targetZoneId?: string;
}

export interface FailureScenario {
  id: string;
  type: FailureType;
  name: string;
  description: string;
  targetNodeIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  parameters?: ScenarioParameters;
}

export interface SimulationEvent {
  time: number; // seconds offset
  message: string;
  affectedNodeId: string;
  newStatus: ArchitectureNode['status'];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  affectedPillars: Pillar[];
  estimatedScoreImpact: Partial<Record<Pillar, number>>;
  estimatedCapacityGain?: number;
  estimatedMonthlyCostDelta?: number;
  estimatedOutageLossReduction?: number;
  action: RecommendationAction;
}

export type RecommendationAction =
  | { type: "add-node"; componentType: ComponentType; zoneId?: string; configurationPreset?: Partial<NodeConfiguration>; connectTo?: Array<{ nodeId: string; direction: "from" | "to"; dependencyType?: "synchronous" | "asynchronous" | "replication" | "monitoring" | "backup"; required?: boolean }> }
  | { type: "update-config"; nodeId: string | "all"; changes: Partial<NodeConfiguration> }
  | { type: "apply-architecture"; name: string; nodes: Array<Omit<ArchitectureNode, "id" | "status"> & { id?: string }>; edges: Array<{ source: string; target: string; type: "synchronous" | "asynchronous" | "replication" | "monitoring" | "backup"; required: boolean }>; zones?: Array<{ id: string; name: string; color: string }> };

export interface ValidationIssue {
  id: string;
  severity: "error" | "warning";
  message: string;
  nodeIds?: string[];
}

export interface ScoreExplanation {
  pillar: Pillar;
  delta: number;
  reason: string;
}

export interface SimulationComponentImpact {
  id: string;
  name: string;
  status: ArchitectureNode["status"];
  exposure?: "none" | "low" | "medium" | "high" | "critical";
}

export interface LiveIncidentImpact {
  demandCapacity: number;
  healthyCapacity: number;
  degradedCapacity: number;
  capacityHeadroomPercent: number;
  latencyBand: "normal" | "elevated" | "severe" | "unavailable";
  failedRequestPaths: string[];
  protectedComponents: SimulationComponentImpact[];
  estimatedBusinessImpactUnits: number;
  pillarScores: Record<Pillar, number>;
  pillarExplanations: ScoreExplanation[];
}

export interface SimulationResult {
  scenario: FailureScenario;
  events: SimulationEvent[];
  affectedNodes: string[];
  affectedComponents: SimulationComponentImpact[];
  failedComponents: SimulationComponentImpact[];
  degradedComponents: SimulationComponentImpact[];
  exposedComponents: SimulationComponentImpact[];
  impactSeverity: "low" | "medium" | "high" | "critical";
  customerImpact: string;
  rootCause: string;
  customerAvailability: number; // 0-100%
  estimatedRecoveryMinutes: number;
  dataLossRisk: "none" | "low" | "medium" | "high" | "critical";
  pillarScoresBefore: Record<Pillar, number>;
  pillarScoresAfter: Record<Pillar, number>;
  architecturePosture: Record<Pillar, number>;
  liveIncident: LiveIncidentImpact;
  scoreExplanations: ScoreExplanation[];
  costBefore: number;
  costAfter: number;
  costDelta: number;
  recommendations: Recommendation[];
}
