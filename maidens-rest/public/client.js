const app = document.querySelector("#app");
const ui = { mode: null, action: null, error: "", reading: null, place: "go", filmEdition: null, reelIndex: 0 };
let filmTimer = 0;
let house = null;
let token = "";
let lastSig = "";
let pollTimer = 0;

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
  const changed = !house || house.phase !== next.phase || house.night !== next.night || house.week !== next.week;
  house = next;
  if (changed) {
    ui.action = null;
    ui.reading = null;
    ui.place = "go";
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
  if (ui.action === "stay" || ui.action === "accuse") {
    const others = house.players.filter((p) => p.alive && p.id !== you.id);
    app.replaceChildren(el("main", { class: "screen" }, [
      el("div", { class: "kicker" }, ui.action === "stay" ? "Stay with" : "Point at"),
      el("h1", {}, ui.action === "stay" ? "Who?" : "Who is it?"),
      others.length ? el("div", { class: "stack" }, others.map((p) =>
        el("button", { class: "choice", onclick: () => act("move", { action: ui.action, targetId: p.id }) }, [
          el("b", {}, p.name),
        ]),
      )) : el("p", {}, "No one else is still inside."),
      el("button", { class: "text-button", onclick: () => { ui.action = null; paint(true); } }, "Back"),
    ]));
    return;
  }

  const body = [
    el("div", { class: "kicker" }, `Night ${house.night} of 7  ·  Week ${house.week}`),
  ];
  if (!you.alive) {
    body.push(el("h1", {}, "The house already has you."));
    body.push(el("p", {}, "You come back if the group starts another week. You can still end the night for the others."));
  } else if (you.moved) {
    body.push(el("h1", {}, "You moved."));
    body.push(el("p", {}, waiting.length ? `Still out: ${names(waiting)}.` : "Everyone has moved."));
  } else {
    body.push(el("h1", {}, "Your move."));
    if (house.night >= 3) {
      body.push(el("p", { class: "warning" }, "An empty turn opens the cellar. People die that way."));
    } else {
      body.push(el("p", {}, "An empty turn, tonight, goes searching. The paper writes it down."));
    }
    body.push(placeSwitcher());
    body.push(ui.place === "go" ? roomPlan(false) : peoplePlan(ui.place));
  }
  if (you.moved && you.move) {
    body.push(roomPlan(true));
    body.push(el("p", {}, whereYouAre(you)));
  }
  if (last) body.push(el("p", { class: "quiet" }, last));
  const othersOut = waiting.filter((p) => p.id !== you.id);
  const alone = house.players.filter((p) => p.alive).length === 1;
  if ((you.moved || !you.alive) && othersOut.length) {
    body.push(el("button", { class: "text-button", onclick: () => { ui.mode = "confirm"; paint(true); } }, "End the night for anyone still out"));
  } else if (alone && you.alive && !you.moved) {
    body.push(el("button", { class: "text-button", onclick: () => { ui.mode = "confirm"; paint(true); } }, "Let the house take my hands"));
  }
  if (ui.error) body.push(el("p", { class: "error" }, ui.error));
  body.unshift(muteButton());
  app.replaceChildren(el("main", { class: "screen" }, body));
}

function placeSwitcher() {
  const others = house.players.some((p) => p.alive && p.id !== house.you.id);
  const button = (id, label) => el("button", {
    "aria-pressed": ui.place === id ? "true" : "false",
    disabled: id !== "go" && !others ? "true" : null,
    onclick: () => {
      ui.place = id;
      MaidenSound.tap();
      paint(true);
    },
  }, label);
  return el("div", { class: "modes" }, [button("go", "Go"), button("with", "Stay"), button("point", "Point")]);
}

