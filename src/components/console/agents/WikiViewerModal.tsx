import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import ForceGraph2D from "react-force-graph-2d";
import remarkGfm from "remark-gfm";

interface WikiViewerModalProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WikiViewerModal({ agentId, agentName, isOpen, onClose }: WikiViewerModalProps) {
  const [content, setContent] = useState<string>("Loading knowledge base...");
  const [viewMode, setViewMode] = useState<"text" | "graph">("text");
  
  // Dummy graph data structure simulating linked MD files
  const graphData = {
    nodes: [
      { id: "index.md", name: "Index", val: 20 },
      { id: "skills.md", name: "Skills", val: 10 },
      { id: "memory.md", name: "Memory", val: 15 },
    ],
    links: [
      { source: "index.md", target: "skills.md" },
      { source: "index.md", target: "memory.md" }
    ]
  };

  useEffect(() => {
    if (isOpen) {
      // In a real implementation this fetches via /api/v1/agents/{agentId}/files/index.md
      setContent(`# Knowledge Base: ${agentName}\n\nWelcome to the internal wiki. Nodes are currently rendering dummy data until the file sync API is fully connected.\n\n## Core Principles\n- Information is persistent.\n- Edits append to log.md.\n`);
    }
  }, [isOpen, agentName, agentId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col bg-zinc-950 border-gray-800">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-200">
            Wiki Explorer: {agentName}
          </DialogTitle>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode("text")}
              className={`px-3 py-1 text-sm rounded ${viewMode === "text" ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-400"}`}
            >
              Document
            </button>
            <button 
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1 text-sm rounded ${viewMode === "graph" ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-400"}`}
            >
              Graph View
            </button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 text-gray-300">
          {viewMode === "text" ? (
            <div className="prose prose-invert prose-purple max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden">
              <ForceGraph2D
                graphData={graphData}
                nodeAutoColorBy="group"
                nodeLabel="name"
                width={800}
                height={500}
                backgroundColor="#18181b"
                linkColor={() => "#4c1d95"}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
