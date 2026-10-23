export function composePaper(facts) {
  const deaths = facts.deaths || [];
  const living = facts.living || [];
  const deadTonight = deaths.map((d) => d.name);
  const taken = facts.taken || [];
  const hands = deaths.find((d) => d.cause === "hands");
  const cellar = deaths.find((d) => d.cause === "cellar");
  const pointed = deaths.find((d) => d.cause === "pointed");
  const searched = deaths.find((d) => d.cause === "search");
  const other = deaths[0];

  let headline = "Morning came. The house is still hungry.";
  let deck = "No one fed it last night.";

  if (living.length === 0) {
    headline = "No one left the house.";
    deck = facts.early ? "The week ended before the seventh morning." : "The final edition is a list of names.";
  } else if (hands) {
    headline = `The house used ${hands.name}'s hands.`;
    deck = "An empty turn is still a turn.";
  } else if (cellar) {
    headline = `${cellar.name} opened the cellar.`;
    deck = "The cellar did not open back.";
  } else if (pointed) {
    headline = `They pointed at ${pointed.name}.`;
    deck = "Enough of them agreed.";
  } else if (searched) {
    headline = `${searched.name} went looking.`;
    deck = "The house keeps what it finds.";
  } else if (other) {
    headline = `${other.name} did not see morning.`;
    deck = "The house kept them.";
  } else if (facts.finale && living.length) {
    headline = living.length === 1 ? `${living[0]} saw the seventh morning.` : "They saw the seventh morning.";
    deck = (facts.fallen || []).some((name) => !living.includes(name))
      ? "The house did not get everyone."
      : "Seven nights, and the house is still hungry.";
  } else if (taken.length) {
    headline = taken.length === 1 ? `The house moved for ${taken[0]}.` : `The house moved for ${list(taken)}.`;
    deck = "They lived. The paper wrote the night down anyway.";
  } else if (facts.locked) {
    headline = "The door held.";
    deck = "Somebody locked it, and the lock remembered them.";
  }

  if (deaths.length > 1 && living.length > 0) {
    const rest = deadTonight.filter((name) => !headline.includes(name));
    if (rest.length) deck = `${list(rest)} did not see morning either.`;
  }

  const paragraphs = story(facts);
  const edition = {
    week: facts.week,
    night: facts.night,
    finale: Boolean(facts.finale),
    early: Boolean(facts.early),
    kicker: facts.early
      ? `Night ${facts.night} of 7  ·  The house finished early`
      : `Night ${facts.night} of 7  ·  Week ${facts.week}`,
    headline,
    deck,
    paragraphs,
    taken,
    living,
    deadTonight,
    fallen: facts.fallen || deadTonight,
    shareText: "",
  };
  edition.shareText = renderShare(edition);
  return edition;
}

export function renderShare(edition) {
  return [
    "THE MAIDEN'S REST GAZETTE",
    edition.kicker,
    "",
    edition.headline,
    edition.deck,
    "",
    ...edition.paragraphs,
    "",
    edition.living.length ? `Still inside: ${list(edition.living)}` : "Still inside: no one",
    edition.deadTonight.length ? `Taken tonight: ${list(edition.deadTonight)}` : "Taken tonight: no one",
  ].join("\n");
}

function story(facts) {
  const events = facts.events || [];
  const takenIds = new Set(events.filter((e) => e.type === "taken").map((e) => e.playerId));
  const lines = [];
  const of = (type) => events.filter((e) => e.type === type);

  const hid = of("hide");
  if (hid.length === 1) lines.push(`${hid[0].name} hid and made no sound.`);
  if (hid.length > 1) lines.push(`${list(hid.map((e) => e.name))} hid and made no sound.`);

  const locks = of("lock");
  if (locks.length === 1) lines.push(`${locks[0].name} locked the door.`);
  if (locks.length > 1) lines.push(`${list(locks.map((e) => e.name))} locked the door.`);

  const seenPairs = new Set();
  for (const event of of("stay")) {
    if (!event.withName) {
      lines.push(`${event.name} reached for someone who was already gone.`);
      continue;
    }
    if (event.how === "mutual") {
      const key = [event.name, event.withName].sort().join("|");
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      lines.push(`${event.name} and ${event.withName} stayed together.`);
      continue;
    }
    if (event.how === "hid") lines.push(`${event.name} stayed with ${event.withName}, who had gone still.`);
    else if (event.how === "betrayed") lines.push(`${event.name} stayed with ${event.withName}. ${event.withName} did not stay.`);
    else lines.push(`${event.name} stayed with ${event.withName}. It was not returned.`);
  }

  const byTarget = new Map();
  for (const event of of("accuse")) {
    if (!event.targetName) continue;
    const names = byTarget.get(event.targetName) || [];
    names.push(event.name);
    byTarget.set(event.targetName, names);
  }
  for (const [target, names] of byTarget) {
    lines.push(`${list(names)} pointed at ${target}.`);
  }

  for (const event of of("cellar")) {
    if (takenIds.has(event.playerId)) continue;
    const died = (facts.deaths || []).some((d) => d.playerId === event.playerId);
    lines.push(died ? `${event.name} opened the cellar and did not come back up.` : `${event.name} opened the cellar and came back up.`);
  }

  const searchers = of("search").filter((e) => !takenIds.has(e.playerId));
  if (searchers.length) {
    lines.push(facts.found || `${list(searchers.map((e) => e.name))} searched the house.`);
  }

  const takenEvents = of("taken");
  if (takenEvents.length) {
    const verb = takenEvents[0].action === "cellar" ? "opened the cellar with them" : "sent them searching";
    const who = list(takenEvents.map((e) => e.name));
    const noun = takenEvents.length === 1 ? "turn belonged" : "turns belonged";
    lines.push(`The empty ${noun} to ${who}. The house ${verb}.`);
  }

  const dead = (facts.deaths || []).map((d) => d.name);
  const living = facts.living || [];
  if (living.length === 0) lines.push("By dawn the house was empty.");
  else if (dead.length === 0) {
    lines.push(living.length === 1 ? `${living[0]} was still in the house at dawn.` : "Everyone who entered was still there at dawn.");
  } else {
    lines.push(`${list(dead)} ${dead.length === 1 ? "is" : "are"} in the paper now. ${list(living)} ${living.length === 1 ? "is" : "are"} still inside.`);
  }

  if (lines.length === 1) return [lines[0], "The gazette kept the night."];
  return [lines.slice(0, -1).join(" "), lines.at(-1)];
}

function list(names) {
  if (!names.length) return "no one";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