function roomPlan(locked) {
  const here = locked ? house.you?.move?.action : null;
  const rooms = [
    ["lock", "Front door", "Lock the door.", "wide"],
    ["hide", "Hall", "Hide. Make no sound.", ""],
    ["search", "Kitchen", "Search the drawers.", ""],
    ["cellar", "Cellar", "Open the cellar.", "cellar wide"],
  ];
  return el("div", { class: "plan" }, rooms.map(([action, title, help, kind]) => el("button", {
    class: `room ${kind}${here === action ? " here" : ""}`.trim(),
    "aria-pressed": here === action ? "true" : "false",
    disabled: locked ? "true" : null,
    onclick: locked ? null : () => {
      MaidenSound.tap();
      act("move", { action });
    },
  }, [el("b", {}, title), el("small", {}, help)])));
}

function peoplePlan(place) {
  const action = place === "point" ? "accuse" : "stay";
  const others = house.players.filter((p) => p.alive && p.id !== house.you.id);
  if (!others.length) return el("p", {}, "No one else is still inside.");
  return el("div", { class: "plan" }, others.map((p) => el("button", {
    class: "room wide",
    onclick: () => {
      MaidenSound.tap();
      act("move", { action, targetId: p.id });
    },
  }, [el("b", {}, p.name), el("small", {}, action === "stay" ? "Stay with them." : "Point at them.")])));
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

function drawFilm(edition, reel) {
  clearTimeout(filmTimer);
  if (!edition) {
    ui.mode = null;
    drawPaper();
    return;
  }
  const frame = el("canvas", { class: "still", width: "1080", height: "1080", "aria-hidden": "true" });
  const last = reel && ui.reelIndex >= house.archive.length - 1;
  app.replaceChildren(el("section", { class: "film" }, [
    muteButton(),
    frame,
    el("div", { class: "film-copy" }, [
      el("div", { class: "live" }, reel ? `Night ${edition.night} of 7` : (edition.finale ? "Final edition" : "Broadcast")),
      el("h2", { class: "headline" }, edition.headline),
      el("p", { class: "deck" }, edition.deck),
      reel ? el("p", { class: "reel-count" }, `${ui.reelIndex + 1} of ${house.archive.length}`) : null,
      el("button", { class: "text-button", onclick: () => (reel ? stepReel() : endFilm()) }, last || !reel ? "The paper" : "Next night"),
    ]),
  ]));
  MaidenScene.paint(frame, edition);
  if (["empty", "hands", "cellar", "pointed", "search", "kept"].includes(edition.shot)) MaidenSound.death();
  else MaidenSound.paper();
  filmTimer = setTimeout(() => (reel ? stepReel() : endFilm()), reel ? 2600 : 6800);
}

function endFilm() {
  clearTimeout(filmTimer);
  ui.mode = null;
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
  const frame = el("canvas", { class: "still", width: "1080", height: "1080", "aria-hidden": "true" });
  app.replaceChildren(
    el("header", { class: "broadcast" }, [
      frame,
      el("div", { class: "live" }, edition.finale ? "FINAL EDITION" : "BROADCAST"),
      el("div", { class: "kicker" }, edition.kicker),
      el("h2", { class: "headline" }, edition.headline),
      el("p", { class: "deck" }, edition.deck),
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
          ? el("button", { class: "ghost", onclick: () => { ui.reelIndex = 0; ui.mode = "reel"; paint(true); } }, "Play the week")
          : null,
        ui.reading != null
          ? el("button", { class: "ghost", onclick: () => { ui.filmEdition = edition; ui.mode = "film"; paint(true); } }, "Play this night")
          : null,
        ui.reading != null
          ? el("button", { class: "ghost", onclick: () => { ui.reading = null; paint(true); } }, "Back to tonight")
          : el("button", { class: "ghost", onclick: () => act("advance") }, house.phase === "finale" ? "Start another week" : `Wake for night ${house.night + 1}`),
      ]),
      ui.reading == null && house.archive.length > 1 ? el("div", {}, [
        el("div", { class: "meta" }, "The editions"),
        el("ul", { class: "week-list" }, house.archive.map((item, index) =>
          el("li", {}, el("button", { onclick: () => { ui.reading = index; paint(true); } }, `Week ${item.week}, night ${item.night}. ${item.headline}`)),
        )),
      ]) : null,
    ]),
  );
  MaidenScene.paint(frame, edition);
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
