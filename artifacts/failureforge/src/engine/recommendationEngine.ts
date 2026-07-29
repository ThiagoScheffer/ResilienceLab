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

  if (databases.length > 0 && !hasDbReplica) {
    recommendations.push({
      id: "rec-db-replica",
      title: "Add standby database replica",
      description: "A single database is a critical single point of failure. Add a replica in another zone.",
      priority: "critical",
      affectedPillars: ["reliability", "cost"],
      estimatedScoreImpact: { reliability: 18, cost: -8 },
      action: { type: "add-node", componentType: "database", zoneId: zonesUsed.has("az-b") ? "az-b" : "az-a" }
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
      action: { type: "add-node", componentType: "web-app", zoneId: webApps[0].zoneId === "az-a" ? "az-b" : "az-a" }
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
      action: { type: "add-node", componentType: "backup" }
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
