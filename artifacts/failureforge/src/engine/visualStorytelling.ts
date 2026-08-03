import { Architecture, ArchitectureEdge, ArchitectureNode, ComponentType, NodeStatus } from "../types/architecture";
import { SimulationEvent, SimulationResult } from "../types/simulation";

export type DesignerMode = "edit" | "simulate" | "present";
export type NodePresentationMode = "design" | "simulation" | "comparison";
export type OperationalVisualState = NodeStatus | "protected";
export type EdgeOperationalState = "healthy" | "broken" | "degraded" | "async" | "replication" | "backup" | "monitoring" | "failover";

export interface NodeStory {
  presentationMode: NodePresentationMode;
  visualState: OperationalVisualState;
  reasonChip?: string;
  role: string;
  subtitle: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  controlSummary: string[];
  riskStatement: string;
  impactCount: number;
}

const titleIncludes = (node: ArchitectureNode, value: string) => node.name.toLowerCase().includes(value);

export const getNodePresentationMode = (
  designerMode: DesignerMode,
  simulationState: "idle" | "running" | "complete",
  comparisonResult: SimulationResult | null
): NodePresentationMode => {
  if (comparisonResult && simulationState === "complete") return "comparison";
  if (designerMode === "present" || simulationState !== "idle") return "simulation";
  return "design";
};

export const getNodeRole = (node: ArchitectureNode, architecture: Architecture): string => {
  if (node.type === "users") return "Customer traffic";
  if (node.type === "load-balancer") return "Public gateway";
  if (node.type === "web-app") return titleIncludes(node, "worker") ? "Worker" : "Checkout API";
  if (node.type === "cache") return "Read accelerator";
  if (node.type === "queue") return "Async buffer";
  if (node.type === "object-storage") return "Durable object store";
  if (node.type === "backup") return "Recovery only";
  if (node.type === "monitoring") return "Detection";

  const hasReplicaTarget = architecture.edges.some(edge => edge.source === node.id && edge.type === "replication");
  const hasReplicaSource = architecture.edges.some(edge => edge.target === node.id && edge.type === "replication");
  if (hasReplicaTarget || titleIncludes(node, "primary")) return "Writer";
  if (hasReplicaSource || titleIncludes(node, "replica") || titleIncludes(node, "standby")) return "Standby";
  return "Data store";
};

const subtitleByType: Record<ComponentType, string> = {
  users: "Active shoppers",
  "web-app": "EC2 - checkout service",
  "load-balancer": "Public traffic router",
  database: "PostgreSQL",
  cache: "Redis cache",
  "object-storage": "Object storage",
  queue: "Order events",
  backup: "Recovery vault",
  monitoring: "Observability"
};

export const getReasonChip = (
  node: ArchitectureNode,
  architecture: Architecture,
  events: SimulationEvent[],
  result: SimulationResult | null
): string | undefined => {
  const event = [...events].reverse().find(item => item.affectedNodeId === node.id);
  const isTarget = result?.scenario.targetNodeIds.includes(node.id);
  const wasProtected = result?.liveIncident.protectedComponents.some(component => component.id === node.id);
  const hasPromotion = result?.events.some(item => item.message.toLowerCase().includes("replica promoted"));

  if (isTarget && node.status === "failed") return "Initiating failure";
  if (wasProtected || (node.type === "database" && hasPromotion && node.status !== "failed" && getNodeRole(node, architecture) === "Standby")) return "Protected by failover";
  if (event?.message.toLowerCase().includes("dependency")) return "Required dependency lost";
  if (event?.message.toLowerCase().includes("no reachable writable")) return "No writable alternative";
  if (node.type === "database" && getNodeRole(node, architecture) === "Standby" && result?.scenario.type === "database-outage" && !architecture.nodes.find(item => result.scenario.targetNodeIds.includes(item.id))?.configuration.failoverEnabled) return "Failover not enabled";
  if (node.type === "backup" && result?.scenario.type === "database-outage") return "Recovery only";
  if (node.type === "monitoring" && result?.events.some(item => item.message.toLowerCase().includes("detect"))) return "Detected failure";
  if (node.status === "degraded") return "Capacity reduced";
  if (node.status === "recovering") return "Recovering";
  return undefined;
};

