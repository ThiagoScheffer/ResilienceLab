Competition Demo & Visual Node Upgrade Plan
Objective

Transform FailureForge from a technically credible architecture simulator into a competition-grade visual experience that immediately communicates:

What the system does.
What failed.
Why the failure matters.
How the architecture responds.
Why the improved design is superior.

The current implementation already contains the simulation engine, guided demo, recommendation flow, customer-path availability calculation, failure-domain reasoning, and separate Architecture Posture versus Live Incident Impact. Therefore, the next phase should not rebuild the simulation model; it should improve visual storytelling, node hierarchy, scenario presentation, and demonstration pacing.

The core product loop should remain:

Build it → Break it → Understand it → Improve it → Test it again.

1. Replace generic nodes with competition-grade architecture nodes
Current problem

The nodes are visually clean, but they still resemble generic diagram-editor cards. During a competition, judges and voters should understand a node’s operational role and current state without opening the Inspector.

The node itself must become the primary storytelling surface.

New node anatomy

Each main node should contain five information layers:

┌────────────────────────────────────┐
│ ICON  Primary Database       CRITICAL│
│       PostgreSQL · Writer           │
├────────────────────────────────────┤
│ STATUS                              │
│ ● Unavailable                      │
│                                    │
│ Availability      0%               │
│ Connections       3 affected       │
│ Recovery target   12 min           │
├────────────────────────────────────┤
│ az-a       Primary       Encrypted │
├────────────────────────────────────┤
│ ⚠ Single writable endpoint         │
└────────────────────────────────────┘
Mandatory node content

Every node should expose:

Service icon and name.
Technology or service subtype.
Functional role: primary, standby, worker, public gateway, cache, backup.
Current operational status.
Failure-domain label.
Capacity or availability metric.
Dependency impact count.
Resilience controls.
One concise risk or protection statement.

This extends the original node specification—which already calls for an icon, name, type, status, zone, warning indicator, and redundancy shield—into a richer operational card.

2. Create specialized node templates by component type

Do not render every service using the same internal structure. Shared dimensions and visual language are appropriate, but the most important metric varies by node type.

2.1 Load Balancer node

Show:

Healthy targets: 2 / 2
Routing mode: Cross-zone
Current request rate.
Health-check state.
Customer traffic preserved or interrupted.

Example:

LOAD BALANCER
Public Traffic Gateway

Healthy targets     1 / 2
Traffic served      52%
Routing             Cross-zone

⚠ Capacity reduced
2.2 Web Application node

Show:

Instance state.
Request capacity.
Current utilization.
Required dependencies.
Database endpoint resolution.
Deployment version where relevant.

Example:

WEB APP A
EC2 · Checkout API

Status              Degraded
Capacity            40 / 100
DB endpoint         Unreachable
Requests failed     68%

✕ Required database unavailable
2.3 Database node

Show:

Writer or replica role.
Read/write availability.
Replication lag.
Failover eligibility.
Data-loss risk.
Recovery estimate.

Example:

PRIMARY DATABASE
PostgreSQL · Writer

Writes              Unavailable
Reads               Unavailable
Replica lag         4.2 sec
Failover            Not configured

CRITICAL
No reachable writable replica
2.4 Cache node

Show:

Hit rate.
Available cached paths.
Time-to-live condition.
Whether the cache protects read traffic during failure.
Whether stale reads are permitted.
2.5 Queue node

Show:

Messages queued.
Throughput.
Consumer availability.
Retry or dead-letter state.
Whether writes are preserved asynchronously.
2.6 Object Storage node

Show:

Availability.
Replication state.
Backup role.
Data durability protection.
Public/private exposure.
2.7 Backup node

Show:

Last successful recovery point.
Recovery-point objective.
Recovery-time objective.
Restore test status.
Whether it is an operational failover path or recovery-only mechanism.

This distinction matters: a backup must never appear equivalent to a live standby.

2.8 Monitoring node

Show:

Detection status.
Time to detect.
Alerts generated.
Coverage.
Automation or manual recovery trigger.
3. Introduce three visual node modes

A single static node design will not work equally well during architecture editing and live simulation.

Mode A — Design mode

Purpose: configuration and architecture comprehension.

Show:

Name.
Type.
Zone.
Capacity.
Protection controls.
Validation warning.

Avoid excessive incident metrics.

Mode B — Simulation mode

Purpose: failure propagation.

Show:

Live status.
Operational metric.
Dependency loss.
Failure reason.
Customer-path contribution.
Recovery state.

Visual emphasis should shift from architecture metadata to incident behavior.

Mode C — Comparison mode

