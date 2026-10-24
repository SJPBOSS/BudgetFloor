import assert from "node:assert/strict";
import test from "node:test";
import { analyze, EXAMPLES, splitClaims } from "./analyze.js";

test("empty input stays empty", () => {
    assert.equal(analyze("").empty, true);
    assert.equal(analyze("   \n").empty, true);
    assert.equal(analyze(null).empty, true);
});

test("splits real sentences and keeps abbreviations together", () => {
    assert.equal(splitClaims("One. Two! Three?").length, 3);
    assert.equal(splitClaims("Read s. 105 of the Act. Then stop.").length, 2);
    assert.equal(splitClaims("The price is $10.50 today. Next.").length, 2);
});

test("a 4K claim asks for pixels and does not invent the model's output", () => {
    const result = analyze(EXAMPLES.fourk.text);
    assert.match(result.next.question, /pixel/i);
    assert.equal(result.claims.some((claim) => claim.verdict === "conflict"), false);
    assert.ok(result.tricks.some((trick) => trick.id === "urgency"));
    assert.ok(result.tricks.some((trick) => trick.id === "unnamed-authority"));
    assert.ok(result.rules.some((rule) => rule.text.includes("3840")));
    const spoken = result.summary + result.rules.map((rule) => rule.text).join(" ");
    assert.doesNotMatch(spoken, /kimi (cannot|can't|does not|can't)/i);
    assert.match(result.reply, /pixel/i);
});

test("an Etsy ban conflicts with the seller policy and the pitch is named", () => {
    const result = analyze(EXAMPLES.etsy.text);
    const ban = result.claims.find((claim) => /digital downloads/i.test(claim.text));
    assert.equal(ban.verdict, "conflict");
    assert.ok(result.rules[0].url.includes("etsy.com/legal/sellers"));
    assert.ok(result.tricks.some((trick) => trick.id === "selling"));
    assert.ok(result.tricks.some((trick) => trick.id === "scarcity"));
    assert.match(result.next.question, /policy/i);
    assert.match(result.summary, /ban/i);
});

test("a true Etsy limit is not called a ban", () => {
    const result = analyze("Digital items on Etsy have to be made or designed by the seller, and AI has to be disclosed.");
    assert.equal(result.claims.some((claim) => claim.verdict === "conflict"), false);
    assert.ok(result.rules.some((rule) => rule.id === "etsy"));
});

test("an Ontario damage deposit conflicts, and the 60-day sentence stays mixed", () => {
    const result = analyze(EXAMPLES.landlord.text);
    const deposit = result.claims.find((claim) => /damage deposit/i.test(claim.text));
    const notice = result.claims.find((claim) => /60 days/i.test(claim.text));
    assert.equal(deposit.verdict, "conflict");
    assert.equal(notice.verdict, "mixed");
    assert.match(notice.note, /60|notice|rental period/i);
    assert.match(result.rules[0].text, /105/);
    assert.match(result.rules[0].text, /106/);
    assert.match(result.rules[0].text, /section 34/i);
    assert.match(result.next.question, /damage deposit/i);
    assert.ok(result.tricks.some((trick) => trick.id === "selling"));
});

test("a correct Ontario explanation is not flagged as a conflict", () => {
    const result = analyze("In Ontario a landlord cannot charge a damage deposit. The only security deposit is a rent deposit under section 105, applied to the last month's rent under section 106. For a monthly tenancy, notice is 60 days under section 44.");
    assert.equal(result.claims.some((claim) => claim.verdict === "conflict" || claim.verdict === "mixed"), false);
    const notice = result.claims.find((claim) => /60 days/i.test(claim.text));
    assert.equal(notice.verdict, "sound");
    assert.ok(result.rules.some((rule) => rule.id === "ontario-rent"));
});

test("a cure pitch that says to stop medicine is a red flag, not a finding of fact", () => {
    const result = analyze(EXAMPLES.tea.text);
    assert.ok(result.claims.some((claim) => claim.verdict === "redflag" && /pills/i.test(claim.text)));
    assert.ok(result.claims.some((claim) => claim.verdict === "redflag" && /blood pressure/i.test(claim.text)));
    assert.equal(result.claims.some((claim) => claim.verdict === "sound"), false);
    assert.equal(result.rules.length, 0);
    assert.match(result.next.question, /clinician|chart|prescri/i);
    assert.match(result.summary, /medicine/i);
    assert.ok(result.tricks.some((trick) => trick.id === "price"));
    assert.ok(result.tricks.some((trick) => trick.id === "social"));
});

test("ordinary advice holds up and is not called a pitch", () => {
    const result = analyze(EXAMPLES.plain.text);
    assert.ok(result.claims.some((claim) => claim.verdict === "sound" && /wash your hands/i.test(claim.text)));
    assert.ok(result.claims.some((claim) => claim.verdict === "sound" && /doctor/i.test(claim.text)));
    assert.ok(result.claims.some((claim) => claim.verdict === "sourced"));
    assert.equal(result.tricks.length, 0);
    assert.equal(result.claims.some((claim) => claim.verdict === "redflag" || claim.verdict === "conflict"), false);
});

test("honest hedges are not sales tricks", () => {
    const result = analyze("There is limited evidence for this, and I can't guarantee a result. The offer is not a limited-time deal.");
    assert.equal(result.tricks.some((trick) => trick.id === "scarcity" || trick.id === "guarantee" || trick.id === "urgency"), false);
});

test("a long paste is clipped and still returns a question", () => {
    const result = analyze("This is a sentence about a number, 12, with no source. ".repeat(400));
    assert.equal(result.clipped, true);
    assert.ok(result.next.question.length > 10);
});

test("punctuation alone is not a sentence", () => {
    const result = analyze("???");
    assert.equal(result.empty, false);
    assert.equal(result.claims.length, 0);
    assert.equal(result.next, null);
});
