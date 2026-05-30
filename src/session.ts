import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { TheiaState } from "./state.js";
import type { FinalReport } from "./types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SESSIONS_ROOT = join(ROOT, "sessions");

// ─── Crear directorio de sesión ──────────────────────────────────────────────

export function createSessionDir(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const name = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "_",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
  const dir = join(SESSIONS_ROOT, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ─── Mapa agente → campo en el estado ────────────────────────────────────────

const AGENT_OUTPUT_KEY: Record<string, keyof TheiaState> = {
  biz_evaluator:        "bizOutput",
  brand_guardian:       "brandOutput",
  growth_hacker:        "growthOutput",
  software_architect:   "softwareArchitectOutput",
  marketing_strategist: "marketingOutput",
  product_manager:      "productOutput",
  sales_lead:           "salesOutput",
  cfo_finance:          "cfoOutput",
  legal_expert:         "legalOutput",
  cxo_designer:         "cxoOutput",
  customer_success:     "csOutput",
  competitor_analyst:   "competitorOutput",
  synthesizer:          "finalReport",
};

// ─── Escritura de sesión completa ─────────────────────────────────────────────

export function writeSession(sessionDir: string, problem: string, result: TheiaState): void {
  // Un archivo .md por cada agente que tomó la palabra
  for (const msg of result.tableMessages) {
    const key = AGENT_OUTPUT_KEY[msg.agent];
    const data = key ? result[key] : null;
    const md = buildAgentMd(msg.role, msg.agent, msg.timestamp, msg.summary, data);
    writeFileSync(join(sessionDir, `${msg.agent}.md`), md, "utf-8");
  }

  // Informe final
  if (result.finalReport) {
    writeFileSync(join(sessionDir, "result.md"), buildResultMd(problem, result.finalReport, result.tableMessages), "utf-8");
  }
}

// ─── Builders ────────────────────────────────────────────────────────────────

function buildAgentMd(
  role: string,
  agent: string,
  timestamp: string,
  summary: string,
  data: unknown
): string {
  return [
    `# ${role}`,
    ``,
    `**Agente:** \`${agent}\`  `,
    `**Timestamp:** ${timestamp}`,
    ``,
    `## Resumen`,
    ``,
    summary,
    ``,
    `## Output estructurado`,
    ``,
    "```json",
    JSON.stringify(data, null, 2),
    "```",
    "",
  ].join("\n");
}

function buildResultMd(problem: string, r: FinalReport, messages: Array<{ role: string; agent: string; timestamp: string; summary: string }>): string {
  const verdictIcon = r.verdict === "GO" ? "✅" : r.verdict === "NO-GO" ? "❌" : "⚠️";
  const lines: string[] = [];

  lines.push(`# Theia — Resultado de sesión`);
  lines.push(``);
  lines.push(`## Problema evaluado`);
  lines.push(``);
  lines.push(`> ${problem}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## ${verdictIcon} Veredicto: ${r.verdict}`);
  lines.push(``);
  lines.push(`| Métrica | Valor |`);
  lines.push(`|---|---|`);
  lines.push(`| Score de viabilidad | **${r.viability_score}/10** |`);
  lines.push(`| Confianza | ${Math.round(r.confidence * 100)}% |`);
  lines.push(``);
  lines.push(`### Resumen ejecutivo`);
  lines.push(``);
  lines.push(r.summary);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Mercados recomendados`);
  lines.push(``);
  for (const m of r.recommended_markets) lines.push(`- ${m}`);
  lines.push(``);
  lines.push(`## Canales de lanzamiento`);
  lines.push(``);
  for (const c of r.launch_channels) lines.push(`- ${c}`);
  lines.push(``);
  lines.push(`## Presupuesto estimado`);
  lines.push(``);
  lines.push(`| | |`);
  lines.push(`|---|---|`);
  lines.push(`| Mínimo | ${r.estimated_budget.minimum} |`);
  lines.push(`| Recomendado | ${r.estimated_budget.recommended} |`);
  lines.push(``);
  lines.push(`## ⚠️ Riesgos clave`);
  lines.push(``);
  for (const risk of r.key_risks) lines.push(`- ${risk}`);
  lines.push(``);
  lines.push(`## ✅ Próximos pasos`);
  lines.push(``);
  for (let i = 0; i < r.next_steps.length; i++) {
    lines.push(`${i + 1}. ${r.next_steps[i]}`);
  }
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Transcript de la mesa`);
  lines.push(``);
  for (const msg of messages) {
    lines.push(`### [${msg.role}] — ${msg.timestamp}`);
    lines.push(``);
    lines.push(msg.summary);
    lines.push(``);
  }

  return lines.join("\n");
}
