import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { registerTool, getTool, getAllTools, executeTool, hasPermission } from "@/lib/tools";

describe("Tool Registry", () => {
  beforeEach(() => {
    // Clear registry by re-registering
  });

  it("registers and retrieves a tool", () => {
    registerTool({
      name: "test_tool",
      description: "Test tool",
      parameters: z.object({ input: z.string() }),
      permissions: ["read"],
      timeout: 5000,
      confirmationRequired: false,
    }, async (params) => ({ success: true, output: `got: ${params.input}` }));

    const tool = getTool("test_tool");
    expect(tool).toBeDefined();
    expect(tool?.definition.name).toBe("test_tool");
  });

  it("returns undefined for unknown tool", () => {
    expect(getTool("nonexistent")).toBeUndefined();
  });

  it("lists all registered tools", () => {
    const tools = getAllTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it("executes a registered tool", async () => {
    registerTool({
      name: "echo",
      description: "Echo tool",
      parameters: z.object({ message: z.string() }),
      permissions: ["read"],
      timeout: 5000,
      confirmationRequired: false,
    }, async (params) => ({ success: true, output: params.message as string }));

    const result = await executeTool("echo", { message: "hello" }, { userId: "test", permissions: ["read"] });
    expect(result.success).toBe(true);
    expect(result.output).toBe("hello");
  });

  it("rejects tool with missing permission", async () => {
    registerTool({
      name: "restricted",
      description: "Restricted tool",
      parameters: z.object({}),
      permissions: ["sensitive"],
      timeout: 5000,
      confirmationRequired: false,
    }, async () => ({ success: true, output: "ok" }));

    const result = await executeTool("restricted", {}, { userId: "test", permissions: ["read"] });
    expect(result.success).toBe(false);
    expect(result.error).toContain("sensitive");
  });

  it("validates tool parameters", async () => {
    registerTool({
      name: "validated",
      description: "Validated tool",
      parameters: z.object({ age: z.number().min(0) }),
      permissions: ["read"],
      timeout: 5000,
      confirmationRequired: false,
    }, async () => ({ success: true, output: "ok" }));

    const result = await executeTool("validated", { age: -1 }, { userId: "test", permissions: ["read"] });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid parameters");
  });
});