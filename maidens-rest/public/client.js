const app = document.querySelector("#app");
const ui = {
  mode: null,
  action: null,
  error: "",
  reading: null,
  place: "go",
  filmEdition: null,
  reelIndex: 0,
  preview: null,
  whisper: "",
  beat: 0,
};
let filmTimer = 0;
let house = null;
let token = "";
let lastSig = "";
let pollTimer = 0;
let walking = false;
let sending = false;

boot();

function boot() {
  const params = new URLSearchParams(location.search);
  const fromUrl = (params.get("code") || "").trim().toLowerCase();
  const last = localStorage.getItem("mr-last") || "";
  const code = fromUrl || last;
  token = code ? localStorage.getItem(`mr:${code}`) || "" : "";
  if (code && token) {
    refresh(code).catch(() => showGate(fromUrl));
    return;
  }
  showGate(fromUrl);
}

function showGate(code) {
  stopPoll();
  house = null;
  drawGate(code || "");
}

function drawGate(code) {
  const named = localStorage.getItem("mr-name") || "";
  app.replaceChildren(el("main", { class: "screen" }, [
    el("div", { class: "kicker" }, "A house for your group"),
    el("h1", {}, "Maiden's Rest"),
    el("ul", { class: "rules" }, [
      el("li", {}, "Seven nights. One move each."),
      el("li", {}, "Miss a night and the house uses your hands."),
      el("li", {}, "On the seventh morning, the paper prints every name."),
    ]),
    ui.error ? el("p", { class: "error" }, ui.error) : null,
    field("Your name", "name", named, ""),
    field("House code", "code", code, code ? "" : "If someone sent you one"),
    el("div", { class: "stack" }, code
      ? [
          el("button", { class: "primary", onclick: () => knock() }, "Knock"),
          el("button", { class: "ghost", onclick: () => startHouse() }, "Start a house"),
        ]
      : [
          el("button", { class: "primary", onclick: () => startHouse() }, "Start a house"),
          el("button", { class: "ghost", onclick: () => useCode() }, "I have a code"),
        ]),
  ]));
  app.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      if (valueOf("code").trim()) knock();
      else startHouse();
    });
  });
}

async function startHouse() {
  const name = valueOf("name");
  ui.error = "";
  try {
    const result = await api("/api/houses", { method: "POST", body: { name } });
    remember(result);
    location.replace(`${location.pathname}?code=${result.house.code}`);
  } catch (error) {
    ui.error = error.message;
    drawGate("");
  }
}

function useCode() {
  if (!valueOf("code").trim()) {
    app.querySelector('[name="code"]')?.focus();
    return;
  }
  knock();
}

async function knock() {
  const name = valueOf("name");
  const code = valueOf("code").trim().toLowerCase();
  ui.error = "";
  if (!code) {
    ui.error = "Ask them for the house code.";
    drawGate("");
    return;
  }
  try {
    const result = await api(`/api/houses/${encodeURIComponent(code)}/join`, { method: "POST", body: { name } });
    remember(result);
    history.replaceState(null, "", `${location.pathname}?code=${result.house.code}`);
    adopt(result.house);
  } catch (error) {
    ui.error = error.message;
    drawGate(code);
  }
}

function remember(result) {
  token = result.token;
  localStorage.setItem("mr-name", result.house.you.name);
  localStorage.setItem("mr-last", result.house.code);
  localStorage.setItem(`mr:${result.house.code}`, token);
}

