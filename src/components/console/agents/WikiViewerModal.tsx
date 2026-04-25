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
      // In a real ACP environment we'd use the backend to parse the real markdown.
      // Here we make an exec call via the gateway to read the directory structure and simulate parsing.
      const fetchRealGraph = async () => {
        try {
          // Leer los archivos markdown del workspace del agente via gateway exec tool
          const response = await fetch(`/api/v1/agents/${agentId}/tools/exec`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              command: `find /home/magnus-vaos/openclaw-workspaces/${agentId} -maxdepth 1 -name "*.md" -exec basename {} \\;` 
            })
          });
          
          if (!response.ok) throw new Error("Failed to fetch markdown files");
          
          const result = await response.json();
          const files = result.output ? result.output.trim().split("\n") : [];
          
          const nodes = files.map((file: string) => ({ id: file, name: file, val: 10 }));
          
          // Crear un nodo central y conectar todos los archivos a él para simular un grafo base
          if (files.length > 0 && !nodes.find((n: any) => n.id === "workspace_root")) {
             nodes.push({ id: "workspace_root", name: `${agentName} Root`, val: 20 });
          }
          
          const links = files.map((file: string) => ({ source: "workspace_root", target: file }));

          setGraphData({ nodes, links } as any);
          setContent(`# Knowledge Base: ${agentName}\n\nEste visor está conectado al sistema de archivos local. Actualmente hay ${files.length} archivos Markdown en la raíz del workspace de este agente.\n\n### Archivos Encontrados:\n${files.map((f: string) => `- ${f}`).join('\n')}`);
        } catch (error) {
          console.error(error);
          setContent(`Error cargando la base de conocimiento real de ${agentName}.`);
        }
      };

      fetchRealGraph();
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
