// take-screenshots.mjs — the maker's own screenshot tool for this entry.
// Starts the entry's serve.ts on a scratch port, drives chrome-headless-shell over the
// DevTools protocol (Node's built-in WebSocket — no libraries), visits each view named
// in shots.json, and writes real JPEG renders into screenshots/. Every process it
// starts is stopped by its own pid at the end; nothing else is touched.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const CHROME = "/home/hatch/workspace/makefun-token-radar/tools/chrome-headless-shell-linux64/chrome-headless-shell";
const APP_PORT = 8917;
const CDP_PORT = 9333;
const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForHttp(url, tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  throw new Error(`never came up: ${url}`);
}

class CdpPage {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.loadWaiters = [];
    this.ws = new WebSocket(wsUrl);
    this.ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
      if (msg.method === "Page.loadEventFired") {
        for (const resolve of this.loadWaiters.splice(0)) resolve();
      }
    });
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  waitLoad() {
    return new Promise((resolve) => this.loadWaiters.push(resolve));
  }

  close() {
    this.ws.close();
  }
}

async function main() {
  mkdirSync(join(root, "screenshots"), { recursive: true });
  const server = spawn("node", ["serve.ts", "--port", String(APP_PORT)], { cwd: root, stdio: "pipe" });
  const chrome = spawn(CHROME, [
    "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=/tmp/leonida-shots-profile`,
    "about:blank",
  ], { stdio: "pipe" });
  try {
    await waitForHttp(`http://127.0.0.1:${APP_PORT}/`);
    await waitForHttp(`http://127.0.0.1:${CDP_PORT}/json/version`);
    const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const page = new CdpPage(target.webSocketDebuggerUrl);
    await page.open();
    await page.send("Page.enable");
    for (const shot of shots) {
      const { width, height } = shot.viewport;
      await page.send("Emulation.setDeviceMetricsOverride", {
        width, height, deviceScaleFactor: 1, mobile: false,
      });
      const loaded = page.waitLoad();
      await page.send("Page.navigate", { url: `http://127.0.0.1:${APP_PORT}${shot.path}` });
      await loaded;
      await sleep(900);
      if (shot.scroll) {
        await page.send("Runtime.evaluate", { expression: `window.scrollTo(0, ${Number(shot.scroll)})` });
        await sleep(250);
      }
      const shotResult = await page.send("Page.captureScreenshot", {
        format: "jpeg", quality: 80, fromSurface: true,
      });
      const outPath = join(root, "screenshots", shot.file);
      writeFileSync(outPath, Buffer.from(shotResult.data, "base64"));
      const size = statSync(outPath).size;
      if (size > 262144) throw new Error(`${shot.file} is ${size} bytes — over the 256 KiB gate limit`);
      console.log(`${shot.file}: ${size} bytes (${width}x${height}) <- ${shot.path}`);
    }
    page.close();
  } finally {
    chrome.kill("SIGTERM");
    server.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