function adopt(next) {
  const previous = house;
  const changed = !house || house.phase !== next.phase || house.night !== next.night || house.week !== next.week;
  if (previous && next.phase === "night" && previous.phase === "night" && previous.night === next.night) {
    const before = new Map(previous.players.map((p) => [p.id, p.moved]));
    if (next.players.some((p) => p.moved && before.get(p.id) === false)) MaidenSound.snuff();
  }
  if (previous && next.phase === "lobby" && previous.phase === "lobby" && next.players.length > previous.players.length) {
    MaidenSound.tap();
  }
  house = next;
  if (changed) {
    ui.action = null;
    ui.reading = null;
    ui.place = "go";
    ui.preview = null;
    ui.whisper = "";
    ui.beat = 0;
    clearTimeout(filmTimer);
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!quiet && (next.phase === "morning" || next.phase === "finale") && next.edition) {
      ui.mode = "film";
      ui.filmEdition = next.edition;
    } else {
      ui.mode = null;
    }
  }
  document.title = house.edition ? house.edition.headline : "Maiden's Rest";
  paint(changed);
  if (changed) requestAnimationFrame(scrollToTop);
  startPoll();
}

function scrollToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

async function refresh(code) {
  const target = code || house?.code;
  if (!target) return;
  const result = await api(`/api/houses/${encodeURIComponent(target)}`);
  if (!result.house.you && token) {
    localStorage.removeItem(`mr:${target}`);
    token = "";
    showGate(target);
    return;
  }
  adopt(result.house);
}

function startPoll() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    refresh().catch(() => {});
  }, 1500);
}

function stopPoll() {
  clearInterval(pollTimer);
  pollTimer = 0;
}

function paint(force) {
  const sig = signature();
  if (!force && sig === lastSig) return;
  lastSig = sig;
  if (!house) return;
  if (ui.mode === "film") drawFilm(ui.filmEdition, false);
  else if (ui.mode === "reel") drawFilm(house.archive[ui.reelIndex], true);
  else if (house.phase === "lobby") drawLobby();
  else if (house.phase === "night") drawNight();
  else drawPaper();
}

function signature() {
  if (!house) return "gate";
  const people = (house.players || []).map((p) => `${p.id}${p.alive}${p.moved}`).join("");
  return [house.phase, house.week, house.night, house.you?.moved, house.you?.alive, house.you?.move?.action, house.edition?.headline, people, ui.mode, ui.place, ui.action, ui.reading, ui.reelIndex, ui.error].join("|");
}

function drawLobby() {
  if (!house.you) {
    drawGate(house.code);
    return;
  }
  app.replaceChildren(el("main", { class: "screen" }, [
    el("div", { class: "kicker" }, "Tell the group"),
    el("h1", {}, "The door is open"),
    el("div", { class: "code" }, house.code),
    candleRow(),
    el("p", {}, "One move a night. If someone never opens this, the house takes their hands."),
    ui.error ? el("p", { class: "error" }, ui.error) : null,
    el("ul", { class: "people" }, house.players.map((p) => el("li", {}, [
      el("span", {}, p.name),
      el("span", { class: "mark ok" }, p.id === house.you.id ? "You" : "Inside"),
    ]))),
    el("div", { class: "stack" }, [
      el("button", { class: "primary", onclick: () => sendInvite() }, "Send the code"),
      el("button", { class: "ghost", onclick: () => act("begin") }, house.players.length > 1 ? "Start night 1" : "Start anyway, alone"),
    ]),
  ]));
}

