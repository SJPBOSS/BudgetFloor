export class RuleError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export const WORDS = [
  "ash", "bolt", "cask", "dusk", "fang", "grim", "haze", "iron", "keel", "loom",
  "moth", "pyre", "rift", "salt", "veil", "wick", "bone", "door", "echo",
  "grit", "hush", "jolt", "knot", "lamp", "mist", "omen", "pall", "ruin", "scar",
  "tomb", "void", "wane", "brim", "eave", "jade", "kiln", "lark", "mare", "rook",
  "silt", "tare", "wold", "yarn", "zeal", "axle", "crow", "dreg", "flint", "gloom",
  "howl", "ink", "jamb", "mire", "noct", "quag", "rust", "slew",
];

const ACTIONS = new Set(["hide", "search", "lock", "cellar", "stay", "accuse"]);
const THRESHOLDS = [0, 5, 4, 3, 3, 2, 2, 2];

export function cleanName(raw) {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > 18) {
    throw new RuleError("Use a name, up to 18 letters.");
  }
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'\u2019-]{0,17}$/u.test(name)) {
    throw new RuleError("Use letters for a name.");
  }
  return name;
}

export function createHouse({ code, name, id, token, now = Date.now() }) {
  const player = makePlayer({ name: cleanName(name), id, token, now });
  return blank(code, [player]);
}

export function joinHouse(house, { name, id, token, now = Date.now() }) {
  assertLobby(house);
  if (house.players.length >= 6) throw new RuleError("This house already has six.");
  const cleaned = cleanName(name);
  if (house.players.some((p) => p.name.toLowerCase() === cleaned.toLowerCase())) {
    throw new RuleError("Someone in the house already has that name.");
  }
  return {
    ...house,
    players: [...house.players, makePlayer({ name: cleaned, id, token, now })],
  };
}

export function beginWeek(house) {
  assertLobby(house);
  if (house.players.length < 1) throw new RuleError("Someone has to be in the house.");
  return { ...house, phase: "night", night: 1, moves: {} };
}

export function submitMove(house, playerId, move) {
  if (house.phase !== "night") throw new RuleError("The night is already over.");
  const player = house.players.find((p) => p.id === playerId);
  if (!player) throw new RuleError("You are not in this house.");
  if (!player.alive) throw new RuleError("The house already has you.");
  const action = move?.action;
  if (!ACTIONS.has(action)) throw new RuleError("That is not a way through the night.");
  let targetId = null;
  if (action === "stay" || action === "accuse") {
    targetId = move.targetId || null;
    const target = house.players.find((p) => p.id === targetId && p.alive);
    if (!target || target.id === player.id) {
      throw new RuleError(action === "stay" ? "Stay with someone who is still inside." : "Point at someone who is still inside.");
    }
  }
  const moves = { ...house.moves, [player.id]: { action, targetId, byHouse: false } };
  const next = { ...house, moves };
  const living = next.players.filter((p) => p.alive);
  const ready = living.every((p) => next.moves[p.id]);
  return { house: next, ready };
}

