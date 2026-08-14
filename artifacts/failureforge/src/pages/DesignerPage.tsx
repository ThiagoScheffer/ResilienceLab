import React from 'react';
import Navigation from '../components/Navigation';
import ComponentLibrary from '../components/designer/ComponentLibrary';
import ArchitectureCanvas from '../components/canvas/ArchitectureCanvas';
import InspectorPanel from '../components/designer/InspectorPanel';
import SimulationPanel from '../components/designer/SimulationPanel';
import GuidedDemo from '../components/designer/GuidedDemo';
import ResilienceLab from '../components/designer/ResilienceLab';
import WorkspaceToolbar from '../components/designer/WorkspaceToolbar';
import { ReactFlowProvider } from '@xyflow/react';
import { useArchitectureStore } from '../store/architectureStore';

export default function DesignerPage() {
  const { designerMode, workspace, updateWorkspace } = useArchitectureStore();
  const isPresenting = designerMode === "present";
  const resize = (edge: "leftWidth" | "rightWidth" | "bottomHeight", start: number, event: React.MouseEvent, invert = false) => {
    const origin = edge === "leftWidth" ? workspace.leftWidth : edge === "rightWidth" ? workspace.rightWidth : workspace.bottomHeight;
    const axis = edge === "bottomHeight" ? "clientY" : "clientX";
    const onMove = (move: MouseEvent) => { const delta = (move[axis] - start) * (invert ? -1 : 1); const bounds = edge === "bottomHeight" ? [140, 380] : [224, 440]; updateWorkspace({ [edge]: Math.max(bounds[0], Math.min(bounds[1], origin + delta)) }); };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
      <div className="md:hidden bg-app-amber/15 text-app-amber text-xs px-3 py-2 text-center">FailureForge is designed for desktop screens. Rotate or use a wider display for the full editor.</div>
      <Navigation />
      <div className="flex-1 flex overflow-hidden">
        {!isPresenting && !workspace.leftCollapsed && <><aside style={{ width: workspace.leftWidth }} className="h-full shrink-0"><ComponentLibrary /></aside><div onMouseDown={event => resize("leftWidth", event.clientX, event)} className="dock-resizer-x" /></>}
        <div className="flex-1 flex flex-col relative min-w-0">
          <ReactFlowProvider>
            <WorkspaceToolbar />
            <ArchitectureCanvas />
          </ReactFlowProvider>
          {!isPresenting && !workspace.bottomCollapsed && <ResilienceLab />}
          {!workspace.bottomCollapsed && <><div onMouseDown={event => resize("bottomHeight", event.clientY, event, true)} className="dock-resizer-y" /><div style={{ height: workspace.bottomHeight }}><SimulationPanel /></div></>}
        </div>
        {!workspace.rightCollapsed && <><div onMouseDown={event => resize("rightWidth", event.clientX, event, true)} className="dock-resizer-x" /><aside style={{ width: workspace.rightWidth }} className="h-full shrink-0"><InspectorPanel /></aside></>}
      </div>
      <GuidedDemo />
    </div>
  );
}
