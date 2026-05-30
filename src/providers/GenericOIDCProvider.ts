import type { IProvider } from "./IProvider.js";

// Generic OpenAI-compatible endpoint (e.g. vLLM, LM Studio, LocalAI, custom OIDC-secured API)
export class GenericOIDCProvider implements IProvider {
  private readonly token = process.env.OIDC_TOKEN ?? "";
  private readonly endpoint = process.env.OIDC_API_ENDPOINT ?? "";
  getName(): string { return "generic-oidc"; }

  async generate(prompt: string, model: string): Promise<string> {
    if (!this.token) throw new Error("OIDC_TOKEN env var not set");
    if (!this.endpoint) throw new Error("OIDC_API_ENDPOINT env var not set");
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
      }),
    });
    if (!response.ok) throw new Error(`OIDC provider ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices: { message: { content: string } }[] };
    return data.choices[0].message.content.trim();
  }
}