export function closeNight(house) {
  if (house.phase !== "night") return house;
  const night = house.night;
  const living = house.players.filter((p) => p.alive);
  const moves = { ...house.moves };
  const takenIds = [];
  for (const player of living) {
    if (!moves[player.id]) {
      moves[player.id] = {
        action: night >= 3 ? "cellar" : "search",
        targetId: null,
        byHouse: true,
      };
      takenIds.push(player.id);
    }
  }

  const events = [];
  const danger = Object.fromEntries(living.map((p) => [p.id, 0]));
  const taken = new Set(takenIds);

  for (const player of living) {
    const move = moves[player.id];
    if (move.byHouse) {
      events.push({ type: "taken", playerId: player.id, name: player.name, action: move.action });
    }
    if (move.action === "hide") {
      events.push({ type: "hide", playerId: player.id, name: player.name });
    } else if (move.action === "search") {
      danger[player.id] += 2;
      events.push({ type: "search", playerId: player.id, name: player.name });
    } else if (move.action === "lock") {
      danger[player.id] += 1;
      events.push({ type: "lock", playerId: player.id, name: player.name });
    } else if (move.action === "cellar") {
      danger[player.id] += 5;
      events.push({ type: "cellar", playerId: player.id, name: player.name });
    } else if (move.action === "stay") {
      const partner = living.find((p) => p.id === move.targetId);
      const partnerMove = partner ? moves[partner.id] : null;
      const mutual = Boolean(partnerMove && partnerMove.action === "stay" && partnerMove.targetId === player.id);
      const partnerHid = Boolean(partnerMove && partnerMove.action === "hide");
      const betrayed = Boolean(
        partnerMove &&
          (partnerMove.action === "cellar" ||
            (partnerMove.action === "accuse" && partnerMove.targetId === player.id)),
      );
      let how = "apart";
      let add = 1;
      if (!partner) {
        how = "alone";
        add = 2;
      } else if (betrayed) {
        how = "betrayed";
        add = 3;
      } else if (mutual) {
        how = "mutual";
        add = 0;
      } else if (partnerHid) {
        how = "hid";
        add = 0;
      }
      danger[player.id] += add;
      events.push({
        type: "stay",
        playerId: player.id,
        name: player.name,
        withId: partner?.id ?? null,
        withName: partner?.name ?? null,
        how,
      });
    } else if (move.action === "accuse") {
      danger[player.id] += 1;
      const target = living.find((p) => p.id === move.targetId);
      events.push({
        type: "accuse",
        playerId: player.id,
        name: player.name,
        targetId: target?.id ?? null,
        targetName: target?.name ?? null,
      });
    }
  }

  const votes = {};
  for (const player of living) {
    const move = moves[player.id];
    if (move.action === "accuse" && move.targetId && danger[move.targetId] != null) {
      votes[move.targetId] = (votes[move.targetId] || 0) + 1;
    }
  }
  for (const [id, count] of Object.entries(votes)) danger[id] += count * 2;

  const locked = living.some((p) => moves[p.id].action === "lock");
  if (locked) {
    for (const id of Object.keys(danger)) danger[id] = Math.max(0, danger[id] - 1);
  }

  const doomed = chooseDeaths(living, danger, night);
  const deadIds = new Set(doomed.map((p) => p.id));
  const players = house.players.map((p) => (deadIds.has(p.id) ? { ...p, alive: false } : p));
  const deaths = doomed.map((p) => ({
    playerId: p.id,
    name: p.name,
    cause: causeFor(p.id, moves[p.id], votes, taken),
  }));
  const still = players.filter((p) => p.alive).map((p) => p.name);
  const fallen = players.filter((p) => !p.alive).map((p) => p.name);
  const searchers = events.filter((e) => e.type === "search" && !taken.has(e.playerId)).map((e) => e.name);
  const cellarNames = events.filter((e) => e.type === "cellar").map((e) => e.name);
  let found = null;
  if (searchers.length && cellarNames.length) {
    found = searchers.length === 1
      ? `${searchers[0]} found the cellar open.`
      : "The searchers found the cellar open.";
  } else if (searchers.length) {
    found = "The search turned up dust, and the dust had been disturbed.";
  }

  const finale = night >= 7 || still.length === 0;
  const edition = composeFromFacts({
    week: house.week,
    night,
    finale,
    early: still.length === 0 && night < 7,
    events,
    deaths,
    living: still,
    fallen,
    taken: takenIds.map((id) => players.find((p) => p.id === id)?.name).filter(Boolean),
    locked,
    found,
  });

  return {
    ...house,
    players,
    moves: {},
    phase: finale ? "finale" : "morning",
    edition,
    archive: [...house.archive, edition],
  };
}

export function advance(house) {
  if (house.phase === "night") return house;
  if (house.phase === "morning") {
    return { ...house, phase: "night", night: house.night + 1, moves: {} };
  }
  if (house.phase === "finale") {
    return {
      ...house,
      week: house.week + 1,
      night: 1,
      phase: "night",
      moves: {},
      edition: null,
      players: house.players.map((p) => ({ ...p, alive: true })),
    };
  }
  throw new RuleError("The night is still open.");
}

export function toClient(house, token) {
  const you = house.players.find((p) => p.token === token) || null;
  const night = house.phase === "night";
  return {
    code: house.code,
    week: house.week,
    night: house.night,
    phase: house.phase,
    you: you
      ? {
          id: you.id,
          name: you.name,
          alive: you.alive,
          moved: Boolean(house.moves[you.id]),
          move: house.moves[you.id]
            ? {
                action: house.moves[you.id].action,
                targetId: house.moves[you.id].targetId,
                byHouse: Boolean(house.moves[you.id].byHouse),
              }
            : null,
        }
      : null,
    players: house.players.map((p) => ({
      id: p.id,
      name: p.name,
      alive: p.alive,
      moved: night ? Boolean(house.moves[p.id]) : false,
    })),
    edition: night ? null : house.edition,
    lastHeadline: house.archive.at(-1)?.headline ?? null,
    archive: house.archive,
  };
}

function chooseDeaths(living, danger, night) {
  const threshold = THRESHOLDS[night];
  const slots = night >= 6 ? 2 : 1;
  const ranked = [...living].sort((a, b) => {
    const delta = danger[b.id] - danger[a.id];
    if (delta) return delta;
    return b.joined - a.joined;
  });
  let doomed = ranked.filter((p) => danger[p.id] >= threshold).slice(0, slots);
  if (night < 7 && living.length > 1 && doomed.length === living.length) {
    doomed = doomed.slice(0, -1);
  }
  return doomed;
}

function causeFor(id, move, votes, taken) {
  if (taken.has(id)) return "hands";
  if ((votes[id] || 0) >= 2) return "pointed";
  if (move.action === "cellar") return "cellar";
  if (move.action === "search") return "search";
  if (move.action === "stay") return "left";
  return "kept";
}

function makePlayer({ name, id, token, now }) {
  return { id, token, name, alive: true, joined: now };
}

function blank(code, players) {
  return {
    code,
    week: 1,
    night: 1,
    phase: "lobby",
    players,
    moves: {},
    edition: null,
    archive: [],
  };
}

function assertLobby(house) {
  if (house.phase !== "lobby") throw new RuleError("The week has started. The door is shut until the next one.");
}

function composeFromFacts(facts) {
  return composePaper(facts);
}

// Imported at the bottom so tests can replace nothing; paper stays pure.
import { composePaper } from "./paper.mjs";
