# FailureForge Project Documentation

Last updated: 2026-08-03

This document is the living tracker for the current state of the project. It is meant to answer three questions quickly:

1. What is implemented right now?
2. What changed most recently?
3. What still needs to be finished or verified?

## Current Status

FailureForge is currently a browser-only React application focused on infrastructure resilience simulation, architecture design, and competition-ready incident reporting.

The active product surface includes:

- Architecture designer and canvas
- Scenario simulation engine
- Validation and recommendation engine
- Inspector and impact reporting panels
- Guided demo flow
- Resilience Lab with Performance and Cost views
- Local persistence and migration handling

The simulation model now distinguishes between:

- Architecture Posture: the structural Well-Architected view of the design
- Live Incident Impact: the immediate customer-path impact of a simulated failure

This is important because a resilient design can still experience a severe outage. The report now shows both the long-term posture and the live incident effect instead of blending them into one misleading score.

## Current Implementation Checklist

### Core app

- [x] React application scaffold and routing
- [x] Designer page with canvas, inspector, simulation panel, and component library
- [x] Dark competition-oriented UI shell
- [x] Responsive layout for desktop demo use

### Architecture model

- [x] Nodes, edges, zones, and capacity modeling
- [x] Extended node configuration for resilience controls
- [x] Sample fragile and resilient architectures
- [x] Local persistence for saved architectures
- [x] Persisted simulation versioning to prevent stale results from reappearing

### Validation and safety

- [x] Validation engine for graph integrity and design issues
- [x] Detection of invalid or missing dependency paths
- [x] Warning and error surfaces in the designer
- [x] Scenario applicability filtering

### Simulation and scoring

- [x] Six-scenario simulation engine
- [x] Deterministic failure propagation
- [x] Separate architecture posture and live incident output
- [x] Timeline reporting for failure chains and recovery events
- [x] Customer-path availability calculation
- [x] Failure-domain aware handling for database and AZ outages

### Recommendations and demo flow

- [x] Recommendation engine with typed actions
- [x] Recommendation application back into the architecture graph
- [x] Guided demo flow
- [x] Before/after comparison reporting
- [x] Performance Lab and Cost Lab views

### Competition hardening

- [x] Clear severity and customer-impact framing in reports
- [x] Distinct presentation for posture vs live incident effects
- [x] Failover reachability checks for database recovery
- [x] AZ outage reasoning tied to surviving zones and routing paths
- [x] Cost and sustainability preserved as posture metrics with separate incident impact
- [x] Specialized operational node cards for competition storytelling
- [x] Live incident strip with customer and business-impact metrics
- [x] Present mode for judge-facing demonstrations
- [x] Right-panel incident tabs for timeline, reasoning, and fix presentation
- [x] Narrative Fragile Checkout preset with hidden failover gap

## Changelog

### 2026-08-03

- [x] Added this documentation tracker.
- [x] Captured the current implementation status in one place.
- [x] Added a changelog-style checklist for ongoing work.

### 2026-08-03: competition visual storytelling upgrade

- [x] Added specialized operational node cards for load balancers, web apps, databases, cache, queue, storage, backup, monitoring, and users.
- [x] Added design, simulation, and comparison node presentation modes.
- [x] Added reason chips for initiating failures, dependency loss, unavailable writable alternatives, backup recovery-only behavior, and failover protection.
- [x] Added operational edge labels and animation states for customer traffic, broken dependencies, queues, replication, backup, monitoring, and failover promotion.
- [x] Added a live incident strip that surfaces severity, availability, checkout success, headroom, latency, data-loss risk, recovery, and incident-loss units.
- [x] Added Edit, Simulate, and Present mode controls.
- [x] Converted the fragile sample into a realistic checkout topology with a replica, backup, monitoring, cache, and queue but missing failover wiring.
- [x] Updated the guided demo to use “The Checkout That Could Not Fail.”
- [x] Tuned database-outage timeline events to show replica detection, missing failover, missing endpoint, promotion, endpoint update, and application reconnection.
- [x] Added right-panel simulation tabs for Incident, Timeline, Why, and Fix.

### 2026-08-03: resilience model hardening

- [x] Separated Architecture Posture from Live Incident Impact.
- [x] Updated database outage logic to require reachable, explicitly configured failover.
- [x] Prevented the `Users` node from being treated as a failed service.
- [x] Added customer-path availability reporting and failure timelines.
- [x] Updated the resilient sample architecture to include explicit failover configuration.
- [x] Added engine versioning to help detect stale simulation state.

### 2026-08-03: competition and demo polish

- [x] Improved the impact report to lead with severity, availability, and customer impact.
- [x] Added the Resilience Lab with Performance and Cost tabs.
- [x] Updated the guided demo to show a fragile run, a fix, and a rerun.
- [x] Expanded the report with recommendation previews and trade-off language.
- [x] Normalized simulation terminology across the inspector and report surfaces.

## Pending Work

These items are the best candidates for the next round of implementation or verification.

- [ ] Add or expand automated regression coverage for all six scenarios.
- [ ] Add snapshot coverage for the guided demo sequence.
- [x] Verify TypeScript checks in the current workspace.
- [ ] Verify the production build after restoring Rollup's missing Windows optional dependency.
- [ ] Review the remaining UI copy for consistency and any malformed characters.
- [ ] Keep the checklist updated as features land so the document stays current.

## Verification Checklist

Use this checklist before shipping or showing the demo:

- [ ] Run the database outage scenario and confirm the live result is severe when no valid failover exists.
- [ ] Run the AZ outage scenario and confirm live availability changes while security posture remains stable.
- [ ] Apply a recommendation and rerun the same scenario to confirm the result materially improves.
- [ ] Confirm the report footer shows the active simulation engine version during development.
- [ ] Confirm saved browser state does not restore stale simulation results from an older engine version.
- [x] Run TypeScript checks.
- [ ] Run the production build.

## Notes For Future Updates

- Keep this document high level.
- Add new items to the changelog as discrete, dated entries.
- Mark checklist items as soon as the code lands, not only after the final demo pass.
- If a change affects simulation behavior, update both the status section and the verification checklist.
