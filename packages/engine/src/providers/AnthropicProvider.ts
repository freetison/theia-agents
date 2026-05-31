import type { IProvider } from "./IProvider.js";

export class AnthropicProvider implements IProvider {
  private readonly apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  getName(): string { return "anthropic"; }

  async generate(prompt: string, model: string): Promise<string> {
    if (!this.apiKey) throw new Error("ANTHROPIC_API_KEY env var not set");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic ${response.status}: ${await response.text()}`);
    const data = await response.json() as { content: { text: string }[] };
    const text = data.content[0]?.text;
    if (!text) throw new Error("Anthropic returned no content");
    return text.trim();
  }
}
