import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import {
  readJsonFile,
  writeJsonFile,
  writeTextFile,
  ensureDir,
  fileExists,
} from "../../src/utils/file-ops.js";
import { createTempDir, cleanupTempDir } from "../helpers/test-utils.js";

describe("file-ops", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await createTempDir("dojo-fileops-");
  });

  afterEach(async () => {
    await cleanupTempDir(tmpDir);
  });

  describe("readJsonFile", () => {
    it("returns default value when file does not exist", async () => {
      const result = await readJsonFile(join(tmpDir, "missing.json"), { fallback: true });
      expect(result).toEqual({ fallback: true });
    });

    it("reads and parses existing JSON file", async () => {
      const data = { name: "test", count: 42 };
      await fs.writeFile(join(tmpDir, "data.json"), JSON.stringify(data));

      const result = await readJsonFile(join(tmpDir, "data.json"), {});
      expect(result).toEqual(data);
    });

    it("throws on invalid JSON", async () => {
      await fs.writeFile(join(tmpDir, "bad.json"), "not json{{{");

      await expect(readJsonFile(join(tmpDir, "bad.json"), {})).rejects.toThrow();
    });

    it("returns null as default value", async () => {
      const result = await readJsonFile(join(tmpDir, "missing.json"), null);
      expect(result).toBeNull();
    });
  });

  describe("writeJsonFile", () => {
    it("writes JSON file with formatting", async () => {
      const data = { name: "test" };
      const filePath = join(tmpDir, "output.json");
      await writeJsonFile(filePath, data);

      const raw = await fs.readFile(filePath, "utf-8");
      expect(JSON.parse(raw)).toEqual(data);
      expect(raw).toContain("\n");
    });

    it("creates parent directories", async () => {
      const filePath = join(tmpDir, "nested", "deep", "output.json");
      await writeJsonFile(filePath, { nested: true });

      const raw = await fs.readFile(filePath, "utf-8");
      expect(JSON.parse(raw)).toEqual({ nested: true });
    });

    it("does not leave .tmp file after successful write", async () => {
      const filePath = join(tmpDir, "clean.json");
      await writeJsonFile(filePath, { clean: true });

      const tmpExists = await fileExists(`${filePath}.tmp`);
      expect(tmpExists).toBe(false);
    });

    it("overwrites existing file", async () => {
      const filePath = join(tmpDir, "overwrite.json");
      await writeJsonFile(filePath, { version: 1 });
      await writeJsonFile(filePath, { version: 2 });

      const result = await readJsonFile(filePath, {});
      expect(result).toEqual({ version: 2 });
    });
  });

  describe("writeTextFile", () => {
    it("writes text content", async () => {
      const filePath = join(tmpDir, "output.md");
      await writeTextFile(filePath, "# Hello\n\nWorld");

      const content = await fs.readFile(filePath, "utf-8");
      expect(content).toBe("# Hello\n\nWorld");
    });

    it("creates parent directories", async () => {
      const filePath = join(tmpDir, "nested", "output.md");
      await writeTextFile(filePath, "content");

      const content = await fs.readFile(filePath, "utf-8");
      expect(content).toBe("content");
    });

    it("does not leave .tmp file after successful write", async () => {
      const filePath = join(tmpDir, "clean.md");
      await writeTextFile(filePath, "clean");

      const tmpExists = await fileExists(`${filePath}.tmp`);
      expect(tmpExists).toBe(false);
    });
  });

  describe("ensureDir", () => {
    it("creates directory recursively", async () => {
      const dir = join(tmpDir, "a", "b", "c");
      await ensureDir(dir);

      const stat = await fs.stat(dir);
      expect(stat.isDirectory()).toBe(true);
    });

    it("is idempotent", async () => {
      const dir = join(tmpDir, "idempotent");
      await ensureDir(dir);
      await ensureDir(dir);

      const stat = await fs.stat(dir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe("fileExists", () => {
    it("returns true for existing file", async () => {
      const filePath = join(tmpDir, "exists.txt");
      await fs.writeFile(filePath, "content");

      expect(await fileExists(filePath)).toBe(true);
    });

    it("returns false for missing file", async () => {
      expect(await fileExists(join(tmpDir, "missing.txt"))).toBe(false);
    });

    it("returns true for existing directory", async () => {
      expect(await fileExists(tmpDir)).toBe(true);
    });
  });
});
