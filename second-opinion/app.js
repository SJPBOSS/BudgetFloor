import { analyze, EXAMPLES } from "./analyze.js";

const advice = document.querySelector("#advice");
const form = document.querySelector("#checker");
const results = document.querySelector("#results");
const examples = document.querySelector(".examples");
const clearButton = document.querySelector("#clear");

for (const [id, example] of Object.entries(EXAMPLES)) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = example.label;
    button.addEventListener("click", () => {
        advice.value = example.text;
        run(example.text);
    });
    examples.append(button);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    run(advice.value);
});

advice.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        run(advice.value);
    }
});

clearButton.addEventListener("click", () => {
    advice.value = "";
    results.hidden = true;
    results.replaceChildren();
    advice.focus();
});

function run(text) {
    const result = analyze(text);
    results.hidden = false;
    results.replaceChildren();
    if (result.empty) {
        results.append(el("p", "summary", "Paste the paragraph first."));
        focusResult();
        return;
    }
    render(result);
    focusResult();
}

function render(result) {
    const title = el("h2", "domain", "Read as " + result.domain.label.toLowerCase());
    title.id = "result-title";
    title.tabIndex = -1;
    results.append(title);
    results.append(el("p", "summary", result.summary));
    if (result.notice) results.append(el("p", "notice", result.notice));

    results.append(sectionHolds(result));
    results.append(sectionMissing(result));
    results.append(sectionTricks(result));
    results.append(sectionNext(result));
    if (result.claims.length) results.append(sectionLines(result));
    if (result.reply) results.append(sectionReply(result));
}

function sectionHolds(result) {
    const section = el("section", "block holds");
    section.append(el("h2", null, "What holds up"));
    if (!result.rules.length && !result.claims.some(isHold)) {
        section.append(el("p", "empty", "Nothing here is both specific and backed. A feeling can still be yours. A fact needs a source."));
        return section;
    }
    for (const rule of result.rules) {
        const card = el("article", "rule");
        card.append(el("p", "mark", "Public rule"));
        card.append(el("h3", null, rule.title));
        card.append(el("p", null, rule.text));
        const links = el("ul", "links");
        links.append(linkItem(rule.url, rule.urlLabel));
        for (const link of rule.links) links.append(linkItem(link.url, link.label));
        card.append(links);
        card.append(el("p", "note", rule.checked));
        section.append(card);
    }
    for (const claim of result.claims.filter(isHold)) {
        const card = el("article", "rule");
        card.append(el("h3", null, claim.label));
        card.append(el("p", "quote", claim.text));
        if (claim.note) card.append(el("p", "note", claim.note));
        section.append(card);
    }
    return section;
}

function sectionMissing(result) {
    const section = el("section", "block missing");
    section.append(el("h2", null, "What’s missing"));
    if (!result.missing.length) {
        section.append(el("p", "empty", "No obvious gap stood out."));
        return section;
    }
    for (const item of result.missing) {
        const card = el("article", "gap");
        card.append(el("h3", null, item.title));
        card.append(el("p", null, item.detail));
        section.append(card);
    }
    return section;
}

function sectionTricks(result) {
    const section = el("section", "block tricks");
    section.append(el("h2", null, "Sales tricks"));
    if (!result.tricks.length) {
        section.append(el("p", "empty", "No sales trick stood out in the wording. That does not make the facts true."));
        return section;
    }
    for (const trick of result.tricks) {
        const card = el("article", "trick");
        card.append(el("h3", null, trick.name));
        card.append(el("p", "quote", trick.quote));
        card.append(el("p", null, trick.why));
        section.append(card);
    }
    return section;
}

function sectionNext(result) {
    const section = el("section", "block next");
    section.append(el("h2", null, "Ask this next"));
    if (!result.next) {
        section.append(el("p", "empty", "There isn’t a sentence to ask about yet."));
        return section;
    }
    section.append(el("p", "question", result.next.question));
    section.append(el("p", "why", result.next.why));
    if (result.next.more.length) {
        const list = el("ul", "more");
        const label = el("p", "note", "If they dodge, ask:");
        for (const item of result.next.more) list.append(el("li", null, item));
        section.append(label);
        section.append(list);
    }
    const copy = el("button", "copy", "Copy the question");
    copy.type = "button";
    copy.addEventListener("click", () => copyText(result.next.question, copy));
    section.append(copy);
    return section;
}

function sectionLines(result) {
    const section = el("section", "block lines");
    section.append(el("h2", null, "Line by line"));
    const list = el("ul", "lines");
    const shown = result.claims.slice(0, 40);
    for (const claim of shown) {
        const item = el("li", "claim " + claim.verdict);
        item.append(el("p", "mark", claim.label));
        item.append(el("p", null, claim.text));
        if (claim.note) item.append(el("p", "note", claim.note));
        list.append(item);
    }
    section.append(list);
    if (result.claims.length > shown.length) {
        section.append(el("p", "notice", "The rest of the lines were left off so this stays readable. The four sections above used the whole paste, up to the length limit."));
    }
    return section;
}

function sectionReply(result) {
    const section = el("section", "block reply-block");
    section.append(el("h2", null, "Say this back"));
    section.append(el("p", "reply", result.reply));
    const copy = el("button", "copy", "Copy the reply");
    copy.type = "button";
    copy.addEventListener("click", () => copyText(result.reply, copy));
    section.append(copy);
    return section;
}

function isHold(claim) {
    return claim.verdict === "sound" || claim.verdict === "sourced";
}

function linkItem(url, label) {
    const item = el("li");
    const link = document.createElement("a");
    link.href = url;
    link.textContent = label;
    link.rel = "noopener noreferrer";
    link.target = "_blank";
    item.append(link);
    return item;
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

function focusResult() {
    const title = document.querySelector("#result-title");
    const target = title || results.firstElementChild;
    if (!target) return;
    if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
    target.focus();
    results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function copyText(text, button) {
    const original = button.textContent;
    const ok = copyWithFallback(text);
    const finish = (copied) => {
        button.textContent = copied ? "Copied" : "Couldn’t copy";
        button.focus({ preventScroll: true });
        window.setTimeout(() => {
            if (button.isConnected) button.textContent = original;
        }, 1600);
    };
    if (ok) {
        finish(true);
        return;
    }
    let settled = false;
    const timer = window.setTimeout(() => {
        if (!settled) finish(false);
    }, 500);
    const settle = (copied) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        finish(copied);
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => settle(true), () => settle(false));
        return;
    }
    settle(false);
}

function copyWithFallback(text) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.width = "1px";
    area.style.height = "1px";
    area.style.opacity = "0";
    document.body.append(area);
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, area.value.length);
    let ok = false;
    try {
        ok = document.execCommand("copy");
    } catch (error) {
        ok = false;
    }
    area.remove();
    return ok;
}
