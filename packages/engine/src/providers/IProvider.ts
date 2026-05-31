export interface IProvider {
  generate(prompt: string, model: string): Promise<string>;
  getName(): string;
}
