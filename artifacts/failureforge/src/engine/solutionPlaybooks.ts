import { FailureScenario, SimulationResult } from "../types/simulation";

export interface SolutionPlaybook {
  title: string;
  problem: string;
  awsPattern: string;
  cause: string[];
  steps: string[];
  outcome: string;
  tradeoff: string;
  pillars: string[];
}

const databaseOutage: SolutionPlaybook = {
  title: "Restore a writable checkout path",
  problem: "A standby exists, but checkout has no automated route to a writable database after the primary fails.",
  awsPattern: "Amazon RDS Multi-AZ with application failover endpoint and Amazon CloudWatch alarm automation",
  cause: ["The primary database is unavailable.", "Checkout applications require a writable database.", "Automatic promotion and endpoint resolution are not both configured."],
  steps: ["Enable Multi-AZ automatic failover for the writer.", "Configure applications to resolve the database failover endpoint.", "Alarm on writer availability and test the runbook with a game day."],
  outcome: "A standby can be promoted and applications reconnect without a customer-visible outage.",
  tradeoff: "Maintaining a standby increases simulated monthly cost and active capacity.",
  pillars: ["Reliability", "Operational Excellence", "Performance Efficiency", "Cost Optimization"]
};

const general: SolutionPlaybook = { title: "Contain the failure and verify the response", problem: "The scenario revealed a workload risk that needs an explicit resilience control.", awsPattern: "Well-Architected failure testing, observability, and automated recovery", cause: ["The simulated event reduced service capacity or trust.", "The current architecture has limited protection for the affected path."], steps: ["Add the recommended protection control.", "Instrument the affected customer-path metric.", "Rerun the scenario and record the trade-off."], outcome: "The revised architecture has a tested, visible response path.", tradeoff: "Resilience controls may add cost or operational complexity.", pillars: ["Reliability", "Operational Excellence"] };

export const getSolutionPlaybook = (scenario: FailureScenario | null, result: SimulationResult | null): SolutionPlaybook => {
  if (scenario?.type === "database-outage" || result?.scenario.type === "database-outage") return databaseOutage;
  return general;
};
