import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, GitMerge, Database, Zap, HardDrive, Layers, Shield, Activity, Users, AlertTriangle } from 'lucide-react';
import { ComponentType, NodeStatus } from '../../types/architecture';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const iconMap: Record<ComponentType, React.ElementType> = {
  "users": Users,
  "web-app": Globe,
  "load-balancer": GitMerge,
  "database": Database,
  "cache": Zap,
  "object-storage": HardDrive,
  "queue": Layers,
  "backup": Shield,
  "monitoring": Activity
};

const subtitleMap: Record<ComponentType, string> = {
  "users": "External Traffic",
  "web-app": "Compute Instance",
  "load-balancer": "Traffic Routing",
  "database": "Persistent Store",
  "cache": "In-Memory Store",
  "object-storage": "Blob Storage",
  "queue": "Message Broker",
  "backup": "Data Archive",
  "monitoring": "Observability"
};

const statusColors: Record<NodeStatus, string> = {
  "healthy": "bg-app-green",
  "degraded": "bg-app-amber",
  "failed": "bg-app-red",
  "recovering": "bg-app-blue"
};

export default function CustomNode({ data, selected }: any) {
  const Icon = iconMap[data.type as ComponentType] || Globe;
  const subtitle = subtitleMap[data.type as ComponentType] || "Component";
  const status = (data.status || "healthy") as NodeStatus;
  
  const isFailed = status === "failed";
  const isDegraded = status === "degraded";

  return (
    <motion.div 
      animate={isFailed ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      draggable onDragStart={(event) => event.dataTransfer.setData('application/failureforge-node', data.id)} className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border-2 bg-bg-elevated shadow-lg min-w-[200px] transition-all",
        selected ? "border-app-blue shadow-[0_0_15px_rgba(47,128,255,0.2)]" : "border-border",
        isFailed && "border-app-red shadow-[0_0_15px_rgba(240,93,94,0.3)]",
        isDegraded && "border-app-amber"
      )}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-border border-none" />
      
      <div className="relative">
        <div className={cn(
          "w-10 h-10 rounded-md flex items-center justify-center text-white",
          "bg-bg-deep border border-border"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        {data.configuration?.redundant && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-app-blue rounded-full flex items-center justify-center border border-bg-elevated">
            <Shield className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm truncate">{data.name}</span>
          
          {isFailed && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-app-red"
            >
              <AlertTriangle className="w-4 h-4 fill-current text-bg-elevated" />
            </motion.div>
          )}
        </div>
        <span className="text-xs text-text-secondary truncate">{subtitle}</span>
      </div>

      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-bg-elevated",
          statusColors[status]
        )} />
        {isFailed && (
          <div className="absolute inset-0 rounded-full animate-ping bg-app-red opacity-75" />
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-border border-none" />
    </motion.div>
  );
}