function drawNight() {
  const you = house.you;
  const waiting = house.players.filter((p) => p.alive && !p.moved);
  const last = house.night > 1 || house.week > 1 ? house.lastHeadline : "";
  if (ui.mode === "confirm") {
    app.replaceChildren(el("main", { class: "screen" }, [
      el("div", { class: "kicker" }, `Night ${house.night} of 7`),
      el("h1", {}, "End the night?"),
      el("p", {}, house.night >= 3
        ? "The house takes every empty turn and opens the cellar with it."
        : "The house takes every empty turn and goes searching. The paper will name them."),
      el("div", { class: "stack" }, [
        el("button", { class: "primary", onclick: () => act("close") }, "Let the house in"),
        el("button", { class: "ghost", onclick: () => { ui.mode = null; paint(true); } }, "Go back"),
      ]),
    ]));
    return;
  }

  const choosing = you.alive && !you.moved;
  const sheet = [
    el("div", { class: "kicker" }, `Night ${house.night} of 7  ·  Week ${house.week}`),
    weekPips(),
    el("h1", { class: "night-title" }, choosing ? titleFor(ui.preview) : (you.alive ? "You moved." : "The house already has you.")),
    candleRow(),
  ];
  if (!you.alive) {
    sheet.push(el("p", {}, "You come back if the group starts another week. You can still end the night for the others."));
  } else if (you.moved) {
    sheet.push(el("p", { class: "whisper" }, whereYouAre(you)));
    sheet.push(el("p", {}, waiting.length ? `Still out: ${names(waiting)}.` : "Everyone has moved."));
    sheet.push(roomPlan(true));
  } else {
    sheet.push(house.night >= 3
      ? el("p", { class: "warning" }, "An empty turn opens the cellar. People die that way.")
      : el("p", {}, "An empty turn, tonight, goes searching. The paper writes it down."));
    sheet.push(placeSwitcher());
    sheet.push(ui.place === "go" ? roomPlan(false) : peoplePlan(ui.place));
    sheet.push(el("p", { class: "whisper", "aria-live": "polite" }, ui.whisper || listenHint()));
    sheet.push(el("button", {
      class: "primary commit",
      disabled: ui.preview ? null : "true",
      onclick: () => commitMove(),
    }, commitLabel()));
  }
  if (last) sheet.push(el("p", { class: "quiet" }, last));
  const othersOut = waiting.filter((p) => p.id !== you.id);
  const alone = house.players.filter((p) => p.alive).length === 1;
  if ((you.moved || !you.alive) && othersOut.length) {
    sheet.push(el("button", { class: "text-button", onclick: () => { ui.mode = "confirm"; paint(true); } }, "End the night for anyone still out"));
  } else if (alone && you.alive && !you.moved) {
    sheet.push(el("button", { class: "text-button", onclick: () => { ui.mode = "confirm"; paint(true); } }, "Let the house take my hands"));
  }
  if (ui.error) sheet.push(el("p", { class: "error" }, ui.error));
  const frame = el("canvas", { class: "still night-still", width: "1080", height: "600", "aria-hidden": "true" });
  app.replaceChildren(el("main", { class: "screen night" }, [
    muteButton(),
    frame,
    el("div", { class: "sheet-up" }, sheet),
  ]));
  MaidenScene.paint(frame, previewEdition());
  frame.addEventListener("pointerdown", () => listenCurrent());
}

function placeSwitcher() {
  const others = house.players.some((p) => p.alive && p.id !== house.you.id);
  const button = (id, label) => el("button", {
    "aria-pressed": ui.place === id ? "true" : "false",
    disabled: id !== "go" && !others ? "true" : null,
    onclick: () => {
      ui.place = id;
      ui.preview = null;
      ui.whisper = "";
      MaidenSound.tap();
      paint(true);
    },
  }, label);
  return el("div", { class: "modes" }, [button("go", "Go"), button("with", "Stay"), button("point", "Point")]);
}

function roomPlan(locked) {
  const rooms = [
    ["lock", "Front door", "Lock the door.", "wide"],
    ["hide", "Hall", "Hide. Make no sound.", ""],
    ["search", "Kitchen", "Search the drawers.", ""],
    ["cellar", "Cellar", "Open the cellar.", "cellar wide"],
  ];
  const plan = el("div", { class: "plan" }, rooms.map(([action, title, help, kind]) =>
    choiceButton(action, title, help, kind, null, locked)));
  if (!locked) bindWalk(plan);
  return plan;
}

function peoplePlan(place) {
  const action = place === "point" ? "accuse" : "stay";
  const others = house.players.filter((p) => p.alive && p.id !== house.you.id);
  if (!others.length) return el("p", {}, "No one else is still inside.");
  const plan = el("div", { class: "plan" }, others.map((p) =>
    choiceButton(action, p.name, action === "stay" ? "Stay with them." : "Point at them.", "wide", p.id, false)));
  bindWalk(plan);
  return plan;
}

