var MENU = [
    { id: "pastor", group: "tacos", asks: true, price: 22, es: "Taco al pastor", en: "Al pastor taco", fr: "Taco al pastor" },
    { id: "suadero", group: "tacos", asks: true, price: 22, es: "Taco de suadero", en: "Suadero taco", fr: "Taco de suadero" },
    { id: "bistec", group: "tacos", asks: true, price: 24, es: "Taco de bistec", en: "Steak taco", fr: "Taco de bistec" },
    { id: "quesadilla", group: "tacos", asks: true, price: 36, es: "Quesadilla", en: "Quesadilla", fr: "Quesadilla" },
    { id: "gringa", group: "tacos", asks: true, price: 42, es: "Gringa", en: "Gringa", fr: "Gringa" },
    { id: "horchata", group: "drinks", asks: false, price: 20, es: "Agua de horchata", en: "Horchata", fr: "Agua de horchata" },
    { id: "jamaica", group: "drinks", asks: false, price: 20, es: "Agua de jamaica", en: "Jamaica water", fr: "Agua de jamaica" },
    { id: "cebollitas", group: "sides", asks: false, price: 18, es: "Cebollitas", en: "Grilled onions", fr: "Oignons grillés" }
];

var ONION = [
    { id: "con-todo", es: "con todo", en: "onion and cilantro", fr: "oignon et coriandre" },
    { id: "sin-cebolla", es: "sin cebolla", en: "no onion", fr: "sans oignon" },
    { id: "sin-cilantro", es: "sin cilantro", en: "no cilantro", fr: "sans coriandre" },
    { id: "sin-nada", es: "sin nada", en: "plain", fr: "nature" }
];

var SALSA = [
    { id: "verde", es: "salsa verde", en: "green salsa", fr: "sauce verte" },
    { id: "roja", es: "salsa roja", en: "red salsa", fr: "sauce rouge" },
    { id: "ambas", es: "verde y roja", en: "both salsas", fr: "les deux sauces" },
    { id: "sin", es: "sin salsa", en: "no salsa", fr: "sans sauce" },
    { id: "aparte", es: "salsas aparte", en: "salsa on the side", fr: "sauces à part" }
];

var SERVICE = [
    { id: "llevar", es: "Para llevar", en: "To go", fr: "À emporter" },
    { id: "aqui", es: "Para aquí", en: "For here", fr: "Sur place" }
];

var GROUPS = {
    es: { tacos: "Tacos", drinks: "Para tomar", sides: "Aparte" },
    en: { tacos: "Tacos", drinks: "To drink", sides: "On the side" },
    fr: { tacos: "Tacos", drinks: "À boire", sides: "À côté" }
};

