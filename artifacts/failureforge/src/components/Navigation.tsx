import React from 'react';
import { Link, useLocation } from 'wouter';
import { Zap, ChevronDown, Download, MousePointer2, Presentation, Radar } from 'lucide-react';
import { useArchitectureStore } from '../store/architectureStore';
import { DesignerMode } from '../engine/visualStorytelling';

import { useToast } from '@/hooks/use-toast';

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { architecture, saveToLocalStorage, setScenario, designerMode, setDesignerMode } = useArchitectureStore();
  const { toast } = useToast();

  const handleSave = () => {
    saveToLocalStorage();
    toast({
      title: "Saved",
      description: "Architecture saved to local storage."
    });
  };

  const modeOptions: Array<{ mode: DesignerMode; label: string; icon: React.ElementType }> = [
    { mode: "edit", label: "Edit", icon: MousePointer2 },
    { mode: "simulate", label: "Simulate", icon: Radar },
    { mode: "present", label: "Present", icon: Presentation }
  ];

  return (
    <header className="h-14 border-b border-border bg-bg-panel flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-app-blue cursor-pointer">
          <Zap className="w-5 h-5 fill-current" />
          <span className="font-bold text-lg tracking-tight">FailureForge</span>
        </Link>

        {location === '/designer' && (
          <div className="flex items-center gap-2 group cursor-pointer hover:bg-bg-elevated px-2 py-1 rounded transition-colors">
            <span className="text-sm font-medium">{architecture.name}</span>
            <ChevronDown className="w-4 h-4 text-text-secondary opacity-50 group-hover:opacity-100" />
          </div>
        )}
      </div>

      {location === '/designer' && (
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border bg-bg-deep p-0.5">
            {modeOptions.map(option => {
              const Icon = option.icon;
              const active = designerMode === option.mode;
              return (
                <button
                  key={option.mode}
                  onClick={() => setDesignerMode(option.mode)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors ${active ? "bg-app-blue text-white" : "text-text-secondary hover:text-white hover:bg-bg-elevated"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <button 
            onClick={handleSave}
            className="text-text-secondary hover:text-white px-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          
          <button onClick={() => { setScenario({ id: "fs-1", type: "instance-failure", name: "Application Instance Failure", description: "Simulates a complete crash of a primary compute instance.", targetNodeIds: [], severity: "high" }); document.getElementById("simulation-panel")?.scrollIntoView({ behavior: "smooth", block: "end" }); }} className="bg-gradient-to-r from-app-blue to-app-cyan hover:opacity-90 text-white px-4 py-1.5 rounded-md text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(47,128,255,0.3)] transition-all">
            <Zap className="w-4 h-4 fill-current" />
            Simulate Failure
          </button>
          
          <div className="w-8 h-8 rounded-full bg-app-purple flex items-center justify-center text-sm font-bold text-white ml-2">
            AM
          </div>
        </div>
      )}
    </header>
  );
}
