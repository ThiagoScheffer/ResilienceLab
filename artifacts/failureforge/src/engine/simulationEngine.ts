import { Architecture, ArchitectureNode } from "../types/architecture";
import { FailureScenario, SimulationEvent, SimulationResult } from "../types/simulation";
import { calculateScores } from "./scoringEngine";
import { generateRecommendations } from "./recommendationEngine";

export const runSimulation = (
  architecture: Architecture, 
  scenario: FailureScenario
): SimulationResult => {
  // Deep clone nodes to manipulate statuses
  const nodes = architecture.nodes.map(n => ({ ...n }));
  const edges = architecture.edges;
  
  const events: SimulationEvent[] = [];
  const affectedNodes = new Set<string>();
  
  let currentTime = 0;

  // Helper to trigger status change and log event
  const setNodeStatus = (nodeId: string, status: ArchitectureNode['status'], message: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.status === status) return;
    
    node.status = status;
    affectedNodes.add(nodeId);
    events.push({
      time: currentTime,
      message,
      affectedNodeId: nodeId,
      newStatus: status
    });
  };

  // 1. Apply initial failure
  if (scenario.type === "zone-outage") {
    // Determine target zone from scenario (using the first targetNode as a hint if not directly specified)
    const targetNode = nodes.find(n => scenario.targetNodeIds.includes(n.id));
    if (targetNode) {
      const zoneToFail = targetNode.zoneId;
      nodes.filter(n => n.zoneId === zoneToFail).forEach(n => {
        setNodeStatus(n.id, "failed", `${n.name} failed due to ${zoneToFail} zone outage`);
      });
    }
  } else {
    scenario.targetNodeIds.forEach(id => {
      setNodeStatus(id, "failed", `${nodes.find(n => n.id === id)?.name || id} failed initially`);
    });
  }

  currentTime++;

  // 2. Propagate
  let stabilized = false;
  let iterations = 0;
  while (!stabilized && iterations < 20) {
    stabilized = true;
    iterations++;

    // For each node, check if its dependencies are failed
    nodes.forEach(dependant => {
      if (dependant.status === "failed") return;

      // Find dependencies (edges where this node is source)
      const outEdges = edges.filter(e => e.source === dependant.id);
      
      let requiredFailedCount = 0;
      let optionalFailedCount = 0;

      outEdges.forEach(edge => {
        const dependency = nodes.find(n => n.id === edge.target);
        if (dependency && dependency.status === "failed") {
          // Check for healthy alternative of same type
          const hasHealthyAlternative = outEdges.some(altEdge => {
            const altDep = nodes.find(n => n.id === altEdge.target);
            return altDep && altDep.id !== dependency.id && altDep.type === dependency.type && altDep.status !== "failed";
          });

          if (!hasHealthyAlternative) {
            if (edge.required) requiredFailedCount++;
            else optionalFailedCount++;
          }
        }
      });

      if (requiredFailedCount > 0) {
        setNodeStatus(dependant.id, "failed", `${dependant.name} failed due to dependency loss`);
        stabilized = false;
      } else if (optionalFailedCount > 0 && dependant.status === "healthy") {
        setNodeStatus(dependant.id, "degraded", `${dependant.name} degraded due to optional dependency loss`);
        stabilized = false;
      }
    });

    currentTime++;
  }

  // 3. Traffic Spike special logic
  if (scenario.type === "traffic-spike") {
    const webApps = nodes.filter(n => n.type === "web-app" && n.status === "healthy");
    const totalCapacity = webApps.reduce((sum, app) => sum + app.configuration.capacity, 0);
    // Assume required demand is higher than normal. If totalCapacity < 10, degrade.
    if (totalCapacity < 10) {
      webApps.forEach(app => {
        setNodeStatus(app.id, "degraded", `${app.name} degraded due to high load overload`);
      });
    }
  }

  // Calculate customer availability
  const originalWebApps = architecture.nodes.filter(n => n.type === "web-app");
  let customerAvailability = 100;
  
  if (originalWebApps.length > 0) {
    const healthyCapacity = nodes.filter(n => n.type === "web-app" && n.status === "healthy")
      .reduce((sum, n) => sum + n.configuration.capacity, 0);
    const degradedCapacity = nodes.filter(n => n.type === "web-app" && n.status === "degraded")
      .reduce((sum, n) => sum + (n.configuration.capacity * 0.5), 0);
    const totalOriginalCapacity = originalWebApps.reduce((sum, n) => sum + n.configuration.capacity, 0);
    
    customerAvailability = totalOriginalCapacity > 0 
      ? Math.round(((healthyCapacity + degradedCapacity) / totalOriginalCapacity) * 100)
      : 0;
  } else {
    // If no web apps, rely on other factors or simply 0
    customerAvailability = 0;
  }

  // Fix max clamping
  customerAvailability = Math.min(100, Math.max(0, customerAvailability));

  // Est recovery time
  const failedNodes = nodes.filter(n => n.status === "failed");
  const estimatedRecoveryMinutes = failedNodes.length > 0 
    ? Math.max(...failedNodes.map(n => n.configuration.recoveryTimeMinutes))
    : 0;

  // Data loss risk
  let dataLossRisk: SimulationResult['dataLossRisk'] = "none";
  const failedDatabases = failedNodes.filter(n => n.type === "database");
  if (failedDatabases.length > 0) {
    dataLossRisk = "high";
    const hasBackups = edges.some(e => e.type === "backup" && failedDatabases.some(d => d.id === e.source));
    if (!hasBackups) dataLossRisk = "critical";
    else dataLossRisk = "medium";
  }

  const pillarScoresBefore = calculateScores(architecture);
  // Re-calculate after? Actually, architecture structural scores don't change during failure.
  // The pillarScoresAfter usually represent if we applied recommendations. But for now, they are same.
  const pillarScoresAfter = { ...pillarScoresBefore };

  // Adjust scores to reflect current outage state
  if (customerAvailability < 50) {
    pillarScoresAfter["reliability"] = Math.max(0, pillarScoresAfter["reliability"] - 30);
  }

  const result: SimulationResult = {
    scenario,
    events,
    affectedNodes: Array.from(affectedNodes),
    customerAvailability,
    estimatedRecoveryMinutes,
    dataLossRisk,
    pillarScoresBefore,
    pillarScoresAfter,
    recommendations: [] // Will populate next
  };

  result.recommendations = generateRecommendations(architecture, result);

  return result;
};
