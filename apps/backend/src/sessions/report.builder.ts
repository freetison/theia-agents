import type { SessionSummary, AgentOutputRow } from '../types';

const AGENT_LABELS: Record<string, string> = {
  biz_evaluator: '🔍 Análisis de Negocio',
  brand_guardian: '🎨 Brand Guardian',
  growth_hacker: '🚀 Growth Hacker',
  software_architect: '🏗️ Arquitectura de Software',
  marketing_strategist: '📣 Estrategia de Marketing',
  product_manager: '📦 Product Manager',
  sales_lead: '💼 Ventas',
  cfo_finance: '💰 Finanzas (CFO)',
  legal_expert: '⚖️ Legal',
  cxo_designer: '🎯 CXO / Experiencia de Cliente',
  customer_success: '🤝 Customer Success',
  competitor_analyst: '🔭 Análisis de Competencia',
  sourcing_specialist: '🔗 Sourcing',
  rental_specialist: '🔑 Especialista en Alquiler',
  synthesizer: '⚖️ Facilitador',
};

function agentLabel(agentId: string): string {
  return AGENT_LABELS[agentId] ?? `🤖 ${agentId}`;
}

function verdictEmoji(verdict: string): string {
  if (verdict === 'GO') return '✅ GO';
  if (verdict === 'NO-GO') return '❌ NO-GO';
  return '⚠️ CONDICIONAL';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderAgentSection(output: AgentOutputRow): string {
  const lines: string[] = [];
  lines.push(`## ${agentLabel(output.agentId)}`);
  lines.push('');
  lines.push(output.summary ?? '_Sin resumen disponible._');
  lines.push('');

  const meta: string[] = [];
  if (output.model) meta.push(`Modelo: \`${output.model}\``);
  if (output.latencyMs != null) meta.push(`Tiempo: ${(output.latencyMs / 1000).toFixed(1)}s`);
  if (meta.length > 0) lines.push(`_${meta.join(' · ')}_`);

  lines.push('');
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function renderFinalReport(report: Record<string, unknown>): string {
  const verdict = String(report.verdict ?? 'N/A');
  const score = report.viability_score != null ? `${report.viability_score}/10` : 'N/A';
  const confidence =
    report.confidence != null
      ? `${Math.round((report.confidence as number) * 100)}%`
      : 'N/A';
  const summary = String(report.summary ?? '');

  const lines: string[] = [];
  lines.push('## 🎯 VEREDICTO FINAL');
  lines.push('');
  lines.push(`**Decisión:** ${verdictEmoji(verdict)}`);
  lines.push(`**Viabilidad:** ${score}`);
  lines.push(`**Confianza global:** ${confidence}`);
  lines.push('');

  if (summary) {
    lines.push('### Resumen ejecutivo');
    lines.push('');
    lines.push(summary);
    lines.push('');
  }

  const markets = report.recommended_markets as string[] | undefined;
  if (markets?.length) {
    lines.push(`**Mercados recomendados:** ${markets.join(', ')}`);
    lines.push('');
  }

  const channels = report.launch_channels as string[] | undefined;
  if (channels?.length) {
    lines.push(`**Canales de lanzamiento:** ${channels.join(', ')}`);
    lines.push('');
  }

  const budget = report.estimated_budget as { minimum?: string; recommended?: string } | undefined;
  if (budget) {
    lines.push('**Presupuesto estimado:**');
    if (budget.minimum) lines.push(`- Mínimo: ${budget.minimum}`);
    if (budget.recommended) lines.push(`- Recomendado: ${budget.recommended}`);
    lines.push('');
  }

  const risks = report.key_risks as string[] | undefined;
  if (risks?.length) {
    lines.push('**Riesgos clave:**');
    risks.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }

  const steps = report.next_steps as string[] | undefined;
  if (steps?.length) {
    lines.push('**Próximos pasos:**');
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
  }

  return lines.join('\n');
}

export function buildMarkdownReport(summary: SessionSummary): string {
  const lines: string[] = [];

  lines.push('# Informe de Análisis de Negocio');
  lines.push('');
  lines.push(`**Problema:** ${summary.problem}`);
  lines.push(`**Estado:** ${summary.status}`);
  lines.push(`**Fecha:** ${formatDate(summary.createdAt)}`);
  if (summary.completedAt) {
    lines.push(`**Completado:** ${formatDate(summary.completedAt)}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  const outputs = (summary.agentOutputs ?? [])
    .filter(o => o.agentId !== 'synthesizer')
    .sort((a, b) => a.sequence - b.sequence);

  if (outputs.length === 0) {
    lines.push('_No hay análisis de agentes disponibles aún._');
    lines.push('');
    lines.push('---');
    lines.push('');
  } else {
    outputs.forEach(o => lines.push(renderAgentSection(o)));
  }

  if (summary.finalReport && typeof summary.finalReport === 'object') {
    lines.push(renderFinalReport(summary.finalReport as Record<string, unknown>));
  } else {
    lines.push('## 🎯 VEREDICTO FINAL');
    lines.push('');
    lines.push('_Veredicto no disponible. La sesión puede estar aún en curso._');
    lines.push('');
  }

  return lines.join('\n');
}
