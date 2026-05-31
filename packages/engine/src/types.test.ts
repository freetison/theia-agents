import { describe, it, expect } from "vitest";
import {
  BizEvaluatorOutputSchema,
  SoftwareArchitectOutputSchema,
  FinalReportSchema,
} from "./types.js";

describe("Zod schemas — flex preprocessors", () => {
  describe("flexString (via BizEvaluatorOutput.icp)", () => {
    const base = {
      icp: "tech founders",
      problem_statement: "x",
      value_proposition: "x",
      pricing_suggestion: "x",
      channels_recommended: [],
      risks: [],
      confidence: 0.8,
      assumptions: [],
    };

    it("accepts a plain string", () => {
      const parsed = BizEvaluatorOutputSchema.parse(base);
      expect(parsed.icp).toBe("tech founders");
    });

    it("coerces a number to string", () => {
      const parsed = BizEvaluatorOutputSchema.parse({ ...base, icp: 42 });
      expect(parsed.icp).toBe("42");
    });

    it("joins an array of strings with comma", () => {
      const parsed = BizEvaluatorOutputSchema.parse({
        ...base,
        icp: ["a", "b", "c"],
      });
      expect(parsed.icp).toBe("a, b, c");
    });

    it("flattens an object into key:val pairs", () => {
      const parsed = BizEvaluatorOutputSchema.parse({
        ...base,
        icp: { age: 30, region: "EU" },
      });
      expect(parsed.icp).toBe("age: 30, region: EU");
    });
  });

  describe("flexStringArray (via BizEvaluatorOutput.risks)", () => {
    const base = {
      icp: "x",
      problem_statement: "x",
      value_proposition: "x",
      pricing_suggestion: "x",
      channels_recommended: [],
      risks: [],
      confidence: 0.5,
      assumptions: [],
    };

    it("accepts an array of strings", () => {
      const parsed = BizEvaluatorOutputSchema.parse({
        ...base,
        risks: ["r1", "r2"],
      });
      expect(parsed.risks).toEqual(["r1", "r2"]);
    });

    it("wraps a single string in an array", () => {
      const parsed = BizEvaluatorOutputSchema.parse({
        ...base,
        risks: "only one",
      });
      expect(parsed.risks).toEqual(["only one"]);
    });

    it("flattens objects inside an array", () => {
      const parsed = BizEvaluatorOutputSchema.parse({
        ...base,
        risks: [{ name: "r1", severity: "high" }],
      });
      expect(parsed.risks).toEqual(["name: r1, severity: high"]);
    });

    it("returns empty array for null", () => {
      const parsed = BizEvaluatorOutputSchema.parse({ ...base, risks: null });
      expect(parsed.risks).toEqual([]);
    });
  });
});

describe("SoftwareArchitectOutput — build_or_buy enum normalization", () => {
  const base = {
    build_or_buy: [],
    tech_stack: { frontend: "x", backend: "x", db: "x", infra: "x" },
    mvp_scope: [],
    architecture_approach: "x",
    estimated_team: [],
    effort_estimation: { mvp: "x", three_months: "x", six_months: "x" },
    scalability_plan: [],
    technical_risks: [],
    existing_tools_to_evaluate: [],
    confidence: 0.7,
  };

  it("lowercases the decision field", () => {
    const parsed = SoftwareArchitectOutputSchema.parse({
      ...base,
      build_or_buy: [{ component: "auth", decision: "BUILD", rationale: "y" }],
    });
    expect(parsed.build_or_buy[0]?.decision).toBe("build");
  });

  it("rejects unknown decision values", () => {
    expect(() =>
      SoftwareArchitectOutputSchema.parse({
        ...base,
        build_or_buy: [{ component: "x", decision: "rent", rationale: "y" }],
      })
    ).toThrow();
  });
});

describe("FinalReport — verdict + budget normalization", () => {
  const base = {
    verdict: "GO",
    viability_score: 7,
    recommended_markets: [],
    launch_channels: [],
    estimated_budget: { minimum: "10k", recommended: "30k" },
    key_risks: [],
    next_steps: [],
    summary: "ok",
    confidence: 0.8,
  };

  it("uppercases verdict", () => {
    const parsed = FinalReportSchema.parse({ ...base, verdict: "go" });
    expect(parsed.verdict).toBe("GO");
  });

  it("parses viability_score from string", () => {
    const parsed = FinalReportSchema.parse({ ...base, viability_score: "7.5" });
    expect(parsed.viability_score).toBe(7.5);
  });

  it("rejects verdict out of enum", () => {
    expect(() =>
      FinalReportSchema.parse({ ...base, verdict: "MAYBE" })
    ).toThrow();
  });

  it("wraps non-object budget into {minimum, recommended}", () => {
    const parsed = FinalReportSchema.parse({
      ...base,
      estimated_budget: "50000",
    });
    expect(parsed.estimated_budget).toEqual({
      minimum: "50000",
      recommended: "50000",
    });
  });
});
