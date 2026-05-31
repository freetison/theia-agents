import type { IProvider } from "./IProvider.js";
import { OllamaProvider } from "./OllamaProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { AnthropicProvider } from "./AnthropicProvider.js";
import { AzureOpenAIProvider } from "./AzureOpenAIProvider.js";
import { GitHubCopilotProvider } from "./GitHubCopilotProvider.js";
import { GenericOIDCProvider } from "./GenericOIDCProvider.js";

class ProviderRegistry {
  private readonly providers = new Map<string, IProvider>();

  constructor() {
    this.register("ollama", new OllamaProvider());
    this.register("openai", new OpenAIProvider());
    this.register("anthropic", new AnthropicProvider());
    this.register("azure-openai", new AzureOpenAIProvider());
    this.register("github-copilot", new GitHubCopilotProvider());
    this.register("generic-oidc", new GenericOIDCProvider());
  }

  register(name: string, provider: IProvider): void {
    this.providers.set(name, provider);
  }

  get(name: string): IProvider {
    const p = this.providers.get(name);
    if (!p) {
      const available = [...this.providers.keys()].join(", ");
      throw new Error(`Provider '${name}' not found. Available: ${available}`);
    }
    return p;
  }
}

export const registry = new ProviderRegistry();
