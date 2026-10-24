var MENU = [
    { id: "pastor", group: "tacos", price: 22, es: "Taco al pastor", en: "Al pastor taco", fr: "Taco al pastor" },
    { id: "suadero", group: "tacos", price: 22, es: "Taco de suadero", en: "Suadero taco", fr: "Taco de suadero" },
    { id: "bistec", group: "tacos", price: 24, es: "Taco de bistec", en: "Steak taco", fr: "Taco de bistec" },
    { id: "quesadilla", group: "tacos", price: 36, es: "Quesadilla", en: "Quesadilla", fr: "Quesadilla" },
    { id: "gringa", group: "tacos", price: 42, es: "Gringa", en: "Gringa", fr: "Gringa" },
    { id: "horchata", group: "drinks", price: 20, es: "Agua de horchata", en: "Horchata", fr: "Agua de horchata" },
    { id: "jamaica", group: "drinks", price: 20, es: "Agua de jamaica", en: "Jamaica water", fr: "Agua de jamaica" },
    { id: "cebollitas", group: "sides", price: 18, es: "Cebollitas", en: "Grilled onions", fr: "Oignons grillés" }
];

var MODS = [
    { id: "sin-cebolla", es: "sin cebolla", en: "no onion", fr: "sans oignon" },
    { id: "sin-cilantro", es: "sin cilantro", en: "no cilantro", fr: "sans coriandre" },
    { id: "verde", es: "salsa verde", en: "green salsa", fr: "sauce verte" },
    { id: "roja", es: "salsa roja", en: "red salsa", fr: "sauce rouge" }
];

var GROUPS = {
    es: { tacos: "Tacos", drinks: "Para tomar", sides: "Aparte" },
    en: { tacos: "Tacos", drinks: "To drink", sides: "On the side" },
    fr: { tacos: "Tacos", drinks: "À boire", sides: "À côté" }
};

var COPY = {
    es: {
        htmlLang: "es-MX",
        title: "Taquería La Esquina — arma el pedido",
        kicker: "Menú de ejemplo",
        shop: "Taquería La Esquina",
        lede: "Elige la comida. WhatsApp se abre con el pedido ya escrito.",
        sample: "Los precios son un ejemplo. No son de una tienda real.",
        setupLabel: "WhatsApp de la tienda",
        setupHelp: "Pon un número que controles, con clave de país. Diez dígitos de México se completan con 52.",
        copyLink: "Copiar enlace de la tienda",
        copied: "Enlace copiado",
        yourOrder: "Tu pedido",
        empty: "Todavía no hay nada.",
        name: "Nombre",
        note: "Nota",
        namePh: "Ana",
        notePh: "Para llevar",
        send: "Enviar por WhatsApp",
        needPhone: "Falta el WhatsApp de la tienda.",
        needItems: "Agrega algo del menú.",
        clear: "Vaciar",
        add: "Agregar",
        less: "Menos",
        more: "Más",
        messageTitle: "Pedido — Taquería La Esquina",
        totalLabel: "Total",
        back: "Budget Floor"
    },
    en: {
        htmlLang: "en",
        title: "Taquería La Esquina — build the order",
        kicker: "Sample menu",
        shop: "Taquería La Esquina",
        lede: "Pick the food. WhatsApp opens with the order already written.",
        sample: "The prices are an example. They are not from a real shop.",
        setupLabel: "Shop WhatsApp",
        setupHelp: "Use a number you control, with the country code. Ten Mexican digits get a 52 in front.",
        copyLink: "Copy the shop link",
        copied: "Link copied",
        yourOrder: "Your order",
        empty: "Nothing here yet.",
        name: "Name",
        note: "Note",
        namePh: "Ana",
        notePh: "To go",
        send: "Send on WhatsApp",
        needPhone: "The shop WhatsApp is missing.",
        needItems: "Add something from the menu.",
        clear: "Clear",
        add: "Add",
        less: "Less",
        more: "More",
        messageTitle: "Order — Taquería La Esquina",
        totalLabel: "Total",
        back: "Budget Floor"
    },
    fr: {
        htmlLang: "fr",
        title: "Taquería La Esquina — compose la commande",
        kicker: "Menu d'exemple",
        shop: "Taquería La Esquina",
        lede: "Choisis les plats. WhatsApp s'ouvre avec la commande déjà écrite.",
        sample: "Les prix sont un exemple. Ils ne viennent pas d'une vraie taquería.",
        setupLabel: "WhatsApp de la taquería",
        setupHelp: "Mets un numéro que tu contrôles, avec l'indicatif. Dix chiffres du Mexique reçoivent un 52 devant.",
        copyLink: "Copier le lien de la taquería",
        copied: "Lien copié",
        yourOrder: "Ta commande",
        empty: "Rien pour l'instant.",
        name: "Nom",
        note: "Note",
        namePh: "Ana",
        notePh: "À emporter",
        send: "Envoyer sur WhatsApp",
        needPhone: "Le WhatsApp de la taquería manque.",
        needItems: "Ajoute quelque chose du menu.",
        clear: "Vider",
        add: "Ajouter",
        less: "Moins",
        more: "Plus",
        messageTitle: "Commande — Taquería La Esquina",
        totalLabel: "Total",
        back: "Budget Floor"
    }
};

