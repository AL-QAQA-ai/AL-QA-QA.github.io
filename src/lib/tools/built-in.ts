import { z } from "zod";
import { registerTool } from "./registry";

// Calculator tool
registerTool(
  {
    name: "calculator",
    description: "Evaluate a mathematical expression",
    parameters: z.object({
      expression: z.string().describe("Mathematical expression to evaluate"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    try {
      const expr = (params.expression as string).replace(/[^0-9+\-*/().%\s]/g, "");
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${expr})`)();
      return { success: true, output: String(result) };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: `Cannot evaluate expression: ${error instanceof Error ? error.message : "invalid math"}`,
      };
    }
  }
);

// Current date/time tool
registerTool(
  {
    name: "current_datetime",
    description: "Get the current date and time",
    parameters: z.object({
      timezone: z.string().optional().describe("Timezone (e.g. UTC, America/New_York)"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    const tz = (params.timezone as string) || "UTC";
    const now = new Date();
    const formatted = now.toLocaleString("en-US", { timeZone: tz, dateStyle: "full", timeStyle: "long" });
    return { success: true, output: formatted, metadata: { iso: now.toISOString(), timezone: tz } };
  }
);

// Text analysis tool
registerTool(
  {
    name: "text_analyzer",
    description: "Analyze text: word count, character count, sentence count",
    parameters: z.object({
      text: z.string().describe("Text to analyze"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    const text = params.text as string;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    const lines = text.split("\n").length;
    return {
      success: true,
      output: JSON.stringify({ words, characters: chars, sentences, lines }, null, 2),
      metadata: { words, characters: chars, sentences, lines },
    };
  }
);

// UUID generator
registerTool(
  {
    name: "uuid_generator",
    description: "Generate a UUID",
    parameters: z.object({
      count: z.number().min(1).max(100).optional().describe("Number of UUIDs to generate"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    const count = (params.count as number) || 1;
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    return { success: true, output: uuids.join("\n") };
  }
);

// JSON formatter
registerTool(
  {
    name: "json_formatter",
    description: "Format or validate JSON",
    parameters: z.object({
      json: z.string().describe("JSON string to format"),
      indent: z.number().optional().describe("Indentation spaces"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    try {
      const parsed = JSON.parse(params.json as string);
      const indent = (params.indent as number) || 2;
      return { success: true, output: JSON.stringify(parsed, null, indent) };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`,
      };
    }
  }
);

// Unit converter tool (works offline)
const LENGTH_TO_M: Record<string, number> = {
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344,
};
const MASS_TO_KG: Record<string, number> = {
  mg: 0.000001, g: 0.001, kg: 1, t: 1000,
  oz: 0.028349523125, lb: 0.45359237,
};

registerTool(
  {
    name: "unit_converter",
    description: "Convert between units: length (mm/cm/m/km/in/ft/yd/mi), mass (mg/g/kg/t/oz/lb), temperature (C/F/K)",
    parameters: z.object({
      value: z.number().describe("Numeric value to convert"),
      from: z.string().describe("Source unit (e.g. km, lb, C)"),
      to: z.string().describe("Target unit (e.g. m, kg, F)"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    try {
      const value = params.value as number;
      const from = (params.from as string).toLowerCase();
      const to = (params.to as string).toLowerCase();

      const convertLinear = (v: number, f: string, t: string, table: Record<string, number>) => {
        if (!(f in table) || !(t in table)) return null;
        return (v * table[f]) / table[t];
      };

      let result: number | null = null;
      result = convertLinear(value, from, to, LENGTH_TO_M) ?? convertLinear(value, from, to, MASS_TO_KG);

      if (result === null) {
        // Temperature
        const toC = (v: number, u: string) =>
          u === "c" ? v : u === "f" ? ((v - 32) * 5) / 9 : u === "k" ? v - 273.15 : null;
        const fromC = (v: number, u: string) =>
          u === "c" ? v : u === "f" ? (v * 9) / 5 + 32 : u === "k" ? v + 273.15 : null;
        const c = toC(value, from);
        result = c === null ? null : fromC(c, to);
      }

      if (result === null) {
        return { success: false, output: "", error: `Unsupported conversion: ${from} → ${to}` };
      }
      const rounded = Math.round(result * 10000) / 10000;
      return { success: true, output: `${value} ${from} = ${rounded} ${to}` };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: `Conversion failed: ${error instanceof Error ? error.message : "unknown error"}`,
      };
    }
  }
);

// Problem solver tool (works offline): percentages, rule of three, averages
registerTool(
  {
    name: "problem_solver",
    description: "Solve small quantitative problems offline: percentage (x% of y), rule of three (a→b, c→?), average of a list",
    parameters: z.object({
      kind: z.enum(["percent", "rule_of_three", "average"]).describe("Type of problem"),
      a: z.number().describe("First number (percent value, or a in a→b)"),
      b: z.number().describe("Second number (base value, or b in a→b)"),
      c: z.number().optional().describe("Third number (only for rule_of_three: c→?)"),
      values: z.array(z.number()).optional().describe("List of numbers (only for average)"),
    }),
    permissions: ["read"],
    timeout: 5000,
    confirmationRequired: false,
  },
  async (params) => {
    const kind = params.kind as string;
    const a = params.a as number;
    const b = params.b as number;
    try {
      if (kind === "percent") {
        const r = (a / 100) * b;
        return { success: true, output: `${a}% of ${b} = ${r}` };
      }
      if (kind === "rule_of_three") {
        if (a === 0) return { success: false, output: "", error: "Division by zero" };
        const c = params.c as number;
        const r = (b * c) / a;
        return { success: true, output: `If ${a} → ${b}, then ${c} → ${r}` };
      }
      const values = params.values as number[];
      if (!values || values.length === 0) {
        return { success: false, output: "", error: "Provide a non-empty values array" };
      }
      const r = values.reduce((s, v) => s + v, 0) / values.length;
      return { success: true, output: `Average of [${values.join(", ")}] = ${r}` };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: `Solver failed: ${error instanceof Error ? error.message : "unknown error"}`,
      };
    }
  }
);

// Web search tool (placeholder — real implementation needs API key)
registerTool(
  {
    name: "web_search",
    description: "Search the web for information (requires API key)",
    parameters: z.object({
      query: z.string().describe("Search query"),
      numResults: z.number().min(1).max(20).optional().describe("Number of results"),
    }),
    permissions: ["network"],
    timeout: 30000,
    confirmationRequired: false,
  },
  async (params) => {
    const query = params.query as string;
    return {
      success: true,
      output: `Web search for "${query}" is available but requires a search API key (e.g. SerpAPI, Tavily). Configure in Settings.`,
      metadata: { query, provider: "none" },
    };
  }
);
