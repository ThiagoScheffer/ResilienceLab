# FailureForge — Replit Build Plan

## 1. Product definition

**FailureForge** is an interactive cloud-architecture simulator where users construct a simplified system, trigger failures, observe cascading effects, and improve the architecture using AWS Well-Architected principles.

### Core interaction

> **Build it → Break it → Understand it → Improve it → Test it again**

The product is not intended to replicate AWS infrastructure or perform real cloud deployment. It is a **visual decision simulator** that abstracts cloud architecture into components, dependencies, failure propagation and architectural trade-offs.

AWS defines six Well-Architected pillars:

1. Operational Excellence
2. Security
3. Reliability
4. Performance Efficiency
5. Cost Optimization
6. Sustainability ([AWS Documentation][1])

These six pillars should govern the scoring system and recommendations.

---

# 2. Recommended Replit implementation

## Architecture decision

Use a **client-heavy React application** with a minimal Node backend.

```text
Browser
│
├── React + TypeScript UI
├── Architecture graph editor
├── Simulation engine
├── Scoring engine
├── Recommendation engine
└── Local persistence
        │
        └── Optional Express API
                │
                └── Replit SQL Database
```

## Recommended technology stack

| Area           | Technology          | Reason                                          |
| -------------- | ------------------- | ----------------------------------------------- |
| Frontend       | React + TypeScript  | Strong component model and type safety          |
| Build tool     | Vite                | Lightweight and fast                            |
| Styling        | Tailwind CSS        | Efficient implementation of the mockup          |
| Diagram canvas | React Flow / XYFlow | Nodes, edges, drag-and-drop and canvas controls |
| State          | Zustand             | Simpler than Redux for this scope               |
| Validation     | Zod                 | Validates architecture JSON                     |
| Icons          | Lucide React        | Consistent lightweight icon set                 |
| Backend        | Express             | Only for saved projects if required             |
| Database       | Replit SQL Database | Native persistence option                       |
| Testing        | Vitest              | Fast unit testing for simulation rules          |
| Deployment     | Static first        | Lowest complexity and resource consumption      |

Replit’s free Starter plan currently supports one published project, a built-in database and monthly credits usable for static or autoscale publishing. ([replit][2])

## Best free-plan strategy

For the competition version:

* Run the simulation entirely in the browser.
* Store projects in `localStorage`.
* Include three prebuilt demo architectures.
* Avoid authentication.
* Avoid external APIs.
* Avoid live AWS integration.
* Use static publishing.
* Add the database only after the core simulator works.

This is superior to starting with a database-backed full-stack system because the core value is the simulation engine, not user management.

Replit warns that published application files are not persistent, so any persistent server-side data would need a database rather than local file writes. ([Replit Docs][3])

---

# 3. MVP scope

The MVP should contain exactly:

## Eight architecture components

1. Web application
2. Load balancer
3. Database
4. Cache
5. Object storage
6. Queue
7. Backup
8. Monitoring

### Multi-zone treatment

Do not implement “Multi-Zone” as a normal service node.

Instead, implement availability zones as **containers**:

```text
Region: ap-southeast-2
├── Availability Zone A
│   ├── Web App A
│   └── Primary Database
└── Availability Zone B
    ├── Web App B
    └── Database Replica
```

This produces a more coherent architecture model than treating redundancy as another draggable service.

## Six failure scenarios

For the first version:

1. Application instance failure
2. Database outage
3. Traffic spike
4. Availability-zone outage
5. Credential compromise
6. Deployment regression

Leave these for later:

* Region-wide failure
* Third-party outage
* Unexpected cost increase
* Storage corruption

A region-wide failure requires cross-region abstractions, which would unnecessarily expand the MVP.

---

# 4. Application structure

## Main screens

### Screen 1 — Landing and project selection

Purpose:

* Explain the product in one sentence.
* Launch the guided demo.
* Start a blank architecture.
* Open sample architectures.

Suggested hero text:

```text
Build it. Break it. Architect it better.

Design a cloud system, simulate failure and discover how resilient
your architecture really is.
```

Actions:

```text
[Try Guided Demo] [Start Blank Architecture]
```

Example cards:

* Fragile Startup
* Resilient E-commerce
* Event-Driven Platform

---

### Screen 2 — System Designer

This is the principal interface shown in the generated preview.

