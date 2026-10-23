import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  RuleError,
  WORDS,
  advance,
  beginWeek,
  closeNight,
  createHouse,
  joinHouse,
  submitMove,
  toClient,
} from "./game.mjs";
import { renderShare } from "./paper.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "public");
const fontDir = path.join(root, "..", "assets", "fonts");
const dataFile = process.env.DATA_FILE || path.join(root, "data", "houses.json");

const queues = new Map();

export function start(port = 0, host = "127.0.0.1") {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      send(res, status, { error: status === 500 ? "The house went quiet. Try again." : error.message });
    });
  });
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}

async function handle(req, res) {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname.startsWith("/api/houses")) {
    await route(req, res, url);
    return;
  }
  serveFile(req, res, url.pathname);
}

async function route(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[2] ? normalizeCode(parts[2]) : null;
  const action = parts[3] || null;
  if (req.method === "POST" && parts.length === 2) {
    const body = await readBody(req);
    const made = await withHouse("__create__", () => {
      const houses = load();
      const house = createHouse({
        code: pickCode(houses),
        name: body.name,
        id: crypto.randomBytes(4).toString("hex"),
        token: crypto.randomBytes(24).toString("hex"),
      });
      houses[house.code] = house;
      save(houses);
      return house;
    });
    send(res, 201, { token: made.players[0].token, house: toClient(made, made.players[0].token) });
    return;
  }
  const readable = /^[a-z]+-\d{2}$/.test(code || "") || /^house-[a-f0-9]+$/.test(code || "");
  if (!readable) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  if (req.method === "POST" && action === "join") {
    const body = await readBody(req);
    const joined = await mutate(code, (house) => joinHouse(house, {
      name: body.name,
      id: crypto.randomBytes(4).toString("hex"),
      token: crypto.randomBytes(24).toString("hex"),
    }));
    const player = joined.players.at(-1);
    send(res, 200, { token: player.token, house: toClient(joined, player.token) });
    return;
  }

  const token = req.headers["x-player-token"] || "";
  if (req.method === "GET" && !action) {
    const house = load()[code];
    if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
    send(res, 200, { house: token ? toClient(house, token) : lobbyOnly(house) });
    return;
  }
  if (req.method === "POST" && action === "begin") {
    const house = await mutate(code, (current) => {
      requirePlayer(current, token);
      return beginWeek(current);
    });
    send(res, 200, { house: toClient(house, token) });
    return;
  }
  if (req.method === "POST" && action === "move") {
    const body = await readBody(req);
    const house = await mutate(code, async (current) => {
      const player = requirePlayer(current, token);
      const result = submitMove(current, player.id, body);
      if (!result.ready) return result.house;
      return finishNight(result.house);
    });
    send(res, 200, { house: toClient(house, token) });
    return;
  }
  if (req.method === "POST" && action === "close") {
    const house = await mutate(code, async (current) => {
      requirePlayer(current, token);
      return finishNight(current);
    });
    send(res, 200, { house: toClient(house, token) });
    return;
  }
  if (req.method === "POST" && action === "advance") {
    const house = await mutate(code, (current) => {
      requirePlayer(current, token);
      return advance(current);
    });
    send(res, 200, { house: toClient(house, token) });
    return;
  }
  throw Object.assign(new Error("That door does not open."), { status: 404 });
}

async function finishNight(house) {
  if (house.phase !== "night") return house;
  const closed = closeNight(house);
  closed.edition = await rewriteEdition(closed);
  closed.archive = closed.archive.map((edition, index) =>
    index === closed.archive.length - 1 ? closed.edition : edition,
  );
  return closed;
}

async function rewriteEdition(house) {
  const edition = house.edition;
  const key = process.env.XAI_API_KEY;
  if (!key) return edition;
  const names = house.players.map((p) => p.name);
  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4.7",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content:
              "You write the front page of a small cursed gazette. Use only the names given. Do not invent a death or spare anyone. Return JSON with headline, deck, and paragraphs (exactly two short strings). Headline under 72 characters. No emoji, no hashtags.",
          },
          {
            role: "user",
            content: JSON.stringify({
              names,
              died: edition.deadTonight,
              lived: edition.living,
              houseTook: edition.taken,
              facts: edition.paragraphs,
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return edition;
    const payload = await response.json();
    const text = payload.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return edition;
    const written = JSON.parse(match[0]);
    if (typeof written.headline !== "string" || typeof written.deck !== "string") return edition;
    if (!Array.isArray(written.paragraphs) || written.paragraphs.length !== 2) return edition;
    if (written.headline.length > 80) return edition;
    const blob = `${written.headline} ${written.deck} ${written.paragraphs.join(" ")}`;
    if (edition.deadTonight.some((name) => !blob.includes(name))) return edition;
    const next = {
      ...edition,
      headline: written.headline.trim(),
      deck: written.deck.trim(),
      paragraphs: written.paragraphs.map((line) => String(line).trim()),
    };
    next.shareText = renderShare(next);
    return next;
  } catch {
    return edition;
  }
}

function requirePlayer(house, token) {
  const player = house.players.find((p) => p.token === token);
  if (!player) throw Object.assign(new Error("The house does not know you."), { status: 401 });
  return player;
}

function lobbyOnly(house) {
  return {
    code: house.code,
    phase: house.phase,
    week: house.week,
    night: house.night,
    players: house.players.map((p) => ({ name: p.name })),
    you: null,
    edition: null,
    archive: [],
  };
}

function normalizeCode(code) {
  return String(code || "").trim().toLowerCase();
}

function pickCode(houses) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const number = 10 + Math.floor(Math.random() * 90);
    const code = `${word}-${number}`;
    if (!houses[code]) return code;
  }
  return `house-${crypto.randomBytes(3).toString("hex")}`;
}

function mutate(code, fn) {
  return withHouse(code, async () => {
    const houses = load();
    const house = houses[code];
    if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
    const next = await fn(house);
    houses[code] = next;
    save(houses);
    return next;
  });
}

function withHouse(code, fn) {
  const previous = queues.get(code) || Promise.resolve();
  const run = previous.then(fn, fn);
  queues.set(code, run.then(() => {}, () => {}));
  return run;
}

function load() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

function save(houses) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(houses));
  fs.renameSync(temp, dataFile);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
      if (chunks.reduce((sum, part) => sum + part.length, 0) > 20_000) {
        reject(Object.assign(new Error("That was too much."), { status: 413 }));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("The house could not read that."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function serveFile(req, res, pathname) {
  const file = pathname.startsWith("/fonts/")
    ? path.join(fontDir, path.basename(pathname))
    : path.join(publicDir, pathname === "/" ? "index.html" : pathname);
  const rootDir = pathname.startsWith("/fonts/") ? fontDir : publicDir;
  if (!file.startsWith(rootDir)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": typeFor(file),
      "Cache-Control": file.endsWith(".html") ? "no-store" : "public, max-age=3600",
    });
    res.end(data);
  });
}

function typeFor(file) {
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".woff2")) return "font/woff2";
  if (file.endsWith(".svg")) return "image/svg+xml";
  return "text/html; charset=utf-8";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 8787;
  start(port, process.env.HOST || "0.0.0.0").then((server) => {
    console.log(`Maiden's Rest listening on http://127.0.0.1:${server.address().port}`);
  });
}
