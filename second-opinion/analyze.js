// Public rules below were read on 23 October 2026.
// Ontario: Residential Tenancies Act sections 34, 44, 105, and 106,
// and https://www.ontario.ca/page/rental-housing-offences (page updated 2 July 2026).
// Etsy: Seller Policy effective 9 July 2026, https://www.etsy.com/legal/sellers
// and the digital listings help page.

const READ_ON = "23 October 2026";
const MAX_CHARS = 12000;

const RANK = {
    vague: 0,
    sound: 1,
    sourced: 2,
    checkable: 3,
    overclaim: 4,
    pressure: 5,
    mixed: 6,
    redflag: 7,
    conflict: 8
};

const LABELS = {
    vague: "Too vague",
    sound: "Holds up",
    sourced: "Names a source",
    checkable: "Check this",
    overclaim: "Bigger than its evidence",
    pressure: "Sales pressure",
    mixed: "Partly right",
    redflag: "Don't act on this",
    conflict: "Conflicts with the written rule"
};

const PRESSURE_IDS = new Set([
    "urgency",
    "scarcity",
    "social",
    "miracle",
    "selling",
    "price",
    "fear",
    "dilemma",
    "guarantee"
]);

const EMPTY = {
    empty: true,
    clipped: false,
    thinEnglish: false,
    notice: null,
    domain: { id: "general", label: "General" },
    summary: "",
    claims: [],
    tricks: [],
    rules: [],
    missing: [],
    next: null,
    reply: ""
};

