import {
  WORDS,
  advance,
  beginWeek,
  closeNight,
  createHouse,
  joinHouse,
  submitMove,
  toClient,
} from "./game.mjs";

const STORE = "mr-houses";

export function install() {
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const raw = typeof input === "string" ? input : input.url;
    const url = new URL(raw, window.location.origin);
    if (!url.pathname.startsWith("/api/houses")) return original(input, init);
    return route(url, init);
  };
}

function route(url, init) {
  try {
    const parts = url.pathname.split("/").filter(Boolean);
    const code = parts[2] ? parts[2].trim().toLowerCase() : "";
    const action = parts[3] || "";
    const method = (init.method || "GET").toUpperCase();
    const body = init.body ? JSON.parse(init.body) : {};
    const token = header(init, "X-Player-Token");
    if (method === "POST" && parts.length === 2) return json(201, create(body.name));
    if (!/^[a-z]+-\d{2}$/.test(code) && !/^house-[a-f0-9]+$/.test(code)) {
      return json(404, { error: "There is no house by that name." });
    }
    if (method === "POST" && action === "join") return json(200, join(code, body.name));
    if (method === "GET" && action === "paper") return json(200, { paper: publicPaper(code) });
    if (method === "GET" && !action) return json(200, { house: read(code, token) });
    if (method === "POST" && action === "begin") return json(200, change(code, token, beginWeek));
    if (method === "POST" && action === "move") return json(200, move(code, token, body));
    if (method === "POST" && action === "close") return json(200, change(code, token, closeNight));
    if (method === "POST" && action === "advance") return json(200, change(code, token, advance));
    return json(404, { error: "That door does not open." });
  } catch (error) {
    return json(error.status || 500, { error: error.message || "The house went quiet." });
  }
}

function create(name) {
  const houses = load();
  const house = createHouse({
    code: pickCode(houses),
    name,
    id: hex(4),
    token: hex(24),
  });
  houses[house.code] = house;
  save(houses);
  return { token: house.players[0].token, house: toClient(house, house.players[0].token) };
}

function join(code, name) {
  const houses = load();
  const house = houses[code];
  if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  const next = joinHouse(house, { name, id: hex(4), token: hex(24) });
  houses[code] = next;
  save(houses);
  const player = next.players.at(-1);
  return { token: player.token, house: toClient(next, player.token) };
}

function read(code, token) {
  const house = load()[code];
  if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  if (!token) {
    return {
      code: house.code,
      phase: house.phase,
      week: house.week,
      night: house.night,
      players: house.players.map((player) => ({ name: player.name })),
      you: null,
      edition: null,
      archive: [],
    };
  }
  return toClient(house, token);
}

function publicPaper(code) {
  const house = load()[code];
  if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  const printed = house.phase === "night" ? house.archive.at(-1) || null : house.edition;
  return {
    code: house.code,
    phase: house.phase,
    week: house.week,
    night: house.night,
    edition: printed,
    archive: house.archive || [],
  };
}

function change(code, token, fn) {
  const houses = load();
  const house = houses[code];
  if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  player(house, token);
  const next = fn(house);
  houses[code] = next;
  save(houses);
  return { house: toClient(next, token) };
}

function move(code, token, body) {
  const houses = load();
  const house = houses[code];
  if (!house) throw Object.assign(new Error("There is no house by that name."), { status: 404 });
  const who = player(house, token);
  let next = submitMove(house, who.id, body);
  let state = next.house;
  if (next.ready) state = closeNight(state);
  houses[code] = state;
  save(houses);
  return { house: toClient(state, token) };
}

function player(house, token) {
  const found = house.players.find((person) => person.token === token);
  if (!found) throw Object.assign(new Error("The house does not know you."), { status: 401 });
  return found;
}

function pickCode(houses) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const code = `${word}-${10 + Math.floor(Math.random() * 90)}`;
    if (!houses[code]) return code;
  }
  return `house-${hex(3)}`;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function save(houses) {
  localStorage.setItem(STORE, JSON.stringify(houses));
}

function header(init, name) {
  const headers = init.headers || {};
  return headers[name] || headers[name.toLowerCase()] || "";
}

function hex(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return [...data].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
