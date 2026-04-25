import { Info } from "lucide-react";

export function LocalSkillsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-yellow-500/20 bg-zinc-900/50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-yellow-400" />
          <div>
            <h3 className="text-sm font-medium text-yellow-400">SitioUno Local Skills</h3>
            <p className="mt-1 text-sm text-gray-400">
              Estas son las skills inyectadas localmente en este nodo por el equipo de DevOps.
              Actualmente se leen directamente del sistema de archivos y están asignadas globalmente.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-200">prompt-architect</h4>
            <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Active</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            Skill activa de ingeniería de prompts de alta densidad. Utiliza estructuras XML, delimitación de roles estrictos...
          </p>
        </div>
        
        <div className="rounded-lg border border-gray-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-200">llm-wiki</h4>
            <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">Active</span>
          </div>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">
            Implementa el patrón de base de conocimiento persistente basado en Markdown (Karpathy 'llm-wiki')...
          </p>
        </div>
      </div>
    </div>
  );
}
