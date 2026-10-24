function pedidoDigits(value) {
    return String(value || "").replace(/\D/g, "").replace(/^00/, "");
}

function pedidoNormalizePhone(value) {
    var digits = pedidoDigits(value);
    if (digits.length === 10) digits = "52" + digits;
    return digits;
}

function pedidoPhoneOk(digits) {
    return digits.length >= 11 && digits.length <= 15;
}

function pedidoLineKey(itemId, onion, salsa) {
    return itemId + "|" + (onion || "") + "|" + (salsa || "");
}

function pedidoBuildMessage(options) {
    var lines = [String(options.shop || "").toUpperCase()];
    var who = [options.service, options.name].filter(function (part) {
        return part;
    }).join(" · ");
    if (who) lines.push(who);
    if (options.note) lines.push(options.note);
    lines.push("");
    (options.lines || []).forEach(function (line) {
        lines.push(line.qty + "  " + line.name);
        if (line.onion) lines.push("— " + line.onion);
        if (line.salsa) lines.push("— " + line.salsa);
        lines.push("");
    });
    lines.push(options.totalLabel + ": $" + options.total + " " + options.currency);
    return lines.join("\n");
}

function pedidoGaps(options) {
    var gaps = [];
    (options.lines || []).forEach(function (line) {
        if (!line.asks) return;
        if (!line.onion) gaps.push({ kind: "onion", name: line.name, key: line.key || "" });
        if (!line.salsa) gaps.push({ kind: "salsa", name: line.name, key: line.key || "" });
    });
    if (!options.service) gaps.push({ kind: "service" });
    if (!options.name) gaps.push({ kind: "name" });
    return gaps;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        pedidoDigits: pedidoDigits,
        pedidoNormalizePhone: pedidoNormalizePhone,
        pedidoPhoneOk: pedidoPhoneOk,
        pedidoLineKey: pedidoLineKey,
        pedidoBuildMessage: pedidoBuildMessage,
        pedidoGaps: pedidoGaps
    };
}
