import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, GitMerge, Database, Zap, HardDrive, Layers, Shield, Activity, Users, AlertTriangle, Lock, Radio, Gauge, Route, Server, ArchiveRestore, Eye } from 'lucide-react';
import { ComponentType } from '../../types/architecture';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { NodeStory, OperationalVisualState } from '../../engine/visualStorytelling';
import { getAwsServicePreset } from '../../lib/awsServicePresets';

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

const statusStyles: Record<OperationalVisualState, { border: string; glow: string; label: string; text: string; dot: string }> = {
  healthy: { border: "border-app-green/60", glow: "shadow-[0_0_16px_rgba(67,209,123,0.12)]", label: "Healthy", text: "text-app-green", dot: "bg-app-green" },
  protected: { border: "border-app-cyan/80", glow: "shadow-[0_0_20px_rgba(41,198,209,0.22)]", label: "Protected", text: "text-app-cyan", dot: "bg-app-cyan" },
  degraded: { border: "border-app-amber/80", glow: "shadow-[0_0_16px_rgba(247,184,75,0.16)]", label: "Degraded", text: "text-app-amber", dot: "bg-app-amber" },
  failed: { border: "border-app-red/90", glow: "shadow-[0_0_18px_rgba(240,93,94,0.22)] opacity-90", label: "Failed", text: "text-app-red", dot: "bg-app-red" },
  recovering: { border: "border-app-blue/80", glow: "shadow-[0_0_18px_rgba(47,128,255,0.2)]", label: "Recovering", text: "text-app-blue", dot: "bg-app-blue" }
};

export default function CustomNode({ data, selected }: any) {
  const Icon = iconMap[data.type as ComponentType] || Globe;
  const story = data.story as NodeStory;
  const visualState = story?.visualState ?? data.status ?? "healthy";
  const styles = statusStyles[visualState as OperationalVisualState] ?? statusStyles.healthy;
  const isFailed = visualState === "failed";
  const isProtected = visualState === "protected";
  const isSimulation = story?.presentationMode === "simulation";
  const isComparison = story?.presentationMode === "comparison";
  const isPresenting = data.designerMode === "present";
  const awsPreset = getAwsServicePreset(data);
  const awsIcon = awsPreset.id === "users" ? null : `${import.meta.env.BASE_URL}aws-icons/${awsPreset.id}.svg`;

  return (
    <motion.div 
      animate={isFailed ? { x: [-2, 2, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      draggable={data.designerMode !== "present"}
      onDragStart={(event: any) => event.dataTransfer?.setData('application/failureforge-node', data.id)}
      className={cn(
        "relative w-[260px] rounded-lg border bg-bg-elevated/95 shadow-lg transition-all overflow-hidden",
        isPresenting && "w-[298px] text-[1.02rem]",
        selected ? "border-app-blue shadow-[0_0_18px_rgba(47,128,255,0.24)]" : styles.border,
        styles.glow
      )}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-border border-none" />

      {story?.reasonChip && (
        <div className={cn(
          "absolute -top-3 left-3 z-10 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur",
          isFailed ? "border-app-red bg-app-red/20 text-app-red" : isProtected ? "border-app-cyan bg-app-cyan/20 text-app-cyan" : "border-app-amber bg-app-amber/20 text-app-amber"
        )}>
          {story.reasonChip}
        </div>
      )}

      <div className={cn("h-1.5", styles.dot)} />

      <div className="p-3 space-y-3">
        <div className="flex items-start gap-3">
          <div className={cn("relative w-11 h-11 rounded-md flex items-center justify-center text-white bg-bg-deep border", styles.border)}>
            {awsIcon ? <img src={awsIcon} alt="" className="h-6 w-6 object-contain" /> : <Icon className="w-5 h-5" />}
            {isProtected && <span className="absolute -right-1 -bottom-1 rounded-full bg-app-cyan p-0.5"><Shield className="w-3 h-3 text-bg-deep" /></span>}
            {isFailed && <span className="absolute -right-1 -bottom-1 rounded-full bg-app-red p-0.5"><AlertTriangle className="w-3 h-3 text-bg-deep" /></span>}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold leading-tight">{data.name}</div>
                <div className="truncate text-[11px] text-text-secondary">{awsPreset.shortName} · {story?.role ?? data.type}</div>
              </div>
              <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase", styles.border, styles.text)}>
                {styles.label}
              </span>
            </div>
          </div>
        </div>

        <div className={cn("grid gap-2", isComparison ? "grid-cols-2" : "grid-cols-2")}>
          <Metric icon={isComparison ? Route : Gauge} label={story?.primaryMetricLabel ?? "Availability"} value={story?.primaryMetricValue ?? "100%"} tone={styles.text} />
          <Metric icon={isComparison ? Shield : Radio} label={story?.secondaryMetricLabel ?? "Connections"} value={story?.secondaryMetricValue ?? "0"} tone={isComparison ? "text-app-cyan" : "text-text-primary"} />
        </div>

        {isSimulation && (
          <div className="rounded-md border border-border bg-bg-deep/70 px-2 py-1.5 text-[11px] text-text-secondary">
            {story?.riskStatement}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <ControlChip icon={Lock} label={story?.controlSummary?.[0] ?? "Encrypted"} />
          <ControlChip icon={Eye} label={story?.controlSummary?.[1] ?? "Monitored"} />
          <ControlChip icon={data.type === "backup" ? ArchiveRestore : data.type === "web-app" ? Server : Shield} label={story?.controlSummary?.[2] ?? "Single path"} />
          <span className="rounded bg-bg-deep px-1.5 py-0.5 text-text-secondary">{data.zoneName ?? data.zoneId}</span>
        </div>
      </div>

      {isProtected && <div className="pointer-events-none absolute inset-0 animate-pulse border border-app-cyan/40 rounded-lg" />}

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-border border-none" />
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-border bg-bg-deep/70 p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase text-text-secondary">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("mt-1 truncate text-sm font-bold", tone)}>{value}</div>
    </div>
  );
}

function ControlChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-bg-deep px-1.5 py-0.5 text-text-secondary">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
