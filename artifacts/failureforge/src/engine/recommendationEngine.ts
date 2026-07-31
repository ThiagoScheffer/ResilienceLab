import { Architecture } from "../types/architecture";
import { Recommendation, SimulationResult } from "../types/simulation";

export const generateRecommendations = (
  architecture: Architecture, 
  result: SimulationResult
): Recommendation[] => {
  const recommendations: Recommendation[] = [];
  const nodes = architecture.nodes;
  const edges = architecture.edges;

  const databases = nodes.filter(n => n.type === "database");
  const webApps = nodes.filter(n => n.type === "web-app");
  
  const hasDbReplica = databases.length > 1 && edges.some(e => e.type === "replication");
  const hasMonitoring = nodes.some(n => n.type === "monitoring");
  const hasBackup = nodes.some(n => n.type === "backup");
  const hasLoadBalancer = nodes.some(n => n.type === "load-balancer");
  const hasCache = nodes.some(n => n.type === "cache");
  const zonesUsed = new Set(nodes.filter(n => n.type !== "users").map(n => n.zoneId));

  if (result.scenario.type === "database-outage" && databases.length > 0 && (!databases[0].configuration.failoverEnabled || !webApps.some(app => app.configuration.failoverEndpointEnabled))) {
    recommendations.push({
      id: "rec-enable-db-failover-endpoint",
      title: "Enable application database failover",
      description: "Configure primary promotion and a shared database endpoint before relying on a standby replica.",
      priority: "critical",
      affectedPillars: ["reliability", "operational-excellence"],
      estimatedScoreImpact: { reliability: 14, "operational-excellence": 8 },
      estimatedOutageLossReduction: Math.round(result.liveIncident.estimatedBusinessImpactUnits * .6),
      action: { type: "update-config", nodeId: "all", changes: { failoverEnabled: true, failoverEndpointEnabled: true, monitoringEnabled: true } }
    });
  }

  if (result.scenario.type === "zone-outage") {
    const failedApps = result.failedComponents.filter(component => nodes.find(node => node.id === component.id)?.type === "web-app");
    if (failedApps.length) recommendations.push({
      id: "rec-cross-zone-capacity", title: "Reserve cross-zone application capacity", description: "Add a healthy target in a second availability zone and register it with the load balancer.", priority: "critical",
      affectedPillars: ["reliability", "performance", "cost", "sustainability"], estimatedScoreImpact: { reliability: 18, performance: 10, cost: -8, sustainability: -4 }, estimatedCapacityGain: failedApps.length * 5, estimatedMonthlyCostDelta: 50, estimatedOutageLossReduction: result.liveIncident.estimatedBusinessImpactUnits,
      action: { type: "add-node", componentType: "web-app", zoneId: "az-b", configurationPreset: { redundant: true, autoscaling: true, healthChecksEnabled: true, monthlyCostUnits: 50 }, connectTo: hasLoadBalancer ? [{ nodeId: nodes.find(node => node.type === "load-balancer")!.id, direction: "to", dependencyType: "synchronous", required: true }] : [] }
    });
    if (databases.length > 0 && !hasDbReplica) recommendations.push({
      id: "rec-multi-az-failover", title: "Enable multi-AZ database failover", description: "Create a standby replica in another zone and test the failover path.", priority: "critical", affectedPillars: ["reliability", "operational-excellence", "cost"], estimatedScoreImpact: { reliability: 16, "operational-excellence": 8, cost: -8 }, estimatedMonthlyCostDelta: 120, estimatedOutageLossReduction: Math.round(result.liveIncident.estimatedBusinessImpactUnits * .7),
      action: { type: "add-node", componentType: "database", zoneId: "az-b", configurationPreset: { redundant: true, failoverEnabled: true, monthlyCostUnits: 120 }, connectTo: [{ nodeId: databases[0].id, direction: "to", dependencyType: "replication", required: false }] }
    });
  }

  if (result.scenario.type === "traffic-spike" && !webApps.some(n => n.configuration.autoscaling)) {
    recommendations.push({
      id: "rec-enable-autoscaling",
      title: "Enable application autoscaling",
      description: "Scale application capacity automatically before burst traffic exhausts the running instances.",
      priority: "critical",
      affectedPillars: ["performance", "reliability", "cost"],
      estimatedScoreImpact: { performance: 12, reliability: 8, cost: 5 },
      action: {
        type: "update-config",
        nodeId: webApps[0]?.id ?? "all",
        changes: { autoscaling: true }
      }
    });
  }

  if (result.scenario.type === "credential-compromise") {
    const compromisedNode = nodes.find(n => result.scenario.targetNodeIds.includes(n.id));
    if (compromisedNode) {
      recommendations.push({
        id: "rec-rotate-credentials",
        title: "Rotate and restrict credentials",
        description: "Revoke the exposed secret, issue a least-privilege replacement, and monitor its use.",
        priority: "critical",
        affectedPillars: ["security", "operational-excellence"],
        estimatedScoreImpact: { security: 20, "operational-excellence": 8 },
        action: {
          type: "update-config",
          nodeId: compromisedNode.id,
          changes: { publiclyAccessible: false, monitoringEnabled: true }
        }
      });
    }
  }

  if (result.scenario.type === "deployment-regression" && webApps.length > 0) {
    recommendations.push({
      id: "rec-deployment-guardrails",
      title: "Add deployment health guardrails",
      description: "Use canary releases, automated health checks, and rollback on error-rate thresholds.",
      priority: "critical",
      affectedPillars: ["operational-excellence", "reliability"],
      estimatedScoreImpact: { "operational-excellence": 18, reliability: 12 },
      action: {
        type: "update-config",
        nodeId: webApps[0].id,
        changes: { monitoringEnabled: true }
      }
    });
  }

  if (databases.length > 0 && !hasDbReplica) {
    recommendations.push({
      id: "rec-db-replica",
      title: "Add standby database replica",
      description: "A single database is a critical single point of failure. Add a replica in another zone.",
      priority: "critical",
      affectedPillars: ["reliability", "cost"],
      estimatedScoreImpact: { reliability: 18, cost: -8 },
      action: { type: "add-node", componentType: "database", zoneId: zonesUsed.has("az-b") ? "az-b" : "az-b", configurationPreset: { redundant: true, failoverEnabled: true, recoveryTimeMinutes: 15, monthlyCostUnits: 120 }, connectTo: databases[0] ? [{ nodeId: databases[0].id, direction: "to", dependencyType: "replication", required: false }] : [] }
    });
  }

  if (webApps.length === 1) {
    recommendations.push({
      id: "rec-web-app-redundancy",
      title: "Add second application instance",
      description: "Run multiple application instances to ensure availability if one fails.",
      priority: "critical",
      affectedPillars: ["reliability", "performance"],
      estimatedScoreImpact: { reliability: 10, performance: 5 },
      action: { type: "add-node", componentType: "web-app", zoneId: webApps[0].zoneId === "az-a" ? "az-b" : "az-a", configurationPreset: { redundant: true, autoscaling: true, healthChecksEnabled: true }, connectTo: hasLoadBalancer ? [{ nodeId: nodes.find(node => node.type === "load-balancer")!.id, direction: "to", dependencyType: "synchronous", required: true }] : [] }
    });
  }

  if (!hasMonitoring && nodes.length > 1) {
    recommendations.push({
      id: "rec-monitoring",
      title: "Add monitoring",
      description: "Without monitoring, failure detection is manual and slow.",
      priority: "high",
      affectedPillars: ["operational-excellence", "security"],
      estimatedScoreImpact: { "operational-excellence": 15, security: 8 },
      action: { type: "add-node", componentType: "monitoring" }
    });
  }

  if (!hasBackup && databases.length > 0) {
    recommendations.push({
      id: "rec-backup",
      title: "Add automated backup",
      description: "Critical data should be backed up regularly.",
      priority: "high",
      affectedPillars: ["operational-excellence", "reliability"],
      estimatedScoreImpact: { "operational-excellence": 10, reliability: 8 },
      action: { type: "add-node", componentType: "backup", connectTo: databases[0] ? [{ nodeId: databases[0].id, direction: "to", dependencyType: "backup", required: false }] : [] }
    });
  }

  if (webApps.length > 1 && !hasLoadBalancer) {
    recommendations.push({
      id: "rec-lb",
      title: "Add load balancer",
      description: "Distribute traffic evenly across your application instances.",
      priority: "high",
      affectedPillars: ["reliability", "performance"],
      estimatedScoreImpact: { reliability: 8, performance: 5 },
      action: { type: "add-node", componentType: "load-balancer" }
    });
  }

  if (!hasCache && databases.length > 0) {
    recommendations.push({
      id: "rec-cache",
      title: "Add caching layer",
      description: "Reduce database load and improve response times.",
      priority: "medium",
      affectedPillars: ["performance", "cost"],
      estimatedScoreImpact: { performance: 15, cost: 5 },
      action: { type: "add-node", componentType: "cache" }
    });
  }

  if (zonesUsed.size === 1 && nodes.length > 2) {
    recommendations.push({
      id: "rec-multi-zone",
      title: "Distribute across availability zones",
      description: "Protect against datacenter-level outages by deploying across multiple AZs.",
      priority: "critical",
      affectedPillars: ["reliability"],
      estimatedScoreImpact: { reliability: 10 },
      action: { type: "update-config", nodeId: "all", changes: {} } // Dummy action
    });
  }

  return recommendations;
};
