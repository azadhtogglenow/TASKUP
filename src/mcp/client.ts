import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER_TS = path.resolve(__dirname, "server.ts");
const SERVER_JS = path.resolve(__dirname, "server.js");
const useTypeScript = fs.existsSync(SERVER_TS);
const MCP_SERVER_SCRIPT = useTypeScript ? SERVER_TS : SERVER_JS;

let client: Client | null = null;
let connecting: Promise<Client> | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  if (connecting) return connecting;

  connecting = (async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: useTypeScript
        ? ["--import", "tsx", MCP_SERVER_SCRIPT]
        : [MCP_SERVER_SCRIPT],
      stderr: "inherit",
      env: { ...process.env } as Record<string, string>,
    });

    const c = new Client({ name: "agent-demo-mcp-client", version: "1.0.0" });
    await c.connect(transport);
    const { tools } = await c.listTools();
    console.log(
      `[mcp-client] connected to MCP server. Tools exposed via MCP: ${tools
        .map((t) => t.name)
        .join(", ")}`
    );

    client = c;
    return c;
  })();

  try {
    return await connecting;
  } finally {
    connecting = null;
  }
}


export async function callCalculatorViaMcp(expression: string): Promise<string> {
  try {
    const c = await getClient();
    const result = await c.callTool({
      name: "calculator",
      arguments: { expression },
    });
    const blocks = (result.content ?? []) as unknown as {
      type: string;
      text?: string;
    }[];
    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n");
    return text || "(empty result from MCP server)";
  } catch (err) {
    await closeMcpClient();
    throw new Error(
      `MCP 'calculator' call failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

export async function closeMcpClient(): Promise<void> {
  if (client) {
    const c = client;
    client = null;
    await c.close().catch(() => undefined);
  }
}