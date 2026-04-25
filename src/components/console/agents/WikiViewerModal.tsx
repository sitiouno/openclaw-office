import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface WikiViewerModalProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_FILES = [
  { name: "index.md", content: "# Welcome to the Wiki\n\nThis is the root index file. Select a file from the sidebar to read its contents." },
  { name: "SOUL.md", content: "# SOUL.md\n\n<identity>\nEres un agente de la red SitioUno.\n</identity>\n\n<behavioral_constraints>\nPrioriza estabilidad y rendimiento.\n</behavioral_constraints>" },
  { name: "AGENTS.md", content: "# AGENTS.md\n\n<role>Arquitecto de Sistemas</role>\n\n<capabilities>\n1. TypeScript\n2. React/Vite\n</capabilities>" },
  { name: "MEMORY.md", content: "# MEMORY.md\n\nHechos durables:\n- SitioUno es la matriz.\n- Jean es el CEO." }
];

export function WikiViewerModal({ agentId, agentName, isOpen, onClose }: WikiViewerModalProps) {
  const [activeFile, setActiveFile] = useState(MOCK_FILES[0]);

  useEffect(() => {
    if (isOpen) {
      setActiveFile(MOCK_FILES[0]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[85vh] p-0 flex flex-col bg-zinc-950 border border-gray-800 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-800 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-gray-200">
            Wiki Explorer: {agentName}
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-md w-8 h-8 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </DialogHeader>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800 bg-zinc-900/50 overflow-y-auto">
            <div className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Files
            </div>
            <div className="flex flex-col gap-1 px-2">
              {MOCK_FILES.map((file) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFile(file)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeFile.name === file.name 
                      ? "bg-purple-600/20 text-purple-400 font-medium" 
                      : "text-gray-400 hover:bg-zinc-800 hover:text-gray-200"
                  }`}
                >
                  📄 {file.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
            <div className="prose prose-invert prose-purple max-w-3xl mx-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeFile.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
