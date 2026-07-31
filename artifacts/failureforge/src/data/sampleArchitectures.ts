import { Architecture } from "../types/architecture";

export const sampleFragileStartup: Architecture = {
  id: "fragile-startup",
  name: "Fragile Startup",
  region: "us-east-1",
  zones: [
    { id: "global", name: "Global", color: "#233349" },
    { id: "az-a", name: "AZ-A", color: "#121F30" }
  ],
  nodes: [
    {
      id: "node-users",
      type: "users",
      name: "Users",
      zoneId: "global",
      position: { x: 100, y: 150 },
      status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: false, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 0, monthlyCostUnits: 0 }
    },
    {
      id: "node-webapp-1",
      type: "web-app",
      name: "API Server",
      zoneId: "az-a",
      position: { x: 350, y: 150 },
      status: "healthy",
      configuration: { capacity: 5, redundant: false, autoscaling: false, encrypted: true, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 30, monthlyCostUnits: 50 }
    },
    {
      id: "node-db-1",
      type: "database",
      name: "Primary DB",
      zoneId: "az-a",
      position: { x: 600, y: 150 },
      status: "healthy",
      configuration: { capacity: 5, redundant: false, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 120, monthlyCostUnits: 100 }
    }
  ],
  edges: [
    { id: "e1", source: "node-users", target: "node-webapp-1", type: "synchronous", required: true },
    { id: "e2", source: "node-webapp-1", target: "node-db-1", type: "synchronous", required: true }
  ]
};

export const sampleResilientEcommerce: Architecture = {
  id: "resilient-ecommerce",
  name: "Resilient E-Commerce",
  region: "us-west-2",
  zones: [
    { id: "global", name: "Global", color: "#233349" },
    { id: "az-a", name: "AZ-A", color: "#121F30" },
    { id: "az-b", name: "AZ-B", color: "#121F30" }
  ],
  nodes: [
    {
      id: "node-users", type: "users", name: "Users", zoneId: "global", position: { x: 50, y: 300 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: false, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 0, monthlyCostUnits: 0 }
    },
    {
      id: "node-lb", type: "load-balancer", name: "Load Balancer", zoneId: "global", position: { x: 250, y: 300 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 30 }
    },
    {
      id: "node-app-a", type: "web-app", name: "Web App A", zoneId: "az-a", position: { x: 500, y: 200 }, status: "healthy",
      configuration: { capacity: 8, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, failoverEndpointEnabled: true, recoveryTimeMinutes: 10, monthlyCostUnits: 60 }
    },
    {
      id: "node-app-b", type: "web-app", name: "Web App B", zoneId: "az-b", position: { x: 500, y: 400 }, status: "healthy",
      configuration: { capacity: 8, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, failoverEndpointEnabled: true, recoveryTimeMinutes: 10, monthlyCostUnits: 60 }
    },
    {
      id: "node-cache", type: "cache", name: "Redis Cache", zoneId: "az-a", position: { x: 750, y: 200 }, status: "healthy",
      configuration: { capacity: 6, redundant: false, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 15, monthlyCostUnits: 40 }
    },
    {
      id: "node-queue", type: "queue", name: "Task Queue", zoneId: "az-a", position: { x: 750, y: 300 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 20 }
    },
    {
      id: "node-db-primary", type: "database", name: "Primary DB", zoneId: "az-a", position: { x: 1000, y: 250 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: true, monitoringEnabled: true, failoverEnabled: true, recoveryTimeMinutes: 30, monthlyCostUnits: 150 }
    },
    {
      id: "node-db-replica", type: "database", name: "Standby Replica", zoneId: "az-b", position: { x: 1000, y: 400 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 15, monthlyCostUnits: 120 }
    },
    {
      id: "node-backup", type: "backup", name: "Vault", zoneId: "global", position: { x: 1250, y: 250 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 60, monthlyCostUnits: 30 }
    },
    {
      id: "node-monitoring", type: "monitoring", name: "Datadog", zoneId: "global", position: { x: 250, y: 100 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 5, monthlyCostUnits: 40 }
    }
  ],
  edges: [
    { id: "e1", source: "node-users", target: "node-lb", type: "synchronous", required: true },
    { id: "e2", source: "node-lb", target: "node-app-a", type: "synchronous", required: true },
    { id: "e3", source: "node-lb", target: "node-app-b", type: "synchronous", required: true },
    { id: "e4", source: "node-app-a", target: "node-cache", type: "synchronous", required: false },
    { id: "e5", source: "node-app-b", target: "node-cache", type: "synchronous", required: false },
    { id: "e6", source: "node-app-a", target: "node-queue", type: "asynchronous", required: false },
    { id: "e7", source: "node-app-b", target: "node-queue", type: "asynchronous", required: false },
    { id: "e8", source: "node-app-a", target: "node-db-primary", type: "synchronous", required: true },
    { id: "e9", source: "node-app-b", target: "node-db-primary", type: "synchronous", required: true },
    { id: "e10", source: "node-queue", target: "node-db-primary", type: "asynchronous", required: true },
    { id: "e11", source: "node-db-primary", target: "node-db-replica", type: "replication", required: false },
    { id: "e12", source: "node-db-primary", target: "node-backup", type: "backup", required: false },
    { id: "e13", source: "node-app-a", target: "node-monitoring", type: "monitoring", required: false },
    { id: "e14", source: "node-db-primary", target: "node-monitoring", type: "monitoring", required: false }
  ]
};