function choiceButton(action, title, help, kind, targetId, locked) {
  const target = targetId || null;
  const selected = !locked && ui.preview && ui.preview.action === action && (ui.preview.targetId || null) === target;
  const here = locked && house.you?.move?.action === action && (house.you?.move?.targetId || null) === target;
  const node = el("button", {
    class: `room ${kind}${selected ? " armed" : ""}${here ? " here" : ""}`.trim(),
    "aria-pressed": selected || here ? "true" : "false",
    disabled: locked ? "true" : null,
  }, [el("b", {}, title), el("small", {}, help)]);
  node.dataset.action = action;
  if (target) node.dataset.target = target;
  if (!locked) armChoice(node, action, target);
  return node;
}

function bindWalk(plan) {
  plan.addEventListener("pointermove", (event) => {
    if (!event.buttons) return;
    const room = event.target.closest?.(".room");
    if (!room || room.disabled || !room.dataset.action) return;
    walking = true;
    choose(room.dataset.action, room.dataset.target || null, "slide");
  });
}

function armChoice(node, action, targetId) {
  let timer = 0;
  let held = false;
  let start = 0;
  node.addEventListener("pointerdown", () => {
    if (node.disabled) return;
    held = false;
    walking = false;
    start = performance.now();
    node.classList.add("listening");
    timer = setTimeout(() => {
      held = true;
      choose(action, targetId, "listen");
    }, 420);
  });
  node.addEventListener("pointerup", (event) => {
    clearTimeout(timer);
    node.classList.remove("listening");
    if (node.disabled || held) {
      walking = false;
      return;
    }
    const under = document.elementFromPoint(event.clientX, event.clientY)?.closest?.(".room");
    if (under && !under.disabled && under.dataset.action) choose(under.dataset.action, under.dataset.target || null, "tap");
    else if (!walking && performance.now() - start < 700) choose(action, targetId, "tap");
    walking = false;
  });
  node.addEventListener("pointercancel", () => {
    clearTimeout(timer);
    node.classList.remove("listening");
    walking = false;
  });
  node.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    choose(action, targetId, "tap");
  });
}

function choose(action, targetId, sound) {
  const target = targetId || null;
  const same = ui.preview && ui.preview.action === action && (ui.preview.targetId || null) === target;
  if (same && sound !== "listen") return;
  ui.preview = { action, targetId: target };
  ui.whisper = whisperFor(action, target);
  if (sound === "tap" || sound === "slide") MaidenSound.tap();
  if (sound === "listen") MaidenSound.listen(action);
  syncChoice();
}