```text
┌──────────────────────────────────────────────────────────────────┐
│ Logo       Project name       Save       Simulate Failure        │
├──────────────┬──────────────────────────────┬────────────────────┤
│ Component    │                              │ Inspector          │
│ Library      │ Architecture Canvas          │                    │
│              │                              │ Component details  │
│ Web App      │ AZ-A       AZ-B              │ Dependencies       │
│ Load Balancer│                              │ Pillar effects     │
│ Database     │ Nodes and connections        │                    │
│ Cache        │                              │                    │
│ Queue        │                              │                    │
├──────────────┴──────────────────────────────┴────────────────────┤
│ Health summary              Selected scenario / Run Simulation  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Screen 3 — Failure Simulation

The same canvas remains visible, but the interface switches into simulation mode.

Changes:

* Component statuses animate.
* Failed nodes turn red.
* Degraded nodes turn amber.
* Healthy nodes remain green.
* Cascading dependencies animate sequentially.
* A timeline explains what occurred.

Example timeline:

```text
00:00  Primary database becomes unavailable
00:01  Web App A loses database connectivity
00:02  Web App B loses database connectivity
00:03  Queue continues accepting write requests
00:05  Read requests fail because no database replica exists
```

---

### Screen 4 — Impact Report

Show:

* Availability impact
* Failed services
* Degraded services
* Data-loss risk
* Recovery estimate
* Cost change
* Six-pillar score changes
* Root cause
* Recommendations

Example:

```text
Simulation result: Severe impact

Customer availability: 18%
Estimated recovery time: 47 minutes
Data-loss risk: Medium
Affected components: 4 of 7
```

---

### Screen 5 — Before-and-after comparison

```text
BEFORE                         AFTER

Reliability       42          Reliability       84
Cost              78          Cost              63
Performance       61          Performance       82
Sustainability    72          Sustainability    65
```

The point is to show that improving reliability can increase cost and resource usage.

That trade-off is critical. FailureForge should not imply that every architectural addition improves every pillar.

---

# 5. Design system

## Visual direction

Use the generated dark interface as the design baseline.

### Colour roles

```text
Background             #08111F
Panel                   #0D1726
Elevated panel          #121F30
Border                  #233349

Primary blue            #2F80FF
Cyan                    #29C6D1
Healthy green           #43D17B
Warning amber           #F7B84B
Failure red             #F05D5E
Purple                  #A46CFF
Text primary            #F3F7FC
Text secondary          #91A1B6
```

The colours must represent semantics consistently:

| Colour | Meaning                   |
| ------ | ------------------------- |
| Green  | Healthy or protected      |
| Amber  | Degraded or warning       |
| Red    | Failed or high risk       |
| Blue   | Selected or informational |
| Purple | Network or routing        |
| Cyan   | Data and replication      |

## Typography

Use:

```text
Font: Inter
Page title: 24px / 700
Section title: 16px / 600
Node title: 14px / 600
Body: 13–14px / 400
Metadata: 11–12px / 500
```

## Spacing

Base spacing system:

```text
4px
8px
12px
16px
24px
32px
```

## Component cards

Each architecture component should show:

* Icon
* Component name
* Type
* Status light
* Zone
* Warning indicator where relevant
* Redundancy shield where applicable

Example:

```text
┌─────────────────────────┐
│ ◉  Primary Database  ⚠  │
│    PostgreSQL            │
│                         │
│ az-a              ◇     │
└─────────────────────────┘
```

---

# 6. User interaction model

## Architecture-building workflow

### Step 1 — Add component

User drags a component from the library to the canvas.

### Step 2 — Configure it

Inspector options:

```text
Name
Availability zone
Capacity
Redundancy
Backup enabled
Monitoring enabled
Public/private exposure
Credential protection
```

### Step 3 — Connect dependencies

The user drags from one component’s output handle to another component.

Example:

```text
Load Balancer → Web App
Web App → Database
Web App → Cache
Web App → Queue
Database → Backup
Monitoring → Web App
Monitoring → Database
```

### Step 4 — Validate architecture

Before simulation, the application identifies structural errors:

* No user entry point
* Orphan component
* Circular dependency
* Database with no consumer
* Backup disconnected from database
* Load balancer with only one target

### Step 5 — Select failure

The application shows only failure scenarios relevant to the current architecture.

For example:

* Database outage appears only when a database exists.
* Zone outage appears only when zones exist.
* Credential compromise appears for public or credential-bearing components.

### Step 6 — Run simulation

The graph engine propagates the failure.

### Step 7 — Apply recommendation

The user selects a recommendation such as:

```text
Add a standby database replica
```

FailureForge can either:

* Automatically add the component, or
* Highlight where the user should add it.

For the MVP, automatic application is more demonstrable.

---

# 7. Data model

## Architecture

```ts
interface Architecture {
  id: string;
  name: string;
  region: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  zones: AvailabilityZone[];
  createdAt: string;
  updatedAt: string;
}
```

## Node

```ts
type ComponentType =
  | "web-app"
  | "load-balancer"
  | "database"
  | "cache"
  | "object-storage"
  | "queue"
  | "backup"
  | "monitoring";

