import type { IProvider } from "./IProvider.js";

const AZURE_API_VERSION = process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-15-preview";

export class AzureOpenAIProvider implements IProvider {
  private readonly apiKey = process.env.AZURE_OPENAI_KEY ?? "";
  private readonly endpoint = process.env.AZURE_OPENAI_ENDPOINT ?? "";
  getName(): string { return "azure-openai"; }

  async generate(prompt: string, model: string): Promise<string> {
    if (!this.apiKey) throw new Error("AZURE_OPENAI_KEY env var not set");
    if (!this.endpoint) throw new Error("AZURE_OPENAI_ENDPOINT env var not set");
    const url = `${this.endpoint}/openai/deployments/${model}/chat/completions?api-version=${AZURE_API_VERSION}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": this.apiKey },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`Azure OpenAI ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Azure OpenAI returned no content");
    return content.trim();
  }
}
