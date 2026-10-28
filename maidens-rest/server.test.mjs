import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const dataFile = path.join(os.tmpdir(), `maidens-${process.pid}.json`);
process.env.DATA_FILE = dataFile;
fs.rmSync(dataFile, { force: true });

const { start } = await import("./server.mjs");
const server = await start(0);
const base = `http://127.0.0.1:${server.address().port}`;

test.after(() => {
  server.close();
  fs.rmSync(dataFile, { force: true });
});

test("a group can finish a week and start another", async () => {
  const sam = await call("/api/houses", { method: "POST", body: { name: "Sam" } });
  const code = sam.house.code;
  const alex = await call(`/api/houses/${code}/join`, { method: "POST", body: { name: "Alex" } });
  assert.equal(alex.house.phase, "lobby");

  let house = await call(`/api/houses/${code}/begin`, { token: sam.token });
  house = await call(`/api/houses/${code}/move`, { token: sam.token, body: { action: "hide" } });
  house = await call(`/api/houses/${code}/close`, { token: sam.token });
  assert.equal(house.house.edition.headline, "The house moved for Alex.");
  assert.equal(house.house.players.every((p) => p.alive), true);

  const outsider = await call(`/api/houses/${code}`, { method: "GET" });
  assert.equal(outsider.house.edition, null);
  assert.equal(JSON.stringify(outsider.house).includes("Alex"), true);
  assert.equal(JSON.stringify(outsider.house).includes("cellar"), false);

  const paper = await call(`/api/houses/${code}/paper`, { method: "GET" });
  assert.equal(paper.paper.edition.headline, "The house moved for Alex.");
  assert.equal(paper.paper.edition.shareText.includes("http"), false);
  assert.equal(JSON.stringify(paper).includes(sam.token), false);

  house = await call(`/api/houses/${code}/advance`, { token: alex.token });
  house = await call(`/api/houses/${code}/move`, { token: sam.token, body: { action: "hide" } });
  house = await call(`/api/houses/${code}/move`, { token: alex.token, body: { action: "hide" } });
  assert.equal(house.house.phase, "morning");
  house = await call(`/api/houses/${code}/advance`, { token: sam.token });
  assert.equal(house.house.night, 3);
  house = await call(`/api/houses/${code}/move`, { token: sam.token, body: { action: "hide" } });
  house = await call(`/api/houses/${code}/close`, { token: sam.token });
  assert.equal(house.house.edition.headline, "The house used Alex's hands.");
  assert.equal(house.house.players.find((p) => p.name === "Alex").alive, false);

  house = await call(`/api/houses/${code}/advance`, { token: alex.token });
  while (house.house.phase === "night") {
    house = await call(`/api/houses/${code}/move`, { token: sam.token, body: { action: "hide" } });
    if (house.house.phase === "night") house = await call(`/api/houses/${code}/close`, { token: sam.token });
    if (house.house.phase !== "finale") house = await call(`/api/houses/${code}/advance`, { token: sam.token });
  }
  assert.equal(house.house.phase, "finale");
  assert.ok(house.house.edition.shareText.includes("MAIDEN'S REST"));
  const page = await fetch(`${base}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Maiden's Rest/);

  house = await call(`/api/houses/${code}/advance`, { token: alex.token });
  assert.equal(house.house.week, 2);
  assert.equal(house.house.night, 1);
  assert.equal(house.house.players.every((p) => p.alive), true);
});

async function call(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (options.token) headers["X-Player-Token"] = options.token;
  const response = await fetch(`${base}${path}`, {
    method: options.method || "POST",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || response.statusText);
  return payload;
}
