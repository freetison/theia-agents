import { describe, it, expect } from "vitest";
import { buildGraph } from "./graph.js";
import { loadProfile } from "./profile.js";

describe("buildGraph (smoke)", () => {
  it("compiles a graph for the 'it' profile", () => {
    const profile = loadProfile("it");
    const graph = buildGraph(profile);
    expect(typeof graph.invoke).toBe("function");
  });

  it("compiles a graph for every seeded profile", () => {
    const ids = ["it", "minorista", "mayorista", "alimenticio", "servicios"];
    for (const id of ids) {
      const profile = loadProfile(id);
      const graph = buildGraph(profile);
      expect(typeof graph.invoke).toBe("function");
    }
  });

  it("throws when last agent is not 'synthesizer'", () => {
    const profile = loadProfile("it");
    const broken = { ...profile, agents: profile.agents.slice(0, -1) };
    expect(() => buildGraph(broken)).toThrow(/last agent must be "synthesizer"/);
  });

  it("throws when an unknown agent id is referenced", () => {
    const profile = loadProfile("it");
    const broken = { ...profile, agents: ["unknown_agent", "synthesizer"] };
    expect(() => buildGraph(broken)).toThrow(/Unknown agent/);
  });
});