var lang = "es";
var lines = [];
var phoneRaw = "";

function itemById(id) {
    return MENU.filter(function (item) { return item.id === id; })[0];
}

function modById(id) {
    return MODS.filter(function (mod) { return mod.id === id; })[0];
}

function findLine(key) {
    for (var i = 0; i < lines.length; i += 1) {
        if (pedidoLineKey(lines[i].itemId, lines[i].mods) === key) return lines[i];
    }
    return null;
}

function addItem(itemId) {
    var existing = findLine(pedidoLineKey(itemId, []));
    if (existing) existing.qty += 1;
    else lines.push({ itemId: itemId, qty: 1, mods: [] });
    render();
}

function changeQty(key, delta) {
    var line = findLine(key);
    if (!line) return;
    line.qty += delta;
    if (line.qty < 1) lines = lines.filter(function (entry) { return entry !== line; });
    render();
}

function toggleMod(key, modId) {
    var line = findLine(key);
    if (!line) return;
    var next = line.mods.filter(function (id) { return id !== modId; });
    if (next.length === line.mods.length) next.push(modId);
    next.sort();
    var clash = findLine(pedidoLineKey(line.itemId, next));
    if (clash && clash !== line) {
        clash.qty += line.qty;
        lines = lines.filter(function (entry) { return entry !== line; });
    } else {
        line.mods = next;
    }
    render();
}

function orderTotal() {
    return lines.reduce(function (sum, line) {
        return sum + itemById(line.itemId).price * line.qty;
    }, 0);
}

function namedLines() {
    return lines.map(function (line) {
        return {
            qty: line.qty,
            name: itemById(line.itemId)[lang],
            mods: line.mods.map(function (id) { return modById(id)[lang]; })
        };
    });
}

function currentMessage() {
    var copy = COPY[lang];
    return pedidoBuildMessage({
        title: copy.messageTitle,
        lines: namedLines(),
        total: orderTotal(),
        totalLabel: copy.totalLabel,
        currency: "MXN",
        name: document.getElementById("guest").value.trim(),
        note: document.getElementById("note").value.trim()
    });
}

function shopLink() {
    var phone = pedidoNormalizePhone(phoneRaw);
    var url = new URL("/pedido/", location.origin);
    url.searchParams.set("lang", lang);
    if (pedidoPhoneOk(phone)) url.searchParams.set("tel", phone);
    return url.toString();
}

function savePhone() {
    try { localStorage.setItem("bf-pedido-tel", phoneRaw); } catch (error) {}
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

function renderLines() {
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
        var key = pedidoLineKey(line.itemId, line.mods);
        var item = itemById(line.itemId);
        var li = document.createElement("li");
        li.className = "ticket-line";
        var top = document.createElement("div");
        top.className = "ticket-top";
        var name = document.createElement("span");
        name.textContent = line.qty + " " + item[lang];
        var price = document.createElement("span");
        price.textContent = "$" + (item.price * line.qty);
        var less = document.createElement("button");
        less.type = "button";
        less.dataset.qty = key;
        less.dataset.delta = "-1";
        less.setAttribute("aria-label", copy.less);
        less.textContent = "−";
        var more = document.createElement("button");
        more.type = "button";
        more.dataset.qty = key;
        more.dataset.delta = "1";
        more.setAttribute("aria-label", copy.more);
        more.textContent = "+";
        top.append(less, name, more, price);
        var mods = document.createElement("div");
        mods.className = "mods";
        if (item.group !== "tacos") {
            li.append(top);
            list.appendChild(li);
            return;
        }
        MODS.forEach(function (mod) {
            var chip = document.createElement("button");
            chip.type = "button";
            chip.className = "mod";
            chip.dataset.mod = mod.id;
            chip.dataset.line = key;
            if (line.mods.indexOf(mod.id) !== -1) chip.setAttribute("aria-pressed", "true");
            chip.textContent = mod[lang];
            mods.appendChild(chip);
        });
        li.append(top, mods);
        list.appendChild(li);
    });
}

