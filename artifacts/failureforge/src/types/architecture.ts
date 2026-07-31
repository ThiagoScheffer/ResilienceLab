export type ComponentType = "web-app" | "load-balancer" | "database" | "cache" | "object-storage" | "queue" | "backup" | "monitoring" | "users";
export type NodeStatus = "healthy" | "degraded" | "failed" | "recovering";
export type DependencyType = "synchronous" | "asynchronous" | "replication" | "monitoring" | "backup";
export type FailureType = "instance-failure" | "database-outage" | "traffic-spike" | "zone-outage" | "credential-compromise" | "deployment-regression";
export type Pillar = "operational-excellence" | "security" | "reliability" | "performance" | "cost" | "sustainability";

export interface NodeConfiguration {
  capacity: number;
  redundant: boolean;
  autoscaling: boolean;
  encrypted: boolean;
  publiclyAccessible: boolean;
  backupsEnabled: boolean;
  monitoringEnabled: boolean;
  credentialProtected?: boolean;
  healthChecksEnabled?: boolean;
  failoverEnabled?: boolean;
  failoverEndpointEnabled?: boolean;
  deploymentStrategy?: "all-at-once" | "rolling" | "blue-green";
  rollbackEnabled?: boolean;
  recoveryTimeMinutes: number;
  monthlyCostUnits: number;
}

export interface ArchitectureNode {
  id: string;
  type: ComponentType;
  name: string;
  zoneId: string; // "az-a" | "az-b" | "global"
  position: { x: number; y: number };
  status: NodeStatus;
  configuration: NodeConfiguration;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  required: boolean; // critical vs optional dependency
}

export interface AvailabilityZone {
  id: string;
  name: string; // "AZ-A", "AZ-B"
  color: string;
}

export interface Architecture {
  id: string;
  name: string;
  region: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  zones: AvailabilityZone[];
  createdAt?: string;
  updatedAt?: string;
}