var COPY = {
    es: {
        htmlLang: "es-MX",
        title: "Taquería La Esquina — ticket para la cocina",
        kicker: "Menú de ejemplo",
        kickerCustomer: "Pide aquí",
        shop: "Taquería La Esquina",
        lede: "El enlace es de la tienda. El pedido no sale hasta que el ticket está completo.",
        ledeCustomer: "Contesta lo de siempre. WhatsApp se abre con el ticket para la cocina.",
        sample: "Los precios son un ejemplo. No son de una tienda real.",
        setupLabel: "WhatsApp de la tienda",
        setupHelp: "Pon un número que controles, con clave de país. Diez dígitos de México se completan con 52. Quien abre el enlace ya no ve esta casilla.",
        copyLink: "Copiar enlace de la tienda",
        copied: "Enlace copiado",
        yourOrder: "Para la cocina",
        ticketNote: "El mensaje sale en español.",
        empty: "Agrega algo del menú.",
        onion: "Cebolla y cilantro",
        salsa: "Salsa",
        service: "¿Para aquí o para llevar?",
        name: "Nombre para el pedido",
        note: "Nota, si hace falta",
        namePh: "Ana",
        notePh: "Sin hielo",
        preview: "Así lo lee la cocina",
        send: "Enviar por WhatsApp",
        copyTicket: "Copiar ticket",
        ticketCopied: "Ticket copiado",
        needPhone: "Falta el WhatsApp de la tienda.",
        needItems: "Agrega algo del menú.",
        needOnion: "Falta cebolla y cilantro en ",
        needSalsa: "Falta la salsa en ",
        needService: "Falta para aquí o para llevar.",
        needName: "Falta el nombre.",
        clear: "Vaciar",
        add: "Agregar",
        less: "Menos",
        more: "Más",
        totalLabel: "Total",
        back: "Budget Floor"
    },
    en: {
        htmlLang: "en",
        title: "Taquería La Esquina — kitchen ticket",
        kicker: "Sample menu",
        kickerCustomer: "Order here",
        shop: "Taquería La Esquina",
        lede: "The link belongs to the shop. Nothing sends until the ticket is complete.",
        ledeCustomer: "Answer the usual questions. WhatsApp opens with the ticket the kitchen reads.",
        sample: "The prices are an example. They are not from a real shop.",
        setupLabel: "Shop WhatsApp",
        setupHelp: "Use a number you control, with the country code. Ten Mexican digits get a 52 in front. Someone who opens the link does not see this box.",
        copyLink: "Copy the shop link",
        copied: "Link copied",
        yourOrder: "For the kitchen",
        ticketNote: "The message goes out in Spanish.",
        empty: "Add something from the menu.",
        onion: "Onion and cilantro",
        salsa: "Salsa",
        service: "For here or to go?",
        name: "Name for the order",
        note: "Note, if you need one",
        namePh: "Ana",
        notePh: "No ice",
        preview: "What the kitchen reads",
        send: "Send on WhatsApp",
        copyTicket: "Copy ticket",
        ticketCopied: "Ticket copied",
        needPhone: "The shop WhatsApp is missing.",
        needItems: "Add something from the menu.",
        needOnion: "Onion and cilantro are missing on ",
        needSalsa: "Salsa is missing on ",
        needService: "For here or to go is missing.",
        needName: "The name is missing.",
        clear: "Clear",
        add: "Add",
        less: "Less",
        more: "More",
        totalLabel: "Total",
        back: "Budget Floor"
    },
    fr: {
        htmlLang: "fr",
        title: "Taquería La Esquina — ticket pour la cuisine",
        kicker: "Menu d'exemple",
        kickerCustomer: "Commander ici",
        shop: "Taquería La Esquina",
        lede: "Le lien est celui de la taquería. Rien ne part tant que le ticket n'est pas complet.",
        ledeCustomer: "Réponds aux questions habituelles. WhatsApp s'ouvre avec le ticket que lit la cuisine.",
        sample: "Les prix sont un exemple. Ils ne viennent pas d'une vraie taquería.",
        setupLabel: "WhatsApp de la taquería",
        setupHelp: "Mets un numéro que tu contrôles, avec l'indicatif. Dix chiffres du Mexique reçoivent un 52 devant. Qui ouvre le lien ne voit plus cette case.",
        copyLink: "Copier le lien de la taquería",
        copied: "Lien copié",
        yourOrder: "Pour la cuisine",
        ticketNote: "Le message part en espagnol.",
        empty: "Ajoute quelque chose du menu.",
        onion: "Oignon et coriandre",
        salsa: "Sauce",
        service: "Sur place ou à emporter ?",
        name: "Nom pour la commande",
        note: "Note, s'il en faut une",
        namePh: "Ana",
        notePh: "Sans glace",
        preview: "Ce que lit la cuisine",
        send: "Envoyer sur WhatsApp",
        copyTicket: "Copier le ticket",
        ticketCopied: "Ticket copié",
        needPhone: "Le WhatsApp de la taquería manque.",
        needItems: "Ajoute quelque chose du menu.",
        needOnion: "Oignon et coriandre manquent pour ",
        needSalsa: "La sauce manque pour ",
        needService: "Sur place ou à emporter manque.",
        needName: "Le nom manque.",
        clear: "Vider",
        add: "Ajouter",
        less: "Moins",
        more: "Plus",
        totalLabel: "Total",
        back: "Budget Floor"
    }
};

