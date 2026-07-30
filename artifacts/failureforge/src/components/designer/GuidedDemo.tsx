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

    if (step === 1 && activeScenario?.id === "fs-1") {
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
      id: "fs-1",
      type: "instance-failure",
      name: "Application Instance Failure",
      description: "Simulates a complete crash of a primary compute instance.",
      targetNodeIds: ["node-webapp-1"],
      severity: "high"
    });
  };

  const autoApplyFixes = () => {
    applyRecommendation({ type: "apply-architecture", name: "guided-resilience", zones: [{ id: "az-b", name: "AZ-B", color: "#121F30" }], nodes: [
      { id: "demo-lb", type: "load-balancer", name: "Load Balancer", zoneId: "global", position: { x: 240, y: 220 }, configuration: { capacity: 10, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: true, backupsEnabled: false, monitoringEnabled: true, healthChecksEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 25 } },
      { id: "demo-app-b", type: "web-app", name: "Web App B", zoneId: "az-b", position: { x: 480, y: 340 }, configuration: { capacity: 5, redundant: true, autoscaling: true, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, healthChecksEnabled: true, rollbackEnabled: true, deploymentStrategy: "rolling", recoveryTimeMinutes: 10, monthlyCostUnits: 50 } },
      { id: "demo-monitoring", type: "monitoring", name: "Monitoring", zoneId: "global", position: { x: 300, y: 80 }, configuration: { capacity: 1, redundant: true, autoscaling: false, encrypted: true, publiclyAccessible: false, backupsEnabled: false, monitoringEnabled: true, recoveryTimeMinutes: 5, monthlyCostUnits: 15 } }
    ], edges: [
      { source: "node-users", target: "demo-lb", type: "synchronous", required: true }, { source: "demo-lb", target: "node-webapp-1", type: "synchronous", required: true }, { source: "demo-lb", target: "demo-app-b", type: "synchronous", required: true }, { source: "demo-app-b", target: "node-db-1", type: "synchronous", required: true }, { source: "demo-app-b", target: "demo-monitoring", type: "monitoring", required: false }
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
              <p>This architecture has critical vulnerabilities — Health: 41/100. Let's simulate a failure.</p>
              <button onClick={autoSelectScenario} className="w-full bg-app-blue hover:bg-opacity-90 text-white font-bold py-2 rounded">
                Select Scenario
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <p>Scenario selected. Click the <strong>Run Simulation</strong> button in the bottom panel to see what happens when the instance fails.</p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-app-red font-bold">Complete outage!</p>
              <p>The single point of failure caused the entire system to go down. Let's improve this architecture.</p>
              <button onClick={autoApplyFixes} className="w-full bg-app-cyan hover:bg-opacity-90 text-bg-deep font-bold py-2 rounded">
                Apply Recommended Fixes
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <p>We've added a Load Balancer and a second Application Instance in another AZ.</p>
              <p>Run the <strong>same scenario</strong> again to see the difference.</p>
            </>
          )}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2 text-app-green font-bold mb-2">
                <CheckCircle className="w-5 h-5" />
                100% Availability!
              </div>
              <p>The system gracefully handled the instance failure without downtime. Check out how your pillar scores changed in the Inspector.</p>
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
