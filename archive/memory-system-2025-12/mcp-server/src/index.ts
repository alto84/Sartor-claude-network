import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { Client as SSHClient } from "ssh2";
import { z } from "zod";

const execAsync = promisify(exec);

// Configuration
const PORT = parseInt(process.env.PORT || "3001", 10);
const ALLOWED_DIRECTORIES = [
  "C:\\Users\\alto8",
  "C:\\Users\\alto8\\Sartor-claude-network",
  "C:\\Users\\alto8\\Documents",
  "C:\\Users\\alto8\\Downloads",
  "C:\\Projects",
];

const SSH_CONFIG = {
  gpuserver1: {
    host: process.env.SSH_HOST_GPUSERVER1 || "gpuserver1",
    port: parseInt(process.env.SSH_PORT_GPUSERVER1 || "22", 10),
    username: process.env.SSH_USER_GPUSERVER1 || "alto",
    privateKeyPath: process.env.SSH_KEY_GPUSERVER1 || "C:\\Users\\alto8\\.ssh\\id_rsa",
  },
};

// Utility functions
function isPathAllowed(targetPath: string): boolean {
  const normalizedPath = path.resolve(targetPath);
  return ALLOWED_DIRECTORIES.some((allowed) =>
    normalizedPath.toLowerCase().startsWith(allowed.toLowerCase())
  );
}

function sanitizePath(inputPath: string): string {
  // Prevent path traversal attacks
  return path.normalize(inputPath).replace(/^(\.\.(\/|\\|$))+/, "");
}

// Create MCP Server
const server = new McpServer({
  name: "sartor-windows-mcp",
  version: "1.0.0",
});

// === FILESYSTEM TOOLS ===

