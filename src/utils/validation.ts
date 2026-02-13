const PROJECT_NAME_REGEX = /^[a-z0-9][a-z0-9-]{1,63}$/;
const DOUBLE_HYPHEN = /--/;

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: "Project name is required" };
  if (!PROJECT_NAME_REGEX.test(name)) {
    return {
      valid: false,
      error: "Project name must be 2-64 chars, lowercase alphanumeric + hyphens, start with letter/number",
    };
  }
  if (DOUBLE_HYPHEN.test(name)) {
    return { valid: false, error: "Project name cannot contain consecutive hyphens" };
  }
  return { valid: true };
}

export function sanitizeFilename(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 128);
}

export function validateOutputDir(dir: string): boolean {
  const allowed = ["scouts", "specs", "prompts", "retros", "tracks", "artifacts"];
  return allowed.includes(dir);
}
