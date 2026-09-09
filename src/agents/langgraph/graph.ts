import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { END, START, StateGraph } from "@langchain/langgraph";
import { SYSTEM_PROMPT } from "../prompts.js";
import { MessagesAnnotation } from "./state.js";
import { agentNode, shouldContinue, toolNode } from "./nodes.js";

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

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode) 
  .addNode("tools", toolNode) 
  .addEdge(START, "agent") 
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools", 
    end: END, 
  })
  .addEdge("tools", "agent"); 

export const graph = workflow.compile();

export async function runLangGraphAgent(
  userMessage: string
): Promise<AgentRunResult> {
  const result = await graph.invoke({
    messages: [new SystemMessage(SYSTEM_PROMPT), new HumanMessage(userMessage)],
  });

  return {
    answer: extractFinalAnswer(result.messages),
    steps: extractSteps(result.messages),
    iterations: result.messages.filter((m) => m instanceof AIMessage).length,
  };
}

function extractFinalAnswer(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m instanceof AIMessage) {
      return typeof m.content === "string"
        ? m.content
        : JSON.stringify(m.content);
    }
  }
  return "(no final answer produced)";
}

function extractSteps(messages: BaseMessage[]): AgentStep[] {
  const pending = new Map<string, { name: string; args: unknown }>();
  const steps: AgentStep[] = [];

  for (const m of messages) {
    if (m instanceof AIMessage) {
      for (const call of m.tool_calls ?? []) {
        pending.set(call.id ?? call.name, {
          name: call.name,
          args: call.args,
        });
      }
    } else if (m instanceof ToolMessage) {
      const info = pending.get(m.tool_call_id);
      steps.push({
        tool: m.name ?? info?.name ?? "unknown",
        args: info?.args,
        result: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
    }
  }
  return steps;
}