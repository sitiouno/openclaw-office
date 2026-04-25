import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
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
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    if (isOpen) {
      // Mock robusto para evitar errores de red en el frontend.
      // El frontend SPA no tiene permisos de ejecución bash directa por seguridad CORS/Role
      // Reemplazado por un mockup mientras se implementa el endpoint /api/v1/wiki/
      const mockGraph = () => {
        const mockFiles = ["index.md", "log.md", "IDENTITY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md"];
        const nodes = mockFiles.map(f => ({ id: f, name: f, val: 15 }));
        nodes.push({ id: "ROOT", name: `${agentName} Vault`, val: 30 });
        
        const links = mockFiles.map(f => ({ source: "ROOT", target: f }));
        // Some random cross links
        links.push({ source: "index.md", target: "log.md" });
        links.push({ source: "SOUL.md", target: "AGENTS.md" });
        
        setGraphData({ nodes, links } as any);
        setContent(`# Knowledge Base: ${agentName}\n\nConexión establecida con la bóveda de conocimiento (Modo: Safe-Mock).\n\n### Documentos detectados:\n${mockFiles.map(f => `- **${f}**`).join('\n')}\n\n*Nota: El renderizado está aislado en el cliente. Para lectura de disco real, la API del gateway debe exponer el endpoint de Wiki.*`);
      };
      
      mockGraph();
    }
  }, [isOpen, agentName, agentId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col bg-zinc-950 border border-purple-500/20 shadow-2xl shadow-purple-900/20">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-800 pb-4 relative">
          <DialogTitle className="text-xl font-bold text-gray-200">
            Wiki Explorer: {agentName}
          </DialogTitle>
          <div className="flex gap-2">
            <button 
              onClick={() => setViewMode("text")}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "text" ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"}`}
            >
              Document
            </button>
            <button 
              onClick={() => setViewMode("graph")}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === "graph" ? "bg-purple-600 text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"}`}
            >
              Graph View
            </button>
          </div>
          <button onClick={onClose} className="absolute -top-2 -right-2 text-gray-400 hover:text-white bg-zinc-800 rounded-full w-8 h-8 flex items-center justify-center border border-gray-700">✕</button>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 text-gray-300">
          {viewMode === "text" ? (
            <div className="prose prose-invert prose-purple max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <ForceGraph2D
                graphData={graphData}
                nodeAutoColorBy="id"
                nodeLabel="name"
                width={900}
                height={500}
                backgroundColor="#18181b"
                linkColor={() => "#4c1d95"}
                nodeRelSize={6}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
