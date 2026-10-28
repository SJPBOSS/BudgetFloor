import { install } from "./host.mjs";

install();
window.MAIDEN_LOCAL = true;
await import("./client.js");
