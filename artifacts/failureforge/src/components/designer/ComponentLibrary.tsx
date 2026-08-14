import React, { DragEvent, useState } from 'react';
import { Globe, GitMerge, Database, Zap, HardDrive, Layers, Shield, Activity, Users, Search, Trash2, LayoutTemplate } from 'lucide-react';
import { ComponentType } from '../../types/architecture';
import { useArchitectureStore } from '../../store/architectureStore';

const components: { type: ComponentType; name: string; category: string; icon: React.ElementType }[] = [
  { type: "users", name: "Users", category: "Entry", icon: Users },
  { type: "web-app", name: "Web App", category: "Compute", icon: Globe },
  { type: "load-balancer", name: "Load Balancer", category: "Networking", icon: GitMerge },
  { type: "database", name: "Database", category: "Data", icon: Database },
  { type: "cache", name: "Cache", category: "Data", icon: Zap },
  { type: "object-storage", name: "Object Storage", category: "Storage", icon: HardDrive },
  { type: "queue", name: "Queue", category: "Messaging", icon: Layers },
  { type: "backup", name: "Backup", category: "Resilience", icon: Shield },
  { type: "monitoring", name: "Monitoring", category: "Observability", icon: Activity },
];

export default function ComponentLibrary() {
  const [query, setQuery] = useState('');
  const { deleteNode, addZone, loadSampleArchitecture, workspace, updateWorkspace } = useArchitectureStore();
  const onDragStart = (event: DragEvent, nodeType: ComponentType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = Array.from(new Set(components.map(c => c.category)));

  return (
    <div className="w-64 bg-bg-panel border-r border-border flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-border">
        <div className="grid grid-cols-2 rounded-md bg-bg-deep p-1 mb-3">
          {(["components", "presets"] as const).map(tab => <button key={tab} onClick={() => updateWorkspace({ activeLeftTab: tab })} className={`rounded px-2 py-1.5 text-xs font-bold capitalize ${workspace.activeLeftTab === tab ? "bg-app-orange text-bg-deep" : "text-text-secondary"}`}>{tab}</button>)}
        </div>
        {workspace.activeLeftTab === "components" && <>
        <h2 className="text-sm font-semibold mb-3 text-text-secondary uppercase tracking-wider">AWS service palette</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search components..." 
            value={query} onChange={event => setQuery(event.target.value)} className="w-full bg-bg-deep border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-app-blue transition-colors"
          />
        </div></>}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {workspace.activeLeftTab === "presets" && <div className="space-y-3">
          <div className="rounded-lg border border-app-orange/40 bg-app-orange/5 p-3"><LayoutTemplate className="w-5 h-5 text-app-orange mb-2" /><div className="font-bold text-sm">Competition stories</div><p className="mt-1 text-xs leading-relaxed text-text-secondary">Load a complete architecture, then show a failure and its solution.</p></div>
          {[{ id: "fragile-startup", name: "Fragile Checkout", detail: "Hidden database failover gap" }, { id: "resilient-ecommerce", name: "Resilient Checkout", detail: "Automatic recovery path" }, { id: "event-driven", name: "Flash-sale platform", detail: "Async workload pattern" }].map(preset => <button key={preset.id} onClick={() => loadSampleArchitecture(preset.id)} className="w-full text-left rounded-lg border border-border bg-bg-elevated p-3 hover:border-app-orange/60"><div className="text-sm font-bold">{preset.name}</div><div className="mt-1 text-xs text-text-secondary">{preset.detail}</div></button>)}
        </div>}
        {workspace.activeLeftTab === "components" && <>
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-medium text-text-secondary mb-2">{category}</h3>
            <div className="space-y-2">
              {components.filter(c => c.category === category && c.name.toLowerCase().includes(query.toLowerCase())).map((comp) => {
                const Icon = comp.icon;
                return (
                  <div
                    key={comp.type}
                    className="flex items-center gap-3 p-2 rounded-md bg-bg-elevated border border-border cursor-grab hover:border-app-blue/50 transition-colors group"
                    draggable
                    onDragStart={(e) => onDragStart(e, comp.type)}
                  >
                    <div className="w-8 h-8 rounded bg-bg-deep flex items-center justify-center text-text-secondary group-hover:text-app-blue transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{comp.name}</span>
                    <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-50 transition-opacity">
                      <div className="w-1 h-1 rounded-full bg-current"></div>
                      <div className="w-1 h-1 rounded-full bg-current"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        </>}
      </div>
      
      {workspace.activeLeftTab === "components" && <div className="p-4 border-t border-border mt-auto">
        <button onClick={addZone} className="w-full mb-3 py-2 rounded border border-app-blue/40 text-app-blue text-xs font-semibold">Add availability zone</button>
        <div onDragOver={event => event.preventDefault()} onDrop={event => { const id = event.dataTransfer.getData('application/failureforge-node'); if (id) deleteNode(id); }} className="h-20 rounded-md border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-text-secondary hover:border-app-red/50 hover:text-app-red transition-colors bg-bg-deep/50">
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-xs">Drop here to delete</span>
        </div>
      </div>}
    </div>
  );
}