var lang = "es";
var lines = [];
var service = "";
var phoneRaw = "";
var openedWithTel = false;

function optionById(list, id) {
    return list.filter(function (option) { return option.id === id; })[0];
}

function itemById(id) {
    return optionById(MENU, id);
}

function findLine(key) {
    for (var i = 0; i < lines.length; i += 1) {
        if (pedidoLineKey(lines[i].itemId, lines[i].onion, lines[i].salsa) === key) return lines[i];
    }
    return null;
}

function gapInput() {
    return {
        name: document.getElementById("guest").value.trim(),
        service: service ? optionById(SERVICE, service).es : "",
        lines: lines.map(function (line) {
            var item = itemById(line.itemId);
            return {
                key: pedidoLineKey(line.itemId, line.onion, line.salsa),
                name: item[lang],
                asks: item.asks,
                onion: line.onion || "",
                salsa: line.salsa || ""
            };
        })
    };
}

function blocker() {
    if (!lines.length) return { kind: "items" };
    var gaps = pedidoGaps(gapInput());
    if (gaps.length) return gaps[0];
    var phone = pedidoNormalizePhone(phoneRaw);
    if (!pedidoPhoneOk(phone)) return { kind: "phone" };
    return null;
}

function contentReady() {
    return lines.length > 0 && pedidoGaps(gapInput()).length === 0;
}

function orderTotal() {
    return lines.reduce(function (sum, line) {
        return sum + itemById(line.itemId).price * line.qty;
    }, 0);
}

function ticketMessage() {
    return pedidoBuildMessage({
        shop: "Taquería La Esquina",
        service: service ? optionById(SERVICE, service).es : "",
        name: document.getElementById("guest").value.trim(),
        note: document.getElementById("note").value.trim(),
        lines: lines.map(function (line) {
            var item = itemById(line.itemId);
            return {
                qty: line.qty,
                name: item.es,
                onion: line.onion ? optionById(ONION, line.onion).es : "",
                salsa: line.salsa ? optionById(SALSA, line.salsa).es : ""
            };
        }),
        total: orderTotal(),
        totalLabel: "Total",
        currency: "MXN"
    });
}

function hintFor(gap) {
    var copy = COPY[lang];
    if (!gap) return "";
    if (gap.kind === "phone") return copy.needPhone;
    if (gap.kind === "items") return copy.needItems;
    if (gap.kind === "onion") return copy.needOnion + gap.name + ".";
    if (gap.kind === "salsa") return copy.needSalsa + gap.name + ".";
    if (gap.kind === "service") return copy.needService;
    return copy.needName;
}

