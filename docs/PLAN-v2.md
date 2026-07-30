# FailureForge Design-System Integration Plan

## Summary

Integrate the build plan into the existing client-heavy React application while preserving the completed dark UI, sample architectures, scoring engine, and six-scenario simulation work.

The main missing pieces are architecture validation, complete editor controls, scenario relevance and parameters, accurate failover/capacity/security simulation rules, actionable recommendations, score explanations, a working before/after guided demo, and production-quality validation.

## Key Changes

### 1. Complete the architecture and simulation models

- Add `createdAt` and `updatedAt` to `Architecture`.
- Add scenario `parameters`, including traffic multiplier and target zone.
- Extend node configuration with the minimum explicit resilience controls required by the scenarios:
  - `credentialProtected`
  - `healthChecksEnabled`
  - `failoverEnabled`
  - `deploymentStrategy: "all-at-once" | "rolling" | "blue-green"`
  - `rollbackEnabled`
- Keep `users` as a non-service entry-point node while preserving the eight draggable service types.
- Add separate simulation exposure metadata so credential compromise represents security exposure without pretending infrastructure failed.
- Extend `SimulationResult` with:
  - Overall impact severity
  - Failed and degraded component lists
  - Exposed component list
  - Cost before, after, and delta
  - Customer-impact summary
  - Score-change explanations
- Replace `any` recommendation actions with typed actions supporting node presets, edge creation, configuration updates, and multi-node architecture transformations.

### 2. Fill the functional gaps

- Add a validation engine that recalculates whenever nodes or edges change and detects:
  - Missing user entry point
  - Orphan components
  - Circular dependencies
  - Invalid/self/duplicate connections
  - Databases without consumers
  - Disconnected backups
  - Load balancers with fewer than two targets
  - Missing monitoring/backups
  - Single points of failure and capacity shortfalls
- Display blocking errors and non-blocking warnings in the designer; disable simulation only for errors that prevent a meaningful run.
- Make the component search field, deletion drop-zone, node deletion, edge selection/deletion, dependency type, required/optional setting, zone selection, capacity, exposure, monitoring, credential protection, and recovery settings functional.
- Add availability-zone creation and ensure dropped/moved nodes receive the correct zone.
- Show only scenarios applicable to the current graph and explain why unavailable scenarios are disabled.
- Wire the top navigation’s “Simulate Failure” button to the scenario panel instead of leaving it inert.
- Validate and migrate locally saved architectures before loading them; surface save/load failures through toasts.

### 3. Correct simulation, scoring, and recommendation behavior

- Refactor propagation into deterministic queue-based rules operating on a cloned simulation state.
- Implement scenario-specific behavior:
  - Instance failure survives only with a reachable healthy target and sufficient remaining capacity.
  - Database outage uses reachable replicas, replication mode, and failover configuration; data-loss risk follows replica and backup quality.
  - Traffic spike uses a configurable multiplier and the documented healthy/degraded/failed capacity thresholds.
  - Zone outage fails every node in the chosen zone, then evaluates cross-zone routing, database writability, and remaining capacity.
  - Credential compromise propagates exposure through reachable data stores and calculates risk from access, encryption, monitoring, and credential protection.
  - Deployment regression respects deployment strategy, health checks, parallel versions, and rollback capability.
- Include informative timeline events for successful fallback and unaffected components, not only status changes.
- Replace hard-coded post-failure score penalties with named score rules and visible explanations for every delta.
- Calculate architecture-improvement trade-offs separately from outage impact so the report can distinguish:
  - Pre-failure architecture score
  - During-failure score
  - Post-recommendation architecture score
- Complete recommendation application:
  - New replicas and services use meaningful presets.
  - Added nodes are connected to the relevant existing components.
  - Cross-zone recommendations create or reuse a valid zone.
  - Configuration recommendations perform real updates.
  - Recommendations are ordered deterministically by severity, business impact, probability, and effort.
- Put recommendations and cost impact directly in the impact report, while retaining the inspector summary.
- After applying a recommendation, reset transient failure statuses but retain the same scenario for immediate rerun.

### 4. Repair the guided demo and competition flow

- Replace the current node-count-driven tour with an explicit demo state machine:
  - Load the fragile sample.
  - Select and run instance failure.
  - Present the first impact report.
  - Apply one atomic “recommended architecture” transformation.
  - Rerun the same resolved scenario.
  - Present a side-by-side before/after comparison.
- The recommended transformation must add AZ-B, a load balancer, a second web application, monitoring, and all required edges/configuration.
- Preserve the first run’s result through the second run so the comparison shows availability and all six pillar trade-offs.
- Ensure the second run genuinely routes traffic to the surviving application and produces the expected materially improved outcome.
- Add restart/end-demo controls, empty states, mobile-width warning, accessible modal focus/escape behavior, and responsive behavior at 1366×768.
- Fix visible encoding corruption and the invalid `dangerouslySetContents` style property.

## Public Interfaces

- Introduce `NodeConfiguration`, `ScenarioParameters`, `ValidationIssue`, `ScoreExplanation`, `SimulationComponentImpact`, and typed `RecommendationAction` interfaces.
- Change simulation execution to accept a fully resolved scenario containing explicit target IDs and parameters.
- Add store state/actions for validation results, scenario applicability, saved comparison runs, edge selection/configuration, zone management, and atomic recommendation application.
- Version persisted architecture JSON and provide defaults for older saved data.

## Test Plan

- Unit-test every validation rule with valid and invalid graphs.
- Unit-test all six scenarios against fragile, resilient, and event-driven samples, including deterministic repeated output.
- Cover failover reachability, optional dependencies, alternative capacity, replica/backup data-loss levels, traffic thresholds, zone routing, security exposure, and deployment rollback.
- Unit-test score rule explanations and positive/negative cost and sustainability trade-offs.
- Test each recommendation action produces a valid connected graph and can be safely applied once.
- Add an integration test for the complete guided-demo sequence and assert that the second run materially improves availability.
- Test local-storage migration, corrupt JSON recovery, timer cancellation, reset behavior, empty architectures, and scenario filtering.
- Run TypeScript checks, Vitest, and the production Vite build; separately fix the existing `ArchitectureCanvas.tsx` style-property compiler error.

## Assumptions

- This remains a static, browser-only MVP with no authentication, backend, database, external API, or AWS deployment integration.
- Cost remains an abstract unit system rather than real AWS pricing.
- The existing visual tokens and general page composition remain the design baseline.
- Work will be integrated incrementally into the current implementation rather than replacing the application.
- Competition readiness and the guided demonstration take priority over optional backend persistence or additional failure scenarios.
