/**
 * Type declarations for the openclaw runtime package.
 * The openclaw package does not ship its own .d.ts files,
 * so we declare the subset of the API surface that this plugin uses.
 */
declare module "openclaw" {
  export interface PluginLogger {
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
  }

  export interface OpenClawConfig {
    [key: string]: unknown;
  }

  export interface PluginRuntime {
    state: {
      resolveStateDir(cfg: OpenClawConfig): string;
    };
  }

  export interface CommandContext {
    args?: string;
    channel?: string;
  }

  export interface CommandRegistration {
    name: string;
    description: string;
    acceptsArgs?: boolean;
    requireAuth?: boolean;
    handler: (ctx: CommandContext) => { text: string } | Promise<{ text: string }>;
  }

  export interface ToolResult {
    content: Array<{ type: string; text: string }>;
  }

  export interface ToolRegistration {
    name: string;
    description: string;
    parameters: unknown;
    execute: (id: string, params: Record<string, unknown>) => Promise<ToolResult>;
  }

  export interface PluginAPI {
    registerCommand(cmd: CommandRegistration): void;
    registerTool(tool: ToolRegistration, opts?: { optional?: boolean }): void;
    runtime: PluginRuntime;
    logger: PluginLogger;
  }

  export interface HookEvent {
    type: string;
    action?: string;
    messages: string[];
    context?: Record<string, unknown>;
  }

  export type HookHandler = (event: HookEvent) => Promise<void> | void;
}

declare module "openclaw/plugin-sdk" {
  import type { PluginAPI } from "openclaw";
  export function registerPluginHooksFromDir(api: PluginAPI, dir: string): void;
}