const TRICKS = [
    {
        id: "urgency",
        name: "A deadline",
        test: (text) => positively(text, /\b(act now|only today|today only|this week only|last chance|ends (tonight|today)|offer ends|before it['’]s too late|in the next \d+ (minutes|hours)|next \d+ minutes)\b/i) || positively(text, /\blimited[- ]time\b/i),
        why: "A deadline is there so you skip the check. A real one names a date and something that changes that day even if nobody is selling."
    },
    {
        id: "scarcity",
        name: "Fake scarcity",
        test: (text) => /\b(only \d+ (spots|left)|spots left|\d+ spots left|spots are limited|limited spots|while supplies last|only a few left)\b/i.test(text),
        why: "A count of spots hurries you. Ask what is actually scarce, and what happens if you come back tomorrow."
    },
    {
        id: "social",
        name: "A crowd instead of a source",
        test: (text) => /\b(everyone (is|knows)|millions of|\d{1,3}(?:,\d{3})+ (customers|people|users)|can['’]t be wrong|cannot be wrong)\b/i.test(text),
        why: "A crowd is not a measurement. Ask who counted, what they counted, and what happened to the people it did not work for."
    },
    {
        id: "miracle",
        name: "Miracle wording",
        test: (text) => {
            if (/\b(does not|doesn['’]t|do not|don['’]t|never|no)\s+(cure|cures|treat)\b/i.test(text)) return false;
            return /\b(cures?|miracle|one weird trick|doctors hate|detox|eliminates|reverses)\b/i.test(text);
        },
        why: "Cure, detox, and “doctors hate this” are sales costumes. They are not a result."
    },
    {
        id: "selling",
        name: "Someone is selling the fix",
        test: (text) => /\b(book a call|dm me|link in bio|use code|my course|i help sellers|hire our)\b/i.test(text) || /\bour\b(?:\s+\w+){0,3}\s+(tea|product|system|program|cleaners)\b/i.test(text),
        why: "The advice and the sale are the same paragraph. Split them before you trust either one."
    },
    {
        id: "price",
        name: "A price meant to be felt",
        test: (text) => /\b(was\s+\$\s?[\d,]+|now\s+\$\s?[\d,]+|same price as|for the price of)\b/i.test(text),
        why: "The number you are meant to feel is not the full cost. Ask what you pay after today, and what you pay if you cancel."
    },
    {
        id: "fear",
        name: "A threat",
        test: (text) => /\b(shut down|you['’]ll lose|you will lose|or you lose|before it['’]s too late)\b/i.test(text),
        why: "Fear shortens the time you spend checking. Ask what actually happens, under which rule, if you do nothing today."
    },
    {
        id: "dilemma",
        name: "Only two doors",
        test: (text) => /\b(or your (shop|account|health) will|the only way|you have no choice)\b/i.test(text),
        why: "A false choice hides the ordinary option, which is to check the rule and then decide."
    },
    {
        id: "guarantee",
        name: "A guarantee with nothing behind it",
        test: (text) => /\b(guaranteed|we guarantee|money[- ]back guarantee)\b/i.test(text) && !/\b(can['’]t|cannot|no) guarantee\b/i.test(text),
        why: "A guarantee is a contract or it is a mood. Ask what you get back, who pays, and what is excluded."
    },
    {
        id: "unnamed-authority",
        name: "An expert with no name",
        test: (text) => /\b(studies show|research shows|experts agree|doctors recommend|science says)\b/i.test(text) && !/https?:\/\//i.test(text),
        why: "“Studies show” without a page is a gesture. Ask for the title, the year, and a link you can open."
    },
    {
        id: "unnamed-law",
        name: "A law with no name",
        test: (text) => /\b(it['’]s the law|it is the law|it['’]s illegal|you have no rights)\b/i.test(text) && !/\b(section|s\.)\s*\d+/i.test(text) && !/\bAct\b/.test(text),
        why: "A law has a name and a section. “It’s the law” does not. Ask which one, and where it applies."
    },
    {
        id: "consensus",
        name: "Assumed consensus",
        test: (text) => /\bthis is standard\b/i.test(text),
        why: "Standard for whom? Ask them to point at the clause, the policy, or the statute."
    }
];

const DOMAINS = [
    {
        id: "health",
        label: "Health",
        terms: [/\b(doctor|doctors|clinician|pharmacist|physician)\b/i, /\b(cure|cures|detox|pills|medication|prescription|symptom|diagnosis)\b/i, /\bblood pressure\b/i, /\bsupplement\b/i]
    },
    {
        id: "housing",
        label: "Housing",
        terms: [/\b(landlord|tenant|lease|eviction|rent)\b/i, /\bdeposit\b/i, /\bontario\b/i, /\bnotice\b/i, /\bcleaning\b/i]
    },
    {
        id: "platform",
        label: "A platform rule",
        terms: [/\betsy\b/i, /\bdigital downloads?\b/i, /\bseller policy\b/i, /\bshop will be\b/i]
    },
    {
        id: "tech",
        label: "A product claim",
        terms: [/\b4k\b/i, /\b(image|images|photo|photos|pixel|pixels|resolution|upscale|upscaled|model)\b/i, /\bgenerat/i, /\bnatively\b/i]
    },
    {
        id: "money",
        label: "Money",
        terms: [/\b(invest|investment|dividend|crypto)\b/i, /\bapr\b/i, /\bguaranteed returns?\b/i]
    },
    {
        id: "sales",
        label: "A pitch",
        terms: [/\bbook a call\b/i, /\bspots\b/i, /\bdiscount\b/i, /\border now\b/i, /\badd to cart\b/i]
    }
];

export const EXAMPLES = {
    fourk: {
        label: "A 4K image claim",
        text: "Kimi generates true 4K images natively, and studies show it beats every other model. Everyone is switching. This week only, 4K is the same price as 1K. Spots are limited."
    },
    etsy: {
        label: "An Etsy scare",
        text: "Etsy doesn't allow digital downloads anymore. You have to switch to physical products or your shop will be shut down. I help sellers fix this. Book a call. Only 3 spots left this week."
    },
    landlord: {
        label: "A landlord's deposit",
        text: "Your damage deposit covers cleaning, and you won't get it back unless you hire our cleaners. It's the law in Ontario. You have to give 60 days' notice or you lose the deposit. This is standard."
    },
    tea: {
        label: "A tea that cures",
        text: "Doctors hate this one trick. Our detox tea cures high blood pressure in 7 days. 50,000 customers can't be wrong. Was $89, now $29 if you order in the next 15 minutes. Guaranteed, and you can stop your pills."
    },
    plain: {
        label: "Ordinary advice",
        text: "Wash your hands with soap for 20 seconds before you cook. If a cut looks infected, see a doctor. These prices are Statistics Canada average retail prices, August 2026."
    }
};

export function splitClaims(text) {
    const lines = String(text || "").split(/\n+/);
    const claims = [];
    for (const line of lines) {
        const trimmed = line.trim().replace(/^([-*•]+|\d+[.)])\s+/, "");
        if (!trimmed) continue;
        for (const sentence of splitSentences(trimmed)) {
            const clean = sentence.replace(/\s+/g, " ").trim();
            if (clean.length > 1) claims.push(clean);
        }
    }
    return claims;
}

export function analyze(raw) {
    if (raw == null) return { ...EMPTY, claims: [], tricks: [], rules: [], missing: [] };
    const original = String(raw).replace(/\r\n/g, "\n").trim();
    if (!original) return { ...EMPTY, claims: [], tricks: [], rules: [], missing: [] };

    const clipped = original.length > MAX_CHARS;
    const text = clipped ? original.slice(0, MAX_CHARS) : original;
    const claims = splitClaims(text);
    const domain = detectDomain(text);
    const thinEnglish = isThinEnglish(text);
    if (!claims.length) {
        return {
            empty: false,
            clipped,
            thinEnglish,
            notice: noticeFor(clipped, thinEnglish),
            domain,
            summary: "There's no sentence here to check.",
            claims: [],
            tricks: [],
            rules: [],
            missing: [],
            next: null,
            reply: ""
        };
    }
    const tricks = findTricks(text, claims);
    const known = knownChecks(text);
    const annotated = claims.map((claim) => annotate(claim, text, known));

    const flags = {
        stopMeds: annotated.some((claim) => claim.stopMeds),
        cure: annotated.some((claim) => claim.cure),
        conflict: annotated.some((claim) => claim.verdict === "conflict" || claim.verdict === "mixed"),
        fourk: known.some((item) => item.id === "fourk"),
        hasDimensions: /\b\d{3,4}\s*[x×]\s*\d{3,4}\b/.test(text),
        ontario: known.some((item) => item.id === "ontario-rent"),
        etsy: known.some((item) => item.id === "etsy"),
        urgency: tricks.some((trick) => trick.id === "urgency"),
        selling: tricks.some((trick) => trick.id === "selling"),
        hasSource: hasSource(text),
        unsourcedNumber: annotated.some((claim) => /\d/.test(claim.text) && (claim.verdict === "checkable" || claim.verdict === "overclaim" || claim.verdict === "pressure")),
        mostlySound: annotated.length > 0 && annotated.every((claim) => claim.verdict === "sound" || claim.verdict === "sourced" || claim.verdict === "vague") && annotated.some((claim) => claim.verdict === "sound" || claim.verdict === "sourced")
    };

    const rules = known.map((item) => item.rule);
    const next = pickQuestion(flags, text);
    const summary = writeSummary(flags, domain);

    return {
        empty: false,
        clipped,
        thinEnglish,
        notice: noticeFor(clipped, thinEnglish),
        domain,
        summary,
        claims: annotated.map(publicClaim),
        tricks,
        rules,
        missing: findMissing(text, flags),
        next,
        reply: next ? "Before I go along with this, I need a straight answer: " + ensureQuestion(next.question) : ""
    };
}

function publicClaim(claim) {
    return {
        text: claim.text,
        verdict: claim.verdict,
        label: LABELS[claim.verdict],
        note: claim.note
    };
}

function annotate(text, full, known) {
    let verdict = "vague";
    if (isSpecific(text)) verdict = "checkable";
    if (isPlainSound(text)) verdict = "sound";
    if (hasSource(text)) verdict = "sourced";

    const notes = [];
    let stopMeds = false;
    let cure = false;

    for (const item of known) {
        const support = item.support(text);
        const contradict = item.contradict(text);
        const backing = item.backing(text) && item.contradict(full);
        if (support && contradict) {
            verdict = "mixed";
            notes.push(item.mixedNote);
        } else if (contradict) {
            verdict = "conflict";
            notes.push(item.conflictNote);
        } else if (backing) {
            verdict = raise(verdict, "conflict");
            notes.push(item.backingNote);
        } else if (support && (verdict === "vague" || verdict === "checkable")) {
            verdict = "sound";
            notes.push(item.supportNote);
        } else if (support) {
            notes.push(item.supportNote);
        }
        if (item.claimNote && item.claimNote.when(text)) notes.push(item.claimNote.text);
    }

    const flag = medicalFlag(text);
    if (flag) {
        verdict = raise(verdict, "redflag");
        notes.push(flag.note);
        stopMeds = flag.stopMeds;
        cure = flag.cure;
    }

    if (/\b(beats every|every other|the best|proven to|100%|no one else)\b/i.test(text) && !isPlainSound(text)) {
        verdict = raise(verdict, "overclaim");
    }

    const matchedTricks = TRICKS.filter((trick) => trick.test(text));
    if (matchedTricks.some((trick) => PRESSURE_IDS.has(trick.id))) {
        verdict = raise(verdict, "pressure");
    }

    if (!notes.length) notes.push(defaultNote(verdict));

    return {
        text,
        verdict,
        note: unique(notes).slice(0, 2).join(" "),
        stopMeds,
        cure
    };
}

function medicalFlag(text) {
    if (/\b(stop|quit|drop|skip|throw out|don['’]t take|do not take)\b(?:\s+\w+){0,5}\s+(?:your\s+)?(pills|medications?|meds|prescriptions?|insulin|statins?)\b/i.test(text)) {
        return {
            stopMeds: true,
            cure: false,
            note: "This tells you to stop a medicine. Do not do that because a paragraph said so. Talk to the person who prescribed it."
        };
    }
    if (/\b(cures?|eliminates|reverses)\b/i.test(text) && /\b(blood pressure|cancer|diabetes|anxiety|depression|infection|arthritis|cholesterol|asthma|covid|pain)\b/i.test(text) && !/\b(does not|doesn['’]t|do not|don['’]t|never)\s+(cure|cures)\b/i.test(text)) {
        return {
            stopMeds: false,
            cure: true,
            note: "A cure claim for a medical condition is not something to act on from a webpage, especially one that sells the product."
        };
    }
    if (/\b(guaranteed returns|risk[- ]free|double your money|can['’]t lose)\b/i.test(text)) {
        return {
            stopMeds: false,
            cure: false,
            note: "A promise of profit with the risk taken out is a sales line, not a plan."
        };
    }
    return null;
}

function defaultNote(verdict) {
    if (verdict === "sound") return "Ordinary caution, and it is not asking you to buy anything.";
    if (verdict === "sourced") return "A named source is a start. Open it and check the date.";
    if (verdict === "checkable") return "Specific enough to be true or false. Nothing in the paragraph settles it.";
    if (verdict === "overclaim") return "The strong word has no source next to it.";
    if (verdict === "pressure") return "This sentence is doing the pushing.";
    if (verdict === "vague") return "Too little here to check.";
    return "";
}

function knownChecks(text) {
    return KNOWN.filter((item) => item.applies(text));
}

const KNOWN = [
    {
        id: "ontario-rent",
        applies: (text) => /\bontario\b/i.test(text) && /\b(deposit|landlord|tenant|lease|notice|rent)\b/i.test(text),
        contradict: ontarioBadDeposit,
        support: (text) => /\b60 days?\b/i.test(text),
        backing: (text) => /\b(it['’]s the law|it is the law|this is standard)\b/i.test(text),
        conflictNote: "Ontario does not allow a damage deposit. The rent deposit is for the last rent period, and charging a damage deposit is listed as an offence.",
        mixedNote: "Sixty days’ notice is a real rule for a monthly tenancy, and the end date has to be the last day of a rental period. Losing the deposit is not part of that rule.",
        supportNote: "For a monthly tenancy, section 44 asks for at least 60 days, ending on the last day of a rental period. That is the notice. It does not forfeit a deposit.",
        backingNote: "This vouches for the deposit claim and names no section. Section 105 allows a rent deposit only.",
        rule: {
            id: "ontario-rent",
            title: "Ontario deposits and notice",
            text: "For a residential tenancy in Ontario, the only security deposit a landlord may collect is a rent deposit (Residential Tenancies Act, section 105). That money is applied to the last rent period (section 106). It is not a cleaning fund or a damage deposit. Ontario’s rental housing offences page, updated 2 July 2026, lists charging a damage deposit as an offence, and lists using the rent deposit for anything other than the last month’s rent as an offence. Notice is a separate rule: for a monthly tenancy, at least 60 days, ending on the last day of a rental period (sections 44 and 47). A tenant still answers for undue damage they cause on purpose or by neglect (section 34). That is a cost, not a deposit taken at the start. Commercial leases, and some housing, sit outside this.",
            url: "https://www.ontario.ca/laws/statute/06r17",
            urlLabel: "Residential Tenancies Act, 2006",
            checked: "Read " + READ_ON + ". Offences page updated 2 July 2026.",
            links: [
                { label: "Rental housing offences", url: "https://www.ontario.ca/page/rental-housing-offences" }
            ]
        }
    },
    {
        id: "etsy",
        applies: (text) => /\betsy\b/i.test(text) && /\b(digital|download|listing|shop|seller)\b/i.test(text),
        contradict: etsyBlanketBan,
        support: () => false,
        backing: (text) => /\b(shut down|switch to physical|or your shop will)\b/i.test(text),
        conflictNote: "The Etsy Seller Policy effective 9 July 2026 includes digitally delivered items as something a listing can sell. That is not a ban on digital downloads.",
        mixedNote: "",
        supportNote: "",
        backingNote: "This threat depends on a ban. The seller policy does not ban digital downloads as a category. Etsy can still act on a listing that breaks a real rule.",
        rule: {
            id: "etsy",
            title: "Etsy and digital downloads",
            text: "Etsy’s Seller Policy, effective 9 July 2026, says every listing has to offer an item for sale, and it says that includes digitally delivered items. Prohibited items are still prohibited. The digital listings help page says a digital item has to be made or designed by the seller. The same seller policy says an item created with AI has to disclose that. Etsy can still suspend a shop that breaks a real rule. Selling a digital file you made is not, by itself, that rule. The page can change. Read the one with the effective date on it.",
            url: "https://www.etsy.com/legal/sellers",
            urlLabel: "Etsy Seller Policy",
            checked: "Read " + READ_ON + ". The policy page says it is effective 9 July 2026.",
            links: [
                { label: "How to manage digital listings", url: "https://help.etsy.com/hc/en-us/articles/115015628347-How-to-Manage-Your-Digital-Listings" }
            ]
        }
    },
    {
        id: "fourk",
        applies: (text) => /\b4k\b|3840\s*[x×]\s*2160|4096\s*[x×]\s*2160|ultra\s*hd/i.test(text) && /\b(image|images|photo|photos|picture|generat|model|pixel|pixels|video|resolution|upscal|kimi)\b/i.test(text),
        contradict: () => false,
        support: () => false,
        backing: () => false,
        conflictNote: "",
        mixedNote: "",
        supportNote: "",
        backingNote: "",
        claimNote: {
            when: (text) => /\b4k\b|3840\s*[x×]\s*2160|4096\s*[x×]\s*2160/i.test(text),
            text: "Television 4K is 3840 by 2160 pixels. Cinema 4K is 4096 by 2160. The check is the file’s width and height, and whether that was sampled or upscaled."
        },
        rule: {
            id: "fourk",
            title: "What 4K actually counts",
            text: "On a television, 4K means 3840 by 2160 pixels, which is exactly four times 1920 by 1080. Cinema 4K means 4096 by 2160. Neither number is a mood, and neither is proved by a product name. A smaller picture can be stretched and saved at that size. This page does not know what any particular model outputs. The file does.",
            url: "https://en.wikipedia.org/wiki/4K_resolution",
            urlLabel: "4K resolution, for the pixel counts",
            checked: "The pixel counts are the display standards, not a claim about a model. Read " + READ_ON + ".",
            links: []
        }
    }
];

function ontarioBadDeposit(text) {
    if (/\b(no|not|never|isn['’]t|aren['’]t|cannot|can['’]t|illegal|offence|prohibited)\b(?:\s+\w+){0,6}\s+damage deposits?/i.test(text)) return false;
    if (/\b(not a damage deposit|no damage deposit|only a rent deposit|offence to charge)\b/i.test(text)) return false;
    return /\b(damage deposits?|cleaning deposits?|pet deposits?|lose the deposit|loses the deposit|won['’]?t get it back|will not get it back|deposit covers cleaning|keep the deposit|forfeit the deposit)\b/i.test(text);
}

function etsyBlanketBan(text) {
    if (/\b(designed by|made or designed|made and\/or designed|you made|you designed|disclose|creativity standards|prohibited items)\b/i.test(text)) return false;
    return /(?:does(?:n['’])?t allow|does not allow|do not allow|don['’]?t allow|no longer allows?|banned|not allowed|prohibited|against the rules|illegal|can['’]t sell|cannot sell)(?:\s+\w+){0,8}\s+digital downloads?|digital downloads?(?:\s+\w+){0,6}\s+(?:are\s+|is\s+)?(?:no longer(?:\s+\w+){0,3}\s+)?(?:banned|not allowed|prohibited|against the rules|illegal)/i.test(text);
}

function findTricks(text, claims) {
    const found = [];
    for (const trick of TRICKS) {
        const claim = claims.find((item) => trick.test(item));
        if (!claim && !trick.test(text)) continue;
        found.push({
            id: trick.id,
            name: trick.name,
            quote: clip(claim || text),
            why: trick.why
        });
    }
    return found;
}

function findMissing(text, flags) {
    const items = [];
    const add = (title, detail) => {
        if (items.length >= 4) return;
        if (items.some((item) => item.title === title)) return;
        items.push({ title, detail });
    };

    if (flags.stopMeds || flags.cure) {
        add("Your actual chart", "Nothing here knows your dose, your other conditions, or what the prescriber is watching.");
        add("The people it did not help", "A customer count is not a result. The missing number is how many people saw no change, and who measured that.");
    }
    if ((flags.stopMeds || flags.cure) && /\$/.test(text)) {
        add("The price after the timer", "The low number is the one in the sentence. Ask what it costs tomorrow, and how you cancel.");
    }
    if (flags.ontario && flags.conflict) {
        add("Whether the Act applies", "This is the residential rule in Ontario. A commercial lease, and some housing, sit outside it.");
        add("Damage you actually cause", "Section 34 says a tenant answers for undue damage done on purpose or by neglect. That is a cost with a receipt, not a deposit taken at the start.");
    }
    if (flags.etsy && flags.conflict) {
        add("The real line, not the category", "Prohibited items are still prohibited, and a digital file still has to be made or designed by the seller. That is a different rule from a ban.");
        add("What the caller earns", "The person booking the call gets paid if you are scared. Ask which policy sentence they are reading from.");
    }
    if (flags.fourk && !/\b\d{3,4}\s*[x×]\s*\d{3,4}\b/.test(text)) {
        add("The file itself", "Width and height, in pixels, of the file it saves. Then the second question: sampled at that size, or upscaled to it.");
    }
    if (flags.selling && !flags.stopMeds && !flags.etsy) {
        add("What they earn if you say yes", "If the same person sells the fix, the advice is not a neutral report.");
    }
    if (!flags.hasSource && !flags.mostlySound && items.length < 4 && !flags.fourk && !flags.etsy && !flags.ontario) {
        add("A source you can open", "A name, a page, and a date. If it is a law, a section. If it is a study, a link.");
    }
    if (!items.length && flags.mostlySound) {
        add("Where it stops", "This is fine as far as it goes. It does not cover a worse case than the one in the sentence.");
    }
    if (!items.length) {
        add("The cost of being wrong", "Ask what happens to you if the paragraph is wrong, and who pays that.");
    }
    return items;
}

function pickQuestion(flags, text) {
    if (flags.stopMeds) {
        return {
            question: "Which clinician, looking at your chart, told you to stop?",
            why: "The person who prescribed the medicine outranks a page that sells the tea. Do not stop because the paragraph said you can.",
            more: [
                "What is in it, in amounts, and what happens to people it does not help?",
                "What does it cost after the timer runs out?"
            ]
        };
    }
    if (flags.cure) {
        return {
            question: "What happened to the people this did not help, and who measured that?",
            why: "A cure claim with a price on it is a pitch. The people left out of the sentence are the evidence.",
            more: [
                "What is the full cost after today, and how do you cancel?",
                "Which clinician who knows your chart is fine with you taking this?"
            ]
        };
    }
    if (flags.ontario && flags.conflict) {
        return {
            question: "Which section of the Residential Tenancies Act says a landlord may keep a damage deposit?",
            why: "Section 105 allows a rent deposit only, and section 106 applies it to the last rent period. Ontario lists charging a damage deposit as an offence. The 60-day notice is a different rule.",
            more: [
                "Is this a residential tenancy covered by the Act, or a commercial lease?",
                "If the claim is that I caused damage, what is the damage, and where is the receipt?"
            ]
        };
    }
    if (flags.etsy && flags.conflict) {
        return {
            question: "Which sentence of the Etsy Seller Policy bans digital downloads, and what effective date is printed on that page?",
            why: "The policy effective 9 July 2026 says listings include digitally delivered items. Policies change. The page is the check, not the person selling the rescue.",
            more: [
                "Which listings would break a real rule, as opposed to every digital file?",
                "What do you get paid if I book the call?"
            ]
        };
    }
    if (flags.fourk) {
        const hasSize = /\b\d{3,4}\s*[x×]\s*\d{3,4}\b/.test(text);
        if (!hasSize) {
            return {
                question: "What are the width and height, in pixels, of the file it actually saves?",
                why: "Television 4K is 3840 by 2160. Cinema 4K is 4096 by 2160. A label on a webpage is neither of those. This page is not claiming the model can or cannot do it.",
                more: [
                    "Is that the size the model sampled, or the size after an upscale?",
                    "Which study, and where do I open it?"
                ]
            };
        }
        return {
            question: "Was that the size the model sampled, or the size after an upscale?",
            why: "The numbers may be a real 4K size. An upscaler can write them into the file afterward.",
            more: ["Where is the study, and what did it measure?"]
        };
    }
    if (flags.urgency) {
        return {
            question: "What actually changes if I decide tomorrow?",
            why: "A deadline is there to skip the check. A real deadline survives the question.",
            more: ["Where does the number come from, and what year is it?"]
        };
    }
    if (flags.unsourcedNumber) {
        return {
            question: "Where does that number come from, and what year is it?",
            why: "A precise number with no page next to it is the easiest thing to invent.",
            more: ["What would the number be if you counted the cases it did not cover?"]
        };
    }
    if (flags.mostlySound) {
        return {
            question: "Where do I open the source, and what would make this not apply?",
            why: "The wording is calm. The remaining check is the page it names, and the case it does not cover.",
            more: []
        };
    }
    return {
        question: "What would have to be true for this to be wrong, and how do I check that today?",
        why: "If they cannot say what would change their mind, you are hearing a pitch.",
        more: ["Who loses if I believe this, and who gets paid?"]
    };
}

function writeSummary(flags, domain) {
    if (flags.stopMeds) return "This tells you to stop a medicine. That is not a step you take from a page that sells the product. The rest is a price and a crowd.";
    if (flags.cure) return "The cure sentence is the one to set aside. A page that sells the product does not get to clear a medical claim.";
    if (flags.ontario && flags.conflict) return "The deposit part is not Ontario law. Sixty days’ notice is a different rule, and it does not let anyone keep a damage deposit.";
    if (flags.etsy && flags.conflict) return "A ban on digital downloads conflicts with Etsy’s seller policy. The shutdown line and the booked call are riding on that ban.";
    if (flags.fourk && flags.hasDimensions) return "The pixel count is a real 4K size. The open question is whether the model sampled it, or an upscaler wrote it afterward.";
    if (flags.fourk) return "4K is a pixel count, not a compliment. Nothing here shows the width and height of the file, or whether those pixels were generated or stretched.";
    if (flags.etsy && !flags.conflict) return "This talks about Etsy and does not claim a ban. The seller policy still changes. Open the page with the effective date.";
    if (flags.ontario && !flags.conflict) return "This talks about an Ontario tenancy and does not claim a damage deposit. The sections are below. Read them before you rely on a paragraph.";
    if (flags.mostlySound) return "This is ordinary caution, and it names a source. Open the source. Nothing in the wording is pushing a sale.";
    if (domain.id !== "general") return "Separate the sentence that informs you from the sentence that hurries you. Anything with a number still needs a page you can open.";
    return "Read each sentence on its own. Keep the ones that name a source. Ask about the ones that only sound sure.";
}

function detectDomain(text) {
    let best = { id: "general", label: "General", score: 0 };
    for (const domain of DOMAINS) {
        const score = domain.terms.reduce((sum, term) => sum + (term.test(text) ? 1 : 0), 0);
        if (score > best.score) best = { id: domain.id, label: domain.label, score };
    }
    return { id: best.id, label: best.label };
}

function isSpecific(text) {
    return /\d|\$|%|\b(study|studies|law|policy|section|4k|pixels?)\b/i.test(text);
}

function hasSource(text) {
    return /https?:\/\/\S+/i.test(text) || /\b(according to|as reported by|source:)\b/i.test(text) || /\b(Statistics Canada|Statistique Canada|Bureau of Labor Statistics|Profeco|World Health Organization|Health Canada|Residential Tenancies Act|Seller Policy)\b/i.test(text);
}

function isPlainSound(text) {
    if (/\b(do not|don['’]t|never) see a doctor\b/i.test(text)) return false;
    if (/\b(cure|cures|detox|guaranteed|act now)\b/i.test(text)) return false;
    return /\bwash your hands\b/i.test(text) || /\bsee (a|your) (doctor|pharmacist|clinician)\b/i.test(text) || /\bget it in writing\b/i.test(text) || /\bread (the|your) (lease|policy|contract)\b/i.test(text);
}

function isThinEnglish(text) {
    const letters = (text.match(/[A-Za-z]/g) || []).length;
    const other = (text.match(/[^\s\dA-Za-z.,;:'"!?$%()[\]\-–—/]/g) || []).length;
    return other > 12 && other > letters * 0.4;
}

function noticeFor(clipped, thinEnglish) {
    const parts = [];
    if (clipped) parts.push("Only the first 12,000 characters were read.");
    if (thinEnglish) parts.push("These patterns read English. A paste in another script gets a thin pass.");
    return parts.length ? parts.join(" ") : null;
}

function splitSentences(paragraph) {
    const protectedText = paragraph
        .replace(/(\d)\.(\d)/g, "$1∯$2")
        .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|No|vs|etc)\./gi, (match) => match.replace(".", "∯"))
        .replace(/\b(e\.g|i\.e)\./gi, (match) => match.replace(/\./g, "∯"))
        .replace(/\bs\./g, "s∯")
        .replace(/\b([A-Z])\./g, (match) => match.replace(".", "∯"));
    const parts = protectedText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    return parts.map((part) => part.replace(/∯/g, ".").trim()).filter(Boolean);
}

function positively(text, pattern) {
    if (!pattern.test(text)) return false;
    const negated = new RegExp("\\b(not|no|isn['’]t|aren['’]t|never)\\s+(?:a\\s+|an\\s+)?" + pattern.source, "i");
    return !negated.test(text);
}

function raise(current, next) {
    return RANK[next] > RANK[current] ? next : current;
}

function unique(list) {
    const seen = new Set();
    const out = [];
    for (const item of list) {
        const clean = (item || "").trim();
        if (!clean || seen.has(clean)) continue;
        seen.add(clean);
        out.push(clean);
    }
    return out;
}

function clip(text, max) {
    const limit = max || 240;
    const flat = text.replace(/\s+/g, " ").trim();
    if (flat.length <= limit) return flat;
    return flat.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…";
}

function ensureQuestion(question) {
    const trimmed = question.trim();
    return trimmed.endsWith("?") ? trimmed : trimmed + "?";
}