function addItem(itemId) {
    var item = itemById(itemId);
    var existing = findLine(pedidoLineKey(itemId, "", ""));
    if (existing) existing.qty += 1;
    else lines.push({ itemId: itemId, qty: 1, onion: "", salsa: "" });
    render();
    if (item.asks && window.matchMedia("(max-width: 899px)").matches) {
        document.getElementById("ticket").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function changeQty(key, delta) {
    var line = findLine(key);
    if (!line) return;
    line.qty += delta;
    if (line.qty < 1) lines = lines.filter(function (entry) { return entry !== line; });
    render();
}

function setAnswer(key, field, value) {
    var line = findLine(key);
    if (!line) return;
    if (line[field] === value) return;
    var onion = field === "onion" ? value : line.onion;
    var salsa = field === "salsa" ? value : line.salsa;
    var clash = findLine(pedidoLineKey(line.itemId, onion, salsa));
    if (clash && clash !== line) {
        clash.qty += line.qty;
        lines = lines.filter(function (entry) { return entry !== line; });
    } else {
        line.onion = onion;
        line.salsa = salsa;
    }
    render();
}

function choiceRow(labelText, answer, key, selected, choices) {
    var wrap = document.createElement("div");
    wrap.className = "line-ask";
    var label = document.createElement("p");
    label.className = "ask-label";
    label.textContent = labelText;
    var row = document.createElement("div");
    row.className = "choices";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", labelText);
    choices.forEach(function (option) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.dataset.answer = answer;
        button.dataset.value = option.id;
        button.dataset.line = key;
        button.setAttribute("aria-pressed", selected === option.id ? "true" : "false");
        button.textContent = option[lang];
        row.appendChild(button);
    });
    wrap.append(label, row);
    return wrap;
}

function renderMenu() {
    var copy = COPY[lang];
    var root = document.getElementById("menu");
    root.replaceChildren();
    ["tacos", "drinks", "sides"].forEach(function (group) {
        var heading = document.createElement("h2");
        heading.textContent = GROUPS[lang][group];
        root.appendChild(heading);
        MENU.filter(function (item) { return item.group === group; }).forEach(function (item) {
            var row = document.createElement("div");
            row.className = "taco";
            var name = document.createElement("span");
            name.className = "taco-name";
            name.textContent = item[lang];
            var price = document.createElement("span");
            price.className = "taco-price";
            price.textContent = "$" + item.price;
            var button = document.createElement("button");
            button.type = "button";
            button.className = "taco-add";
            button.dataset.add = item.id;
            button.setAttribute("aria-label", copy.add + " " + item[lang]);
            button.textContent = "+";
            row.append(name, price, button);
            root.appendChild(row);
        });
    });
}

function renderLines(gap) {
    var copy = COPY[lang];
    var list = document.getElementById("lines");
    list.replaceChildren();
    if (!lines.length) {
        var empty = document.createElement("li");
        empty.className = "ticket-empty";
        empty.textContent = copy.empty;
        list.appendChild(empty);
        return;
    }
    lines.forEach(function (line) {
        var key = pedidoLineKey(line.itemId, line.onion, line.salsa);
        var item = itemById(line.itemId);
        var li = document.createElement("li");
        li.className = "ticket-line";
        var top = document.createElement("div");
        top.className = "ticket-top";
        var name = document.createElement("span");
        name.textContent = line.qty + "  " + item[lang];
        var price = document.createElement("span");
        price.textContent = "$" + (item.price * line.qty);
        var less = document.createElement("button");
        less.type = "button";
        less.dataset.qty = key;
        less.dataset.delta = "-1";
        less.setAttribute("aria-label", copy.less + " " + item[lang]);
        less.textContent = "−";
        var more = document.createElement("button");
        more.type = "button";
        more.dataset.qty = key;
        more.dataset.delta = "1";
        more.setAttribute("aria-label", copy.more + " " + item[lang]);
        more.textContent = "+";
        top.append(less, name, more, price);
        li.appendChild(top);
        if (item.asks) {
            var onionAsk = choiceRow(copy.onion, "onion", key, line.onion, ONION);
            var salsaAsk = choiceRow(copy.salsa, "salsa", key, line.salsa, SALSA);
            if (gap && gap.key === key && gap.kind === "onion") onionAsk.dataset.gap = "true";
            if (gap && gap.key === key && gap.kind === "salsa") salsaAsk.dataset.gap = "true";
            li.append(onionAsk, salsaAsk);
        }
        list.appendChild(li);
    });
}

function renderService(gap) {
    var copy = COPY[lang];
    var root = document.getElementById("service-ask");
    root.replaceChildren();
    if (gap && gap.kind === "service") root.dataset.gap = "true";
    else delete root.dataset.gap;
    var label = document.createElement("p");
    label.className = "ask-label";
    label.id = "service-label";
    label.textContent = copy.service;
    var choices = document.createElement("div");
    choices.className = "choices";
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-labelledby", "service-label");
    SERVICE.forEach(function (option) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "choice";
        button.dataset.service = option.id;
        button.setAttribute("aria-pressed", service === option.id ? "true" : "false");
        button.textContent = option[lang];
        choices.appendChild(button);
    });
    root.append(label, choices);
}

