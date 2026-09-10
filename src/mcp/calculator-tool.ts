import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { calculate } from "../tools/calculator.js";

export function registerCalculatorTool(server: McpServer): void {
  server.registerTool(
    "calculator",
    {
      title: "Calculator",
      description:
        "Evaluates a mathematical expression. Supports + - * / % ^ ( ) **, " +
        "functions sqrt abs ln log exp sin cos tan round floor ceil, and " +
        "constants pi and e. Use it for any arithmetic such as totals, " +
        "percentages, discounts or variances.",
      inputSchema: {
        expression: z
          .string()
          .describe("Math expression, e.g. '(40/100) * 500' or 'sqrt(144) + 2^10'"),
      },
    },
    async ({ expression }) => {

      try {
        const value = calculate(expression);
        return {
          content: [{ type: "text" as const, text: `${expression} = ${value}` }],
        };
      } catch (err) {
        return {
          content: [
            { type: "text" as const, text: `Error: ${(err as Error).message}` },
          ],
          isError: true,
        };
      }
    }
  );
}