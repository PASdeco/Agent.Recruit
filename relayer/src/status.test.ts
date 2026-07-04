import { describe, expect, it } from "vitest";
import { summarizeFailure } from "./status.js";

describe("summarizeFailure", () => {
  it("maps timeout errors to plain language", () => {
    expect(summarizeFailure(new Error("request timed out"))).toMatch(/too long/i);
  });

  it("maps unknown errors to a retry-safe message", () => {
    expect(summarizeFailure(new Error("boom"))).toMatch(/retry/i);
  });
});
