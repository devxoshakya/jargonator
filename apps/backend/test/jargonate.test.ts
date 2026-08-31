import { describe, it, expect } from "vitest";
import { parseJargonResponse } from "../src/lib/parseJargonResponse";
import { buildSystemPrompt } from "../src/prompts/buildSystemPrompt";

describe("parseJargonResponse", () => {
  it("parses clean JSON", () => {
    const result = parseJargonResponse('{"jargon": "Hi Rahul, following up."}');
    expect(result.jargon).toBe("Hi Rahul, following up.");
  });

  it("strips markdown code fences", () => {
    const result = parseJargonResponse('```json\n{"jargon": "Following up on this."}\n```');
    expect(result.jargon).toBe("Following up on this.");
  });

  it("extracts JSON from surrounding stray text", () => {
    const result = parseJargonResponse('Sure, here it is: {"jargon": "Noted, thanks."} Hope that helps!');
    expect(result.jargon).toBe("Noted, thanks.");
  });

  it("throws on missing jargon field", () => {
    expect(() => parseJargonResponse('{"message": "oops"}')).toThrow();
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJargonResponse("not json at all")).toThrow();
  });
});

describe("buildSystemPrompt", () => {
  it("includes all required fields in the prompt", () => {
    const prompt = buildSystemPrompt({
      raw: "bhai 3 baar bol chuka hu",
      tone: "firm",
      relationship: "peer",
      context: "3rd follow-up",
    });
    expect(prompt).toContain("bhai 3 baar bol chuka hu");
    expect(prompt).toContain("Tone: firm");
    expect(prompt).toContain("Relationship: peer");
    expect(prompt).toContain("3rd follow-up");
    expect(prompt).toContain('{"jargon"');
  });

  it("defaults context to 'none provided' when omitted", () => {
    const prompt = buildSystemPrompt({
      raw: "test",
      tone: "diplomatic",
      relationship: "client",
    });
    expect(prompt).toContain("Context: none provided");
  });
});