function syncChoice() {
  const plan = app.querySelector(".night .plan");
  if (!plan) return;
  plan.querySelectorAll(".room").forEach((room) => {
    const on = ui.preview
      && room.dataset.action === ui.preview.action
      && (room.dataset.target || "") === (ui.preview.targetId || "");
    room.classList.toggle("armed", on);
    room.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const commit = app.querySelector(".commit");
  if (commit) {
    commit.disabled = !ui.preview;
    commit.textContent = commitLabel();
  }
  const line = app.querySelector(".whisper");
  if (line) line.textContent = ui.whisper || listenHint();
  const title = app.querySelector(".night-title");
  if (title && house.you?.alive && !house.you?.moved) title.textContent = titleFor(ui.preview);
  const frame = app.querySelector(".night-still");
  if (frame) MaidenScene.paint(frame, previewEdition());
}

async function commitMove() {
  if (sending || !ui.preview || house.you?.moved) return;
  sending = true;
  const { action, targetId } = ui.preview;
  try {
    await act("move", targetId ? { action, targetId } : { action });
  } finally {
    sending = false;
  }
}

function listenHint() {
  return ui.place === "go" ? "Tap a room. Hold it, and listen." : "Tap a name. Hold it, and listen.";
}

function listenCurrent() {
  const action = house?.you?.moved ? house.you.move?.action : ui.preview?.action;
  if (action) MaidenSound.listen(action);
  else MaidenSound.approach();
}

function titleFor(pick) {
  if (!pick) return "Your move.";
  if (pick.action === "hide") return "The hall.";
  if (pick.action === "search") return "The kitchen.";
  if (pick.action === "lock") return "The front door.";
  if (pick.action === "cellar") return "The cellar.";
  const other = house.players.find((p) => p.id === pick.targetId);
  if (pick.action === "stay") return other ? `With ${other.name}.` : "Stay.";
  if (pick.action === "accuse") return other ? `At ${other.name}.` : "Point.";
  return "Your move.";
}

function commitLabel() {
  const pick = ui.preview;
  if (!pick) return ui.place === "go" ? "Choose a room" : "Choose a person";
  if (pick.action === "hide") return "Hide in the hall";
  if (pick.action === "search") return "Search the kitchen";
  if (pick.action === "lock") return "Lock the door";
  if (pick.action === "cellar") return "Open the cellar";
  const other = house.players.find((p) => p.id === pick.targetId);
  if (pick.action === "stay") return other ? `Stay with ${other.name}` : "Stay";
  if (pick.action === "accuse") return other ? `Point at ${other.name}` : "Point";
  return "This is my night";
}

function whisperFor(action, targetId) {
  const other = house.players.find((p) => p.id === targetId);
  const who = other ? other.name : "them";
  if (action === "lock") return "The bolt is cold. One lock covers everyone still inside.";
  if (action === "hide") return "The hall goes quiet. You make no sound, and the night cannot pair you.";
  if (action === "search") return "The drawers stick. A search is loud enough for the paper to print your name.";
  if (action === "cellar") return "Hold still. Something under the floor is listening for the door.";
  if (action === "stay") return `Stay with ${who}. If they hide, you are quiet. If they open the cellar, you go with them.`;
  if (action === "accuse") return `Point at ${who}. Fingers add up. The house keeps count.`;
  return "";
}

function previewEdition() {
  const move = house.you?.moved ? house.you.move : ui.preview;
  const shot = {
    lock: "lock",
    hide: "hide",
    search: "search",
    cellar: "cellar",
    stay: "kept",
    accuse: "pointed",
  }[move?.action] || "morning";
  return {
    week: house.week,
    night: house.night,
    shot,
    headline: titleFor(move),
    finale: false,
  };
}

function candleRow() {
  return el("div", { class: "candles" }, house.players.map((p) => {
    const state = !p.alive ? "dead" : p.moved ? "out" : "lit";
    const you = p.id === house.you?.id;
    return el("div", { class: `candle ${state}${you ? " you" : ""}` }, [
      el("div", { class: "wick" }, state === "lit" ? el("i", { class: "flame" }) : null),
      el("span", { class: "name" }, p.name),
    ]);
  }));
}

function weekPips() {
  const marks = [];
  for (let night = 1; night <= 7; night += 1) {
    let cls = "";
    if (house.phase === "finale" || night < house.night || (night === house.night && house.phase !== "night")) cls = "done";
    else if (night === house.night) cls = "now";
    marks.push(el("i", { class: cls }));
  }
  return el("div", { class: "pips", "aria-hidden": "true" }, marks);
}

function whereYouAre(you) {
  const move = you.move;
  if (!move) return "You moved.";
  const other = house.players.find((p) => p.id === move.targetId);
  if (move.action === "hide") return "You are in the hall.";
  if (move.action === "search") return "You are in the kitchen.";
  if (move.action === "lock") return "You are at the front door.";
  if (move.action === "cellar") return "You opened the cellar.";
  if (move.action === "stay") return other ? `You stayed with ${other.name}.` : "You stayed.";
  if (move.action === "accuse") return other ? `You pointed at ${other.name}.` : "You pointed.";
  return "You moved.";
}

function muteButton() {
  return el("button", {
    class: "mute",
    onclick: (event) => {
      const muted = MaidenSound.toggle();
      event.currentTarget.textContent = muted ? "Sound" : "Mute";
    },
  }, MaidenSound.muted ? "Sound" : "Mute");
}

function filmBeats(edition) {
  const approach = edition.shot === "empty" ? "empty" : "morning";
  return [
    {
      edition: { ...edition, shot: approach, headline: `Night ${edition.night}`, frame: 0 },
      live: "The house",
      deck: "Tap the picture. Hold it to keep this frame.",
    },
    {
      edition: { ...edition, frame: 1 },
      live: edition.finale ? "Final edition" : "Broadcast",
      deck: edition.deck,
    },
    {
      edition: { ...edition, headline: nameLine(edition), frame: 2 },
      live: "The names",
      deck: (edition.living || []).length ? `Still inside: ${names(edition.living)}.` : "The house is empty.",
    },
  ];
}

function nameLine(edition) {
  const dead = edition.deadTonight || [];
  if (!dead.length && edition.finale) {
    const living = edition.living || [];
    if (living.length === 1) return `${living[0]} saw the seventh morning.`;
    if (living.length) return "They saw the seventh morning.";
  }
  if (!dead.length) return "No one was taken.";
  if (dead.length === 1) return `${dead[0]} is in the paper.`;
  return `${names(dead)} are in the paper.`;
}

function drawFilm(edition, reel) {
  clearTimeout(filmTimer);
  if (!edition) {
    ui.mode = null;
    drawPaper();
    return;
  }
  const beats = reel ? null : filmBeats(edition);
  if (!reel) ui.beat = Math.max(0, Math.min(ui.beat, beats.length - 1));
  const beat = reel ? null : beats[ui.beat];
  const shown = reel ? edition : beat.edition;
  const frame = el("canvas", {
    class: "still",
    width: "1080",
    height: "1080",
    role: "button",
    tabindex: "0",
    "aria-label": "Next picture",
  });
  const lastBeat = !reel && ui.beat >= beats.length - 1;
  const lastReel = reel && ui.reelIndex >= house.archive.length - 1;
  const dots = reel
    ? house.archive.map((item, index) => el("button", {
      class: "tick",
      "aria-label": `Night ${item.night}`,
      "aria-current": index === ui.reelIndex ? "true" : "false",
      onclick: () => { ui.reelIndex = index; paint(true); },
    }))
    : beats.map((item, index) => el("button", {
      class: "tick",
      "aria-label": item.live,
      "aria-current": index === ui.beat ? "true" : "false",
      onclick: () => { ui.beat = index; drawFilm(ui.filmEdition, false); },
    }));
  const nextLabel = reel ? (lastReel ? "The paper" : "Next night") : (lastBeat ? "The paper" : "Next picture");
  app.replaceChildren(el("section", { class: "film" }, [
    muteButton(),
    frame,
    el("div", { class: "ticks" }, dots),
    el("div", { class: "film-copy" }, [
      el("div", { class: "live" }, reel ? `Night ${edition.night} of 7` : beat.live),
      el("h2", { class: "headline" }, shown.headline),
      el("p", { class: "deck" }, reel ? edition.deck : beat.deck),
      reel ? el("p", { class: "reel-count" }, `${ui.reelIndex + 1} of ${house.archive.length}`) : null,
      el("button", {
        class: "text-button",
        onclick: () => (reel ? (lastReel ? endFilm() : stepReel()) : (lastBeat ? endFilm() : advanceFilm(false))),
      }, nextLabel),
    ]),
  ]));
  MaidenScene.paint(frame, shown);
  const shot = edition.shot;
  if (reel || ui.beat === 1) {
    if (["empty", "hands", "cellar", "pointed", "search", "kept"].includes(shot)) MaidenSound.death();
    else MaidenSound.paper();
  } else if (ui.beat === 0) MaidenSound.approach();
  else MaidenSound.paper();
  bindFilmFrame(frame, reel);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    filmTimer = setTimeout(() => advanceFilm(reel), reel ? 2400 : 2200);
  }
}

function bindFilmFrame(frame, reel) {
  let start = 0;
  let held = false;
  let timer = 0;
  frame.addEventListener("pointerdown", (event) => {
    start = event.timeStamp || performance.now();
    held = false;
    clearTimeout(filmTimer);
    timer = setTimeout(() => { held = true; }, 280);
  });
  frame.addEventListener("pointerup", (event) => {
    clearTimeout(timer);
    const quick = (event.timeStamp || performance.now()) - start < 280 && !held;
    if (quick) advanceFilm(reel);
    else if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      filmTimer = setTimeout(() => advanceFilm(reel), reel ? 2400 : 2200);
    }
  });
  frame.addEventListener("pointercancel", () => {
    clearTimeout(timer);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      filmTimer = setTimeout(() => advanceFilm(reel), reel ? 2400 : 2200);
    }
  });
  frame.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    advanceFilm(reel);
  });
}