function render() {
    var copy = COPY[lang];
    var phone = pedidoNormalizePhone(phoneRaw);
    var readyPhone = pedidoPhoneOk(phone);
    var readyTicket = contentReady();
    var gap = blocker();
    var questionGap = gap && gap.kind !== "phone" && gap.kind !== "items" ? gap : null;
    document.body.classList.toggle("is-customer", openedWithTel);
    document.documentElement.lang = copy.htmlLang;
    document.title = copy.title;
    document.getElementById("back-home").hidden = openedWithTel;
    document.getElementById("back-home").textContent = copy.back;
    var shopBrand = document.getElementById("shop-brand");
    shopBrand.hidden = !openedWithTel;
    shopBrand.textContent = copy.shop;
    document.getElementById("kicker").textContent = openedWithTel ? copy.kickerCustomer : copy.kicker;
    document.getElementById("shop-name").textContent = copy.shop;
    document.getElementById("lede").textContent = openedWithTel ? copy.ledeCustomer : copy.lede;
    document.getElementById("sample").textContent = copy.sample;
    document.getElementById("setup-label").textContent = copy.setupLabel;
    document.getElementById("setup-help").textContent = copy.setupHelp;
    var copyLink = document.getElementById("copy-link");
    copyLink.textContent = copyLink.dataset.state === "copied" ? copy.copied : copy.copyLink;
    document.getElementById("ticket-heading").textContent = copy.yourOrder;
    document.getElementById("ticket-kicker").textContent = copy.ticketNote;
    document.getElementById("name-label").textContent = copy.name;
    document.getElementById("note-label").textContent = copy.note;
    document.getElementById("guest").placeholder = copy.namePh;
    document.getElementById("note").placeholder = copy.notePh;
    document.getElementById("clear-order").textContent = copy.clear;
    document.querySelectorAll("#languages button").forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.lang === lang ? "true" : "false");
    });
    renderMenu();
    renderLines(questionGap);
    renderService(questionGap);
    var nameAsk = document.getElementById("name-ask");
    if (questionGap && questionGap.kind === "name") nameAsk.dataset.gap = "true";
    else delete nameAsk.dataset.gap;
    document.getElementById("guest").setAttribute("aria-invalid", questionGap && questionGap.kind === "name" ? "true" : "false");
    var total = orderTotal();
    document.getElementById("total").textContent = copy.totalLabel + " $" + total + " MXN";
    var preview = document.getElementById("preview");
    var previewLabel = document.getElementById("preview-label");
    previewLabel.textContent = copy.preview;
    preview.textContent = readyTicket ? ticketMessage() : "";
    preview.hidden = !readyTicket;
    previewLabel.hidden = !readyTicket;
    var send = document.getElementById("send");
    send.textContent = copy.send;
    var copyTicket = document.getElementById("copy-ticket");
    copyTicket.textContent = copyTicket.dataset.state === "copied" ? copy.ticketCopied : copy.copyTicket;
    copyTicket.setAttribute("aria-disabled", readyTicket ? "false" : "true");
    document.getElementById("hint").textContent = hintFor(gap);
    if (readyPhone && readyTicket) {
        send.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(ticketMessage());
        send.setAttribute("aria-disabled", "false");
    } else {
        send.href = "#pedido";
        send.setAttribute("aria-disabled", "true");
    }
    var params = new URLSearchParams();
    params.set("lang", lang);
    if (openedWithTel && readyPhone) params.set("tel", phone);
    var next = location.pathname + "?" + params.toString();
    if (next !== location.pathname + location.search) history.replaceState(null, "", next);
}

