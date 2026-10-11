import "dotenv/config";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serviceUrl = process.env.AI_SERVICE_URL;
const serviceToken = process.env.AI_SERVICE_TOKEN;

if (!serviceUrl || !serviceToken) {
  console.error("AI_SERVICE_URL and AI_SERVICE_TOKEN must be configured in .env before starting the development stack.");
  process.exit(1);
}

let baseUrl;
try {
  const parsed = new URL(serviceUrl);
  if (
    parsed.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname) ||
    parsed.username ||
    parsed.password
  ) {
    throw new Error("The AI service must use a loopback HTTP URL.");
  }
  baseUrl = parsed.origin;
} catch (error) {
  console.error(error instanceof Error ? error.message : "AI_SERVICE_URL is invalid.");
  process.exit(1);
}

const port = new URL(baseUrl).port || "80";
const pythonCommand = process.env.PYTHON || (process.platform === "win32" ? "py" : "python3");
const pythonArgs = process.env.PYTHON
  ? ["-m", "ai_service.app"]
  : process.platform === "win32"
    ? ["-3.10", "-m", "ai_service.app"]
    : ["-m", "ai_service.app"];
const children = new Set();
let shuttingDown = false;

function startChild(command, args, env = process.env) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
  });
  children.add(child);
  child.once("error", (error) => {
    console.error(`Could not start ${command}: ${error.message}`);
    stop(1);
  });
  child.once("exit", (code) => {
    children.delete(child);
    if (!shuttingDown) stop(code ?? 1);
  });
  return child;
}

function stop(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  process.exitCode = code;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
}

process.once("SIGINT", () => stop(0));
process.once("SIGTERM", () => stop(0));

async function serviceIsReady() {
  try {
    const response = await fetch(`${baseUrl}/v1/health`, {
      headers: { Authorization: `Bearer ${serviceToken}` },
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`The local model service returned HTTP ${response.status}. Check AI_SERVICE_TOKEN.`);
    }
    const data = await response.json();
    if (data.ok !== true) throw new Error("The local model service did not pass its health check.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("The local model service")) throw error;
    return false;
  }
}

try {
  process.chdir(projectRoot);

  if (!(await serviceIsReady())) {
    console.log(`Starting local disease model service at ${baseUrl}...`);
    const python = startChild(pythonCommand, pythonArgs, {
      ...process.env,
      AI_SERVICE_PORT: port,
    });

    let ready = false;
    for (let attempt = 0; attempt < 60 && !shuttingDown; attempt += 1) {
      if (python.exitCode !== null) {
        throw new Error("The local model service stopped before it became ready. Check the Python dependencies and service log above.");
      }
      await delay(1000);
      ready = await serviceIsReady();
      if (ready) break;
    }
    if (!ready) throw new Error("The local model service did not become ready within 60 seconds.");
  } else {
    console.log(`Using existing local disease model service at ${baseUrl}.`);
  }

  if (!shuttingDown) {
    console.log("Starting Next.js development server...");
    startChild(process.execPath, [
      path.join(projectRoot, "node_modules", "next", "dist", "bin", "next"),
      "dev",
      ...process.argv.slice(2),
    ]);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not start the development stack.");
  stop(1);
}
