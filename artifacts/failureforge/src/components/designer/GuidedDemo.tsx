import React, { useEffect, useState } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, CheckCircle } from 'lucide-react';

export default function GuidedDemo() {
  const { architecture, activeScenario, simulationState, applyRecommendation, setScenario } = useArchitectureStore();
  const [step, setStep] = useState(0);

  // If we are not in fragile-startup, do not show demo by default, 
  // but let's just trigger it if architecture ID is fragile-startup and we just loaded it
  // For simplicity, we just use local state to track it.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (architecture.id === "fragile-startup") {
      setIsVisible(true);
      setStep(1);
    } else {
      setIsVisible(false);
    }
  }, [architecture.id]);

  useEffect(() => {
    if (!isVisible) return;

    if (step === 1 && activeScenario?.id === "fs-2") {
      setStep(2);
    } else if (step === 2 && simulationState === "complete") {
      setStep(3);
    } else if (step === 3 && architecture.nodes.length > 3) {
      // Applied recommendation (added nodes)
      setStep(4);
    } else if (step === 4 && simulationState === "complete") {
      setStep(5);
    }
  }, [activeScenario, simulationState, architecture.nodes.length, isVisible, step]);

  const autoSelectScenario = () => {
    setScenario({
      id: "fs-2",
      type: "database-outage",
      name: "Primary Database Outage",
      description: "Simulates a complete loss of the primary database.",
      targetNodeIds: ["node-db-1"],
      severity: "critical"
    });
  };

  const autoApplyFixes = () => {
    applyRecommendation({ type: "update-config", nodeId: "node-webapp-1", changes: { failoverEndpointEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "update-config", nodeId: "node-db-1", changes: { failoverEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "apply-architecture", name: "guided-db-failover", zones: [{ id: "az-b", name: "AZ-B", color: "#121F30" }], nodes: [
      { id: "demo-db-replica", type: "database", name: "Cross-Zone Standby", zoneId: "az-b", position: { x: 820, y: 300 }, configuration: { capacity: 5, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: true, monitoringEnabled: true, failoverEnabled: true, recoveryTimeMinutes: 15, monthlyCostUnits: 90 } },
      { id: "demo-monitoring", type: "monitoring", name: "Monitoring", zoneId: "global", position: { x: 300, y: 80 }, configuration: { capacity: 1, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 15 } }
    ], edges: [
      { source: "node-db-1", target: "demo-db-replica", type: "replication", required: false }, { source: "node-db-1", target: "demo-monitoring", type: "monitoring", required: false }
    ] });
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-8 right-8 w-80 bg-bg-elevated border border-app-blue shadow-[0_0_20px_rgba(47,128,255,0.2)] rounded-xl z-50 overflow-hidden"
      >
        <div className="bg-app-blue/10 p-3 flex items-center justify-between border-b border-border">
          <span className="text-xs font-bold text-app-blue uppercase tracking-wider">Guided Demo</span>
          <button onClick={() => setIsVisible(false)} className="text-text-secondary hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 space-y-4 text-sm">
          {step === 1 && (
            <>
              <p>This architecture has a critical database single point of failure. Let's simulate an outage.</p>
              <button onClick={autoSelectScenario} className="w-full bg-app-blue hover:bg-opacity-90 text-white font-bold py-2 rounded">
                Select Scenario
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <p>Scenario selected. Click <strong>Run Simulation</strong> to see what happens when the primary database fails.</p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-app-red font-bold">Complete outage!</p>
              <p>No writable database path remains. Let's add cross-zone failover and monitoring.</p>
              <button onClick={autoApplyFixes} className="w-full bg-app-cyan hover:bg-opacity-90 text-bg-deep font-bold py-2 rounded">
                Apply Recommended Fixes
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <p>We've added a cross-zone standby, failover endpoint, and monitoring.</p>
              <p>Run the <strong>same scenario</strong> again to see the difference.</p>
            </>
          )}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2 text-app-green font-bold mb-2">
                <CheckCircle className="w-5 h-5" />
                Database failover successful!
              </div>
              <p>The standby promoted and the application switched its database endpoint without customer downtime.</p>
              <button onClick={() => setIsVisible(false)} className="w-full bg-bg-panel border border-border hover:bg-border text-white font-bold py-2 rounded mt-2">
                End Tour
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
