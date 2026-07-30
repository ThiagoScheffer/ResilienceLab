#1 - Complete all six failure scenarios with animated timeline and impact report
What & Why
The plan defines six failure scenarios but only instance-failure and database-outage are wired up end-to-end. The remaining four (traffic-spike, zone-outage, credential-compromise, deployment-regression) are defined as types but need full propagation rules, simulation outcomes, and UI display.

The impact report screen (Screen 4 in the plan) — showing customer availability %, failed/degraded services list, data-loss risk badge, recovery estimate, and pillar score deltas — should appear as a panel/modal after simulation completes.

Done looks like
All 6 scenarios selectable and runnable with deterministic outcomes
Animated simulation timeline panel (1 event/second, scrolling log) replaces legend during simulation
Post-simulation impact report: customer availability %, affected components, data-loss risk, recovery time, root cause
Before/after pillar score comparison with delta indicators (▲/▼)
Reset button restores nodes to healthy state
Relevant files
artifacts/failureforge/src/engine/simulationEngine.ts
artifacts/failureforge/src/engine/recommendationEngine.ts
artifacts/failureforge/src/components/designer/SimulationPanel.tsx
artifacts/failureforge/src/types/simulation.ts
artifacts/failureforge/src/store/architectureStore.ts