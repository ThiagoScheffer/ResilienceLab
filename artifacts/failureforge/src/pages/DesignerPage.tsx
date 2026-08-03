import React from 'react';
import Navigation from '../components/Navigation';
import ComponentLibrary from '../components/designer/ComponentLibrary';
import ArchitectureCanvas from '../components/canvas/ArchitectureCanvas';
import InspectorPanel from '../components/designer/InspectorPanel';
import SimulationPanel from '../components/designer/SimulationPanel';
import GuidedDemo from '../components/designer/GuidedDemo';
import ResilienceLab from '../components/designer/ResilienceLab';
import { ReactFlowProvider } from '@xyflow/react';
import { useArchitectureStore } from '../store/architectureStore';

export default function DesignerPage() {
  const { designerMode } = useArchitectureStore();
  const isPresenting = designerMode === "present";

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      <div className="md:hidden bg-app-amber/15 text-app-amber text-xs px-3 py-2 text-center">FailureForge is designed for desktop screens. Rotate or use a wider display for the full editor.</div>
      <Navigation />
      <div className="flex-1 flex overflow-hidden">
        {!isPresenting && <ComponentLibrary />}
        <div className="flex-1 flex flex-col relative min-w-0">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
          {!isPresenting && <ResilienceLab />}
          <SimulationPanel />
        </div>
        <InspectorPanel />
      </div>
      <GuidedDemo />
    </div>
  );
}
