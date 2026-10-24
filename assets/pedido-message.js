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

function pedidoLineKey(itemId, mods) {
    return itemId + "|" + mods.slice().sort().join(",");
}

function pedidoBuildMessage(options) {
    var lines = [options.title, ""];
    options.lines.forEach(function (line) {
        var row = line.qty + " " + line.name;
        if (line.mods.length) row += " (" + line.mods.join(", ") + ")";
        lines.push(row);
    });
    lines.push("", options.totalLabel + ": $" + options.total + " " + options.currency);
    if (options.name) lines.push(options.name);
    if (options.note) lines.push(options.note);
    return lines.join("\n");
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        pedidoDigits: pedidoDigits,
        pedidoNormalizePhone: pedidoNormalizePhone,
        pedidoPhoneOk: pedidoPhoneOk,
        pedidoLineKey: pedidoLineKey,
        pedidoBuildMessage: pedidoBuildMessage
    };
}
