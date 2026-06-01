import type { IProvider } from "./IProvider.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const TIMEOUT_MS = 90_000;   // 90 s per attempt
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000; // 2 s → 4 s → (no 3rd wait)

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OllamaProvider implements IProvider {
  getName(): string { return "ollama"; }

  async generate(prompt: string, model: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (response.ok) {
          const data = await response.json() as { response: string };
          return data.response.trim();
        }

        // 4xx → no point retrying (bad model, auth, etc.)
        const text = await response.text();
        if (response.status < 500) throw new Error(`Ollama ${response.status}: ${text}`);

        lastError = new Error(`Ollama ${response.status}: ${text}`);
        console.warn(`   [llm] attempt ${attempt}/${MAX_ATTEMPTS} failed (${response.status}) — retrying...`);
      } catch (e) {
        lastError = e;
        if (e instanceof Error && !isRetryable(e)) throw e;
        console.warn(`   [llm] attempt ${attempt}/${MAX_ATTEMPTS} error: ${String(e)} — retrying...`);
      }

      if (attempt < MAX_ATTEMPTS) await sleep(BASE_DELAY_MS * attempt);
    }

    throw lastError;
  }
}

function isRetryable(e: Error): boolean {
  // Don't retry 4xx (already thrown above) or programmer errors
  const nonRetryable = e.message.startsWith("Ollama 4");
  return !nonRetryable;
}
