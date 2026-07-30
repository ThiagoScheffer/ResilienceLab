import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import { useArchitectureStore } from '../../store/architectureStore';
import { ComponentType } from '../../types/architecture';

const nodeTypes = {
  customNode: CustomNode,
  zone: ({ data }: any) => (
    <div className="w-full h-full rounded-2xl border-2 border-dashed flex items-start justify-center p-4 bg-opacity-10 pointer-events-none" style={{ borderColor: data.color, backgroundColor: `${data.color}20` }}>
      <span className="font-bold text-lg opacity-50 uppercase tracking-widest" style={{ color: data.color }}>
        {data.label}
      </span>
    </div>
  )
};

const edgeTypes = {
  customEdge: CustomEdge,
};

export default function ArchitectureCanvas() {
  const store = useArchitectureStore();
  const { architecture, selectNode, addNode, moveNode, updateEdge, deleteEdge } = store;
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const selectedEdge = architecture.edges.find(edge => edge.id === selectedEdgeId);

  const nodes: Node[] = useMemo(() => {
    const regularNodes: Node[] = architecture.nodes.map(n => ({
      id: n.id,
      type: 'customNode',
      position: n.position,
      data: { ...n },
      zIndex: 10
    }));

    // Calculate zone boundaries
    const zoneNodes: Node[] = architecture.zones.map(z => {
      const zNodes = architecture.nodes.filter(n => n.zoneId === z.id);
      if (zNodes.length === 0) return null;
      
      const padding = 100;
      const minX = Math.min(...zNodes.map(n => n.position.x)) - padding;
      const maxX = Math.max(...zNodes.map(n => n.position.x)) + 300 + padding; // approx node width 200 + padding
      const minY = Math.min(...zNodes.map(n => n.position.y)) - padding;
      const maxY = Math.max(...zNodes.map(n => n.position.y)) + 100 + padding;

      return {
        id: `zone-${z.id}`,
        type: 'zone',
        position: { x: minX, y: minY },
        style: { width: maxX - minX, height: maxY - minY },
        data: { label: z.name, color: z.color },
        zIndex: -1,
        draggable: false,
        selectable: false
      };
    }).filter(Boolean) as Node[];

    return [...zoneNodes, ...regularNodes];
  }, [architecture.nodes, architecture.zones]);

  const edges: Edge[] = useMemo(() => {
    return architecture.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'customEdge',
      data: { type: e.type, required: e.required },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: e.type === "synchronous" ? "var(--blue)" : e.type === "asynchronous" ? "var(--cyan)" : "var(--text-secondary)"
      }
    }));
  }, [architecture.edges]);

  const onNodesChange = useCallback((changes: any) => {
    changes.forEach((c: any) => {
      if (c.type === 'position' && c.position && !c.dragging && !c.id.startsWith('zone-')) {
        moveNode(c.id, c.position);
      }
      if (c.type === 'select' && !c.id.startsWith('zone-')) {
        if (c.selected) selectNode(c.id);
      }
    });
  }, [moveNode, selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onConnect = useCallback((connection: Connection) => {
    store.addEdge({
      id: `e-${connection.source}-${connection.target}`,
      source: connection.source!,
      target: connection.target!,
      type: "synchronous",
      required: true
    });
  }, [store]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as ComponentType;
      if (!type) return;

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      };

      addNode(type, position);
    },
    [addNode]
  );

  return (
    <div className="flex-1 h-full bg-bg-deep relative overflow-hidden canvas-dot-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
        onInit={(instance) => instance.fitView({ padding: 0.2 })}
        onDrop={onDrop}
        onDragOver={onDragOver}
        proOptions={{ hideAttribution: true }}
        className="dark"
      >
        <Controls className="bg-bg-panel border-border fill-white" />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="transparent" />
      </ReactFlow>
      {selectedEdge && <div className="absolute right-3 top-3 z-20 bg-bg-panel border border-border rounded-lg p-3 shadow-lg text-xs space-y-2">
        <div className="font-semibold text-text-primary">Dependency</div>
        <select value={selectedEdge.type} onChange={event => updateEdge(selectedEdge.id, { type: event.target.value as typeof selectedEdge.type })} className="bg-bg-deep border border-border rounded px-2 py-1 text-text-primary">
          <option value="synchronous">Synchronous</option><option value="asynchronous">Asynchronous</option><option value="replication">Replication</option><option value="monitoring">Monitoring</option><option value="backup">Backup</option>
        </select>
        <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked={selectedEdge.required} onChange={event => updateEdge(selectedEdge.id, { required: event.target.checked })} /> Required</label>
        <button onClick={() => { deleteEdge(selectedEdge.id); setSelectedEdgeId(null); }} className="text-app-red">Delete connection</button>
      </div>}
      
      <style>{`
        @keyframes dashdraw {
          from { stroke-dashoffset: 10; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
