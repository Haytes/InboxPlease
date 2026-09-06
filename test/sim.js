/* Node harness: loads data.js + engine.js with a stubbed window,
   validates campaign data, and simulates full playthroughs.
   Run: node test/sim.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {
  console,
  localStorage: (function () {
    let store = {};
    return {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    };
  })()
};
sandbox.window = sandbox;
vm.createContext(sandbox);

for (const f of ["js/data.js", "js/engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), sandbox, { filename: f });
}

const { IP } = sandbox;
let failures = 0;
function check(cond, msg) {
  if (cond) { console.log("  PASS  " + msg); }
  else { failures++; console.log("  FAIL  " + msg); }
}

/* ============ 1. data validation ============ */
console.log("\n== DATA VALIDATION ==");
const DAYS = IP.DAYS;
const all = DAYS.flatMap(d => d.emails.map(e => ({ e, d })));
check(DAYS.length === 6, "6 days");
check(all.length === 31, "31 emails total (got " + all.length + ")");

const ids = all.map(x => x.e.id);
check(new Set(ids).size === ids.length, "email ids unique");
check(ids.every(id => /^d[1-6]e0[1-9]$/.test(id)), "ids follow dNeNN pattern");

const phish = all.filter(x => x.e.verdict === "phish");
const legit = all.filter(x => x.e.verdict === "legit");
check(phish.length === 18, "18 phish (got " + phish.length + ")");
check(legit.length === 13, "13 legit (got " + legit.length + ")");

// per-day mix
const mixes = DAYS.map(d => {
  const p = d.emails.filter(e => e.verdict === "phish").length;
  return `D${d.day}: ${p}p/${d.emails.length - p}l`;
});
console.log("  mix: " + mixes.join("  "));
check(DAYS[2].emails.filter(e => e.verdict === "phish").length === 2, "Day 3 inverted (2 phish)");

// every email complete
let schemaOk = true, problems = [];
for (const { e, d } of all) {
  for (const f of ["id", "time", "fromName", "fromAddr", "subject", "body", "verdict", "weight", "coachRight"]) {
    if (e[f] === undefined) { schemaOk = false; problems.push(e.id + " missing " + f); }
  }
  if (e.verdict === "phish" && (!e.redFlags || !e.redFlags.length)) { schemaOk = false; problems.push(e.id + " phish without redFlags"); }
  if (e.verdict === "phish" && e.weight >= 2 && !e.incident) { schemaOk = false; problems.push(e.id + " w>=2 phish without incident text"); }
  if (e.verdict === "legit" && !e.fpNote) { schemaOk = false; problems.push(e.id + " legit without fpNote"); }
  if (d.day >= 4 && !e.auth) { schemaOk = false; problems.push(e.id + " day>=4 without auth"); }
  for (const b of e.body) {
    if (!["p", "sig", "quote", "link", "qr"].includes(b.t)) { schemaOk = false; problems.push(e.id + " unknown block " + b.t); }
    if (b.t === "link" && !b.href) { schemaOk = false; problems.push(e.id + " link without href"); }
  }
  for (const f of e.redFlags || []) {
    if (!["from", "header", "body", "link", "attach", "qr"].includes(f.zone)) { schemaOk = false; problems.push(e.id + " flag bad zone " + f.zone); }
    if (!f.label || !f.explain) { schemaOk = false; problems.push(e.id + " flag missing label/explain"); }
  }
  if (e.weight < 1 || e.weight > 3) { schemaOk = false; problems.push(e.id + " weight out of range"); }
}
check(schemaOk, "schema complete (" + (problems.length ? problems.join("; ") : "no problems") + ")");

// homoglyph email actually contains non-ASCII
const homo = all.find(x => x.e.id === "d5e03").e;
check(/[^\x00-\x7F]/.test(homo.fromAddr), "d5e03 fromAddr contains non-ASCII homoglyph");
check(/xn--/.test(JSON.stringify(homo)), "d5e03 has raw punycode form somewhere");
// no unintended non-ASCII in other from addrs
const dirty = all.filter(x => /[^\x00-\x7F]/.test(x.e.fromAddr)).map(x => x.e.id);
check(dirty.length === 1 && dirty[0] === "d5e03", "only d5e03 has non-ASCII sender (" + dirty.join(",") + ")");

// fairness: flags for evidence not inspectable that day shouldn't exist before tools unlock
// (from/body always visible; header flags only from day 2; link from day 1; attach day 1)
let fairnessOk = true;
for (const { e, d } of all) {
  for (const f of e.redFlags || []) {
    if (f.zone === "header" && d.day < 2) fairnessOk = false;
    if (f.zone === "qr" && d.day < 6) fairnessOk = false;
  }
}
check(fairnessOk, "flag zones fair for their day");

