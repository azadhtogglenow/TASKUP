import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCalculatorTool } from "./calculator-tool.js";

const server = new McpServer({
  name: "agent-demo-calculator",
  version: "1.0.0",
});

registerCalculatorTool(server);

await server.connect(new StdioServerTransport());
console.error("[mcp-server] calculator MCP server is running on stdio");