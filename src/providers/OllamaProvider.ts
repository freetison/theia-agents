import type { IProvider } from "./IProvider.js";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";

export class OllamaProvider implements IProvider {
  getName(): string { return "ollama"; }

  async generate(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false, format: "json" }),
    });
    if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`);
    const data = await response.json() as { response: string };
    return data.response.trim();
  }
}