export const getVisualState = (
  node: ArchitectureNode,
  architecture: Architecture,
  events: SimulationEvent[],
  result: SimulationResult | null
): OperationalVisualState => {
  const chip = getReasonChip(node, architecture, events, result);
  if (chip === "Protected by failover" || chip === "Traffic rerouted") return "protected";
  return node.status;
};

const getImpactCount = (node: ArchitectureNode, architecture: Architecture, result: SimulationResult | null) => {
  const directDependants = architecture.edges.filter(edge => edge.target === node.id).length;
  const failedDependants = result?.affectedNodes.filter(id => architecture.edges.some(edge => edge.source === id && edge.target === node.id)).length ?? 0;
  return Math.max(directDependants, failedDependants);
};

export const getNodeStory = (
  node: ArchitectureNode,
  architecture: Architecture,
  events: SimulationEvent[],
  result: SimulationResult | null,
  designerMode: DesignerMode,
  simulationState: "idle" | "running" | "complete",
  comparisonResult: SimulationResult | null
): NodeStory => {
  const presentationMode = getNodePresentationMode(designerMode, simulationState, comparisonResult);
  const role = getNodeRole(node, architecture);
  const impactCount = getImpactCount(node, architecture, result);
  const visualState = getVisualState(node, architecture, events, result);
  const availability = node.status === "failed" ? 0 : node.status === "degraded" ? 50 : 100;
  const capacity = node.status === "failed" ? 0 : node.status === "degraded" ? Math.round(node.configuration.capacity / 2) : node.configuration.capacity;
  const controls = [
    node.configuration.encrypted ? "Encrypted" : "Unencrypted",
    node.configuration.monitoringEnabled ? "Monitored" : "Unmonitored",
    node.configuration.redundant ? "Redundant" : "Single path"
  ];

  const story: NodeStory = {
    presentationMode,
    visualState,
    reasonChip: getReasonChip(node, architecture, events, result),
    role,
    subtitle: subtitleByType[node.type],
    primaryMetricLabel: "Availability",
    primaryMetricValue: `${availability}%`,
    secondaryMetricLabel: "Connections",
    secondaryMetricValue: `${impactCount} affected`,
    controlSummary: controls,
    riskStatement: node.configuration.redundant ? "Redundancy absorbs common failures" : "Single operational path",
    impactCount
  };

  if (presentationMode === "comparison" && comparisonResult && result) {
    story.primaryMetricLabel = "Before";
    story.primaryMetricValue = `${comparisonResult.customerAvailability}%`;
    story.secondaryMetricLabel = "After";
    story.secondaryMetricValue = `${result.customerAvailability}%`;
    story.riskStatement = result.customerAvailability > comparisonResult.customerAvailability ? "Resilience upgrade changed the outcome" : "No material recovery improvement";
    return story;
  }

  if (node.type === "load-balancer") {
    const targets = architecture.edges.filter(edge => edge.source === node.id).map(edge => architecture.nodes.find(item => item.id === edge.target)).filter(Boolean) as ArchitectureNode[];
    const healthyTargets = targets.filter(target => target.status !== "failed").length;
    story.primaryMetricLabel = "Healthy targets";
    story.primaryMetricValue = `${healthyTargets} / ${Math.max(targets.length, 1)}`;
    story.secondaryMetricLabel = "Traffic served";
    story.secondaryMetricValue = result ? `${result.customerAvailability}%` : "Ready";
    story.riskStatement = healthyTargets === 0 ? "No healthy checkout target" : node.configuration.redundant ? "Cross-zone routing enabled" : "Routing has limited redundancy";
  } else if (node.type === "web-app") {
    story.primaryMetricLabel = "Capacity";
    story.primaryMetricValue = `${capacity} / ${node.configuration.capacity}`;
    story.secondaryMetricLabel = "DB endpoint";
    story.secondaryMetricValue = node.configuration.failoverEndpointEnabled ? "Resolvable" : "Primary only";
    story.riskStatement = node.status === "failed" ? "Required database unavailable" : node.configuration.failoverEndpointEnabled ? "Can resolve standby endpoint" : "No writable standby endpoint";
  } else if (node.type === "database") {
    story.primaryMetricLabel = role === "Standby" ? "Promotion" : "Writes";
    story.primaryMetricValue = role === "Standby" ? (node.configuration.failoverEnabled || story.reasonChip === "Protected by failover" ? "Eligible" : "Manual") : node.status === "failed" ? "Unavailable" : "Available";
    story.secondaryMetricLabel = "Replica lag";
    story.secondaryMetricValue = role === "Standby" ? "4.2 sec" : node.configuration.failoverEnabled ? "< 5 sec" : "Unknown";
    story.riskStatement = node.status === "failed" ? "No reachable writable replica" : node.configuration.failoverEnabled ? "Automatic promotion configured" : "Failover not configured";
  } else if (node.type === "cache") {
    story.primaryMetricLabel = "Hit rate";
    story.primaryMetricValue = node.status === "failed" ? "0%" : "82%";
    story.secondaryMetricLabel = "Stale reads";
    story.secondaryMetricValue = node.configuration.redundant ? "Allowed" : "Limited";
    story.riskStatement = "Protects reads, not checkout writes";
  } else if (node.type === "queue") {
    story.primaryMetricLabel = "Queued";
    story.primaryMetricValue = result && result.customerAvailability < 50 ? "+380" : "+24";
    story.secondaryMetricLabel = "Throughput";
    story.secondaryMetricValue = node.status === "failed" ? "Stopped" : "Healthy";
    story.riskStatement = "Buffers async work only";
  } else if (node.type === "object-storage") {
    story.primaryMetricLabel = "Availability";
    story.primaryMetricValue = `${availability}%`;
    story.secondaryMetricLabel = "Exposure";
    story.secondaryMetricValue = node.configuration.publiclyAccessible ? "Public" : "Private";
    story.riskStatement = node.configuration.encrypted ? "Durability controls active" : "Storage is not encrypted";
  } else if (node.type === "backup") {
    story.primaryMetricLabel = "RPO";
    story.primaryMetricValue = "15 min";
    story.secondaryMetricLabel = "Restore test";
    story.secondaryMetricValue = node.configuration.monitoringEnabled ? "Recent" : "Manual";
    story.riskStatement = "Recovery only, not live failover";
  } else if (node.type === "monitoring") {
    story.primaryMetricLabel = "Detection";
    story.primaryMetricValue = node.status === "failed" ? "Offline" : "3 sec";
    story.secondaryMetricLabel = "Automation";
    story.secondaryMetricValue = node.configuration.rollbackEnabled || node.configuration.failoverEnabled ? "Enabled" : "Manual";
    story.riskStatement = "Detects failures, does not serve traffic";
  } else if (node.type === "users") {
    story.primaryMetricLabel = "Checkout";
    story.primaryMetricValue = result ? `${result.customerAvailability}%` : "Ready";
    story.secondaryMetricLabel = "Active users";
    story.secondaryMetricValue = "12,000";
    story.riskStatement = result && result.customerAvailability < 25 ? "No healthy customer path" : "Traffic source";
  }

  return story;
};

export const getEdgeOperationalState = (
  edge: ArchitectureEdge,
  architecture: Architecture,
  result: SimulationResult | null
): EdgeOperationalState => {
  const source = architecture.nodes.find(node => node.id === edge.source);
  const target = architecture.nodes.find(node => node.id === edge.target);
  const hasPromotion = result?.events.some(event => event.message.toLowerCase().includes("replica promoted")) ?? false;

  if (edge.type === "replication" && hasPromotion && target?.status !== "failed") return "failover";
  if (edge.type === "replication") return "replication";
  if (edge.type === "backup") return "backup";
  if (edge.type === "monitoring") return "monitoring";
  if (edge.type === "asynchronous") return source?.status === "failed" || target?.status === "failed" ? "degraded" : "async";
  if (edge.required && (source?.status === "failed" || target?.status === "failed")) return "broken";
  if (!edge.required && (source?.status === "failed" || target?.status === "failed")) return "degraded";
  return "healthy";
};
