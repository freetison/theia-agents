import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadProblem(): string {
  return readFileSync(join(ROOT, "config", "problem.txt"), "utf-8").trim();
}

export function loadPrompt(agent: string, vars: Record<string, string>): string {
  const template = readFileSync(
    join(ROOT, "config", "prompts", `${agent}.txt`),
    "utf-8"
  ).trim();
  return Object.entries(vars).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    template
  );
}
