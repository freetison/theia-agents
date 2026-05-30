# Theia Agents — Mesa de Trabajo Estratégica

Simula una reunión donde 5 especialistas evalúan cualquier idea de negocio y emiten un veredicto conjunto: **GO / NO-GO / CONDITIONAL**.

Cada agente lee los outputs de los anteriores y construye sobre ellos — como en una reunión real.

## El equipo

| Agente | Rol | Output principal |
|---|---|---|
| 🧑‍💼 Analista de Negocio | Habla primero | ICP, propuesta de valor, pricing, canales, riesgos |
| 🏗️ Arquitecto de Software | Evalúa viabilidad técnica | Build vs buy, stack, MVP scope, tiempo estimado |
| 🛡️ Brand Guardian | Coherencia de marca | Tono, mensajes clave, inconsistencias detectadas |
| 🚀 Growth Hacker | Plan de crecimiento | Funnel, experimentos, KPIs, loops virales |
| ⚖️ Facilitador | Cierra la mesa | Veredicto final, score 0–10, presupuesto, próximos pasos |

## Configuración

Antes de correr, edita estos archivos según tu caso:

| Archivo | Qué contiene |
|---|---|
| `config/problem.txt` | El brief del problema o idea a evaluar |
| `config/prompts/*.txt` | Prompt de cada agente — ajusta persona, contexto o instrucciones |

## Setup

**Requisitos:** Node.js 20+, [Ollama](https://ollama.com) corriendo en `localhost:11434` con el modelo `llama3.2`.

```bash
# Instalar dependencias
npm install

# Correr con el problema por defecto (config/problem.txt)
npm start

# O pasar el problema directamente como argumento
npm start "¿Tiene sentido lanzar un marketplace de servicios legales en México?"
```

El output incluye el transcript completo de la mesa y un informe ejecutivo final en JSON.

