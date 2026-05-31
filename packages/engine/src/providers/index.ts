import type { IProvider } from "./IProvider.js";
import { OllamaProvider } from "./OllamaProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";
import { AnthropicProvider } from "./AnthropicProvider.js";
import { AzureOpenAIProvider } from "./AzureOpenAIProvider.js";
import { GitHubCopilotProvider } from "./GitHubCopilotProvider.js";
import { GenericOIDCProvider } from "./GenericOIDCProvider.js";

export { registry } from "./ProviderRegistry.js";
export type { IProvider };
export {
  OllamaProvider,
  OpenAIProvider,
  AnthropicProvider,
  AzureOpenAIProvider,
  GitHubCopilotProvider,
  GenericOIDCProvider,
};
