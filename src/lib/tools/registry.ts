import type { ToolDefinition, ToolHandler, ToolExecutionContext, ToolResult, ToolPermission } from "./types";

const registry = new Map<string, { definition: ToolDefinition; handler: ToolHandler }>();

export function registerTool(definition: ToolDefinition, handler: ToolHandler) {
  registry.set(definition.name, { definition, handler });
}

export function getTool(name: string) {
  return registry.get(name);
}

export function getAllTools() {
  return Array.from(registry.values()).map((t) => t.definition);
}

export function getToolDefinitions() {
  return Array.from(registry.values()).map((t) => ({
    name: t.definition.name,
    description: t.definition.description,
  }));
}

export async function executeTool(
  name: string,
  params: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<ToolResult> {
  const tool = registry.get(name);
  if (!tool) {
    return { success: false, output: "", error: `Tool "${name}" not found` };
  }

  // Check permissions
  const hasPermission = tool.definition.permissions.every((p) =>
    context.permissions.includes(p)
  );
  if (!hasPermission) {
    const missing = tool.definition.permissions.filter(
      (p) => !context.permissions.includes(p)
    );
    return {
      success: false,
      output: "",
      error: `Missing permissions: ${missing.join(", ")}`,
    };
  }

  // Validate params
  const parsed = tool.definition.parameters.safeParse(params);
  if (!parsed.success) {
    return {
      success: false,
      output: "",
      error: `Invalid parameters: ${parsed.error.message}`,
    };
  }

  // Execute with timeout
  const timeout = tool.definition.timeout;
  try {
    const result = await Promise.race([
      tool.handler(parsed.data as Record<string, unknown>, context),
      new Promise<ToolResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Tool "${name}" timed out after ${timeout}ms`)), timeout)
      ),
    ]);
    return result;
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function hasPermission(
  currentPermissions: ToolPermission[],
  required: ToolPermission[]
): boolean {
  return required.every((p) => currentPermissions.includes(p));
}
