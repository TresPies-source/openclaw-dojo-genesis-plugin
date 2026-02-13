import { describe, it, expect } from "vitest";
import {
  validateProjectName,
  sanitizeFilename,
  validateOutputDir,
} from "../../src/utils/validation.js";

describe("validateProjectName", () => {
  it("accepts valid lowercase names", () => {
    expect(validateProjectName("my-app")).toEqual({ valid: true });
    expect(validateProjectName("project1")).toEqual({ valid: true });
    expect(validateProjectName("a1")).toEqual({ valid: true });
    expect(validateProjectName("hello-world-123")).toEqual({ valid: true });
  });

  it("accepts names starting with a digit", () => {
    expect(validateProjectName("1project")).toEqual({ valid: true });
    expect(validateProjectName("42-app")).toEqual({ valid: true });
  });

  it("rejects empty string", () => {
    const result = validateProjectName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Project name is required");
  });

  it("rejects uppercase characters", () => {
    const result = validateProjectName("MyApp");
    expect(result.valid).toBe(false);
  });

  it("rejects special characters", () => {
    expect(validateProjectName("my_app").valid).toBe(false);
    expect(validateProjectName("my.app").valid).toBe(false);
    expect(validateProjectName("my app").valid).toBe(false);
    expect(validateProjectName("my@app").valid).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    expect(validateProjectName("../etc/passwd").valid).toBe(false);
    expect(validateProjectName("../../root").valid).toBe(false);
    expect(validateProjectName("./something").valid).toBe(false);
  });

  it("rejects single character name", () => {
    expect(validateProjectName("a").valid).toBe(false);
  });

  it("rejects names longer than 64 characters", () => {
    const longName = "a" + "-b".repeat(32);
    expect(longName.length).toBeGreaterThan(64);
    expect(validateProjectName(longName).valid).toBe(false);
  });

  it("accepts names at exactly 64 characters", () => {
    const name = "a".repeat(64);
    expect(validateProjectName(name).valid).toBe(true);
  });

  it("rejects consecutive hyphens", () => {
    const result = validateProjectName("my--app");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Project name cannot contain consecutive hyphens");
  });

  it("rejects names starting with a hyphen", () => {
    expect(validateProjectName("-my-app").valid).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("lowercases input", () => {
    expect(sanitizeFilename("MyFile")).toBe("myfile");
  });

  it("replaces spaces and special chars with hyphens", () => {
    expect(sanitizeFilename("my file name")).toBe("my-file-name");
    expect(sanitizeFilename("file@name!")).toBe("file-name");
  });

  it("collapses consecutive hyphens", () => {
    expect(sanitizeFilename("a---b")).toBe("a-b");
  });

  it("strips leading and trailing hyphens", () => {
    expect(sanitizeFilename("--hello--")).toBe("hello");
  });

  it("preserves underscores", () => {
    expect(sanitizeFilename("my_file_name")).toBe("my_file_name");
  });

  it("truncates to 128 characters", () => {
    const long = "a".repeat(200);
    expect(sanitizeFilename(long).length).toBe(128);
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("");
  });

  it("handles already-clean filenames", () => {
    expect(sanitizeFilename("2026-02-12_scout_native-vs-pwa.md")).toBe(
      "2026-02-12_scout_native-vs-pwa-md",
    );
  });
});

describe("validateOutputDir", () => {
  it("accepts valid directories", () => {
    expect(validateOutputDir("scouts")).toBe(true);
    expect(validateOutputDir("specs")).toBe(true);
    expect(validateOutputDir("prompts")).toBe(true);
    expect(validateOutputDir("retros")).toBe(true);
    expect(validateOutputDir("tracks")).toBe(true);
    expect(validateOutputDir("artifacts")).toBe(true);
  });

  it("rejects invalid directories", () => {
    expect(validateOutputDir("")).toBe(false);
    expect(validateOutputDir("invalid")).toBe(false);
    expect(validateOutputDir("../scouts")).toBe(false);
    expect(validateOutputDir("SCOUTS")).toBe(false);
  });
});
