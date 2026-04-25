import type { AgentSummary } from "@/gateway/types";
import { Info, BookOpen } from "lucide-react";

interface LocalSkillsTabProps {
  agent: AgentSummary;
}

export function LocalSkillsTab({ agent }: LocalSkillsTabProps) {
  const handleOpenObsidian = () => {
    // We launch via HTTP target since standard obsidian:// protocol assumes
    // Obsidian knows the vault mapping ahead of time.
    // However, if the browser is running on the host, a simple file:// URI 
    // or triggering an MCP exec is safer. For now we just instruct the user.
    alert(`Para abrir la wiki de ${agent.name} en Obsidian, abre la aplicación Obsidian y selecciona "Open Folder as Vault" apuntando a: /home/magnus-vaos/openclaw-workspaces/${agent.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-yellow-500/20 bg-zinc-900/50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-yellow-400" />
          <div>
            <h3 className="text-sm font-medium text-yellow-400">SitioUno Local Skills & Knowledge</h3>
            <p className="mt-1 text-sm text-gray-400">
              Estas son las skills inyectadas localmente en este nodo por el equipo de DevOps.
              Las skills locales se inyectan a nivel del sistema de archivos (npm-global), por lo tanto están habilitadas globalmente para todos los agentes del nodo.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleOpenObsidian}
          className="flex items-center gap-2 rounded-md bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:bg-[#6d28d9] transition-all"
        >
          <BookOpen className="h-4 w-4" />
          Ubicación de Wiki de {agent.name}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-zinc-950 p-4 opacity-75">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-200">prompt-architect</h4>
            <span className="rounded bg-gray-500/10 px-2 py-0.5 text-xs text-gray-400">Global Read-Only</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            Skill activa de ingeniería de prompts de alta densidad. Utiliza estructuras XML, delimitación de roles estrictos...
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-800 bg-zinc-950 p-4 opacity-75">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-200">llm-wiki</h4>
            <span className="rounded bg-gray-500/10 px-2 py-0.5 text-xs text-gray-400">Global Read-Only</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            Implementa el patrón de base de conocimiento persistente basado en Markdown (Karpathy 'llm-wiki')...
          </p>
        </div>
      </div>
    </div>
  );
}