type NodeStatus =
  | "healthy"
  | "degraded"
  | "failed"
  | "recovering";

interface ArchitectureNode {
  id: string;
  type: ComponentType;
  name: string;
  zoneId: string;
  position: {
    x: number;
    y: number;
  };
  configuration: NodeConfiguration;
  status: NodeStatus;
}
```

## Configuration

```ts
interface NodeConfiguration {
  capacity: number;
  redundant: boolean;
  autoscaling: boolean;
  encrypted: boolean;
  publiclyAccessible: boolean;
  backupsEnabled: boolean;
  monitoringEnabled: boolean;
  recoveryTimeMinutes: number;
  monthlyCostUnits: number;
}
```

Use **cost units**, not real AWS prices, in the MVP.

Example:

```text
Web App instance          10 units
Load balancer              8 units
Database                  20 units
Database replica          16 units
Backup                     5 units
Monitoring                 4 units
```

This avoids creating inaccurate pricing claims while still demonstrating trade-offs.

## Edges

```ts
type DependencyType =
  | "synchronous"
  | "asynchronous"
  | "replication"
  | "monitoring"
  | "backup";

interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  required: boolean;
}
```

## Failure scenario

```ts
type FailureType =
  | "instance-failure"
  | "database-outage"
  | "traffic-spike"
  | "zone-outage"
  | "credential-compromise"
  | "deployment-regression";

interface FailureScenario {
  id: string;
  type: FailureType;
  name: string;
  description: string;
  targetNodeIds: string[];
  severity: "low" | "medium" | "high" | "critical";
  parameters: Record<string, number | string | boolean>;
}
```

---

# 8. Simulation engine

The simulator should be deterministic.

Do not use generative AI to decide whether a component fails.

## Simulation pipeline

```text
1. Clone architecture state
2. Apply initiating failure
3. Identify direct dependants
4. Evaluate dependency criticality
5. Check redundancy and fallback
6. Propagate degradation or failure
7. Repeat until state stabilizes
8. Calculate business impact
9. Recalculate pillar scores
10. Generate recommendations
```

## Core propagation algorithm

```ts
function simulateFailure(
  architecture: Architecture,
  scenario: FailureScenario
): SimulationResult {
  const state = createInitialSimulationState(architecture);
  const queue = applyInitialFailure(state, scenario);
  const events: SimulationEvent[] = [];

  while (queue.length > 0) {
    const failedNodeId = queue.shift()!;
    const dependants = findDependants(architecture, failedNodeId);

    for (const dependant of dependants) {
      const outcome = evaluateDependencyFailure({
        architecture,
        state,
        dependant,
        failedDependencyId: failedNodeId,
        scenario,
      });

      if (outcome.statusChanged) {
        state.nodes[dependant.id].status = outcome.newStatus;
        events.push(outcome.event);

        if (outcome.newStatus === "failed") {
          queue.push(dependant.id);
        }
      }
    }
  }

  return buildSimulationResult(architecture, state, events);
}
```

## Critical dependency logic

Example:

```ts
if (
  dependency.required &&
  failedDependency.status === "failed" &&
  !hasHealthyAlternative(dependant, architecture, state)
) {
  return "failed";
}
```

## Optional dependency logic

```ts
if (
  failedDependency.status === "failed" &&
  dependency.required === false
) {
  return "degraded";
}
```

## Zone outage logic

```text
Fail all components in target zone
             ↓
Check whether equivalents exist elsewhere
             ↓
Redirect traffic where possible
             ↓
Evaluate remaining capacity
             ↓
