import { describe, it, expect } from "vitest";
import { extractJson } from "./ollama.js";

describe("extractJson", () => {
  describe("happy path", () => {
    it("parses plain JSON object", () => {
      expect(extractJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: "x" });
    });

    it("parses JSON wrapped in markdown fence", () => {
      const raw = '```json\n{"a":1}\n```';
      expect(extractJson(raw)).toEqual({ a: 1 });
    });

    it("parses JSON with leading and trailing text", () => {
      const raw = 'Here is the result:\n{"verdict":"GO"}\nThanks!';
      expect(extractJson(raw)).toEqual({ verdict: "GO" });
    });

    it("handles nested objects and arrays", () => {
      const raw = '{"nested":{"arr":[1,2,3],"obj":{"k":"v"}}}';
      expect(extractJson(raw)).toEqual({
        nested: { arr: [1, 2, 3], obj: { k: "v" } },
      });
    });
  });

  describe("recovery from common LLM glitches", () => {
    it("removes trailing commas in objects", () => {
      expect(extractJson('{"a":1,"b":2,}')).toEqual({ a: 1, b: 2 });
    });

    it("removes trailing commas in arrays", () => {
      expect(extractJson('{"arr":[1,2,3,]}')).toEqual({ arr: [1, 2, 3] });
    });

    it("quotes unquoted keys (best-effort)", () => {
      const raw = "{a: 1, b: 2}";
      expect(extractJson(raw)).toEqual({ a: 1, b: 2 });
    });

    it("strips ```json and ``` fences anywhere", () => {
      const raw = 'Result:```json{"x":1}```done';
      expect(extractJson(raw)).toEqual({ x: 1 });
    });
  });

  describe("error cases", () => {
    it("throws SyntaxError when no JSON object present", () => {
      expect(() => extractJson("no json here")).toThrow(SyntaxError);
    });

    it("throws SyntaxError on irrecoverable malformed JSON", () => {
      expect(() => extractJson('{"a": "unterminated')).toThrow(SyntaxError);
    });

    it("throws on empty string", () => {
      expect(() => extractJson("")).toThrow(SyntaxError);
    });
  });
});
