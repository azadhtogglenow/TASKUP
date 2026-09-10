import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatGroq } from "@langchain/groq"; // Swapped out @langchain/openai for the native Groq package
import { z } from "zod";
import { env } from "../../config/env.js";
import { searchDocuments } from "../../tools/doc-search.js";
import { callCalculatorViaMcp } from "../../mcp/client.js";
import type { AgentState } from "./state.js";

export const docSearchTool = new DynamicStructuredTool({
  name: "doc-search",
  description:
    "Search the internal SAP/procurement document library stored in " +
    "PostgreSQL. Use for questions about purchase orders, vendor creation, " +
    "goods receipt, invoice verification, payments, approvals, contracts.",
  schema: z.object({
    query: z
      .string()
      .describe("Free-text keywords, e.g. 'invoice price variance tolerance'"),
  }),
  func: async ({ query }) => JSON.stringify(await searchDocuments(query), null, 2),
});

export const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description:
    "Evaluate a mathematical expression. Supports + - * / % ^ ( ) ** and " +
    "functions sqrt abs ln log. Use for any arithmetic such as totals, " +
    "percentages, discounts or variances.",
  schema: z.object({
    expression: z
      .string()
      .describe("e.g. '12500 * 0.02' or 'sqrt(144) + 2^10'"),
  }),
  func: async ({ expression }) => callCalculatorViaMcp(expression), // <-- MCP hop
});

let boundModel: ReturnType<typeof createBoundModel> | undefined;

function createBoundModel() {
  const model = new ChatGroq({
    model: env.groqModel || "qwen/qwen3.6-27b",
    temperature: 0,
    apiKey: env.groqApiKey || process.env.GROQ_API_KEY || undefined,
    maxTokens: 300,
  });
  return model.bindTools([docSearchTool, calculatorTool]);
}

function getBoundModel() {
  if (!boundModel) boundModel = createBoundModel();
  return boundModel;
}

export async function agentNode(state: AgentState) {
  const response = await getBoundModel().invoke(state.messages);
  return { messages: [response] };
}

export async function toolNode(state: AgentState) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const results: ToolMessage[] = [];

  for (const call of lastMessage.tool_calls ?? []) {
    const args = (call.args ?? {}) as Record<string, unknown>;
    let output: string;

    if (call.name === docSearchTool.name) {
      output = await docSearchTool.invoke(args as { query: string });
    } else if (call.name === calculatorTool.name) {
      output = await calculatorTool.invoke(args as { expression: string });
    } else {
      output = `Error: unknown tool "${call.name}"`;
    }

    results.push(
      new ToolMessage({
        content: output,
        tool_call_id: call.id ?? call.name,
        name: call.name,
      })
    );
  }

  return { messages: results };
}

export function shouldContinue(state: AgentState): "tools" | "end" {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const hasToolCalls = (lastMessage.tool_calls ?? []).length > 0;
  return hasToolCalls ? "tools" : "end";
}
