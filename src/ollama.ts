const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

export async function ollamaGenerate(
  prompt: string,
  model = DEFAULT_MODEL
): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { response: string };
  return data.response.trim();
}

/**
 * Extrae y parsea el primer bloque JSON completo que encuentre en el texto.
 * Maneja: markdown fences, texto introductorio, texto posterior, comillas extras.
 */
export function extractJson(raw: string): unknown {
  // 1. Quitar fences de markdown
  let text = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // 2. Buscar el primer '{' y el último '}' que correspondan a un objeto válido
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end < start) {
    throw new SyntaxError(
      `No se encontró ningún objeto JSON en la respuesta del LLM.\nRespuesta cruda:\n${raw}`
    );
  }

  const candidate = text.slice(start, end + 1);

  try {
    return JSON.parse(candidate);
  } catch (err) {
    // 3. Último recurso: eliminar trailing commas (bug común en LLMs)
    const fixed = candidate
      .replace(/,\s*([}\]])/g, "$1") // trailing commas
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // claves sin comillas

    try {
      return JSON.parse(fixed);
    } catch {
      throw new SyntaxError(
        `JSON inválido incluso después de corrección automática.\nFragmento:\n${candidate}\n\nError original: ${String(err)}`
      );
    }
  }
}