function focusGap(gap) {
    if (!gap) return;
    if (gap.kind === "phone" && !openedWithTel) {
        document.getElementById("phone").focus();
        return;
    }
    if (gap.kind === "items") {
        var add = document.querySelector("#menu button[data-add]");
        if (add) add.focus();
        return;
    }
    if (gap.kind === "onion" || gap.kind === "salsa") {
        var button = document.querySelector('.choice[data-answer="' + gap.kind + '"][data-line="' + gap.key + '"]');
        if (button) button.focus();
        return;
    }
    if (gap.kind === "service") {
        var serviceButton = document.querySelector("#service-ask button");
        if (serviceButton) serviceButton.focus();
        return;
    }
    document.getElementById("guest").focus();
}

function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(value);
    }
    return new Promise(function (resolve, reject) {
        try {
            var area = document.createElement("textarea");
            area.value = value;
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

function flash(button, state, label) {
    button.dataset.state = state;
    button.textContent = label;
    window.setTimeout(function () {
        button.dataset.state = "";
        render();
    }, 1600);
}

function boot() {
    var params = new URLSearchParams(location.search);
    var langQ = (params.get("lang") || "").toLowerCase();
    if (COPY[langQ]) lang = langQ;
    var tel = params.get("tel") || "";
    if (tel && pedidoPhoneOk(pedidoNormalizePhone(tel))) {
        openedWithTel = true;
        phoneRaw = tel;
    } else if (tel) {
        phoneRaw = tel;
    } else {
        try { phoneRaw = localStorage.getItem("bf-pedido-tel") || ""; } catch (error) {}
    }
    document.getElementById("phone").value = phoneRaw;
    render();
}

document.getElementById("languages").addEventListener("click", function (event) {
    var button = event.target.closest("button[data-lang]");
    if (!button) return;
    lang = button.dataset.lang;
    render();
});

document.getElementById("phone").addEventListener("input", function (event) {
    phoneRaw = event.target.value;
    try { localStorage.setItem("bf-pedido-tel", phoneRaw); } catch (error) {}
    render();
});

document.getElementById("guest").addEventListener("input", render);
document.getElementById("note").addEventListener("input", render);

document.getElementById("menu").addEventListener("click", function (event) {
    var button = event.target.closest("button[data-add]");
    if (!button) return;
    addItem(button.dataset.add);
});

document.getElementById("ticket").addEventListener("click", function (event) {
    var serviceButton = event.target.closest("button[data-service]");
    if (serviceButton) {
        service = serviceButton.dataset.service;
        render();
        return;
    }
    var qty = event.target.closest("button[data-qty]");
    if (qty) {
        changeQty(qty.dataset.qty, Number(qty.dataset.delta));
        return;
    }
    var answer = event.target.closest("button[data-answer]");
    if (answer) setAnswer(answer.dataset.line, answer.dataset.answer, answer.dataset.value);
});

document.getElementById("clear-order").addEventListener("click", function () {
    lines = [];
    service = "";
    document.getElementById("guest").value = "";
    document.getElementById("note").value = "";
    render();
});

document.getElementById("send").addEventListener("click", function (event) {
    var gap = blocker();
    if (gap) {
        event.preventDefault();
        focusGap(gap);
    }
});

document.getElementById("copy-link").addEventListener("click", function () {
    var button = document.getElementById("copy-link");
    var phone = pedidoNormalizePhone(phoneRaw);
    if (!pedidoPhoneOk(phone)) {
        document.getElementById("phone").focus();
        return;
    }
    var url = new URL("/pedido/", location.origin);
    url.searchParams.set("lang", lang);
    url.searchParams.set("tel", phone);
    copyText(url.toString()).then(function () {
        flash(button, "copied", COPY[lang].copied);
    });
});

document.getElementById("copy-ticket").addEventListener("click", function () {
    var button = document.getElementById("copy-ticket");
    if (!contentReady()) {
        focusGap(blocker());
        return;
    }
    copyText(ticketMessage()).then(function () {
        flash(button, "copied", COPY[lang].ticketCopied);
    });
});

boot();
