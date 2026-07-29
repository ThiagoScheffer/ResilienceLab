import React from 'react';
import { useArchitectureStore } from '../../store/architectureStore';
import { calculateScores, getOverallHealth, getHealthLabel } from '../../engine/scoringEngine';
import { Pillar } from '../../types/architecture';
import { Shield, Settings, Activity, Zap, DollarSign, Leaf } from 'lucide-react';

const pillarIcons: Record<Pillar, React.ElementType> = {
  "reliability": Shield,
  "security": Settings,
  "operational-excellence": Activity,
  "performance": Zap,
  "cost": DollarSign,
  "sustainability": Leaf
};

const pillarLabels: Record<Pillar, string> = {
  "reliability": "Reliability",
  "security": "Security",
  "operational-excellence": "Operational Excellence",
  "performance": "Performance",
  "cost": "Cost Optimization",
  "sustainability": "Sustainability"
};

const pillarColors: Record<Pillar, string> = {
  "reliability": "bg-app-blue",
  "security": "bg-app-cyan",
  "operational-excellence": "bg-app-purple",
  "performance": "bg-app-amber",
  "cost": "bg-app-green",
  "sustainability": "bg-app-green"
};

export default function InspectorPanel() {
  const { architecture, selectedNodeId, updateNode, simulationResult, applyRecommendation } = useArchitectureStore();
  
  const selectedNode = architecture.nodes.find(n => n.id === selectedNodeId);
  const scores = calculateScores(architecture);
  const overallHealth = getOverallHealth(scores);
  
  // Use post-simulation scores if available
  const displayScores = simulationResult ? simulationResult.pillarScoresAfter : scores;
  const displayHealth = getOverallHealth(displayScores);
  const healthColor = displayHealth >= 80 ? "text-app-green" : displayHealth >= 50 ? "text-app-amber" : "text-app-red";

  return (
    <div className="w-80 bg-bg-panel border-l border-border flex flex-col h-full shrink-0 overflow-y-auto">
      
      {!selectedNode ? (
        <div className="p-5 flex flex-col gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-bg-deep rounded-xl border border-border">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="var(--border)" strokeWidth="12" />
                <circle 
                  cx="64" cy="64" r="56" fill="none" 
                  stroke="currentColor" strokeWidth="12" 
                  strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * displayHealth) / 100}
                  className={healthColor + " transition-all duration-1000"}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold">{displayHealth}</span>
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{getHealthLabel(displayHealth)}</span>
              </div>
            </div>
            <h3 className="mt-4 font-semibold">Architecture Health</h3>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Six Pillars</h3>
            {(Object.keys(pillarLabels) as Pillar[]).map(pillar => {
              const Icon = pillarIcons[pillar];
              const score = displayScores[pillar];
              const delta = simulationResult ? score - scores[pillar] : 0;

              return (
                <div key={pillar} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-text-secondary" />
                      <span className="font-medium">{pillarLabels[pillar]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {delta !== 0 && (
                        <span className={`text-xs ${delta > 0 ? 'text-app-green' : 'text-app-red'}`}>
                          {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                        </span>
                      )}
                      <span className="font-bold">{score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-bg-deep rounded-full overflow-hidden">
                    <div className={`h-full ${pillarColors[pillar]} transition-all duration-500`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {simulationResult && simulationResult.recommendations.length > 0 && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Recommendations</h3>
              {simulationResult.recommendations.slice(0,3).map(rec => (
                <div key={rec.id} className="bg-bg-deep border border-border p-3 rounded-lg space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-sm leading-tight text-app-cyan">{rec.title}</h4>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      rec.priority === 'critical' ? 'bg-app-red/20 text-app-red' : 
                      rec.priority === 'high' ? 'bg-app-amber/20 text-app-amber' : 
                      'bg-app-blue/20 text-app-blue'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{rec.description}</p>
                  <button 
                    onClick={() => applyRecommendation(rec.action)}
                    className="w-full mt-2 py-1.5 text-xs font-semibold bg-bg-elevated hover:bg-border rounded text-text-primary transition-colors"
                  >
                    Apply Fix
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">Selected Node</h3>
              <input 
                type="text" 
                value={selectedNode.name}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="w-full bg-bg-deep border border-border rounded-md px-3 py-2 font-bold focus:border-app-blue focus:outline-none transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <span className="px-2 py-1 bg-bg-deep border border-border rounded text-xs text-text-secondary font-medium uppercase tracking-wider">
                {selectedNode.type}
              </span>
              <span className="px-2 py-1 bg-bg-deep border border-border rounded text-xs text-text-secondary font-medium uppercase tracking-wider">
                {selectedNode.zoneId}
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Configuration</h3>
              
              <label className="flex items-center justify-between text-sm cursor-pointer group">
                <span className="text-text-secondary group-hover:text-text-primary transition-colors">High Availability</span>
                <input 
                  type="checkbox" 
                  checked={selectedNode.configuration.redundant}
                  onChange={(e) => updateNode(selectedNode.id, { 
                    configuration: { ...selectedNode.configuration, redundant: e.target.checked }
                  })}
                  className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                />
              </label>

              {['web-app', 'load-balancer', 'queue'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Auto-scaling</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.autoscaling}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, autoscaling: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}

              {['database', 'object-storage', 'cache'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Encryption at Rest</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.encrypted}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, encrypted: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}
              
              {['database'].includes(selectedNode.type) && (
                <label className="flex items-center justify-between text-sm cursor-pointer group">
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors">Automated Backups</span>
                  <input 
                    type="checkbox" 
                    checked={selectedNode.configuration.backupsEnabled}
                    onChange={(e) => updateNode(selectedNode.id, { 
                      configuration: { ...selectedNode.configuration, backupsEnabled: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-border bg-bg-deep text-app-blue focus:ring-app-blue focus:ring-offset-bg-panel"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