function advanceFilm(reel) {
  clearTimeout(filmTimer);
  if (reel) {
    stepReel();
    return;
  }
  if (!ui.filmEdition) {
    endFilm();
    return;
  }
  const beats = filmBeats(ui.filmEdition);
  if (ui.beat < beats.length - 1) {
    ui.beat += 1;
    drawFilm(ui.filmEdition, false);
    return;
  }
  endFilm();
}

function endFilm() {
  clearTimeout(filmTimer);
  ui.mode = null;
  ui.beat = 0;
  paint(true);
}

function stepReel() {
  clearTimeout(filmTimer);
  if (ui.reelIndex >= house.archive.length - 1) {
    ui.mode = null;
    paint(true);
    return;
  }
  ui.reelIndex += 1;
  paint(true);
}

function drawPaper() {
  const edition = ui.reading != null ? house.archive[ui.reading] : house.edition;
  if (!edition) return;
  const already = (edition.fallen || []).filter((name) => !(edition.deadTonight || []).includes(name));
  const frame = el("canvas", {
    class: "still",
    width: "1080",
    height: "1080",
    role: "button",
    tabindex: "0",
    "aria-label": "Play this night",
  });
  frame.addEventListener("click", () => playEdition(edition));
  frame.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    playEdition(edition);
  });
  app.replaceChildren(
    el("header", { class: "broadcast" }, [
      frame,
      el("div", { class: "live" }, edition.finale ? "FINAL EDITION" : "BROADCAST"),
      el("div", { class: "kicker" }, edition.kicker),
      el("h2", { class: "headline" }, edition.headline),
      el("p", { class: "deck" }, edition.deck),
      el("p", { class: "quiet tap-hint" }, "Tap the picture."),
    ]),
    el("article", { class: "sheet" }, [
      el("div", { class: "mast" }, [
        el("span", {}, "The evening edition"),
        el("strong", {}, "Maiden's Rest"),
      ]),
      ...edition.paragraphs.map((paragraph) => el("p", {}, paragraph)),
      el("div", { class: "roll" }, [
        roll("Taken tonight", edition.deadTonight, true),
        roll("The house moved for", (edition.taken || []).filter((name) => !(edition.deadTonight || []).includes(name)), true),
        roll("Still inside", edition.living, false),
        already.length ? roll("Already in the paper", already, true) : null,
      ]),
      ui.error ? el("p", { class: "error" }, ui.error) : null,
      el("div", { class: "stack" }, [
        el("button", { class: "primary", onclick: () => shareEdition(edition) }, "Send the broadcast"),
        house.phase === "finale" && ui.reading == null && house.archive.length > 1
          ? el("button", { class: "ghost", onclick: () => { ui.reelIndex = 0; ui.beat = 0; ui.mode = "reel"; paint(true); } }, "Play the week")
          : null,
        el("button", { class: "ghost", onclick: () => playEdition(edition) }, "Play this night"),
        ui.reading != null
          ? el("button", { class: "ghost", onclick: () => { ui.reading = null; paint(true); } }, "Back to tonight")
          : el("button", { class: "ghost", onclick: () => act("advance") }, house.phase === "finale" ? "Start another week" : `Wake for night ${house.night + 1}`),
      ]),
      house.archive.length > 1 ? editionStrip() : null,
    ]),
  );
  MaidenScene.paint(frame, edition);
}

