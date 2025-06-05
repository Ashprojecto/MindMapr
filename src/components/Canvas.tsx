"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Node from "./Node";

type NodeData = {
  id: string;
  x: number;
  y: number;
  text: string;
};

type Edge = {
  from: string;
  to: string;
};

export default function Canvas() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  //const [_isPanning, setIsPanning] = useState(false);

  const isPanningRef = useRef(false)
  isPanningRef.current = true;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("graph-data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
        }
      }
    } catch (err) {
      console.error("Error loading saved graph:", err);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("graph-data", JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  // Add new node
  const handleAddNode = () => {
    const baseX = window.innerWidth / 2;
    const baseY = window.innerHeight / 2;
    const newNode: NodeData = {
      id: uuidv4(),
      x: (baseX - offset.x) / scale,
      y: (baseY - offset.y) / scale,
      text: "New Node",
    };
    setNodes((prev) => [...prev, newNode]);
  };

  // Clear graph
  const handleClearGraph = () => {
    setNodes([]);
    setEdges([]);
    localStorage.removeItem("graph-data");
    setSelectedNodeId(null);
  };

  // Update node drag position
  const updateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, x, y } : node))
    );
  };

  // Update node text
  const updateNodeText = (id: string, newText: string) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === id ? { ...node, text: newText } : node))
    );
  };

  // Delete a node
  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) =>
      prev.filter((edge) => edge.from !== id && edge.to !== id)
    );
    setSelectedNodeId(null);
  };

  // Zooming (desktop only)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (window.innerWidth < 640) return;
    e.preventDefault();
    setScale((prev) => Math.min(2, Math.max(0.5, prev - e.deltaY * 0.001)));
  };

  // Panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;

    isPanningRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startOffset = { ...offset };

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };

    const handleMouseUp = () => {
      isPanningRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Clear selection when clicking on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    setSelectedNodeId(null);
  };

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedNodeId) {
        deleteNode(selectedNodeId);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId]);

  return (
    <div
      className="w-full h-screen bg-gray-100 relative overflow-auto touch-pan-x touch-pan-y"
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
      {/* Buttons */}
      <div className="absolute top-4 left-4 z-10 flex gap-4">
        <button
          onClick={handleAddNode}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow cursor-pointer"
        >
          ➕ Add Node
        </button>
        <button
          onClick={handleClearGraph}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow cursor-pointer"
        >
          🗑️ Reset Graph
        </button>
      </div>

      {/* Arrows */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="black" />
            </marker>
          </defs>
          {edges.map((edge, index) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;

            const boxWidth = 150;
            const boxHeight = 50;
            const offsetX = boxWidth / 2;
            const offsetY = boxHeight / 2;

            const x1 = from.x + offsetX;
            const y1 = from.y + offsetY;
            const x2 = to.x + offsetX;
            const y2 = to.y + offsetY;

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const shorten = 10;

            const x2Adjusted = x2 - (dx / len) * shorten;
            const y2Adjusted = y2 - (dy / len) * shorten;

            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2Adjusted}
                y2={y2Adjusted}
                stroke="black"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </g>
      </svg>

      {/* Nodes */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
        className="absolute top-0 left-0 w-full h-full"
      >
        {nodes.map((node) => (
          <Node
            key={node.id}
            {...node}
            onDrag={(x, y) => updateNodePosition(node.id, x, y)}
            onTextChange={(text) => updateNodeText(node.id, text)}
            onClick={() => {
              if (selectedNodeId && selectedNodeId !== node.id) {
                setEdges((prev) => [
                  ...prev,
                  { from: selectedNodeId, to: node.id },
                ]);
                setSelectedNodeId(null);
              } else {
                setSelectedNodeId(node.id);
              }
            }}
            onDelete={() => deleteNode(node.id)}
            isSelected={selectedNodeId === node.id}
          />
        ))}
      </div>
    </div>
  );
}