Mark services healthy, degraded or failed
```

---

# 9. Failure rules

## 9.1 Application instance failure

### Initial effect

Target web application fails.

### Survival conditions

The service survives when:

* Another healthy web application exists.
* The load balancer connects to it.
* Remaining capacity is sufficient.

### Recommendations

* Add a second application instance.
* Distribute instances across zones.
* Add health checks.
* Add autoscaling.

---

## 9.2 Database outage

### Initial effect

Primary database fails.

### Survival conditions

The service survives when:

* A healthy replica exists.
* Failover is enabled.
* Dependent applications can reach the replica.

### Data-loss risk

```text
Synchronous replica       Low
Asynchronous replica      Medium
No replica                High
Backup only               Medium to high
No backup                 Critical
```

### Recommendations

* Add a standby replica.
* Enable automated failover.
* Add backups.
* Test restoration.
* Add database monitoring.

---

## 9.3 Traffic spike

### Initial effect

Traffic demand increases by a configured multiplier.

Example:

```text
Normal demand: 100 units
Spike: ×5
Required capacity: 500 units
```

### Capacity calculation

```ts
availableCapacity =
  sum(healthyWebApps.map((node) => node.configuration.capacity));
```

### Result

```text
Available capacity ≥ demand    Healthy
Available capacity ≥ 70%       Degraded
Available capacity < 70%       Failed
```

### Recommendations

* Add autoscaling.
* Add cache.
* Add additional application capacity.
* Use a queue for asynchronous work.

---

## 9.4 Availability-zone outage

### Initial effect

All nodes in one zone fail.

### Survival conditions

* Critical workloads exist in another zone.
* The load balancer can route across zones.
* The remaining database is writable.
* Capacity remains adequate.

### Recommendation

* Distribute critical components across at least two zones.

---

## 9.5 Credential compromise

### Initial effect

A selected public component’s credentials are compromised.

### Impact factors

* Public accessibility
* Encryption
* Credential scope
* Logging
* Monitoring
* Credential rotation
* Connected data stores

### Result

This scenario should propagate **security exposure**, not infrastructure failure.

Example:

```text
Web App credentials compromised
              ↓
Database is reachable from Web App
              ↓
Object storage is reachable
              ↓
Customer data exposure risk increases
```

---

## 9.6 Deployment regression

### Initial effect

A new web application version becomes unhealthy.

### Survival conditions

* Multiple versions exist.
* Rolling or blue/green deployment is configured.
* Health checks are enabled.
* Rollback is available.

### Recommendations

* Add staged deployment.
* Add rollback.
* Add health checks.
* Add deployment monitoring.

---

# 10. Six-pillar scoring engine

Each pillar receives a score from 0 to 100.

## Do not score everything equally

Use weighted rules.

```ts
interface ScoreRule {
  id: string;
  pillar: Pillar;
  condition: (architecture: Architecture) => boolean;
  scoreChange: number;
  explanation: string;
}
```

## Reliability score example

Starting score:

```text
50 points
```

Adjustments:

| Rule                           | Change |
| ------------------------------ | -----: |
| Multiple web instances         |    +10 |
| Web instances across zones     |    +10 |
| Database replica               |    +12 |
| Automated backups              |     +8 |
| Monitoring                     |     +5 |
| Single database                |    −15 |
| Single web instance            |    −10 |
| Critical component in one zone |    −10 |

Clamp the final score:

```ts
Math.max(0, Math.min(100, score));
```

## Security score example

| Rule                        | Change |
| --------------------------- | -----: |
| Encryption enabled          |    +10 |
| Private database            |    +15 |
| Monitoring enabled          |     +8 |
| Least-privilege credentials |    +12 |
| Public database             |    −30 |
| Unencrypted sensitive store |    −25 |
| No security monitoring      |    −10 |

## Operational Excellence

Measures:

* Monitoring
* Deployment safety
* Recovery procedures
* Observability
* Backup testing

## Performance Efficiency

Measures:

* Caching
* Scaling capability
* Capacity match
* Queue usage
* Bottlenecks

## Cost Optimization

Measures:

* Unused redundancy
* Excess capacity
* Duplicate resources
* Autoscaling
* Resource utilization

## Sustainability

Measures:

* Utilization
* Overprovisioning
* Idle resources
* Unnecessary duplication
* Efficient scaling

## Essential scoring principle

Adding redundancy should produce trade-offs:

```text
Database replica

