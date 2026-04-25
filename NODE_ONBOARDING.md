# Guía de Onboarding para Nuevos Nodos (SitioUno)

Esta es la guía oficial para acoplar una nueva sucursal o nodo a la arquitectura unificada de **SitioUno**. Siguiendo estos pasos, el nuevo nodo heredará todas las customizaciones (branding neón, interfaz de skills locales, etc.) y compartirá la base de conocimiento global.

## Paso 1: Clonar este Repositorio Base
En el workspace del agente programador del nuevo nodo, ejecuta:
```bash
git clone https://github.com/sitiouno/openclaw-office.git
```

## Paso 2: Crear al DevOps (Capablanca)
Todo nodo DEBE tener un agente llamado **Capablanca** dedicado a operaciones domésticas y de sistema.
1. Revisa `docs/ecosystem_agents/CAPABLANCA_DEVOPS.md`.
2. Utiliza la skill `prompt-architect` para generar sus archivos `IDENTITY.md`, `SOUL.md` y `AGENTS.md` con ese formato.

## Paso 3: Instalar Skills Locales
1. Capablanca debe entrar a `/local-skills` dentro de este repo.
2. Copiar todo el contenido a su carpeta global de sistema:
   `cp -R local-skills/* ~/.local/npm-global/lib/node_modules/openclaw/skills/`
3. Reiniciar el gateway de OpenClaw. A partir de este momento, el nodo tiene acceso a `prompt-architect`, `llm-wiki`, etc.

## Paso 4: Despliegue de la Interfaz Customizada
1. Capablanca debe crear un script `deploy-office.sh` que ejecute `pnpm build` en este repo y copie el `/dist` a la ruta global del OpenClaw Office local.
2. Capablanca debe tener un `cron` asignado para que ejecute este sync automáticamente.

## Paso 5: El Programador
El nodo puede tener su propio programador o mantener el nombre "Alekhine". Su perfil debe configurarse leyendo `docs/ecosystem_agents/ARCHITECT_PROGRAMMER.md`. Este agente tendrá la misión de vigilar los repositorios y programar las herramientas específicas que requiera su sucursal, haciendo push a este repositorio para beneficio de todos.
