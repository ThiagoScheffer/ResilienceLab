import { Architecture, ArchitectureEdge } from "../types/architecture";
import { ValidationIssue } from "../types/simulation";

const issue = (id: string, severity: ValidationIssue["severity"], message: string, nodeIds?: string[]): ValidationIssue => ({ id, severity, message, nodeIds });

export const validateArchitecture = (architecture: Architecture): ValidationIssue[] => {
  const { nodes, edges } = architecture;
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(nodes.map(node => node.id));
  const users = nodes.filter(node => node.type === "users");
  if (!users.length) issues.push(issue("missing-users", "error", "Add a Users entry point before running a simulation."));

  const seenEdges = new Set<string>();
  edges.forEach(edge => {
    const key = `${edge.source}:${edge.target}`;
    if (edge.source === edge.target || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) issues.push(issue(`invalid-edge-${edge.id}`, "error", "Remove invalid component connections.", [edge.source, edge.target]));
    if (seenEdges.has(key)) issues.push(issue(`duplicate-edge-${edge.id}`, "warning", "Duplicate dependency connection.", [edge.source, edge.target]));
    seenEdges.add(key);
  });

  const connected = new Set(edges.flatMap(edge => [edge.source, edge.target]));
  nodes.filter(node => node.type !== "users" && !connected.has(node.id)).forEach(node => issues.push(issue(`orphan-${node.id}`, "warning", `${node.name} is not connected to the architecture.`, [node.id])));
  nodes.filter(node => node.type === "database" && !edges.some(edge => edge.target === node.id && edge.type !== "replication")).forEach(node => issues.push(issue(`database-consumer-${node.id}`, "warning", `${node.name} has no application consumer.`, [node.id])));
  nodes.filter(node => node.type === "backup" && !edges.some(edge => edge.target === node.id && edge.type === "backup")).forEach(node => issues.push(issue(`backup-${node.id}`, "warning", `${node.name} is not connected to a database backup flow.`, [node.id])));
  nodes.filter(node => node.type === "load-balancer" && edges.filter(edge => edge.source === node.id).length < 2).forEach(node => issues.push(issue(`lb-targets-${node.id}`, "warning", `${node.name} needs at least two targets for resilience.`, [node.id])));
  if (nodes.some(node => node.type === "database") && !nodes.some(node => node.type === "backup")) issues.push(issue("missing-backup", "warning", "No backup component protects the database."));
  if (nodes.length > 2 && !nodes.some(node => node.type === "monitoring")) issues.push(issue("missing-monitoring", "warning", "No monitoring component is configured."));
  if (nodes.filter(node => node.type === "web-app").length === 1) issues.push(issue("single-web-app", "warning", "A single web application is a single point of failure."));

  const visiting = new Set<string>(); const visited = new Set<string>();
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const cyclic = edges.filter(edge => edge.source === id).some(edge => hasCycle(edge.target));
    visiting.delete(id); visited.add(id); return cyclic;
  };
  if (nodes.some(node => hasCycle(node.id))) issues.push(issue("circular-dependency", "error", "Remove circular dependencies before running a simulation."));
  return issues;
};

export const hasBlockingValidationIssues = (issues: ValidationIssue[]) => issues.some(issue => issue.severity === "error");