Purpose: before versus after judging moment.

Show:

Before
No failover
Availability 0%
Recovery 47 min

After
Automatic promotion
Availability 100%
Recovery 18 sec

The transition between these modes should occur without replacing the architecture canvas. The original product specification already requires the same canvas to remain visible while statuses and cascading dependencies animate.

4. Strengthen status visualization
Status hierarchy

Use five states instead of relying mainly on a colored dot:

State	Meaning	Visual treatment
Healthy	Fully serving its function	Green border accent, stable glow
Protected	Failure absorbed by redundancy	Green/cyan shield animation
Degraded	Service operating with reduced capability	Amber border and metric
Failed	Service function unavailable	Red border, reduced brightness
Recovering	Restoration or failover in progress	Blue animated progress state
Important correction

Do not flood the entire canvas with red. This reduces comprehension.

Use red only for:

The initiating failure.
Components that have actually lost their required function.
The broken customer path.

Use amber for:

Reduced capacity.
Latency increase.
Dependency impairment.
Services waiting for recovery.

Use cyan or green for:

Replica promotion.
Traffic rerouting.
Queue buffering.
Cache protection.
Recovery automation.
5. Make edges operational, not merely structural

The edges should explain what is happening.

Edge types

Maintain distinct semantics for:

Required synchronous dependency.
Optional dependency.
Asynchronous delivery.
Replication.
Backup.
Monitoring.
Customer traffic.
Failover routing.

The underlying architecture model already distinguishes synchronous, asynchronous, replication, monitoring, and backup edges.

Simulation edge behavior
Healthy traffic

Animate subtle particles moving in the normal direction.

Broken dependency

Stop traffic animation and display:

DB connection refused
Failure propagation

Use a short pulse from the failed node toward the dependent node.

Successful failover

Animate a visible route change:

Primary DB
     ✕
Web Apps ─────→ Standby DB
               PROMOTED
Queue protection

Show requests accumulating rather than instantly treating them as lost:

+120 pending
+240 pending
+380 pending

This gives the simulation physical and operational credibility.

6. Upgrade the architecture canvas into a real-case topology
Recommended event architecture

Use a recognizable e-commerce checkout system instead of a generic component arrangement.

Business context
Online retail platform
Campaign launch traffic
12,000 active users
1,800 checkout requests/min
Revenue-sensitive write path
Architecture topology
Customers
    ↓
Edge / Public Entry
    ↓
Load Balancer
   ↙      ↘
Web App A  Web App B
   │   \    /   │
   │    Cache   │
   │      │     │
   └── Primary Database
          │
          ├── Standby Replica
          ├── Backup
          └── Monitoring

Checkout events → Queue → Order Worker
Why this topology is superior

It makes several failure behaviors visible:

Read traffic can benefit from cache.
Checkout writes require a writable database.
Queue buffering can preserve asynchronous work.
A replica may exist but still fail if promotion or endpoint resolution is not configured.
Monitoring affects detection and recovery rather than magically preserving availability.
Backup reduces recovery and data-loss risk but does not preserve live traffic.

This reflects the product’s intended role as a visual decision simulator, rather than an exact AWS deployment tool.

7. Add business-impact overlays

Technical component failures alone will not maximize audience votes. The interface needs to translate technical events into business consequences.

Top canvas overlay

During simulation, display a compact live incident strip:

CRITICAL INCIDENT

Customer availability     0%
Checkout success          0%
Orders at risk             318
Estimated revenue impact   42 units/min
Data-loss risk             High

Use abstract “business impact units” unless the user configures real business figures. The original plan correctly avoids claiming inaccurate real-world pricing and uses cost units instead.

Business metrics by scenario
Database outage
Checkout success.
Writable path.
Orders delayed or lost.
Data-loss risk.
Recovery estimate.
Traffic spike
Demand versus capacity.
Rejected requests.
Latency.
Queue growth.
Capacity headroom.
Zone outage
Surviving capacity.
Cross-zone routing.
Regional availability.
Critical services remaining.
Credential compromise
Exposed records.
Affected trust boundary.
Credential scope.
Detection time.
Containment state.
8. Create a cinematic simulation sequence

The current “Run Simulation” interaction should become a controlled demonstration sequence of approximately 20–30 seconds.

Phase 1 — Incident initiation

Duration: 2 seconds.

Camera subtly centers on the target node.
Scenario title appears.
Initiating node pulses red.
Timeline starts at T+00:00.
Primary database connection lost
Phase 2 — Dependency evaluation

Duration: 4–6 seconds.

