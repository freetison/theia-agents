sistema de agentes para Theia Platform donde varios roles “se sienten a la mesa” y den una solución conjunta a un problema de negocio/marketing. La idea no era solo automatizar tareas, sino simular equipos enteros con agentes especializados.
Decisión de enfoque
Concluimos que la mejor base para esto es LangGraph como orquestador principal, porque encaja mejor con flujos con estado, bifurcaciones, reintentos y persistencia. CrewAI quedó como opción más simple para prototipos, pero menos sólida como núcleo del sistema.
Estrategia de implementación
Se decidió trabajar en dos fases:
Dev local primero, para iterar barato y rápido.
Proveedor real después, cuando el flujo ya funcione y solo haya que cambiar el backend del modelo.
La idea era construir un sistema reusable que pudiera servir para Theia y también para simular equipos completos en otros dominios.
Estado del arte
Antes de construir, querías revisar qué ya existe similar para no reinventar la rueda. Se discutió que ya hay frameworks y plataformas que cubren partes del problema:
Orquestación multiagente.
Simulación y evaluación de agentes.
Automatización de marketing.
Uso de modelos locales para desarrollo barato.
La conclusión fue que el hueco diferencial de Theia no está en “hacer otro agente”, sino en combinar estrategia, marca, growth, pricing y evaluación en una sola mesa de decisión.
Plan de acción
Luego elaboramos un plan detallado para validar el MVP:
Definir criterios de éxito.
Elegir un caso de prueba real.
Montar un entorno mínimo.
Diseñar 3 agentes base.
Darles un contrato JSON claro.
Conectarlos con un flujo simple.
Evaluar consistencia, cobertura y accionabilidad.
Comparar con herramientas existentes.
Decidir si seguir construyendo, integrar algo existente o pivotar.
Diseño de los 3 agentes
Después bajamos a la parte práctica: los tres agentes mínimos serían:
Biz Evaluator: evalúa mercado, ICP, propuesta de valor, pricing y canales.
Brand Guardian: revisa coherencia de marca y mensaje.
Growth Hacker: diseña funnel, experimentos y loops.
La idea era que cada agente devolviera una salida estructurada en JSON para poder conectar sus resultados entre sí.
Problemas técnicos en Windows / Python
Hubo una larga parte de debugging de entorno:
Problemas con imports.
Estructura de carpetas app/.
__init__.py.
Entorno virtual y Python en Windows.
pip que parecía quedarse colgado.
Incompatibilidades entre el Python global y el virtual.
Cambios temporales a versiones más simples para hacer avanzar el sistema.
La conclusión práctica fue que el entorno estaba demasiado enredado y se optó por simplificar lo suficiente para que el sistema pudiera correr.
Resultado conceptual alcanzado
Aunque hubo mucho ruido técnico, la parte importante quedó bastante clara:
Ya tienes la arquitectura mental.
Ya sabes qué roles deben existir.
Ya sabes cómo se comunican.
Ya está claro que el sistema debe devolver JSON estructurado.
Ya quedó definido que LangGraph es el núcleo ideal.