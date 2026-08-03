import React, { useEffect, useState } from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, CheckCircle } from 'lucide-react';

export default function GuidedDemo() {
  const { architecture, activeScenario, simulationState, applyRecommendation, setScenario } = useArchitectureStore();
  const [step, setStep] = useState(0);
  const [fixApplied, setFixApplied] = useState(false);

  // If we are not in fragile-startup, do not show demo by default, 
  // but let's just trigger it if architecture ID is fragile-startup and we just loaded it
  // For simplicity, we just use local state to track it.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (architecture.id === "fragile-startup") {
      setIsVisible(true);
      setStep(1);
      setFixApplied(false);
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
    } else if (step === 3 && fixApplied) {
      setStep(4);
    } else if (step === 4 && simulationState === "complete") {
      setStep(5);
    }
  }, [activeScenario, simulationState, fixApplied, isVisible, step]);

  const autoSelectScenario = () => {
    setScenario({
      id: "fs-2",
      type: "database-outage",
      name: "The Checkout That Could Not Fail",
      description: "A campaign-launch checkout outage where a replica exists but automatic promotion and endpoint resolution are missing.",
      targetNodeIds: ["node-db-1"],
      severity: "critical"
    });
  };

  const autoApplyFixes = () => {
    applyRecommendation({ type: "update-config", nodeId: "node-webapp-1", changes: { failoverEndpointEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "update-config", nodeId: "node-webapp-2", changes: { failoverEndpointEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "update-config", nodeId: "node-db-1", changes: { failoverEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "update-config", nodeId: "node-db-replica", changes: { failoverEnabled: true, monitoringEnabled: true } });
    applyRecommendation({ type: "update-config", nodeId: "node-monitoring", changes: { monitoringEnabled: true, rollbackEnabled: true, recoveryTimeMinutes: 1 } });
    setFixApplied(true);
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
          <span className="text-xs font-bold text-app-blue uppercase tracking-wider">The Checkout That Could Not Fail</span>
          <button onClick={() => setIsVisible(false)} className="text-text-secondary hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 space-y-4 text-sm">
          {step === 1 && (
            <>
              <p>Campaign launch traffic is hitting checkout. The architecture looks mature, but its database resilience is incomplete.</p>
              <button onClick={autoSelectScenario} className="w-full bg-app-blue hover:bg-opacity-90 text-white font-bold py-2 rounded">
                Select Checkout Outage
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <p>Scenario selected. Click <strong>Run Simulation</strong> to prove whether the standby replica is actually usable.</p>
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-app-red font-bold">Critical checkout outage.</p>
              <p>The replica exists, but promotion and endpoint resolution are missing. Backup helps recovery only.</p>
              <button onClick={autoApplyFixes} className="w-full bg-app-cyan hover:bg-opacity-90 text-bg-deep font-bold py-2 rounded">
                Apply Resilience Upgrade
              </button>
            </>
          )}
          {step === 4 && (
            <>
              <p>Failover, endpoint resolution, standby promotion, and monitoring automation are now enabled.</p>
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
