import React from "react";
import { Crosshair, Hand, Link2, Maximize2, PanelBottom, PanelLeft, PanelRight, Presentation, Radar, MousePointer2 } from "lucide-react";
import { useArchitectureStore } from "../../store/architectureStore";
import { DesignerMode } from "../../engine/visualStorytelling";

export default function WorkspaceToolbar() {
  const { workspace, updateWorkspace, designerMode, setDesignerMode } = useArchitectureStore();
  const tools = [{ id: "select" as const, label: "Select", icon: MousePointer2 }, { id: "pan" as const, label: "Pan", icon: Hand }, { id: "connect" as const, label: "Connect", icon: Link2 }];
  const modes: Array<{ id: DesignerMode; label: string; icon: React.ElementType }> = [{ id: "edit", label: "Edit", icon: Crosshair }, { id: "simulate", label: "Simulate", icon: Radar }, { id: "present", label: "Present", icon: Presentation }];
  return <div className="h-11 shrink-0 border-b border-border bg-bg-panel/95 px-2 flex items-center gap-1">
    <div className="flex items-center rounded border border-border bg-bg-deep p-0.5">
      {tools.map(tool => { const Icon = tool.icon; return <button key={tool.id} title={`${tool.label} tool`} onClick={() => updateWorkspace({ canvasTool: tool.id })} className={`rounded p-1.5 ${workspace.canvasTool === tool.id ? "bg-app-orange text-bg-deep" : "text-text-secondary hover:text-white"}`}><Icon className="h-3.5 w-3.5" /></button>; })}
    </div>
    <div className="h-5 border-l border-border" />
    <div className="flex items-center rounded border border-border bg-bg-deep p-0.5">
      {modes.map(mode => { const Icon = mode.icon; return <button key={mode.id} onClick={() => setDesignerMode(mode.id)} className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold ${designerMode === mode.id ? "bg-app-blue text-white" : "text-text-secondary hover:text-white"}`}><Icon className="h-3.5 w-3.5" />{mode.label}</button>; })}
    </div>
    <div className="ml-auto flex items-center gap-1">
      <button title="Fit architecture" onClick={() => window.dispatchEvent(new Event("failureforge:fit-view"))} className="p-1.5 text-text-secondary hover:text-white"><Maximize2 className="h-4 w-4" /></button>
      <button title="Toggle component dock" onClick={() => updateWorkspace({ leftCollapsed: !workspace.leftCollapsed })} className="p-1.5 text-text-secondary hover:text-white"><PanelLeft className="h-4 w-4" /></button>
      <button title="Toggle inspector dock" onClick={() => updateWorkspace({ rightCollapsed: !workspace.rightCollapsed })} className="p-1.5 text-text-secondary hover:text-white"><PanelRight className="h-4 w-4" /></button>
      <button title="Toggle scenario dock" onClick={() => updateWorkspace({ bottomCollapsed: !workspace.bottomCollapsed })} className="p-1.5 text-text-secondary hover:text-white"><PanelBottom className="h-4 w-4" /></button>
    </div>
  </div>;
}