function render() {
    var copy = COPY[lang];
    var phone = pedidoNormalizePhone(phoneRaw);
    var readyPhone = pedidoPhoneOk(phone);
    var readyItems = lines.length > 0;
    document.documentElement.lang = copy.htmlLang;
    document.title = copy.title;
    document.getElementById("kicker").textContent = copy.kicker;
    document.getElementById("shop-name").textContent = copy.shop;
    document.getElementById("lede").textContent = copy.lede;
    document.getElementById("sample").textContent = copy.sample;
    document.getElementById("setup-label").textContent = copy.setupLabel;
    document.getElementById("setup-help").textContent = copy.setupHelp;
    document.getElementById("copy-link").textContent = document.getElementById("copy-link").dataset.state === "copied" ? copy.copied : copy.copyLink;
    document.getElementById("ticket-heading").textContent = copy.yourOrder;
    document.getElementById("name-label").textContent = copy.name;
    document.getElementById("note-label").textContent = copy.note;
    document.getElementById("guest").placeholder = copy.namePh;
    document.getElementById("note").placeholder = copy.notePh;
    document.getElementById("clear-order").textContent = copy.clear;
    document.getElementById("back-home").textContent = copy.back;
    document.querySelectorAll("#languages button").forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.lang === lang ? "true" : "false");
    });
    renderMenu();
    renderLines();
    var total = orderTotal();
    document.getElementById("total").textContent = copy.totalLabel + " $" + total + " MXN";
    var preview = document.getElementById("preview");
    preview.textContent = readyItems ? currentMessage() : "";
    preview.hidden = !readyItems;
    var send = document.getElementById("send");
    send.textContent = copy.send;
    var hint = document.getElementById("hint");
    if (!readyPhone) hint.textContent = copy.needPhone;
    else if (!readyItems) hint.textContent = copy.needItems;
    else hint.textContent = "";
    if (readyPhone && readyItems) {
        send.href = "https://wa.me/" + phone + "?text=" + encodeURIComponent(currentMessage());
        send.setAttribute("aria-disabled", "false");
    } else {
        send.href = "#pedido";
        send.setAttribute("aria-disabled", "true");
    }
    var params = new URLSearchParams(location.search);
    params.set("lang", lang);
    if (readyPhone) params.set("tel", phone);
    else params.delete("tel");
    var next = location.pathname + "?" + params.toString();
    if (next !== location.pathname + location.search) history.replaceState(null, "", next);
}

function boot() {
    var params = new URLSearchParams(location.search);
    var langQ = (params.get("lang") || "").toLowerCase();
    if (COPY[langQ]) lang = langQ;
    var stored = "";
    try { stored = localStorage.getItem("bf-pedido-tel") || ""; } catch (error) {}
    phoneRaw = params.get("tel") || stored;
    document.getElementById("phone").value = phoneRaw;
    lines = [
        { itemId: "pastor", qty: 2, mods: ["sin-cebolla"] },
        { itemId: "horchata", qty: 1, mods: [] }
    ];
    document.getElementById("guest").value = "Ana";
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
    savePhone();
    render();
});

document.getElementById("guest").addEventListener("input", render);
document.getElementById("note").addEventListener("input", render);

document.getElementById("menu").addEventListener("click", function (event) {
    var button = event.target.closest("button[data-add]");
    if (!button) return;
    addItem(button.dataset.add);
});

document.getElementById("lines").addEventListener("click", function (event) {
    var qty = event.target.closest("button[data-qty]");
    if (qty) {
        changeQty(qty.dataset.qty, Number(qty.dataset.delta));
        return;
    }
    var mod = event.target.closest("button[data-mod]");
    if (mod) toggleMod(mod.dataset.line, mod.dataset.mod);
});

document.getElementById("clear-order").addEventListener("click", function () {
    lines = [];
    document.getElementById("guest").value = "";
    document.getElementById("note").value = "";
    render();
});

document.getElementById("send").addEventListener("click", function (event) {
    var phone = pedidoNormalizePhone(phoneRaw);
    if (!pedidoPhoneOk(phone) || !lines.length) {
        event.preventDefault();
        if (!pedidoPhoneOk(phone)) document.getElementById("phone").focus();
    }
});

document.getElementById("copy-link").addEventListener("click", async function () {
    var button = document.getElementById("copy-link");
    var phone = pedidoNormalizePhone(phoneRaw);
    if (!pedidoPhoneOk(phone)) {
        document.getElementById("phone").focus();
        return;
    }
    try {
        await navigator.clipboard.writeText(shopLink());
    } catch (error) {
        var area = document.createElement("textarea");
        area.value = shopLink();
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
    }
    button.dataset.state = "copied";
    button.textContent = COPY[lang].copied;
    window.setTimeout(function () {
        button.dataset.state = "";
        button.textContent = COPY[lang].copyLink;
    }, 1600);
});

boot();
