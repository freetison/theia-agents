import type { IProvider } from "./IProvider.js";

export class OpenAIProvider implements IProvider {
  private readonly apiKey = process.env.OPENAI_API_KEY ?? "";
  getName(): string { return "openai"; }

  async generate(prompt: string, model: string): Promise<string> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY env var not set");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content.trim();
  }
}
