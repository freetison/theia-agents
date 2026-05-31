import type { IProvider } from "./IProvider.js";

// GitHub Models API — requires a GitHub Personal Access Token with models:read scope
// https://docs.github.com/en/github-models
const GITHUB_MODELS_ENDPOINT = "https://models.inference.ai.azure.com";

export class GitHubCopilotProvider implements IProvider {
  private readonly token = process.env.GITHUB_TOKEN ?? "";
  getName(): string { return "github-copilot"; }

  async generate(prompt: string, model: string): Promise<string> {
    if (!this.token) throw new Error("GITHUB_TOKEN env var not set");
    const response = await fetch(`${GITHUB_MODELS_ENDPOINT}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });
    if (!response.ok) throw new Error(`GitHub Models ${response.status}: ${await response.text()}`);
    const data = await response.json() as { choices: { message: { content: string } }[] };
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("GitHub Models returned no content");
    return content.trim();
  }
}
