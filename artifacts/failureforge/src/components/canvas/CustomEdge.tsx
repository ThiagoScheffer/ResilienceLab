import React from 'react';
import { getBezierPath, BaseEdge, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { EdgeOperationalState } from '../../engine/visualStorytelling';

export default function CustomEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style = {},
    markerEnd,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const type = data?.type || "synchronous";
  const operationalState = (data?.operationalState || "healthy") as EdgeOperationalState;
  
  let edgeColor = "var(--border)";
  let strokeDasharray = "";
  let isAnimated = false;
  let label = "";

  switch(operationalState) {
    case "broken":
      edgeColor = "var(--red)";
      strokeDasharray = "8 7";
      label = data?.required ? "DB connection refused" : "Optional path unavailable";
      break;
    case "degraded":
      edgeColor = "var(--amber)";
      strokeDasharray = "6 5";
      isAnimated = true;
      label = type === "asynchronous" ? "+380 pending" : "Degraded";
      break;
    case "async":
      edgeColor = "var(--cyan)";
      strokeDasharray = "5 5";
      isAnimated = true;
      label = "Queue flow";
      break;
    case "replication":
      edgeColor = "var(--cyan)";
      strokeDasharray = "4 6";
      isAnimated = true;
      label = "Replication";
      break;
    case "failover":
      edgeColor = "var(--green)";
      strokeDasharray = "10 5";
      isAnimated = true;
      label = "PROMOTED";
      break;
    case "backup":
      edgeColor = "var(--amber)";
      strokeDasharray = "2 4";
      label = "Recovery only";
      break;
    case "monitoring":
      edgeColor = "var(--text-secondary)";
      strokeDasharray = "2 4";
      label = "Telemetry";
      break;
    default:
      edgeColor = "var(--blue)";
      isAnimated = true;
      label = data?.required ? "Customer path" : "Optional";
      break;
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: edgeColor,
          strokeWidth: 2,
          strokeDasharray,
          animation: isAnimated ? "dashdraw 1s linear infinite" : "none"
        }}
        className={isAnimated ? "animated-edge" : ""}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded border border-border bg-bg-panel/95 px-2 py-0.5 text-[10px] font-semibold text-text-secondary shadow"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
