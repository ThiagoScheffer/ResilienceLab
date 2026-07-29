import React, { DragEvent } from 'react';
import { Globe, GitMerge, Database, Zap, HardDrive, Layers, Shield, Activity, Users, Search, Trash2 } from 'lucide-react';
import { ComponentType } from '../../types/architecture';

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
  const onDragStart = (event: DragEvent, nodeType: ComponentType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const categories = Array.from(new Set(components.map(c => c.category)));

  return (
    <div className="w-64 bg-bg-panel border-r border-border flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold mb-3 text-text-secondary uppercase tracking-wider">Component Library</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search components..." 
            className="w-full bg-bg-deep border border-border rounded-md pl-9 pr-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-app-blue transition-colors"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-medium text-text-secondary mb-2">{category}</h3>
            <div className="space-y-2">
              {components.filter(c => c.category === category).map((comp) => {
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
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <div className="h-20 rounded-md border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-text-secondary hover:border-app-red/50 hover:text-app-red transition-colors bg-bg-deep/50">
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-xs">Drop here to delete</span>
        </div>
      </div>
    </div>
  );
}
