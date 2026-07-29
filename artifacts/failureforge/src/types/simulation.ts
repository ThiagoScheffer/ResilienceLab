import { ArchitectureNode, ComponentType, FailureType, Pillar } from "./architecture";

export interface FailureScenario {
  id: string;
  type: FailureType;
  name: string;
  description: string;
  targetNodeIds: string[];
  severity: "low" | "medium" | "high" | "critical";
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
  action: { type: "add-node"; componentType: ComponentType; zoneId?: string } | { type: "update-config"; nodeId: string; changes: object };
}

export interface SimulationResult {
  scenario: FailureScenario;
  events: SimulationEvent[];
  affectedNodes: string[];
  customerAvailability: number; // 0-100%
  estimatedRecoveryMinutes: number;
  dataLossRisk: "none" | "low" | "medium" | "high" | "critical";
  pillarScoresBefore: Record<Pillar, number>;
  pillarScoresAfter: Record<Pillar, number>;
  recommendations: Recommendation[];
}
