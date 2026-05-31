import { describe, it, expect } from "vitest";
import { loadProfile, listProfiles } from "./profile.js";

describe("loadProfile", () => {
  it("loads the 'it' profile with required shape", () => {
    const p = loadProfile("it");
    expect(p.id).toBe("it");
    expect(p.agents.length).toBeGreaterThanOrEqual(2);
    expect(p.agents.at(-1)).toBe("synthesizer");
  });

  it("throws for unknown profile", () => {
    expect(() => loadProfile("does-not-exist")).toThrow(
      /Profile "does-not-exist" not found/
    );
  });

  it("includes the list of available profiles in the error message", () => {
    try {
      loadProfile("nope");
    } catch (e) {
      expect((e as Error).message).toMatch(/Available:/);
      return;
    }
    expect.fail("should have thrown");
  });
});

describe("listProfiles", () => {
  it("returns at least the 5 seeded profiles", () => {
    const profiles = listProfiles();
    expect(profiles).toEqual(
      expect.arrayContaining([
        "it",
        "minorista",
        "mayorista",
        "alimenticio",
        "servicios",
      ])
    );
  });

  it("returns a sorted list", () => {
    const profiles = listProfiles();
    const sorted = [...profiles].sort();
    expect(profiles).toEqual(sorted);
  });
});
