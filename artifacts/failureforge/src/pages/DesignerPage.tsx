import React from 'react';
import Navigation from '../components/Navigation';
import ComponentLibrary from '../components/designer/ComponentLibrary';
import ArchitectureCanvas from '../components/canvas/ArchitectureCanvas';
import InspectorPanel from '../components/designer/InspectorPanel';
import SimulationPanel from '../components/designer/SimulationPanel';
import GuidedDemo from '../components/designer/GuidedDemo';
import { ReactFlowProvider } from '@xyflow/react';

export default function DesignerPage() {
  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      <Navigation />
      <div className="flex-1 flex overflow-hidden">
        <ComponentLibrary />
        <div className="flex-1 flex flex-col relative min-w-0">
          <ReactFlowProvider>
            <ArchitectureCanvas />
          </ReactFlowProvider>
          <SimulationPanel />
        </div>
        <InspectorPanel />
      </div>
      <GuidedDemo />
    </div>
  );
}
