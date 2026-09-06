/* ============================================================
   INBOX, PLEASE — engine.js
   Game state, grading, trust/streak/citation math, save/load.
   This module NEVER touches the DOM.
   ============================================================ */

window.IP = window.IP || {};

IP.engine = (function () {

  const SAVE_KEY = "inbox-please-save-v1";
  const TRUST_START = 70;

  const state = {
    screen: "title",
    playerName: "",
    dayIndex: 0,          // 0-based index into IP.DAYS
    emailIndex: 0,        // index within current day's queue
    trust: TRUST_START,
    streak: 0,
    bestStreak: 0,
    dayCitations: 0,
    totalCitations: 0,
    incidentsToday: 0,
    toolsUnlocked: [],    // union of tools[] across days entered
    results: [],          // one entry per judged email
    current: null,        // inspection state for the email on screen
    startedAt: null,
    completedAt: null
  };

  /* ---------- day/email accessors ---------- */

  function day()       { return IP.DAYS[state.dayIndex]; }
  function emails()    { return day().emails; }
  function email()     { return emails()[state.emailIndex]; }
  function isLastEmailOfCampaign() {
    return state.dayIndex === IP.DAYS.length - 1 &&
           state.emailIndex >= emails().length;
  }

  /* ---------- inspection tracking ---------- */

  function beginEmail() {
    state.current = {
      emailId: email().id,
      inspected: { header: false, links: [], attach: [] }
    };
  }

  function recordInspection(kind, value) {
    if (!state.current) return;
    const ins = state.current.inspected;
    if (kind === "header") ins.header = true;
    if (kind === "link" && ins.links.indexOf(value) === -1) ins.links.push(value);
    if (kind === "attach" && ins.attach.indexOf(value) === -1) ins.attach.push(value);
  }

  /* Was a red flag's evidence zone actually examined before ruling? */
  function flagExamined(flag, inspected) {
    switch (flag.zone) {
      case "from":
      case "body":  return true;                         // always visible
      case "header": return inspected.header;
      case "link":   return inspected.links.length > 0;   // any hover counts
      case "qr":     return inspected.links.length > 0;   // qr hover reveals href
      case "attach": return inspected.attach.length > 0;
      default:       return true;
    }
  }

  /* ---------- grading ---------- */

  function decide(choice) {
    const em = email();
    const correct = (choice === "allow" && em.verdict === "legit") ||
                    (choice === "report" && em.verdict === "phish");

    const inspected = state.current ? state.current.inspected
                                    : { header: false, links: [], attach: [] };

    let delta = 0;
    let commendation = false;

    if (correct) {
      delta = 2;
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      if (state.streak >= 5) { delta += 1; commendation = true; } // streak bonus
    } else {
      state.streak = 0;
      delta = em.verdict === "phish" ? -6 * em.weight   // false negative
                                     : -2 * em.weight;  // false positive
      state.dayCitations += 1;
      state.totalCitations += 1;
      if (state.dayCitations === 3) delta -= 2;         // repeat violation
    }

    state.trust = Math.max(0, Math.min(100, state.trust + delta));

    const flags = (em.redFlags || []).map(function (f) {
      return {
        zone: f.zone, key: !!f.key, label: f.label,
        explain: f.explain, proto: f.proto || null,
        examined: correct ? true : flagExamined(f, inspected)
      };
    });

    state.results.push({
      day: state.dayIndex,
      emailId: em.id,
      subject: em.subject,
      fromName: em.fromName,
      choice: choice,
      correct: correct,
      errorType: correct ? null : (em.verdict === "phish" ? "fn" : "fp"),
      delta: delta,
      commendation: commendation,
      verdict: em.verdict,
      category: em.category || null,
      trapType: em.trapType || null,
      weight: em.weight,
      flags: flags,
      coachRight: em.coachRight,
      coachWrong: em.coachWrong || em.fpNote || "",
      fpNote: em.fpNote || null
    });

    // incident interstitial: serious phish let through, capped at 2/day
    let incidentShown = false;
    if (!correct && em.verdict === "phish" && em.weight >= 2 &&
        state.incidentsToday < 2 && em.incident) {
      state.incidentsToday += 1;
      incidentShown = true;
    }

    const result = state.results[state.results.length - 1];

    state.current = null;
    state.emailIndex += 1;

    let routing;
    if (incidentShown)                    routing = "incident";
    else if (state.emailIndex >= emails().length) routing = "debrief";
    else                                  routing = "next";

    save();
    return { routing: routing, result: result };
  }

  /* ---------- day transitions ---------- */

  function endDay() {
    const dayResults = state.results.filter(function (r) { return r.day === state.dayIndex; });
    const correctCount = dayResults.filter(function (r) { return r.correct; }).length;
    const total = dayResults.length || 1;
    const accuracy = correctCount / total;

    const summary = {
      accuracy: accuracy,
      correct: correctCount,
      total: dayResults.length,
      citations: state.dayCitations,
      cleanShift: false,
      coaching: accuracy < 0.6,
      probation: false,
      trustAfter: state.trust,
      incidents: state.incidentsToday
    };

    if (accuracy >= 0.8) {
      summary.cleanShift = true;
      state.trust = Math.min(100, state.trust + 3);
      summary.trustAfter = state.trust;
    }
    if (state.trust <= 20) summary.probation = true;

    save();
    return summary;
  }

  function nextDay() {
    state.dayIndex += 1;
    state.emailIndex = 0;
    state.dayCitations = 0;
    state.incidentsToday = 0;
    state.screen = "memo";
    enterDay();
    save();
  }

  /* union tools/vendors when a day begins */
  function enterDay() {
    const d = day();
    (d.tools || []).forEach(function (t) {
      if (state.toolsUnlocked.indexOf(t) === -1) state.toolsUnlocked.push(t);
    });
  }

  function startCampaign(name) {
    state.playerName = (name || "").trim() || "Screener";
    state.dayIndex = 0;
    state.emailIndex = 0;
    state.trust = TRUST_START;
    state.streak = 0;
    state.bestStreak = 0;
    state.dayCitations = 0;
    state.totalCitations = 0;
    state.incidentsToday = 0;
    state.toolsUnlocked = [];
    state.results = [];
    state.current = null;
    state.startedAt = Date.now();
    state.completedAt = null;
    state.screen = "memo";
    enterDay();
    save();
  }

  function finishCampaign() {
    state.completedAt = Date.now();
    clearSave();
  }

  /* ---------- final report ---------- */

  function finalStats() {
    const rs = state.results;
    let sumW = 0, sumWC = 0;
    const catStats = {};    // phish category -> {caught, total, label}
    let trapsWon = 0, trapsTotal = 0;

    rs.forEach(function (r) {
      sumW += r.weight;
      if (r.correct) sumWC += r.weight;
      if (r.verdict === "phish" && r.category) {
        if (!catStats[r.category]) catStats[r.category] = { caught: 0, total: 0 };
        catStats[r.category].total += 1;
        if (r.correct) catStats[r.category].caught += 1;
      }
      if (r.verdict === "legit") {
        trapsTotal += 1;
        if (r.correct) trapsWon += 1;
      }
    });

    const weightedAcc = sumW ? sumWC / sumW : 0;
    const grade = weightedAcc >= 0.95 ? "A" :
                  weightedAcc >= 0.85 ? "B" :
                  weightedAcc >= 0.70 ? "C" :
                  weightedAcc >= 0.55 ? "D" : "F";

    // aggregate missed red flags (wrong calls only), sorted by frequency
    const missed = {};
    rs.forEach(function (r) {
      if (r.correct) return;
      (r.flags || []).forEach(function (f) {
        if (!missed[f.label]) missed[f.label] = { label: f.label, count: 0, explain: f.explain };
        missed[f.label].count += 1;
      });
    });
    const missedList = Object.keys(missed).map(function (k) { return missed[k]; })
      .sort(function (a, b) { return b.count - a.count; });

    // accuracy per day
    const perDay = IP.DAYS.map(function (d, i) {
      const dr = rs.filter(function (r) { return r.day === i; });
      const c = dr.filter(function (r) { return r.correct; }).length;
      return { day: d.day, date: d.date, correct: c, total: dr.length };
    });

    return {
      name: state.playerName,
      startedAt: state.startedAt,
      completedAt: state.completedAt || Date.now(),
      daysCompleted: IP.DAYS.length,
      totalJudged: rs.length,
      weightedAcc: weightedAcc,
      correct: rs.filter(function (r) { return r.correct; }).length,
      grade: grade,
      trust: state.trust,
      citations: state.totalCitations,
      bestStreak: state.bestStreak,
      categories: catStats,
      trapsWon: trapsWon,
      trapsTotal: trapsTotal,
      missedFlags: missedList,
      perDay: perDay,
      results: rs
    };
  }

  /* ---------- persistence (file:// can restrict storage) ---------- */

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        playerName: state.playerName,
        dayIndex: state.dayIndex,
        emailIndex: state.emailIndex,
        trust: state.trust,
        streak: state.streak,
        bestStreak: state.bestStreak,
        dayCitations: state.dayCitations,
        totalCitations: state.totalCitations,
        incidentsToday: state.incidentsToday,
        toolsUnlocked: state.toolsUnlocked,
        results: state.results,
        startedAt: state.startedAt
      }));
    } catch (e) { /* storage unavailable — playable in one sitting */ }
  }

  function hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  }

  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const s = JSON.parse(raw);
      if (typeof s.dayIndex !== "number" || !IP.DAYS[s.dayIndex]) return false;
      Object.assign(state, s);
      state.current = null;
      state.screen = "memo";
      enterDay();
      return true;
    } catch (e) { return false; }
  }

  /* ---------- misc ---------- */

  function interpName(text) {
    return String(text).split("{{name}}").join(state.playerName || "Screener");
  }

  function unlocked(tool) {
    return state.toolsUnlocked.indexOf(tool) !== -1;
  }

  return {
    state: state,
    day: day,
    email: email,
    emails: emails,
    beginEmail: beginEmail,
    recordInspection: recordInspection,
    decide: decide,
    endDay: endDay,
    nextDay: nextDay,
    startCampaign: startCampaign,
    finishCampaign: finishCampaign,
    finalStats: finalStats,
    save: save,
    load: load,
    hasSave: hasSave,
    clearSave: clearSave,
    interpName: interpName,
    unlocked: unlocked,
    isLastEmailOfCampaign: isLastEmailOfCampaign
  };
})();
