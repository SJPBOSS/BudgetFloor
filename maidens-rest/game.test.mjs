import assert from "node:assert/strict";
import test from "node:test";
import { advance, beginWeek, closeNight, createHouse, joinHouse, submitMove, toClient } from "./game.mjs";

function house(names) {
  let state = createHouse({ code: "dusk-21", name: names[0], id: "p0", token: "t0", now: 1 });
  names.slice(1).forEach((name, index) => {
    state = joinHouse(state, { name, id: `p${index + 1}`, token: `t${index + 1}`, now: index + 2 });
  });
  return beginWeek(state);
}

function move(state, id, action, targetId) {
  return submitMove(state, id, { action, targetId }).house;
}

test("a cellar on night 1 kills, and a lock saves them", () => {
  let state = house(["Sam", "Alex"]);
  state = move(state, "p0", "cellar");
  state = move(state, "p1", "hide");
  state = closeNight(state);
  assert.equal(state.players.find((p) => p.id === "p0").alive, false);
  assert.equal(state.edition.headline, "Sam opened the cellar.");
  assert.equal(state.edition.shot, "cellar");
  assert.equal(state.phase, "morning");

  state = house(["Sam", "Alex"]);
  state = move(state, "p0", "cellar");
  state = move(state, "p1", "lock");
  state = closeNight(state);
  assert.equal(state.players.every((p) => p.alive), true);
  assert.equal(state.edition.headline, "The door held.");
});

test("two people pointing on night 2 can kill, unless the door is locked", () => {
  let state = house(["Sam", "Alex", "Jordan"]);
  state = advance(closeNight(move(move(move(state, "p0", "hide"), "p1", "hide"), "p2", "hide")));
  state = move(state, "p0", "accuse", "p2");
  state = move(state, "p1", "accuse", "p2");
  state = move(state, "p2", "hide");
  state = closeNight(state);
  assert.equal(state.players.find((p) => p.id === "p2").alive, false);
  assert.equal(state.edition.headline, "They pointed at Jordan.");

  state = house(["Sam", "Alex", "Jordan"]);
  state = advance(closeNight(move(move(move(state, "p0", "hide"), "p1", "hide"), "p2", "hide")));
  state = move(state, "p0", "accuse", "p2");
  state = move(state, "p1", "lock");
  state = move(state, "p2", "hide");
  state = closeNight(state);
  assert.equal(state.players.find((p) => p.id === "p2").alive, true);
});

test("from night 3 an empty turn opens the cellar and kills", () => {
  let state = house(["Sam", "Alex"]);
  state = closeNight(move(move(state, "p0", "hide"), "p1", "hide"));
  assert.match(state.edition.shareText, /no one/i);
  state = advance(state);
  state = closeNight(move(move(state, "p0", "hide"), "p1", "hide"));
  state = advance(state);
  assert.equal(state.night, 3);
  state = move(state, "p0", "hide");
  state = closeNight(state);
  const alex = state.players.find((p) => p.id === "p1");
  assert.equal(alex.alive, false);
  assert.equal(state.edition.headline, "The house used Alex's hands.");
  assert.equal(state.edition.shot, "hands");
  assert.match(state.edition.shareText, /empty turn belonged to Alex/);
});

test("an empty turn on night 2 is a search, and the paper names it", () => {
  let state = house(["Sam", "Alex"]);
  state = closeNight(move(move(state, "p0", "hide"), "p1", "hide"));
  state = advance(state);
  state = move(state, "p0", "hide");
  state = closeNight(state);
  assert.equal(state.players.every((p) => p.alive), true);
  assert.equal(state.edition.headline, "The house moved for Alex.");
  assert.match(state.edition.paragraphs.join(" "), /sent them searching/);
});

test("staying together is safe, and staying with the cellar is not enough to spare them", () => {
  let state = house(["Sam", "Alex"]);
  state = move(state, "p0", "stay", "p1");
  state = move(state, "p1", "stay", "p0");
  state = closeNight(state);
  assert.equal(state.players.every((p) => p.alive), true);
  assert.match(state.edition.paragraphs.join(" "), /stayed together/);

  state = house(["Sam", "Alex"]);
  for (let night = 1; night < 5; night += 1) {
    state = move(state, "p0", "hide");
    state = move(state, "p1", "hide");
    state = advance(closeNight(state));
  }
  assert.equal(state.night, 5);
  state = move(state, "p0", "stay", "p1");
  state = move(state, "p1", "cellar");
  state = closeNight(state);
  assert.equal(state.players.find((p) => p.id === "p1").alive, false);
  assert.equal(state.players.find((p) => p.id === "p0").alive, true);
});

test("a group keeps one witness before the final night, then the house can finish them", () => {
  let state = house(["Sam", "Alex"]);
  for (let night = 1; night < 6; night += 1) {
    state = move(state, "p0", "hide");
    state = move(state, "p1", "hide");
    state = advance(closeNight(state));
  }
  assert.equal(state.night, 6);
  state = move(state, "p0", "cellar");
  state = move(state, "p1", "cellar");
  state = closeNight(state);
  const alive = state.players.filter((p) => p.alive);
  assert.equal(alive.length, 1);
  assert.equal(alive[0].id, "p0");
  state = advance(state);
  state = move(state, "p0", "cellar");
  state = closeNight(state);
  assert.equal(state.phase, "finale");
  assert.equal(state.players.every((p) => !p.alive), true);
  assert.equal(state.edition.headline, "No one left the house.");
});

test("a solo empty night from night 3 ends the week, and week 2 brings them back", () => {
  let state = beginWeek(createHouse({ code: "moth-14", name: "Sam", id: "p0", token: "t0", now: 1 }));
  state = closeNight(state);
  state = advance(state);
  state = closeNight(state);
  state = advance(state);
  state = closeNight(state);
  assert.equal(state.phase, "finale");
  assert.equal(state.edition.early, true);
  assert.equal(state.players[0].alive, false);
  const headlines = state.archive.map((edition) => edition.headline);
  state = advance(state);
  assert.equal(state.week, 2);
  assert.equal(state.night, 1);
  assert.equal(state.phase, "night");
  assert.equal(state.players[0].alive, true);
  assert.deepEqual(state.archive.map((edition) => edition.headline), headlines);
});

test("someone who lasts seven nights gets a final edition with their name", () => {
  let state = house(["Sam", "Alex"]);
  for (let night = 1; night <= 7; night += 1) {
    state = closeNight(move(move(state, "p0", "hide"), "p1", "hide"));
    if (night < 7) state = advance(state);
  }
  assert.equal(state.phase, "finale");
  assert.equal(state.edition.headline, "They saw the seventh morning.");
  assert.match(state.edition.kicker, /Night 7 of 7/);
});

test("the night hides other people's moves", () => {
  let state = house(["Sam", "Alex"]);
  state = move(state, "p0", "cellar");
  const view = toClient(state, "t1");
  assert.equal(view.you.move, null);
  assert.equal(view.players.find((p) => p.id === "p0").moved, true);
  assert.equal(JSON.stringify(view).includes("cellar"), false);
  assert.equal(JSON.stringify(view).includes("t0"), false);
});

test("names have to be real and unique, and the door shuts when the week starts", () => {
  const state = house(["Sam"]);
  assert.throws(() => joinHouse({ ...state, phase: "lobby" }, { name: "sam", id: "p9", token: "t9" }), /already has that name/);
  assert.throws(() => joinHouse(state, { name: "Alex", id: "p9", token: "t9" }), /door is shut/);
  assert.throws(() => createHouse({ code: "x", name: "Sam2", id: "a", token: "b" }), /letters/);
});