function playEdition(edition) {
  ui.beat = 0;
  ui.filmEdition = edition;
  ui.mode = "film";
  paint(true);
}

function editionStrip() {
  const current = ui.reading != null ? ui.reading : house.archive.length - 1;
  return el("div", {}, [
    el("div", { class: "meta" }, "The week"),
    el("div", { class: "strip" }, house.archive.map((item, index) =>
      el("button", {
        class: index === current ? "on" : "",
        onclick: () => {
          ui.reading = index === house.archive.length - 1 ? null : index;
          paint(true);
        },
      }, [el("b", {}, `Night ${item.night}`), el("small", {}, item.headline)]),
    )),
  ]);
}

function roll(label, people, gone) {
  if (!people || !people.length) return null;
  return el("div", {}, [
    el("b", { class: gone ? "gone" : "" }, label),
    el("span", {}, names(people)),
  ]);
}

async function act(kind, body) {
  ui.error = "";
  try {
    const result = await api(`/api/houses/${encodeURIComponent(house.code)}/${kind}`, { method: "POST", body: body || {} });
    ui.mode = null;
    ui.action = null;
    ui.reading = null;
    if (kind === "move") {
      ui.preview = null;
      ui.whisper = "";
    }
    adopt(result.house);
  } catch (error) {
    ui.error = error.message;
    refresh().catch(() => paint(true));
  }
}

