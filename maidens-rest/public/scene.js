(function () {
  function hash(text) {
    let value = 2166136261;
    const source = String(text || "");
    for (let i = 0; i < source.length; i += 1) {
      value ^= source.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function rngOf(seed) {
    let a = seed >>> 0;
    return function rng() {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function paint(canvas, edition) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const shot = edition.shot || "morning";
    const rng = rngOf(hash(`${edition.week}|${edition.night}|${shot}|${edition.headline}`));
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, shot === "dawn" ? "#2a241c" : "#0c0b0a");
    sky.addColorStop(0.55, shot === "empty" ? "#120e0c" : "#1a1410");
    sky.addColorStop(1, "#070605");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(243,234,215,0.88)";
    ctx.beginPath();
    ctx.arc(w * 0.18, h * 0.14, Math.min(w, h) * 0.045, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shot === "dawn" ? "#2a241c" : "#0c0b0a";
    ctx.beginPath();
    ctx.arc(w * 0.20, h * 0.132, Math.min(w, h) * 0.038, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#090807";
    ctx.fillRect(0, h * 0.72, w, h * 0.28);

    const left = w * 0.22;
    const houseW = w * 0.56;
    const base = h * 0.74;
    const wallH = h * 0.34;
    ctx.fillStyle = "#16130f";
    ctx.beginPath();
    ctx.moveTo(left - w * 0.04, base - wallH);
    ctx.lineTo(left + houseW / 2, base - wallH - h * 0.12);
    ctx.lineTo(left + houseW + w * 0.04, base - wallH);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(left, base - wallH, houseW, wallH);
    ctx.strokeStyle = "rgba(243,234,215,0.28)";
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(left, base - wallH, houseW, wallH);

    const win = (x, y, lit, red) => {
      ctx.fillStyle = lit ? (red ? "#8f1d1d" : "rgba(243,220,170,0.9)") : "#0a0908";
      ctx.fillRect(x, y, houseW * 0.16, wallH * 0.18);
      if (lit && shot === "search") {
        ctx.fillStyle = "rgba(243,220,170,0.13)";
        ctx.beginPath();
        ctx.moveTo(x, y + wallH * 0.18);
        ctx.lineTo(x - houseW * 0.22, base);
        ctx.lineTo(x + houseW * 0.38, base);
        ctx.closePath();
        ctx.fill();
      }
    };
    const lit = shot !== "empty";
    win(left + houseW * 0.14, base - wallH * 0.72, lit && shot !== "pointed", false);
    win(left + houseW * 0.68, base - wallH * 0.72, lit, shot === "cellar" || shot === "hands");

    const doorX = left + houseW * 0.4;
    const doorW = houseW * 0.18;
    const doorH = wallH * 0.38;
    ctx.fillStyle = shot === "hands" || shot === "missed" ? "#070605" : "#100e0c";
    ctx.fillRect(doorX, base - doorH, doorW, doorH);
    if (shot === "lock") {
      ctx.strokeStyle = "#f3ead7";
      ctx.lineWidth = Math.max(3, w * 0.008);
      ctx.beginPath();
      ctx.moveTo(doorX + doorW * 0.72, base - doorH * 0.55);
      ctx.lineTo(doorX + doorW * 1.15, base - doorH * 0.55);
      ctx.stroke();
    }
    if (shot === "hands") {
      ctx.fillStyle = "rgba(243,234,215,0.8)";
      ctx.fillRect(doorX + doorW * 0.15, base - doorH * 0.42, doorW * 0.22, doorH * 0.12);
      ctx.fillRect(doorX + doorW * 0.55, base - doorH * 0.36, doorW * 0.22, doorH * 0.12);
    }

    if (shot === "cellar" || shot === "empty" || shot === "hands") {
      ctx.fillStyle = shot === "empty" ? "#1a100e" : "#6e1c18";
      ctx.fillRect(left + houseW * 0.28, base - 4, houseW * 0.44, h * 0.035);
      ctx.fillStyle = "rgba(143,29,29,0.35)";
      ctx.beginPath();
      ctx.moveTo(left + houseW * 0.34, base);
      ctx.lineTo(left + houseW * 0.5, base + h * 0.1);
      ctx.lineTo(left + houseW * 0.66, base);
      ctx.closePath();
      ctx.fill();
    }

    if (shot === "pointed") {
      ctx.strokeStyle = "rgba(231,178,168,0.85)";
      ctx.lineWidth = Math.max(2, w * 0.005);
      const targetX = left + houseW * 0.76;
      const targetY = base - wallH * 0.62;
      [0.18, 0.5, 0.86].forEach((start) => {
        ctx.beginPath();
        ctx.moveTo(w * start, h * 0.9);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
      });
    }

    for (let i = 0; i < 900; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      ctx.fillStyle = `rgba(243,234,215,${rng() * 0.09})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    const vignette = ctx.createRadialGradient(w / 2, h * 0.45, w * 0.2, w / 2, h * 0.5, w * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function card(edition) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    paint(canvas, edition);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(7,6,5,0.72)";
    ctx.fillRect(0, 980, 1080, 370);
    ctx.fillStyle = "#e7b2a8";
    ctx.font = "600 28px sans-serif";
    ctx.fillText(edition.finale ? "FINAL EDITION" : "LIVE  ·  MAIDEN'S REST", 64, 1060);
    ctx.fillStyle = "#f3ead7";
    ctx.font = "500 68px Georgia, serif";
    wrap(ctx, edition.headline, 64, 1150, 952, 76);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
  }

  function wrap(ctx, text, x, y, max, line) {
    const words = String(text || "").split(" ");
    let row = "";
    let top = y;
    words.forEach((word) => {
      const next = row ? `${row} ${word}` : word;
      if (ctx.measureText(next).width > max && row) {
        ctx.fillText(row, x, top);
        row = word;
        top += line;
      } else {
        row = next;
      }
    });
    if (row) ctx.fillText(row, x, top);
  }

  window.MaidenScene = { paint, card };
})();