Reliability       +12
Performance       +4
Cost              −8
Sustainability    −4
```

That makes the simulator intellectually credible.

---

# 11. Recommendation engine

The recommendation system should be rule-based.

## Recommendation format

```ts
interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  affectedPillars: Pillar[];
  estimatedScoreImpact: Partial<Record<Pillar, number>>;
  action: RecommendationAction;
}
```

## Example recommendation

```json
{
  "id": "add-db-replica",
  "title": "Add a standby database replica",
  "description": "The primary database is currently a single point of failure.",
  "priority": "critical",
  "affectedPillars": [
    "reliability",
    "performance-efficiency",
    "cost-optimization",
    "sustainability"
  ],
  "estimatedScoreImpact": {
    "reliability": 18,
    "performance-efficiency": 4,
    "cost-optimization": -8,
    "sustainability": -4
  },
  "action": {
    "type": "add-node",
    "componentType": "database",
    "configurationPreset": "standby-replica"
  }
}
```

## Prioritization formula

```text
Priority =
Severity × Failure probability × Business impact
────────────────────────────────────────────────
Implementation effort
```

For the MVP, use integer values from 1 to 5.

---

# 12. Folder structure

```text
failureforge/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── architecture/
│   │   │   │   ├── ArchitectureCanvas.tsx
│   │   │   │   ├── ArchitectureNode.tsx
│   │   │   │   ├── AvailabilityZone.tsx
│   │   │   │   └── DependencyEdge.tsx
│   │   │   ├── component-library/
│   │   │   │   ├── ComponentLibrary.tsx
│   │   │   │   └── DraggableComponent.tsx
│   │   │   ├── inspector/
│   │   │   │   ├── ComponentInspector.tsx
│   │   │   │   └── ConfigurationForm.tsx
│   │   │   ├── simulation/
│   │   │   │   ├── ScenarioSelector.tsx
│   │   │   │   ├── SimulationControls.tsx
│   │   │   │   ├── SimulationTimeline.tsx
│   │   │   │   └── ImpactReport.tsx
│   │   │   ├── scoring/
│   │   │   │   ├── PillarScores.tsx
│   │   │   │   └── ArchitectureHealth.tsx
│   │   │   └── recommendations/
│   │   │       └── RecommendationPanel.tsx
│   │   ├── engine/
│   │   │   ├── simulationEngine.ts
│   │   │   ├── propagationEngine.ts
│   │   │   ├── scoringEngine.ts
│   │   │   ├── recommendationEngine.ts
│   │   │   └── validationEngine.ts
│   │   ├── rules/
│   │   │   ├── failureRules.ts
│   │   │   ├── scoringRules.ts
│   │   │   └── recommendationRules.ts
│   │   ├── data/
│   │   │   ├── componentCatalog.ts
│   │   │   ├── sampleArchitectures.ts
│   │   │   └── failureScenarios.ts
│   │   ├── store/
│   │   │   └── architectureStore.ts
│   │   ├── types/
│   │   │   ├── architecture.ts
│   │   │   ├── simulation.ts
│   │   │   └── scoring.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── DesignerPage.tsx
│   │   │   └── ResultsPage.tsx
│   │   └── App.tsx
│   └── package.json
├── server/
│   ├── index.ts
│   └── routes/
├── shared/
│   └── schema.ts
└── README.md
```

For the first implementation, `server/` can remain unused.

---

# 13. Build phases

## Phase 1 — Static interface

Deliverables:

* Dark application shell
* Component sidebar
* Canvas
* Inspector
* Pillar-score panel
* Scenario panel
* Responsive desktop layout

Acceptance criterion:

> The interface closely resembles the generated concept and works at 1366×768 and above.

---

## Phase 2 — Architecture editor

Deliverables:

* Drag components onto canvas
* Move nodes
* Connect nodes
* Delete nodes and edges
* Edit node configuration
* Create availability zones
* Save to local storage

Acceptance criterion:

> A user can reproduce the sample architecture without editing JSON.

---

## Phase 3 — Validation engine

Deliverables:

* Single-point-of-failure detection
* Orphan detection
* Invalid connection detection
* Missing backup detection
* Missing monitoring detection
* Capacity warnings

Acceptance criterion:

> Architectural warnings update immediately when the graph changes.

---

## Phase 4 — First working simulation

Implement only:

* Application instance failure
* Database outage

Deliverables:

* Failure propagation
* Status animation
* Event timeline
* Impact summary
* Reset simulation

Acceptance criterion:

> The fragile architecture fails and the resilient architecture survives the same scenario.

---

## Phase 5 — Six-pillar scoring

Deliverables:

* Baseline scores
* Post-failure scores
* Score explanations
* Trade-off indicators
* Before-and-after comparison

Acceptance criterion:

> Every score movement has a visible explanation.

---

## Phase 6 — Recommendations

Deliverables:

* Prioritized recommendations
* Pillar impact preview
* Apply recommendation
* Rerun simulation

Acceptance criterion:

> The guided demo can apply redundancy and visibly improve the second result.

---

## Phase 7 — Remaining scenarios

Implement:

* Traffic spike
* Zone outage
* Credential compromise
* Deployment regression

---

## Phase 8 — Competition polish

Deliverables:

* Landing page
* Guided demo
* Three sample architectures
* Smooth animations
* Empty states
* Error handling
* Mobile warning
* Reset demo button
* Loading and simulation states

---

# 14. Suggested development priority

```text
P0 — Required to demonstrate the concept
─────────────────────────────────────────
Architecture canvas
Components and connections
Database outage
Failure propagation
Pillar scoring
Recommendation application
Before/after comparison

