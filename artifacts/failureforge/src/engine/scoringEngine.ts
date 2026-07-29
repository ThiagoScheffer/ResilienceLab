import { Architecture, Pillar } from "../types/architecture";

export const getInitialPillarScores = (): Record<Pillar, number> => ({
  "reliability": 50,
  "security": 60,
  "operational-excellence": 50,
  "performance": 55,
  "cost": 65,
  "sustainability": 60,
});

export const calculateScores = (architecture: Architecture): Record<Pillar, number> => {
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
    scores[k] = Math.max(0, Math.min(100, scores[k]));
  });

  return scores;
};

export const getOverallHealth = (scores: Record<Pillar, number>): number => {
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
};

export const getHealthLabel = (score: number) => {
  if (score >= 80) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
};