Required edges turn red.
Optional edges turn amber.
The engine visibly checks replica, routing, backup, and monitoring controls.

Example badges:

Replica detected
Failover disabled
Endpoint unresolved
Backup available — recovery only
Phase 3 — Cascading impact

Duration: 5–8 seconds.

Web apps lose writable dependency.
Load balancer loses healthy transactional targets.
Customer-path overlay drops.
Queue behavior remains correctly differentiated.
No healthy customer request path
Phase 4 — Impact stabilization

Duration: 3 seconds.

Node animation settles.
Severity and metrics lock.
Failed, degraded, protected, and unaffected components become clear.
Phase 5 — Recommendation reveal

Duration: 4 seconds.

Reveal the highest-value recommendation first:

Enable automatic database failover

Expected result
Availability       0% → 100%
Recovery           47 min → 18 sec
Data-loss risk     High → Low
Cost posture       70 → 62
Sustainability     65 → 60
9. Build one decisive guided demo for the event

The original roadmap correctly states that a polished deterministic demonstration has greater judging value than a broad but incomplete editor.

Demo title

The Checkout That Could Not Fail

This is stronger than a generic “Database Outage” label because it frames the architecture around a business-critical outcome.

Step 1 — Establish context
Campaign launch
12,000 active customers
Checkout traffic rising
Architecture appears healthy

Keep this to 5 seconds.

Step 2 — Run database outage

Expected first result:

CRITICAL

Availability             0%
Checkout success          0%
Writable database path    None
Recovery estimate         47 min
Data-loss risk            High

Timeline:

T+00 Primary database failed
T+01 Replica detected
T+02 Automatic failover not configured
T+03 No writable endpoint available
T+04 Web App A lost required dependency
T+04 Web App B lost required dependency
T+05 Load balancer has no healthy checkout target
T+06 No healthy customer request path
Step 3 — Explain the failure

Highlight the architecture gap directly on the canvas:

Replica exists, but resilience is incomplete.

Missing:
• Automatic promotion
• Failover endpoint
• Application endpoint resolution
• Recovery automation
Step 4 — Apply a resilience package

Use one competition-friendly action:

[Apply Resilience Upgrade]

It should:

Enable failover.
Configure standby promotion.
Add a reachable database endpoint.
Enable application endpoint resolution.
Improve monitoring automation.
Optionally configure synchronous replication.

Show each modification on the graph instead of silently changing data.

Step 5 — Rerun the identical outage

Expected result:

FAILURE CONTAINED

Customer availability     100%
Checkout success          98%
Failover completed        18 sec
Data-loss risk            Low
Customer-visible outage   None

Timeline:

T+00 Primary database failed
T+01 Failure detected
T+04 Standby replica eligible
T+08 Replica promoted
T+12 Database endpoint updated
T+15 Web applications reconnected
T+18 Full checkout capacity restored
Step 6 — Show the trade-off
Reliability          68 → 91
Operational Ex.      72 → 88
Performance          78 → 84
Cost Optimization    70 → 62
Sustainability       65 → 60

The tool must explicitly state:

The improved architecture is more resilient,
but it costs more and keeps additional capacity active.

That preserves the simulator’s core intellectual credibility: architectural improvements should not falsely improve every pillar.

10. Redesign the right-side panel for event viewing

The existing Inspector is useful for editing, but it becomes too dense during a live demonstration.

Design mode tabs
[Configuration] [Dependencies] [Risks]
Simulation mode tabs
[Incident] [Timeline] [Why] [Fix]
Incident tab

Lead with:

Severity.
Availability.
Customer path.
Primary failure.
Recovery status.
Timeline tab

Use a vertically animated sequence with timestamps.

Why tab

Show deterministic reasoning:

Why did Web App A fail?

1. Primary Database is unavailable.
2. Database dependency is required.
3. No reachable writable alternative exists.
4. Therefore, checkout processing cannot continue.
Fix tab

Show:

Recommendation.
Expected impact.
Trade-offs.
Apply button.

Architecture Posture should remain secondary because the current implementation already distinguishes it from live incident effects.

11. Add a presentation mode

Create a dedicated toggle:

[Edit] [Simulate] [Present]
Present mode behavior
Collapse the component library.
Increase canvas width.
Increase node scale by approximately 15%.
Use larger incident typography.
Keep the timeline visible.
Hide low-value editing controls.
Automatically frame affected nodes.
Disable accidental drag operations.
Provide one prominent Next action.

This mode is important because a competition host or judge should not have to interpret an editor interface while watching the demonstration.

12. Improve visual composition
Current layout issue

The screen contains many panels of similar visual weight:

