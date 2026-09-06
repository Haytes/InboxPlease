/* ============================================================
   INBOX, PLEASE — audio.js
   WebAudio-synthesized sound effects. No asset files, no network.
   Audio must never break the game: every call is guarded.
   ============================================================ */

window.IP = window.IP || {};

IP.sfx = (function () {

  const MUTE_KEY = "inbox-please-muted";
  let ctx = null;
  let muted = false;

  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  function ac() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  /* one tone: freq -> slideTo over dur, type, volume, delay */
  function tone(freq, dur, type, vol, delay, slideTo) {
    const c = ac();
    if (!c) return;
    try {
      const t0 = c.currentTime + (delay || 0);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) {}
  }

  /* filtered noise burst (stamp thunk) */
  function noise(dur, vol, delay) {
    const c = ac();
    if (!c) return;
    try {
      const t0 = c.currentTime + (delay || 0);
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 900;
      const g = c.createGain();
      g.gain.setValueAtTime(vol || 0.2, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt).connect(g).connect(c.destination);
      src.start(t0);
    } catch (e) {}
  }

  const sounds = {
    ding:    function () { tone(660, 0.12, "sine", 0.10); tone(880, 0.14, "sine", 0.10, 0.10); },
    thunk:   function () { tone(180, 0.09, "square", 0.07); },
    buzz:    function () { tone(110, 0.25, "sawtooth", 0.10); tone(104, 0.25, "sawtooth", 0.10); },
    stamp:   function () { noise(0.16, 0.25); tone(140, 0.08, "square", 0.05, 0.02); },
    alarm:   function () {
               for (let i = 0; i < 3; i++) {
                 tone(440, 0.12, "square", 0.08, i * 0.26);
                 tone(330, 0.12, "square", 0.08, i * 0.26 + 0.13);
               }
             },
    jingle:  function () { tone(523, 0.12, "sine", 0.10); tone(659, 0.12, "sine", 0.10, 0.12); tone(784, 0.22, "sine", 0.10, 0.24); },
    click:   function () { tone(320, 0.03, "square", 0.04); }
  };

  return {
    play: function (name) {
      if (muted || !sounds[name]) return;
      sounds[name]();
    },
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
    },
    toggle: function () { this.setMuted(!muted); return muted; }
  };
})();