/* ============ 2. perfect playthrough ============ */
console.log("\n== SIM: PERFECT PLAY ==");
IP.engine.startCampaign("Test Perfect");
let commendationsSeen = 0, daysSummary = [];
for (let di = 0; di < DAYS.length; di++) {
  IP.engine.enterDayPublic; // no-op
  for (let ei = 0; ei < DAYS[di].emails.length; ei++) {
    const em = IP.engine.email();
    IP.engine.beginEmail();
    // simulate a thorough player: inspect everything available
    IP.engine.recordInspection("header");
    em.body.forEach(b => { if (b.href) IP.engine.recordInspection("link", b.href); });
    (em.attachments || []).forEach(a => IP.engine.recordInspection("attach", a.name));
    const out = IP.engine.decide(em.verdict === "phish" ? "report" : "allow");
    if (out.routing === "incident") { failures++; console.log("  FAIL  incident on CORRECT play " + em.id); }
    if (out.result.correct !== true) { failures++; console.log("  FAIL  correct play marked wrong " + em.id); }
    if (out.result.commendation) commendationsSeen++;
  }
  const s = IP.engine.endDay();
  daysSummary.push(`D${DAYS[di].day}: ${Math.round(s.accuracy * 100)}% clean=${s.cleanShift} trust=${s.trustAfter}`);
  if (di < DAYS.length - 1) IP.engine.nextDay();
}
console.log("  " + daysSummary.join("  |  "));
const ps = IP.engine.finalStats();
check(ps.correct === 31, "all 31 correct");
check(ps.grade === "A", "perfect play = A (got " + ps.grade + ")");
check(ps.weightedAcc === 1, "weightedAcc = 1");
check(ps.missedFlags.length === 0, "no missed flags");
check(ps.trapsWon === 13, "all 13 traps survived");
check(ps.trust === 100, "trust clamped at 100 (got " + ps.trust + ")");
check(commendationsSeen > 20, "commendations awarded on streak (" + commendationsSeen + ")");
check(daysSummary.every(s => /clean=true/.test(s)), "every day a clean shift");

/* ============ 3. worst playthrough (fall for everything) ============ */
console.log("\n== SIM: WORST PLAY ==");
IP.engine.startCampaign("Test Worst");
let incidents = 0, expectedTrust = 70;
for (let di = 0; di < DAYS.length; di++) {
  const dayCost = [];
  for (let ei = 0; ei < DAYS[di].emails.length; ei++) {
    const em = IP.engine.email();
    IP.engine.beginEmail();
    // wrong call every time: allow phish, report legit
    const before = IP.engine.state.trust;
    const out = IP.engine.decide(em.verdict === "phish" ? "allow" : "report");
    if (out.routing === "incident") incidents++;
    // hand-check the delta (clamped the same way the engine clamps)
    let expect = em.verdict === "phish" ? -6 * em.weight : -2 * em.weight;
    const dayCit = IP.engine.state.dayCitations;
    if (dayCit === 3) expect -= 2; // repeat violation lands on the 3rd citation
    const expectedTrust = Math.max(0, Math.min(100, before + expect));
    if (expectedTrust !== IP.engine.state.trust) {
      failures++; console.log("  FAIL  trust math " + em.id + ": expected " + expectedTrust + " got " + IP.engine.state.trust);
    }
    if (out.result.correct !== false) { failures++; console.log("  FAIL  wrong play marked right " + em.id); }
  }
  const s = IP.engine.endDay();
  if (di < DAYS.length - 1) IP.engine.nextDay();
}
const ws = IP.engine.finalStats();
check(ws.correct === 0, "0 correct");
check(ws.grade === "F", "worst play = F (got " + ws.grade + ")");
check(ws.citations === 31, "31 citations (got " + ws.citations + ")");
// expected incident count: FN on w>=2 phish, capped 2/day
const expectedIncidents = DAYS.reduce((n, d) => {
  const q = d.emails.filter(e => e.verdict === "phish" && e.weight >= 2).length;
  return n + Math.min(2, q);
}, 0);
check(incidents === expectedIncidents, "incident interstitials = expected (" + incidents + " vs " + expectedIncidents + ")");
check(ws.missedFlags.length > 0, "missed flags aggregated (" + ws.missedFlags.length + " unique)");
console.log("  final trust after worst play: " + ws.trust);

/* ============ 4. mixed play + trust mid-band ============ */
console.log("\n== SIM: MIXED PLAY ==");
IP.engine.startCampaign("Test Mixed");
let n = 0;
for (let di = 0; di < DAYS.length; di++) {
  for (let ei = 0; ei < DAYS[di].emails.length; ei++) {
    const em = IP.engine.email();
    IP.engine.beginEmail();
    IP.engine.decide(n % 3 === 0 ? (em.verdict === "phish" ? "allow" : "report")  // wrong 1/3
                                 : (em.verdict === "phish" ? "report" : "allow"));
    n++;
  }
  IP.engine.endDay();
  if (di < DAYS.length - 1) IP.engine.nextDay();
}
const ms = IP.engine.finalStats();
check(ms.grade === "C" || ms.grade === "D" || ms.grade === "B", "mixed play lands mid-band (grade " + ms.grade + ", acc " + Math.round(ms.weightedAcc * 100) + "%)");
console.log("  mixed: " + ms.correct + "/31 correct, grade " + ms.grade + ", trust " + ms.trust + ", citations " + ms.citations);

/* ============ 5. save / load ============ */
console.log("\n== SAVE/LOAD ==");
IP.engine.startCampaign("Saver");
IP.engine.decide("report"); // judge one email
IP.engine.save();
const ok = IP.engine.load();
check(ok, "load() succeeds with a save present");
check(IP.engine.state.playerName === "Saver", "playerName restored");
check(IP.engine.state.results.length === 1, "results restored");
IP.engine.clearSave();
check(IP.engine.hasSave() === false, "clearSave works");

/* ============ result ============ */
console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED ✔" : failures + " CHECK(S) FAILED ✗"));
process.exit(failures === 0 ? 0 : 1);
