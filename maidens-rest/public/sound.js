(function () {
  const sound = {
    ctx: null,
    muted: false,
    unlock() {
      if (this.muted) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) this.ctx = new Ctx();
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    toggle() {
      this.muted = !this.muted;
      try { localStorage.setItem("mr-mute", this.muted ? "1" : "0"); } catch (error) { /* ignore */ }
      if (this.muted && this.ctx) this.ctx.suspend();
      else this.unlock();
      return this.muted;
    },
    tone(freq, duration, type, gain) {
      if (this.muted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain || 0.05, now);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },
    tap() { this.unlock(); this.tone(420, 0.06, "triangle", 0.03); },
    paper() { this.unlock(); this.tone(660, 0.12, "sine", 0.03); this.tone(440, 0.2, "sine", 0.02); },
    death() {
      this.unlock();
      this.tone(98, 0.45, "sawtooth", 0.04);
      this.tone(146, 0.35, "triangle", 0.03);
    },
  };
  try { sound.muted = localStorage.getItem("mr-mute") === "1"; } catch (error) { /* ignore */ }
  document.addEventListener("pointerdown", () => sound.unlock(), { passive: true });
  window.MaidenSound = sound;
})();
