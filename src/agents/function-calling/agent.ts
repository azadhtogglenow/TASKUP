import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import { SYSTEM_PROMPT } from "../prompts.js";
import { searchDocuments } from "../../tools/doc-search.js";
import { calculate } from "../../tools/calculator.js";

export interface AgentStep {
  tool: string;
  args: unknown;
  result: string;
}

export interface AgentRunResult {
  answer: string;
  steps: AgentStep[];
  iterations: number;
}

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const tools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "doc-search",
      description:
        "Search the internal SAP/procurement document library stored in " +
        "PostgreSQL. Use for questions about purchase orders, vendor creation, " +
        "goods receipt, invoice verification, payments, approvals, contracts.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keywords, e.g. 'invoice price variance tolerance'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description:
        "Evaluate a mathematical expression. Supports + - * / % ^ ( ) ** and " +
        "functions sqrt abs ln log. Use for any arithmetic such as totals, " +
        "percentages, discounts or variances.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "e.g. '12500 * 0.02' or 'sqrt(144) + 2^10'",
          },
        },
        required: ["expression"],
      },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    if (name === "doc-search") {
      const results = await searchDocuments(String(args.query ?? ""));
      return JSON.stringify(results, null, 2);
    }
    if (name === "calculator") {
      const value = calculate(String(args.expression ?? ""));
      return String(value);
    }
    return `Error: unknown tool "${name}"`;
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function runFunctionCallingAgent(
  userMessage: string
): Promise<AgentRunResult> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const steps: AgentStep[] = [];

  for (let iteration = 1; iteration <= env.maxAgentIterations; iteration++) {
    // 1. Request chat completion from the native Groq client engine
    const response = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-specdec",
      messages,
      tools,
      tool_choice: "auto", 
      temperature: 0,
      max_tokens: 300,
    });

    const message = response.choices[0]?.message;
    if (!message) throw new Error("No message returned by the model");
    messages.push(message as Groq.Chat.ChatCompletionMessageParam);

    const toolCalls = message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        answer: message.content ?? "(no answer)",
        steps,
        iterations: iteration,
      };
    }

    for (const call of toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
    
      }

      const result = await executeTool(call.function.name, args);
      steps.push({ tool: call.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return {
    answer: "I could not complete the task within the allowed number of steps.",
    steps,
    iterations: env.maxAgentIterations,
  };
}
