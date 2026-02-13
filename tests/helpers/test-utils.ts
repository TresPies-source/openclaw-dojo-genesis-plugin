import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function createTempDir(prefix = "dojo-test-"): Promise<string> {
  return fs.mkdtemp(join(tmpdir(), prefix));
}

export async function cleanupTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