P1 — Strong competition value
─────────────────────────────────────────
Guided demo
Traffic spike
Zone outage
Timeline animation
Sample architectures
Architecture validation

P2 — Optional
─────────────────────────────────────────
Credential compromise
Deployment regression
Project persistence
Export/import JSON
Downloadable report

P3 — Do not build for MVP
─────────────────────────────────────────
Authentication
Real AWS API integration
Terraform generation
Real AWS pricing
Multiplayer editing
AI-generated architecture
Billing
Enterprise permissions
```

---

# 15. Guided demonstration

The product should open with a **90-second guided demo**.

## Initial architecture

```text
Users
  ↓
Web App
  ↓
Database
```

Initial analysis:

```text
Architecture Health: 41/100

Critical risks:
• Web App is a single point of failure
• Database is a single point of failure
• No monitoring exists
• No backup exists
```

## First simulation

Scenario:

```text
Application Instance Failure
```

Result:

```text
Application availability: 0%
Failed services: Web App
Customer impact: Complete outage
Estimated recovery: 35 minutes
```

## Improvement

FailureForge recommends:

```text
• Add Load Balancer
• Add second Web App
• Place second Web App in AZ-B
• Add Monitoring
```

The user presses:

```text
[Apply Recommended Architecture]
```

## Second simulation

Run the same failure.

Result:

```text
Application availability: 100%
Traffic rerouted to Web App B
Customer-visible outage: None
Reliability score: 42 → 82
Cost score: 84 → 68
Sustainability score: 78 → 70
```

This is the strongest demonstration because it proves resilience while showing the associated cost and sustainability trade-offs.

---

# 16. Initial Replit Agent prompt

Use this as the first Replit build instruction:

```text
Build a polished desktop-first React and TypeScript web application named
FailureForge.

FailureForge is an interactive cloud architecture failure simulator. Users
visually construct a simplified architecture using draggable components,
connect dependencies, trigger failure scenarios, observe cascading failures,
review six AWS Well-Architected pillar scores, and apply architecture
recommendations.

Use:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Flow or XYFlow for the diagram editor
- Zustand for application state
- Lucide React icons
- Vitest for engine tests

Do not add authentication, external APIs, payment systems, generative AI or
real AWS integrations.

Create a dark-mode interface with these areas:

1. Top navigation:
   - FailureForge logo
   - Project name
   - Save button
   - Prominent “Simulate Failure” button

2. Left sidebar:
   - Title: Component Library
   - Draggable components:
     Web App
     Load Balancer
     Database
     Cache
     Object Storage
     Queue
     Backup
     Monitoring

3. Central architecture canvas:
   - Dot-grid background
   - Zoom and fit controls
   - Availability-zone containers
   - Draggable architecture nodes
   - Directed dependency edges
   - Node statuses: healthy, warning, degraded and failed

4. Right inspector:
   - Selected component name
   - Type
   - Availability zone
   - Capacity
   - Redundancy
   - Encryption
   - Public/private exposure
   - Backup status
   - Monitoring status
   - Incoming and outgoing dependencies

