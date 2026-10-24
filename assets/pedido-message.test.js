var assert = require("assert");
var pedido = require("./pedido-message.js");

assert.strictEqual(pedido.pedidoNormalizePhone("55 1234 5678"), "525512345678");
assert.strictEqual(pedido.pedidoNormalizePhone("+52 55 1234 5678"), "525512345678");
assert.strictEqual(pedido.pedidoNormalizePhone("5215512345678"), "5215512345678");
assert.strictEqual(pedido.pedidoPhoneOk("525512345678"), true);
assert.strictEqual(pedido.pedidoPhoneOk("5512345678"), false);
assert.strictEqual(pedido.pedidoPhoneOk(""), false);
assert.strictEqual(pedido.pedidoLineKey("pastor", "", ""), "pastor||");
assert.strictEqual(pedido.pedidoLineKey("pastor", "con-todo", "verde"), "pastor|con-todo|verde");

var message = pedido.pedidoBuildMessage({
    shop: "Taquería La Esquina",
    service: "Para llevar",
    name: "Ana",
    note: "",
    lines: [
        { qty: 2, name: "Taco al pastor", onion: "con todo", salsa: "salsa verde" },
        { qty: 1, name: "Agua de horchata", onion: "", salsa: "" }
    ],
    total: 64,
    totalLabel: "Total",
    currency: "MXN"
});

assert.strictEqual(message, [
    "TAQUERÍA LA ESQUINA",
    "Para llevar · Ana",
    "",
    "2  Taco al pastor",
    "— con todo",
    "— salsa verde",
    "",
    "1  Agua de horchata",
    "",
    "Total: $64 MXN"
].join("\n"));

var withNote = pedido.pedidoBuildMessage({
    shop: "Taquería La Esquina",
    service: "Para aquí",
    name: "Luis",
    note: "Sin hielo",
    lines: [{ qty: 1, name: "Agua de jamaica", onion: "", salsa: "" }],
    total: 20,
    totalLabel: "Total",
    currency: "MXN"
});
assert.strictEqual(withNote, [
    "TAQUERÍA LA ESQUINA",
    "Para aquí · Luis",
    "Sin hielo",
    "",
    "1  Agua de jamaica",
    "",
    "Total: $20 MXN"
].join("\n"));

var open = pedido.pedidoGaps({
    name: "",
    service: "",
    lines: [{ key: "pastor||", name: "Taco al pastor", asks: true, onion: "", salsa: "" }]
});
assert.deepStrictEqual(open.map(function (gap) { return gap.kind; }), ["onion", "salsa", "service", "name"]);
assert.strictEqual(open[0].name, "Taco al pastor");

var drinkOnly = pedido.pedidoGaps({
    name: "Ana",
    service: "Para llevar",
    lines: [{ name: "Agua de horchata", asks: false, onion: "", salsa: "" }]
});
assert.deepStrictEqual(drinkOnly, []);

var half = pedido.pedidoGaps({
    name: "Ana",
    service: "Para llevar",
    lines: [{ key: "pastor|con-todo|", name: "Taco al pastor", asks: true, onion: "con-todo", salsa: "" }]
});
assert.deepStrictEqual(half.map(function (gap) { return gap.kind; }), ["salsa"]);

console.log("pedido-message ok");
