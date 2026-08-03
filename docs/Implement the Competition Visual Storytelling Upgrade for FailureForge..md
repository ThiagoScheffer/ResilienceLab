Implement the Competition Visual Storytelling Upgrade for FailureForge.

Do not rebuild or replace the current deterministic simulation engine, scoring
engine, recommendation engine, guided demo state, persistence system, or
Architecture Posture versus Live Incident Impact model.

The objective is to improve the architecture canvas, node system, simulation
presentation, and competition demonstration.

1. Create specialized architecture node templates for:
- Load Balancer
- Web Application
- Database
- Cache
- Queue
- Object Storage
- Backup
- Monitoring

Use a shared outer visual system, but give each node type operationally relevant
metrics.

2. Add three node presentation modes:
- Design mode
- Simulation mode
- Comparison mode

Design mode should prioritize configuration and structural warnings.
Simulation mode should prioritize live status, operational impact, failure reason,
capacity, availability, and dependency state.
Comparison mode should display before and after resilience outcomes.

3. Upgrade node status rendering to support:
- Healthy
- Protected
- Degraded
- Failed
- Recovering

Do not rely only on small status dots. Use borders, labels, metrics, icons, and
subtle animation. Avoid turning the entire canvas red.

4. Add operational edge animation:
- Healthy customer traffic
- Broken required dependency
- Optional degraded dependency
- Asynchronous queue flow
- Database replication
- Backup path
- Monitoring path
- Failover routing

During database failover, visibly animate traffic moving from the failed primary
database to the promoted standby database.

5. Add temporary reason chips to nodes during simulation, such as:
- Initiating failure
- Required dependency lost
- No writable alternative
- Failover not enabled
- Recovery only
- Protected by failover
- Traffic rerouted

6. Add a top-level live incident strip during simulation showing:
- Severity
- Customer availability
- Checkout success
- Capacity headroom
- Latency
- Data-loss risk
- Recovery estimate
- Incident-loss units

Do not use real currency values unless explicitly configured. Use abstract
business-impact units by default.

7. Add a Present mode alongside Edit and Simulate modes.

Present mode must:
- Collapse the component library
- Enlarge the architecture canvas
- Increase node readability
- Disable accidental graph editing
- Keep the incident timeline visible
- Emphasize customer impact
- Automatically frame affected nodes
- Hide secondary controls

8. Create a competition guided demo titled:
“The Checkout That Could Not Fail.”

Use a realistic e-commerce case:
- Customers
- Load Balancer
- Web App A in AZ-A
- Web App B in AZ-B
- Cache
- Queue
- Primary PostgreSQL Database
- Standby Replica
- Backup
- Monitoring

The first run must demonstrate a critical database outage where:
- The replica exists
- Automatic failover is not correctly configured
- The applications cannot resolve a writable standby endpoint
- The customer checkout path reaches 0% availability
- Backup is correctly shown as recovery-only
- Monitoring detects the failure but does not prevent the outage

Use this timeline:
T+00 Primary database failed
T+01 Replica detected
T+02 Automatic failover not configured
T+03 No writable endpoint available
T+04 Web App A lost required dependency
T+04 Web App B lost required dependency
T+05 Load balancer has no healthy checkout target
T+06 No healthy customer request path

9. Add one prominent recommendation:
“Apply Resilience Upgrade.”

Applying it must:
- Enable automatic database failover
- Configure standby promotion
- Configure a reachable failover endpoint
- Configure application endpoint resolution
- Improve monitoring automation
- Preserve explicit cost and sustainability trade-offs

Animate each architecture modification visibly on the graph.

10. Rerun the identical database outage.

The second run should visibly show:
T+00 Primary database failed
T+01 Failure detected
T+04 Standby replica eligible
T+08 Replica promoted
T+12 Database endpoint updated
T+15 Web applications reconnected
T+18 Full checkout capacity restored

Expected outcome:
- Customer availability: approximately 100%
- Checkout preserved or restored rapidly
- Customer-visible outage: none or minimal
- Data-loss risk: low
- Reliability and Operational Excellence improve
- Cost Optimization and Sustainability decline appropriately

11. Restructure the right panel.

In Design mode, show:
- Configuration
- Dependencies
- Risks

In Simulation mode, show:
- Incident
- Timeline
- Why
- Fix

The Incident tab must lead with severity, availability, customer-path condition,
root cause, and recovery status.

The Why tab must explain deterministic engine reasoning in numbered steps.

The Fix tab must show:
- Recommendation
- Expected outcome
- Pillar deltas
- Cost and sustainability trade-offs
- Apply action

12. Keep Architecture Posture visible, but secondary during live simulation.
Never allow structural posture scores to visually override a critical live
customer outage.

13. Add lightweight camera framing:
- Focus the target and direct dependencies when the scenario starts
- Expand to affected nodes during propagation
- Frame primary, replica, and web applications during failover
- Fit affected and protected components when the result stabilizes

Use no more than three camera movements in one simulation.

14. Preserve current application behavior and data compatibility.
Do not remove existing scenario logic, saved architectures, version migration,
recommendation actions, reports, or Resilience Lab views.

15. Add Vitest coverage for:
- Node mode transitions
- Status-to-visual-state mapping
- Database failure reason chips
- Failed failover presentation
- Successful failover presentation
- Present mode state
- Guided demo before-and-after sequence

The result should feel like a live incident control room rather than a generic
diagram editor. A judge must understand the failure, customer impact, root cause,
fix, and trade-off without opening detailed configuration controls.