5. Bottom simulation panel:
   - Selected failure scenario
   - Estimated impact
   - Run Simulation button

6. Six-pillar score panel:
   - Operational Excellence
   - Security
   - Reliability
   - Performance Efficiency
   - Cost Optimization
   - Sustainability

Use this visual system:
- Background #08111F
- Panels #0D1726 and #121F30
- Borders #233349
- Primary blue #2F80FF
- Healthy green #43D17B
- Warning amber #F7B84B
- Failure red #F05D5E
- Primary text #F3F7FC
- Secondary text #91A1B6
- Inter font
- Rounded panels, subtle shadows and clear status indicators

Initially build only the interface and architecture editing functionality.
Do not implement the simulation engine yet.

Include one sample e-commerce architecture:
Users → Load Balancer → Web App A and Web App B
Web Apps → Cache, Queue and Primary Database
Primary Database → Replica, Backup and Monitoring

Organize the project into reusable components and strongly typed domain models.
```

---

# 17. Subsequent Replit prompts

Do not ask Replit Agent to build everything in one operation.

## Prompt 2 — State and persistence

```text
Implement a strongly typed Zustand architecture store.

The store must support:
- Add node
- Update node
- Delete node
- Add edge
- Delete edge
- Move node
- Assign node to availability zone
- Select node
- Save architecture to localStorage
- Load architecture from localStorage
- Reset to sample architecture

Use immutable state updates and TypeScript interfaces.
Do not implement simulations yet.
```

## Prompt 3 — Validation

```text
Create a deterministic architecture validation engine.

Detect:
- Single web application
- Single database
- Critical components located in only one availability zone
- Database without backup
- Components without monitoring
- Load balancer with fewer than two targets
- Publicly accessible database
- Orphan nodes
- Broken dependency references

Return structured findings containing:
id, title, explanation, severity, affectedNodeIds and affectedPillars.

Display findings in the inspector and architecture health panel.
```

## Prompt 4 — Simulation

```text
Implement the deterministic failure simulation engine.

Start with two scenarios:
1. Application Instance Failure
2. Database Outage

The engine must:
- Clone the architecture
- Apply the initial node failure
- Find dependent nodes using graph traversal
- Check whether each dependency is required
- Check for healthy alternatives
- Check redundancy and failover
- Propagate failed or degraded status
- Produce an ordered simulation timeline
- Calculate customer availability
- Estimate recovery time
- Calculate data-loss risk
- Return affected nodes and root cause

Do not use AI or random results.
Add Vitest unit tests for fragile and resilient architectures.
```

## Prompt 5 — Scoring

```text
Implement a rule-based six-pillar scoring engine.

Every pillar receives a score from 0 to 100:
- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

Create transparent scoring rules with:
pillar, condition, score change and explanation.

Display:
- Current score
- Post-simulation score
- Score delta
- Reasons for every change

Model trade-offs. Adding redundancy should improve reliability but reduce cost
optimization and potentially sustainability.
```

## Prompt 6 — Guided demonstration

```text
Build a guided demo called “From Fragile to Resilient.”

Start with:
Users → Web App → Database

Guide the user through:
1. Running an application instance failure
2. Observing complete outage
3. Reviewing recommendations
4. Automatically adding a load balancer and second web app in another zone
5. Running the same failure again
6. Showing that traffic is rerouted
7. Comparing before and after pillar scores

The entire guided demo should take approximately 90 seconds and include concise
tooltips and animated node status changes.
```

---

# 18. Definition of done

FailureForge is competition-ready when a judge can:

1. Open the app without creating an account.
2. Understand the proposition within 10 seconds.
3. Start a guided demo with one click.
4. Trigger a failure within 30 seconds.
5. See cascading effects visually.
6. Understand why the architecture failed.
7. Apply a recommendation.
8. Rerun the same scenario.
9. See a materially different outcome.
10. Understand the reliability, cost and sustainability trade-off.

## Final strategic recommendation

Build the **guided failure demonstration first**, not the complete generic architecture editor.

The correct order is:

```text
Guided demo
→ Simulation engine
→ Scoring and recommendations
→ Generic drag-and-drop editor
→ Additional failure scenarios
```

A polished, deterministic demonstration with one fragile and one resilient architecture has greater judging value than a broad editor containing incomplete simulation logic.

[1]: https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html?utm_source=chatgpt.com "The pillars of the framework - AWS Well-Architected ..."