Component library.
Canvas.
Inspector.
Bottom simulation panel.
Pillar scores.
Architecture health.

This produces information density but weakens focal hierarchy.

Recommended hierarchy
Before simulation
Architecture canvas.
Selected scenario.
Main architecture risk.
Inspector.
Component library.
During simulation
Incident severity and customer impact.
Failure propagation on canvas.
Timeline.
Recovery or recommendation.
Architecture posture.
After simulation
Outcome.
Root cause.
Recommendation.
Before/after comparison.
Pillar trade-offs.
13. Add camera and focus behavior

Use subtle canvas framing rather than aggressive zoom.

Rules
On scenario selection, frame the target node and its first-degree dependencies.
When propagation begins, expand framing to affected nodes.
When customer impact is calculated, include the entry path.
During failover, center the primary, replica, and applications.
At result stabilization, fit all affected and protected nodes.

Do not continuously move the camera. A maximum of three camera movements per simulation is sufficient.

14. Add “reason chips” directly to nodes

During simulation, attach temporary reason labels:

Primary DB
[Initiating failure]

Web App A
[Required dependency lost]

Web App B
[No writable alternative]

Replica
[Failover not enabled]

Backup
[Recovery only]

Monitoring
[Detected in 3 sec]

This will allow judges to understand the propagation without reading the complete timeline.

15. Add architecture-story presets

The current project already includes fragile and resilient sample architectures.

Convert the samples into narrative cases:

Preset 1 — Fragile Checkout

Purpose: complete database failure.

Characteristics:

Two web apps.
One primary database.
Replica exists but is not correctly configured.
Backup exists.
Monitoring exists.
Architecture appears mature but contains a hidden resilience gap.

This is more compelling than an obviously weak architecture.

Preset 2 — Resilient Checkout

Purpose: demonstrate successful failover.

Characteristics:

Explicit failover.
Reachable writable standby.
Cross-zone applications.
Monitoring automation.
Tested recovery.
Trade-off in cost and sustainability.
Preset 3 — Flash Sale Under Load

Purpose: traffic spike.

Characteristics:

Cache.
Queue.
Autoscaling.
Capacity headroom.
Visible latency and demand.
16. Revised screen structure
┌──────────────────────────────────────────────────────────────┐
│ FailureForge   The Checkout That Could Not Fail   PRESENT    │
├──────────────────────────────────────────────────────────────┤
│ CRITICAL INCIDENT                                             │
│ Availability 0% · Checkout 0% · Recovery 47 min · Risk High  │
├───────────────────────────────────────┬──────────────────────┤
│                                       │ INCIDENT             │
│          ARCHITECTURE CANVAS          │                      │
│                                       │ Root cause           │
│     Animated nodes and paths          │ Customer impact      │
│                                       │ Recovery state       │
│                                       │                      │
│                                       │ [View Fix]           │
├───────────────────────────────────────┴──────────────────────┤
│ T+00 DB failed → T+03 no failover → T+06 customer outage     │
├──────────────────────────────────────────────────────────────┤
│ Architecture Posture: Rel 90 · Sec 80 · Cost 70 · Sust 65   │
└──────────────────────────────────────────────────────────────┘
17. Implementation priorities
P0 — Required for the competition
Specialized operational node templates.
Design, Simulation, and Comparison node modes.
Business-impact overlay.
Cinematic database-outage sequence.
Presentation mode.
Visible failover route animation.
Before/after rerun experience.
Reason chips on affected nodes.
P1 — Strong vote-generation value
Architecture-story presets.
Camera framing.
Business context panel.
Enhanced timeline animation.
Recommendation impact preview.
Node-level operational metrics.
Full-screen result moment.
P2 — Only after the primary demo is polished
Additional visual treatment for all six scenarios.
Custom edge particles.
Exportable incident report.
Shareable result card.
More architecture themes.
18. Acceptance criteria

The upgrade is complete when a first-time viewer can answer the following without opening the Inspector:

Which component failed?
Which services were affected?
Was the customer path lost?
Did failover occur?
Why did failover succeed or fail?
What is the business impact?
What recommendation fixes the issue?
What architectural trade-off does the fix introduce?

The competition demonstration must also satisfy:

Proposition understood within 10 seconds.
Failure initiated within 20 seconds.
Root cause understood within 15 seconds after propagation.
Recommendation applied with one action.
Identical scenario rerun.
Materially different outcome immediately visible.

These criteria align with the original definition of done, which requires judges to understand the proposition, trigger a failure, observe cascading effects, apply a recommendation, rerun the scenario, and recognize the reliability, cost, and sustainability trade-off.