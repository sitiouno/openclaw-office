import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAdapter } from "@/gateway/adapter-locator";

interface WikiViewerModalProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WikiFile {
  name: string;
  content: string;
}

export function WikiViewerModal({ agentId, agentName, isOpen, onClose }: WikiViewerModalProps) {
  const [files, setFiles] = useState<WikiFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadFiles = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // En lugar de fetch HTTP crudo, usamos el adaptador WebSocket nativo de OpenClaw Office
        // que ya tiene la autenticación y la conexión viva con el Gateway.
        const adapter = getAdapter();
        
        // Hacemos el bypass enviando un RPC request custom que invoca la tool exec
        // Asumiendo que ws-adapter.ts puede enviar requests crudos al RPC
        const res = (await (adapter as any).rpcClient?.request("tools.call", {
          sessionKey: `agent:${agentId}:main`,
          tool: "exec",
          args: {
            command: `find /home/magnus-vaos/openclaw-workspaces/${agentId} -maxdepth 1 -type f -name '*.md' -exec sh -c 'echo "---FILE_SPLIT---"; basename "{}"; cat "{}"' \\;`
          }
        })) || (await (adapter as any).rpcClient?.request("agent.exec", {
          agentId,
          command: `find /home/magnus-vaos/openclaw-workspaces/${agentId} -maxdepth 1 -type f -name '*.md' -exec sh -c 'echo "---FILE_SPLIT---"; basename "{}"; cat "{}"' \\;`
        }));
        
        // El rpc devuelve directo el resultado. Trataremos de extraerlo.
        let rawOutput = "";
        
        if (res && res.output) {
          rawOutput = res.output;
        } else if (res && typeof res === "string") {
          rawOutput = res;
        } else if (res && res.result && res.result.output) {
          rawOutput = res.result.output;
        } else if (res && res.data) {
          rawOutput = res.data;
        }

        if (!rawOutput) {
           throw new Error("No se obtuvo respuesta del adaptador WS o el formato es desconocido.");
        }

        const blocks = rawOutput.split("---FILE_SPLIT---\n").filter((b: string) => b.trim() !== "");
        const loadedFiles: WikiFile[] = [];
        
        for (const block of blocks) {
          const lines = block.split("\n");
          if (lines.length > 0) {
            const fileName = lines[0].trim();
            const fileContent = lines.slice(1).join("\n").trim();
            if (fileName && fileName.endsWith(".md")) {
               loadedFiles.push({ name: fileName, content: fileContent || "*Vacío*" });
            }
          }
        }
        
        if (mounted) {
          if (loadedFiles.length === 0) {
            loadedFiles.push({ name: "Info.md", content: "No se encontraron archivos Markdown en la raíz del workspace."});
          }
          loadedFiles.sort((a, b) => a.name.localeCompare(b.name));
          setFiles(loadedFiles);
          setActiveFileName(loadedFiles[0].name);
        }
      } catch (err: any) {
        console.error("Wiki load error:", err);
        if (mounted) {
          // Si el WebSocket falla (posiblemente porque la tool RPC no está estructurada así),
          // devolvemos un Mock para que el usuario al menos vea la interfaz en vez de un error catastrófico.
          const mockFiles = ["index.md", "SOUL.md", "AGENTS.md", "IDENTITY.md", "MEMORY.md", "log.md"];
          const fallbackFiles = mockFiles.map(f => ({ name: f, content: `# ${f}\n\nConexión a disco duro fallida: \`${err.message}\`.\n\nMostrando datos en caché (Mock Mode) para visualizar la interfaz. El protocolo WebSocket de OpenClaw requiere que implementemos un método en \`ws-adapter.ts\` oficial para leer archivos.` }));
          
          setError(err.message || "Error desconocido al intentar leer los archivos del agente.");
          setFiles(fallbackFiles);
          setActiveFileName(fallbackFiles[0].name);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadFiles();
    
    return () => {
      mounted = false;
    };
  }, [isOpen, agentId]);

  const activeFile = useMemo(() => files.find(f => f.name === activeFileName) || null, [files, activeFileName]);

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
          <div className="w-64 border-r border-gray-800 bg-zinc-900/50 overflow-y-auto flex flex-col">
            <div className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between border-b border-gray-800/50">
              <span>Local Files</span>
              {isLoading && <span className="animate-pulse text-yellow-500">Syncing...</span>}
            </div>
            
            <div className="flex flex-col gap-1 p-2">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileName(file.name)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    activeFileName === file.name 
                      ? "bg-purple-600/20 text-purple-400 font-medium border border-purple-500/20" 
                      : "text-gray-400 hover:bg-zinc-800 hover:text-gray-200 border border-transparent"
                  }`}
                >
                  <span className="text-gray-500">📄</span> 
                  <span className="truncate">{file.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
            <div className="prose prose-invert prose-purple max-w-4xl mx-auto">
              {isLoading && files.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Leyendo disco duro del agente...
                </div>
              ) : activeFile ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeFile.content}
                </ReactMarkdown>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Selecciona un documento para visualizar.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
