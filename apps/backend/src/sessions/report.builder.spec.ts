import { describe, it, expect } from 'vitest';
import { buildMarkdownReport } from './report.builder';
import type { SessionSummary } from '../types';

function makeSession(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: 'sess-1',
    tenantId: 'tenant-1',
    profileId: 'profile-a',
    problem: 'Alquiler de equipos para DJ en la costa blanca',
    status: 'completed',
    createdAt: '2026-06-01T20:10:39.524Z',
    completedAt: '2026-06-01T20:18:04.374Z',
    ...overrides,
  };
}

const sampleFinalReport = {
  agent_name: 'synthesizer',
  verdict: 'GO',
  viability_score: 8,
  summary: 'El modelo es viable con buena demanda local.',
  confidence: 0.85,
  recommended_markets: ['España', 'LATAM'],
  launch_channels: ['Instagram', 'Google Ads'],
  estimated_budget: { minimum: '€5,000/mes', recommended: '€15,000/mes' },
  key_risks: ['Alta competencia local', 'Estacionalidad'],
  next_steps: ['Validar precio con 10 clientes', 'Crear web de reservas'],
};

const sampleOutputs = [
  {
    id: 'out-1',
    sessionId: 'sess-1',
    agentId: 'biz_evaluator',
    sequence: 1,
    role: 'Analista',
    summary: 'ICP: DJ profesionales en Alicante. Propuesta: alquiler flexible sin depósito.',
    structuredOutput: {},
    provider: 'ollama',
    model: 'llama3',
    latencyMs: 3200,
    tokensIn: 400,
    tokensOut: 600,
    costUsd: null,
    status: 'completed',
  },
  {
    id: 'out-2',
    sessionId: 'sess-1',
    agentId: 'brand_guardian',
    sequence: 2,
    role: 'Brand',
    summary: 'Posicionamiento: premium local, estética mediterránea.',
    structuredOutput: {},
    provider: 'ollama',
    model: 'llama3',
    latencyMs: 2100,
    tokensIn: 300,
    tokensOut: 400,
    costUsd: null,
    status: 'completed',
  },
];

describe('buildMarkdownReport', () => {
  it('includes the problem in the header', () => {
    const md = buildMarkdownReport(makeSession());
    expect(md).toContain('Alquiler de equipos para DJ en la costa blanca');
  });

  it('renders each agent section with its summary', () => {
    const md = buildMarkdownReport(makeSession({ agentOutputs: sampleOutputs }));
    expect(md).toContain('🔍 Análisis de Negocio');
    expect(md).toContain('ICP: DJ profesionales en Alicante');
    expect(md).toContain('🎨 Brand Guardian');
    expect(md).toContain('Posicionamiento: premium local');
  });

  it('excludes synthesizer from agent sections', () => {
    const outputs = [
      ...sampleOutputs,
      { ...sampleOutputs[0], id: 'out-3', agentId: 'synthesizer', sequence: 3, summary: 'VEREDICTO interno' },
    ];
    const md = buildMarkdownReport(makeSession({ agentOutputs: outputs }));
    expect(md).not.toContain('VEREDICTO interno');
  });

  it('renders the VEREDICTO FINAL section with verdict GO', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: sampleFinalReport }));
    expect(md).toContain('🎯 VEREDICTO FINAL');
    expect(md).toContain('✅ GO');
    expect(md).toContain('8/10');
    expect(md).toContain('85%');
    expect(md).toContain('El modelo es viable');
  });

  it('renders NO-GO verdict with ❌ emoji', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: { ...sampleFinalReport, verdict: 'NO-GO' } }));
    expect(md).toContain('❌ NO-GO');
  });

  it('renders CONDITIONAL verdict with ⚠️ emoji', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: { ...sampleFinalReport, verdict: 'CONDITIONAL' } }));
    expect(md).toContain('⚠️ CONDICIONAL');
  });

  it('renders recommended markets and launch channels', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: sampleFinalReport }));
    expect(md).toContain('España');
    expect(md).toContain('Instagram');
    expect(md).toContain('€5,000/mes');
  });

  it('renders key risks and next steps', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: sampleFinalReport }));
    expect(md).toContain('Alta competencia local');
    expect(md).toContain('Validar precio con 10 clientes');
  });

  it('shows placeholder when no finalReport', () => {
    const md = buildMarkdownReport(makeSession({ finalReport: undefined }));
    expect(md).toContain('Veredicto no disponible');
  });

  it('shows placeholder when no agentOutputs', () => {
    const md = buildMarkdownReport(makeSession({ agentOutputs: [] }));
    expect(md).toContain('No hay análisis de agentes disponibles');
  });

  it('orders agents by sequence', () => {
    const reversed = [...sampleOutputs].reverse();
    const md = buildMarkdownReport(makeSession({ agentOutputs: reversed, finalReport: sampleFinalReport }));
    const bizPos = md.indexOf('🔍 Análisis de Negocio');
    const brandPos = md.indexOf('🎨 Brand Guardian');
    expect(bizPos).toBeLessThan(brandPos);
  });
});
