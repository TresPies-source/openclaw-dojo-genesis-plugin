export interface PluginLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface PluginRuntime {
  state: {
    resolveStateDir(pluginId: string): string;
  };
}

export interface CommandContext {
  args?: string;
}

export interface CommandRegistration {
  name: string;
  description: string;
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
  registerTool(tool: ToolRegistration): void;
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

export function registerPluginHooksFromDir(
  _api: PluginAPI,
  _dir: string,
): void {}

export function createMockPluginAPI(stateDir: string): PluginAPI & {
  _commands: Map<string, CommandRegistration>;
  _tools: Map<string, ToolRegistration>;
} {
  const commands = new Map<string, CommandRegistration>();
  const tools = new Map<string, ToolRegistration>();

  return {
    _commands: commands,
    _tools: tools,
    registerCommand(cmd: CommandRegistration) {
      commands.set(cmd.name, cmd);
    },
    registerTool(tool: ToolRegistration) {
      tools.set(tool.name, tool);
    },
    runtime: {
      state: {
        resolveStateDir(_pluginId: string) {
          return stateDir;
        },
      },
    },
    logger: {
      info() {},
      warn() {},
      error() {},
      debug() {},
    },
  };
}