server.tool(
  "fs_read_file",
  "Read the contents of a file from allowed directories",
  {
    path: z.string().describe("Absolute path to the file to read"),
  },
  async ({ path: filePath }) => {
    const sanitized = sanitizePath(filePath);

    if (!isPathAllowed(sanitized)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path '${sanitized}' is not in allowed directories.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const content = await fs.readFile(sanitized, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error reading file: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "fs_write_file",
  "Write content to a file in allowed directories",
  {
    path: z.string().describe("Absolute path to the file to write"),
    content: z.string().describe("Content to write to the file"),
  },
  async ({ path: filePath, content }) => {
    const sanitized = sanitizePath(filePath);

    if (!isPathAllowed(sanitized)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path '${sanitized}' is not in allowed directories.`,
          },
        ],
        isError: true,
      };
    }

    try {
      await fs.mkdir(path.dirname(sanitized), { recursive: true });
      await fs.writeFile(sanitized, content, "utf-8");
      return {
        content: [
          {
            type: "text",
            text: `Successfully wrote ${content.length} bytes to ${sanitized}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error writing file: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "fs_list_directory",
  "List contents of a directory in allowed paths",
  {
    path: z.string().describe("Absolute path to the directory to list"),
    recursive: z.boolean().optional().describe("Whether to list recursively (default: false)"),
  },
  async ({ path: dirPath, recursive = false }) => {
    const sanitized = sanitizePath(dirPath);

    if (!isPathAllowed(sanitized)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path '${sanitized}' is not in allowed directories.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const entries = await fs.readdir(sanitized, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        const entryPath = path.join(sanitized, entry.name);
        const type = entry.isDirectory() ? "[DIR]" : "[FILE]";

        try {
          const stats = await fs.stat(entryPath);
          const size = entry.isFile() ? ` (${stats.size} bytes)` : "";
          results.push(`${type} ${entry.name}${size}`);

          if (recursive && entry.isDirectory() && !entry.name.startsWith(".")) {
            // Limit recursion depth
            const subEntries = await fs.readdir(entryPath, { withFileTypes: true });
            for (const subEntry of subEntries.slice(0, 20)) {
              const subType = subEntry.isDirectory() ? "[DIR]" : "[FILE]";
              results.push(`  ${subType} ${entry.name}/${subEntry.name}`);
            }
            if (subEntries.length > 20) {
              results.push(`  ... and ${subEntries.length - 20} more items`);
            }
          }
        } catch {
          results.push(`${type} ${entry.name} (access denied)`);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: results.length > 0 ? results.join("\n") : "Directory is empty",
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error listing directory: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "fs_delete",
  "Delete a file or directory in allowed paths",
  {
    path: z.string().describe("Absolute path to delete"),
    recursive: z.boolean().optional().describe("For directories, delete recursively"),
  },
  async ({ path: targetPath, recursive = false }) => {
    const sanitized = sanitizePath(targetPath);

    if (!isPathAllowed(sanitized)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path '${sanitized}' is not in allowed directories.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const stats = await fs.stat(sanitized);

      if (stats.isDirectory()) {
        await fs.rm(sanitized, { recursive, force: false });
      } else {
        await fs.unlink(sanitized);
      }

      return {
        content: [
          {
            type: "text",
            text: `Successfully deleted: ${sanitized}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error deleting: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "fs_mkdir",
  "Create a directory in allowed paths",
  {
    path: z.string().describe("Absolute path of directory to create"),
  },
  async ({ path: dirPath }) => {
    const sanitized = sanitizePath(dirPath);

    if (!isPathAllowed(sanitized)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Access denied. Path '${sanitized}' is not in allowed directories.`,
          },
        ],
        isError: true,
      };
    }

    try {
      await fs.mkdir(sanitized, { recursive: true });
      return {
        content: [
          {
            type: "text",
            text: `Successfully created directory: ${sanitized}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating directory: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// === SHELL EXECUTION TOOLS ===

server.tool(
  "shell_execute",
  "Execute a shell command on Windows (cmd.exe or PowerShell)",
  {
    command: z.string().describe("The command to execute"),
    shell: z.enum(["cmd", "powershell"]).optional().describe("Shell to use (default: cmd)"),
    cwd: z.string().optional().describe("Working directory for the command"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 30000)"),
  },
  async ({ command, shell = "cmd", cwd, timeout = 30000 }) => {
    // Validate working directory if provided
    if (cwd) {
      const sanitizedCwd = sanitizePath(cwd);
      if (!isPathAllowed(sanitizedCwd)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Working directory '${sanitizedCwd}' is not in allowed paths.`,
            },
          ],
          isError: true,
        };
      }
    }

    // Dangerous command check
    const dangerousPatterns = [
      /format\s+[a-z]:/i,
      /del\s+\/[sfq]/i,
      /rmdir\s+\/s/i,
      /rd\s+\/s/i,
      /::\s*format/i,
      /shutdown/i,
      /reg\s+delete/i,
    ];

    if (dangerousPatterns.some((pattern) => pattern.test(command))) {
      return {
        content: [
          {
            type: "text",
            text: "Error: This command has been blocked for safety reasons.",
          },
        ],
        isError: true,
      };
    }

    try {
      const shellCmd = shell === "powershell"
        ? `powershell -NoProfile -NonInteractive -Command "${command.replace(/"/g, '\\"')}"`
        : command;

      const { stdout, stderr } = await execAsync(shellCmd, {
        cwd: cwd || "C:\\Users\\alto8",
        timeout,
        windowsHide: true,
        shell: shell === "cmd" ? "cmd.exe" : undefined,
      });

      const output = [
        stdout ? `STDOUT:\n${stdout}` : "",
        stderr ? `STDERR:\n${stderr}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: output || "Command completed with no output.",
          },
        ],
      };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; message?: string; code?: number };
      const errorOutput = [
        execError.stdout ? `STDOUT:\n${execError.stdout}` : "",
        execError.stderr ? `STDERR:\n${execError.stderr}` : "",
        `Error: ${execError.message || String(error)}`,
        execError.code !== undefined ? `Exit code: ${execError.code}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: errorOutput,
          },
        ],
        isError: true,
      };
    }
  }
);

server.tool(
  "shell_spawn",
  "Start a long-running process (non-blocking)",
  {
    command: z.string().describe("The command to spawn"),
    args: z.array(z.string()).optional().describe("Command arguments"),
    cwd: z.string().optional().describe("Working directory"),
  },
  async ({ command, args = [], cwd }) => {
    if (cwd) {
      const sanitizedCwd = sanitizePath(cwd);
      if (!isPathAllowed(sanitizedCwd)) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Working directory '${sanitizedCwd}' is not in allowed paths.`,
            },
          ],
          isError: true,
        };
      }
    }

    try {
      const child = spawn(command, args, {
        cwd: cwd || "C:\\Users\\alto8",
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });

      child.unref();

      return {
        content: [
          {
            type: "text",
            text: `Process spawned with PID: ${child.pid}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error spawning process: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// === SSH TOOLS ===

server.tool(
  "ssh_execute",
  "Execute a command on gpuserver1 via SSH",
  {
    command: z.string().describe("Command to execute on the remote server"),
    timeout: z.number().optional().describe("Timeout in milliseconds (default: 60000)"),
  },
  async ({ command, timeout = 60000 }) => {
    const config = SSH_CONFIG.gpuserver1;

    return new Promise(async (resolve) => {
      const conn = new SSHClient();
      let privateKey: Buffer;

      try {
        privateKey = await fs.readFile(config.privateKeyPath);
      } catch (error) {
        resolve({
          content: [
            {
              type: "text",
              text: `Error reading SSH key: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        });
        return;
      }

      const timeoutId = setTimeout(() => {
        conn.end();
        resolve({
          content: [
            {
              type: "text",
              text: `SSH command timed out after ${timeout}ms`,
            },
          ],
          isError: true,
        });
      }, timeout);

      conn
        .on("ready", () => {
          conn.exec(command, (err, stream) => {
            if (err) {
              clearTimeout(timeoutId);
              conn.end();
              resolve({
                content: [
                  {
                    type: "text",
                    text: `SSH exec error: ${err.message}`,
                  },
                ],
                isError: true,
              });
              return;
            }

            let stdout = "";
            let stderr = "";

            stream
              .on("close", (code: number) => {
                clearTimeout(timeoutId);
                conn.end();

                const output = [
                  stdout ? `STDOUT:\n${stdout}` : "",
                  stderr ? `STDERR:\n${stderr}` : "",
                  `Exit code: ${code}`,
                ]
                  .filter(Boolean)
                  .join("\n\n");

                resolve({
                  content: [
                    {
                      type: "text",
                      text: output || "Command completed with no output.",
                    },
                  ],
                  isError: code !== 0,
                });
              })
              .on("data", (data: Buffer) => {
                stdout += data.toString();
              })
              .stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
              });
          });
        })
        .on("error", (err) => {
          clearTimeout(timeoutId);
          resolve({
            content: [
              {
                type: "text",
                text: `SSH connection error: ${err.message}`,
              },
            ],
            isError: true,
          });
        })
        .connect({
          host: config.host,
          port: config.port,
          username: config.username,
          privateKey,
        });
    });
  }
);

server.tool(
  "ssh_check_connection",
  "Test SSH connectivity to gpuserver1",
  {},
  async () => {
    const config = SSH_CONFIG.gpuserver1;

    return new Promise(async (resolve) => {
      const conn = new SSHClient();
      let privateKey: Buffer;

      try {
        privateKey = await fs.readFile(config.privateKeyPath);
      } catch (error) {
        resolve({
          content: [
            {
              type: "text",
              text: `Error reading SSH key from ${config.privateKeyPath}: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        });
        return;
      }

      const timeoutId = setTimeout(() => {
        conn.end();
        resolve({
          content: [
            {
              type: "text",
              text: `SSH connection timed out connecting to ${config.host}:${config.port}`,
            },
          ],
          isError: true,
        });
      }, 10000);

      conn
        .on("ready", () => {
          clearTimeout(timeoutId);
          conn.end();
          resolve({
            content: [
              {
                type: "text",
                text: `Successfully connected to ${config.username}@${config.host}:${config.port}`,
              },
            ],
          });
        })
        .on("error", (err) => {
          clearTimeout(timeoutId);
          resolve({
            content: [
              {
                type: "text",
                text: `SSH connection failed: ${err.message}`,
              },
            ],
            isError: true,
          });
        })
        .connect({
          host: config.host,
          port: config.port,
          username: config.username,
          privateKey,
        });
    });
  }
);

// === SYSTEM INFO TOOLS ===

server.tool(
  "system_info",
  "Get system information about the Windows machine",
  {},
  async () => {
    try {
      const commands = [
        'systeminfo | findstr /B /C:"OS Name" /C:"OS Version" /C:"System Type" /C:"Total Physical Memory"',
        "hostname",
        "whoami",
      ];

      const results = await Promise.all(
        commands.map((cmd) =>
          execAsync(cmd, { windowsHide: true }).catch((e) => ({
            stdout: "",
            stderr: e.message,
          }))
        )
      );

      const info = [
        "=== System Information ===",
        results[0].stdout || results[0].stderr,
        `\nHostname: ${results[1].stdout?.trim() || "Unknown"}`,
        `Current User: ${results[2].stdout?.trim() || "Unknown"}`,
        `\nAllowed Directories:`,
        ...ALLOWED_DIRECTORIES.map((d) => `  - ${d}`),
      ].join("\n");

      return {
        content: [
          {
            type: "text",
            text: info,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting system info: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// === HTTP SERVER SETUP ===

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "mcp-session-id"],
  exposedHeaders: ["mcp-session-id"],
}));

app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "sartor-mcp-server", version: "1.0.0" });
});

// Session storage for HTTP transport
const sessions = new Map<string, StreamableHTTPServerTransport>();

// MCP endpoint
app.all("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (req.method === "GET") {
    // SSE stream for server-to-client messages
    if (!sessionId || !sessions.has(sessionId)) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }

    const transport = sessions.get(sessionId)!;
    await transport.handleRequest(req, res);
    return;
  }

  if (req.method === "POST") {
    // Check for existing session
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res);
      return;
    }

    // Create new session
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (newSessionId) => {
        sessions.set(newSessionId, transport);
        console.log(`New session created: ${newSessionId}`);
      },
    });

    transport.onclose = () => {
      const sid = [...sessions.entries()].find(([_, t]) => t === transport)?.[0];
      if (sid) {
        sessions.delete(sid);
        console.log(`Session closed: ${sid}`);
      }
    };

    await server.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  if (req.method === "DELETE") {
    if (sessionId && sessions.has(sessionId)) {
      const transport = sessions.get(sessionId)!;
      await transport.handleRequest(req, res);
      sessions.delete(sessionId);
      console.log(`Session deleted: ${sessionId}`);
      return;
    }
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║         Sartor MCP Server - Windows Remote Control           ║
╠══════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                    ║
║  MCP endpoint:      http://localhost:${PORT}/mcp                ║
║  Health check:      http://localhost:${PORT}/health             ║
╠══════════════════════════════════════════════════════════════╣
║  Available Tools:                                            ║
║    - fs_read_file      - Read files                          ║
║    - fs_write_file     - Write files                         ║
║    - fs_list_directory - List directory contents             ║
║    - fs_delete         - Delete files/directories            ║
║    - fs_mkdir          - Create directories                  ║
║    - shell_execute     - Run shell commands                  ║
║    - shell_spawn       - Start background processes          ║
║    - ssh_execute       - Run commands on gpuserver1          ║
║    - ssh_check_connection - Test SSH connectivity            ║
║    - system_info       - Get system information              ║
╠══════════════════════════════════════════════════════════════╣
║  To expose via ngrok:                                        ║
║    ngrok http ${PORT}                                           ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down gracefully...");
  sessions.forEach((transport) => transport.close());
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nReceived SIGTERM, shutting down...");
  sessions.forEach((transport) => transport.close());
  process.exit(0);
});
