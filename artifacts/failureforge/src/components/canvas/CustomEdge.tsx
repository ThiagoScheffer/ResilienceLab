import React from 'react';
import { getBezierPath, BaseEdge, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';

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
  
  let edgeColor = "var(--border)";
  let strokeDasharray = "";
  let isAnimated = false;

  switch(type) {
    case "synchronous":
      edgeColor = "var(--blue)";
      break;
    case "asynchronous":
      edgeColor = "var(--cyan)";
      strokeDasharray = "5 5";
      isAnimated = true;
      break;
    case "replication":
      edgeColor = "var(--cyan)";
      strokeDasharray = "5 5";
      isAnimated = true;
      break;
    case "monitoring":
      edgeColor = "var(--text-secondary)";
      strokeDasharray = "2 4";
      break;
    case "backup":
      edgeColor = "var(--amber)";
      strokeDasharray = "2 4";
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
      {/* Could add a label here if needed */}
    </>
  );
}
