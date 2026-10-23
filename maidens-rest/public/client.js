const app = document.querySelector("#app");
const ui = { mode: null, action: null, error: "", reading: null };
let house = null;
let token = "";
let lastSig = "";
let pollTimer = 0;

const choices = [
  ["hide", "Hide", "Stay still. Make no sound."],
  ["search", "Search", "Look for what the house is doing."],
  ["lock", "Lock the door", "The night gets safer. It remembers you."],
  ["stay", "Stay with someone", "Do not be alone in it."],
  ["accuse", "Point at someone", "The house listens if enough of you agree."],
  ["cellar", "Open the cellar", "Someone should. It should not be you."],
];

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
    ui.mode = null;
    ui.action = null;
    ui.reading = null;
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
  if (house.phase === "lobby") drawLobby();
  else if (house.phase === "night") drawNight();
  else drawPaper();
}

function signature() {
  if (!house) return "gate";
  const people = (house.players || []).map((p) => `${p.id}${p.alive}${p.moved}`).join("");
  return [house.phase, house.week, house.night, house.you?.moved, house.you?.alive, house.edition?.headline, people, ui.mode, ui.action, ui.reading, ui.error].join("|");
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
    body.push(el("div", { class: "stack" }, choices.map(([action, label, help]) =>
      el("button", {
        class: "choice",
        onclick: () => {
          if (action === "stay" || action === "accuse") {
            ui.action = action;
            paint(true);
          } else {
            act("move", { action });
          }
        },
      }, [el("b", {}, label), el("small", {}, help)]),
    )));
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
  app.replaceChildren(el("main", { class: "screen" }, body));
}

function drawPaper() {
  const edition = ui.reading != null ? house.archive[ui.reading] : house.edition;
  if (!edition) return;
  const already = (edition.fallen || []).filter((name) => !(edition.deadTonight || []).includes(name));
  app.replaceChildren(
    el("header", { class: "broadcast" }, [
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
        el("button", { class: "primary", onclick: () => shareEdition(edition) }, "Send this to the group"),
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
  await shareOrCopy(`${edition.shareText}\n\n${url}`, edition.headline);
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
