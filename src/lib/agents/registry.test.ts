import { describe, it, expect, beforeEach } from "vitest";
import { routeToAgent, getAgent, getEnabledAgents, registerAgent } from "@/lib/agents";

describe("Agent Registry", () => {
  beforeEach(() => {
    // Built-in agents are registered on import
  });

  it("has built-in agents registered", () => {
    const agents = getEnabledAgents();
    expect(agents.length).toBeGreaterThan(0);
    const ids = agents.map((a) => a.id);
    expect(ids).toContain("main");
    expect(ids).toContain("coding");
    expect(ids).toContain("research");
  });

  it("gets specific agent by id", () => {
    const agent = getAgent("coding");
    expect(agent).toBeDefined();
    expect(agent?.name).toBe("Coding Agent");
    expect(agent?.permissions).toContain("read");
  });

  it("routes to coding agent for code queries", () => {
    const result = routeToAgent("code a function to sort array");
    expect(result.agentId).toBe("coding");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("routes to research agent for search queries", () => {
    const result = routeToAgent("research latest React features");
    expect(result.agentId).toBe("research");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("routes to design agent for design queries", () => {
    const result = routeToAgent("design a landing page with modern colors");
    expect(result.agentId).toBe("design");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("routes to writing agent for content queries", () => {
    const result = routeToAgent("write a blog post about AI");
    expect(result.agentId).toBe("writing");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("routes to data agent for analysis queries", () => {
    const result = routeToAgent("analyze this data and create a chart");
    expect(result.agentId).toBe("data");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("routes to planning agent for project queries", () => {
    const result = routeToAgent("plan a project roadmap for Q4");
    expect(result.agentId).toBe("planning");
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it("defaults to main agent for general queries", () => {
    const result = routeToAgent("hello how are you");
    expect(result.agentId).toBe("main");
  });

  it("allows registering custom agents", () => {
    registerAgent({
      id: "custom",
      name: "Custom Agent",
      description: "Test agent",
      scope: ["test"],
      permissions: ["read"],
      systemPrompt: "You are a test agent",
      enabled: true,
    });

    const agent = getAgent("custom");
    expect(agent).toBeDefined();
    expect(agent?.name).toBe("Custom Agent");
  });
});