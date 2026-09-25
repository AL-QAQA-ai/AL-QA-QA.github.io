import type { AgentDefinition, AgentRouteResult } from "./types";

const agents = new Map<string, AgentDefinition>();

export function registerAgent(agent: AgentDefinition) {
  agents.set(agent.id, agent);
}

export function getAgent(id: string) {
  return agents.get(id);
}

export function getAllAgents() {
  return Array.from(agents.values());
}

export function getEnabledAgents() {
  return Array.from(agents.values()).filter((a) => a.enabled);
}

export function routeToAgent(input: string): AgentRouteResult {
  const lower = input.toLowerCase();
  const enabled = getEnabledAgents();

  if (enabled.length === 0) {
    return { agentId: "main", confidence: 1, reason: "No agents configured" };
  }

  let bestMatch: AgentRouteResult = { agentId: "main", confidence: 0, reason: "Default" };

  for (const agent of enabled) {
    let score = 0;

    // Check scope keywords
    for (const keyword of agent.scope) {
      if (lower.includes(keyword.toLowerCase())) {
        score += 0.3;
      }
    }

    // Check specific patterns
    if (agent.id === "coding" && /```|code|function|class|import|debug|bug|fix|test|build|deploy/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "research" && /search|find|research|lookup|what is|who is|how to|explain|compare/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "design" && /design|ui|ux|color|layout|style|css|theme|mockup|wireframe/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "writing" && /write|article|blog|essay|content|copy|caption|post|story/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "data" && /data|analyze|chart|graph|statistics|csv|excel|report|metrics/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "planning" && /plan|project|task|roadmap|sprint|milestone|deadline|organize/.test(lower)) {
      score += 0.4;
    }
    if (agent.id === "science" && /science|physics|chemistry|biology|medicine|math|equation|formula|technology|engineering|solution|solve|calculate|physique|chimie|biologie|médecine|mathématiques|équation|formule|technologie|ingénierie|résoudre|calculer|problème|علوم|فيزياء|كيمياء|أحياء|طب|رياضيات|معادلة|تقنية|تكنولوجيا|هندسة|حل|اشرح|مسألة/.test(lower)) {
      score += 0.4;
    }

    if (score > bestMatch.confidence) {
      bestMatch = {
        agentId: agent.id,
        confidence: Math.min(score, 1),
        reason: `Matched scope: ${agent.scope.join(", ")}`,
      };
    }
  }

  // If no good match, use main agent
  if (bestMatch.confidence < 0.3) {
    return { agentId: "main", confidence: 1, reason: "No strong match, using main agent" };
  }

  return bestMatch;
}