async function sendInvite() {
  const url = `${location.origin}${location.pathname}?code=${house.code}`;
  const text = `Maiden's Rest. House ${house.code}.\nOne move a night, or the house uses your hands.\n${url}`;
  await shareOrCopy(text, "Come to the house");
}

async function shareEdition(edition) {
  const url = `${location.origin}${location.pathname}?code=${house.code}`;
  const text = `${edition.shareText}\n\n${url}`;
  let file = null;
  try {
    const blob = await MaidenScene.card(edition);
    if (blob) file = new File([blob], "maidens-rest.png", { type: "image/png" });
  } catch (error) {
    file = null;
  }
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: edition.headline, text, files: [file] });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  if (file) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "maidens-rest.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  }
  await shareOrCopy(text, edition.headline);
}

async function shareOrCopy(text, title) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text });
      return;
    }
  } catch (error) {
    if (error.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(text);
    ui.error = "";
    const note = el("p", { class: "quiet" }, "Copied. Paste it in the group.");
    app.querySelector(".stack")?.before(note);
  } catch {
    ui.error = "Copy it from the paper and send it yourself.";
    paint(true);
  }
}

function field(label, name, value, placeholder) {
  const input = el("input", { name, value, placeholder, autocomplete: "name", maxlength: "18" });
  return el("label", {}, [el("span", {}, label), input]);
}

function valueOf(name) {
  return app.querySelector(`[name="${name}"]`)?.value || "";
}

function names(list) {
  const values = list.map((item) => (typeof item === "string" ? item : item.name));
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function el(tag, attrs = {}, kids = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const kid of [].concat(kids)) {
    if (kid == null || kid === false) continue;
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Player-Token"] = token;
  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "The house didn't answer.");
  return payload;
}