export const sampleEventDriven: Architecture = {
  id: "event-driven",
  name: "Event-Driven Platform",
  region: "eu-central-1",
  zones: [
    { id: "global", name: "Global", color: "#233349" },
    { id: "az-a", name: "AZ-A", color: "#121F30" }
  ],
  nodes: [
    {
      id: "node-users", type: "users", name: "Users", zoneId: "global", position: { x: 100, y: 200 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: false, encrypted: false, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: false, recoveryTimeMinutes: 0, monthlyCostUnits: 0 }
    },
    {
      id: "node-gateway", type: "web-app", name: "API Gateway", zoneId: "az-a", position: { x: 300, y: 200 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 80 }
    },
    {
      id: "node-bus", type: "queue", name: "Event Bus", zoneId: "az-a", position: { x: 550, y: 200 }, status: "healthy",
      configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: true, monitoringEnabled: true, recoveryTimeMinutes: 10, monthlyCostUnits: 120 }
    },
    {
      id: "node-worker1", type: "web-app", name: "Order Worker", zoneId: "az-a", position: { x: 800, y: 100 }, status: "healthy",
      configuration: { capacity: 5, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 10, monthlyCostUnits: 40 }
    },
    {
      id: "node-worker2", type: "web-app", name: "Invoice Worker", zoneId: "az-a", position: { x: 800, y: 300 }, status: "healthy",
      configuration: { capacity: 5, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 10, monthlyCostUnits: 40 }
    },
    {
      id: "node-db1", type: "database", name: "Order DB", zoneId: "az-a", position: { x: 1050, y: 100 }, status: "healthy",
      configuration: { capacity: 5, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: true, monitoringEnabled: true, recoveryTimeMinutes: 30, monthlyCostUnits: 90 }
    },
    {
      id: "node-db2", type: "database", name: "Invoice DB", zoneId: "az-a", position: { x: 1050, y: 300 }, status: "healthy",
      configuration: { capacity: 5, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: true, monitoringEnabled: true, recoveryTimeMinutes: 30, monthlyCostUnits: 90 }
    }
  ],
  edges: [
    { id: "e1", source: "node-users", target: "node-gateway", type: "synchronous", required: true },
    { id: "e2", source: "node-gateway", target: "node-bus", type: "asynchronous", required: true },
    { id: "e3", source: "node-bus", target: "node-worker1", type: "asynchronous", required: true },
    { id: "e4", source: "node-bus", target: "node-worker2", type: "asynchronous", required: true },
    { id: "e5", source: "node-worker1", target: "node-db1", type: "synchronous", required: true },
    { id: "e6", source: "node-worker2", target: "node-db2", type: "synchronous", required: true }
  ]
};

export const sampleArchitectures = [
  sampleFragileStartup,
  sampleResilientEcommerce,
  sampleEventDriven
];
