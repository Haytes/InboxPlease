/* ============================================================
   INBOX, PLEASE — ui.js
   All DOM rendering and events. Reads IP.engine.state, calls
   IP.engine methods, never mutates scoring directly.
   ============================================================ */

window.IP = window.IP || {};

IP.ui = (function () {

  const E = IP.engine;

  /* ---------- tiny DOM helpers ---------- */

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function txt(s) { return document.createTextNode(E.interpName(s)); }

  const CATEGORY_LABELS = {
    "mass-spam":     "Mass-market spam",
    "credential":    "Credential harvesting",
    "attachment":    "Malicious attachments",
    "bec":           "Executive impersonation (BEC)",
    "lookalike":     "Lookalike domains",
    "replyto":       "Reply-To spoofing",
    "hr-benefits":   "Benefits / HR scare bait",
    "spoof-auth":    "Vendor spoof (auth failure)",
    "thread-hijack": "Thread hijacking",
    "subdomain":     "Subdomain tricks",
    "homoglyph":     "Homoglyph / punycode",
    "spearphish":    "Spearphishing",
    "quishing":      "QR-code phishing"
  };
  const ZONE_LABELS = {
    from: "sender line", header: "full headers", body: "body text",
    link: "link hover", attach: "attachment", qr: "QR code"
  };

  /* ---------- screen router ---------- */

  let memoReturn = null;   // 'triage' when memo opened as RULES overlay

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("active", s.id === "screen-" + name);
    });
    E.state.screen = name;
    const showTop = ["memo", "triage", "incident", "debrief"].indexOf(name) !== -1;
    $("topbar").hidden = !showTop;
    window.scrollTo(0, 0);
  }

  /* ---------- topbar ---------- */

  function syncTopbar() {
    const d = E.day();
    $("tb-day").textContent = "DAY " + d.day + "/" + IP.DAYS.length + " · " + d.date.toUpperCase();
    const t = E.state.trust;
    $("trust-num").textContent = t;
    const fill = $("trust-fill");
    fill.style.width = t + "%";
    fill.style.background = t > 55 ? "var(--ok)" : t > 25 ? "#a98a3c" : "#a3402a";
  }

  function toast(msg, bad) {
    let node = $("toast");
    if (!node) {
      node = el("div"); node.id = "toast";
      document.body.appendChild(node);
    }
    node.textContent = msg;
    node.classList.toggle("bad", !!bad);
    node.classList.add("show");
    clearTimeout(node._t);
    node._t = setTimeout(function () { node.classList.remove("show"); }, 1800);
  }

  /* ---------- title ---------- */

  function renderTitle() {
    showScreen("title");
    $("btn-resume").hidden = !E.hasSave();
  }

  function bindTitle() {
    $("btn-begin").addEventListener("click", function () {
      const name = $("name-input").value.trim();
      if (!name) { toast("Enter a screener name to begin."); $("name-input").focus(); return; }
      E.startCampaign(name);
      renderMemo();
    });
    $("btn-resume").addEventListener("click", function () {
      if (E.load()) {
        if (E.state.emailIndex === 0) renderMemo();
        else if (E.state.emailIndex >= E.emails().length) renderDebrief(); // saved mid-debrief
        else renderTriage();
      } else {
        toast("No saved shift found.");
      }
    });
    $("name-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") $("btn-begin").click();
    });
  }

  /* ---------- memo ---------- */

  function renderMemo(review) {
    memoReturn = review ? "triage" : null;
    const d = E.day();
    const m = d.memo;
    const scr = $("screen-memo");
    clear(scr);

    const sheet = el("div", "memo-sheet");

    const head = el("div", "memo-head");
    head.appendChild(el("div", "memo-kicker", "MERIDIAN BENEFITS GROUP — INTERNAL MEMORANDUM"));
    head.appendChild(el("h2", null, null)).appendChild(txt(m.subject));
    head.appendChild(el("div", "memo-meta", "FROM: " + m.from + "   ·   TO: Mail Screener, Claims   ·   " + d.date.toUpperCase()));
    sheet.appendChild(head);

    m.paragraphs.forEach(function (p) {
      sheet.appendChild(el("p", "memo-p", null)).appendChild(txt(p));
    });

    const rulesBox = el("div", "memo-rules");
    rulesBox.appendChild(el("h3", null, "PROTOCOL" + (m.protocols.length > 1 ? "S" : "") + " IN EFFECT"));
    const ol = el("ol", "memo-proto-list");
    m.protocols.forEach(function (p) {
      const li = el("li");
      li.appendChild(el("span", "p-id", p.id));
      li.appendChild(txt(p.text));
      ol.appendChild(li);
    });
    rulesBox.appendChild(ol);
    sheet.appendChild(rulesBox);

    if (m.unlockNote) sheet.appendChild(el("div", "memo-unlock", m.unlockNote));

    const foot = el("div", "memo-foot");
    const btn = el("button", "big-btn ok-btn", review ? "RETURN TO SHIFT" : "ACKNOWLEDGE — BEGIN SHIFT");
    btn.addEventListener("click", function () { renderTriage(); });
    foot.appendChild(btn);
    sheet.appendChild(foot);

    scr.appendChild(sheet);
    showScreen("memo");
    syncTopbar();
  }

  /* ---------- triage ---------- */

  function renderTriage() {
    // preserve mid-email inspection state when returning from the RULES overlay
    const em = E.email();
    if (em && (!E.state.current || E.state.current.emailId !== em.id)) E.beginEmail();
    const d = E.day();
    syncTopbar();

    // sidebar
    $("list-date").textContent = d.date;
    const pl = $("side-protocols");
    clear(pl);
    d.memo.protocols.forEach(function (p) {
      const li = el("li");
      li.appendChild(el("span", "p-id", p.id));
      li.appendChild(txt(p.text));
      pl.appendChild(li);
    });

    $("side-vendors").hidden = !E.unlocked("vendor");
    if (E.unlocked("vendor")) {
      const vl = $("vendor-list");
      clear(vl);
      IP.VENDORS.forEach(function (v) {
        const li = el("li");
        li.appendChild(el("span", "v-dom", v.dom));
        li.appendChild(el("span", "v-note", v.note));
        vl.appendChild(li);
      });
    }

    renderQueue();
    renderEmail();
    showScreen("triage");
    $("screen-triage").classList.remove("locked");
    $("verdict-msg").textContent = "";
    $("verdict-msg").className = "";
  }

  function renderQueue() {
    const d = E.day();
    const emails = d.emails;
    const list = $("msg-list");
    clear(list);

    const done = E.state.emailIndex;
    const remaining = emails.length - done;

    $("queue-count").innerHTML = "";
    const q = $("queue-count");
    q.appendChild(el("div", null, remaining + " remaining"));
    q.appendChild(el("div", null, done + " judged"));

    emails.forEach(function (em, i) {
      const row = el("li", "msg-row");
      const from = el("div", "mr-from", null);
      from.appendChild(txt(em.fromName));
      const time = el("div", "mr-time", em.time);
      const sub = el("div", "mr-sub", null);
      sub.appendChild(txt(em.subject));
      row.appendChild(from); row.appendChild(time); row.appendChild(sub);

      if (i < done) {
        row.classList.add("done");
        const r = E.state.results.filter(function (x) { return x.emailId === em.id; })[0];
        if (r) {
          const st = el("div", "mr-stamp");
          const mark = r.correct ? "✔" : "✗";
          const cls = r.correct ? "st-ok" : "st-bad";
          const verb = r.choice === "allow" ? "DELIVERED" : "REPORTED";
          const mk = el("span", cls, mark + " ");
          const vb = el("span", "st-verb", verb + (r.correct ? "" : "  ·  FLAGGED"));
          st.appendChild(mk); st.appendChild(vb);
          row.appendChild(st);
        }
      } else if (i === done) {
        row.classList.add("current");
      } else {
        row.classList.add("future");
      }
      list.appendChild(row);
    });
  }

  function renderEmail() {
    const em = E.email();
    if (!em) return;

    clear($("header-panel"));
    $("header-panel").hidden = true;
    $("btn-headers").innerHTML = "&#9662; FULL HEADERS";
    $("btn-headers").disabled = false;

    const subj = $("m-subject");
    clear(subj); subj.appendChild(txt(em.subject));
    clear($("m-fromname")); $("m-fromname").appendChild(txt(em.fromName));
    clear($("m-fromaddr")); $("m-fromaddr").textContent = em.fromAddr;
    clear($("m-time")); $("m-time").textContent = em.time;

    // body
    const body = $("mail-body");
    clear(body);
    em.body.forEach(function (b) { renderBlock(body, b); });

    // attachments
    const att = $("attachments");
    clear(att);
    (em.attachments || []).forEach(function (a) {
      const chip = el("button", "attach-chip");
      chip.type = "button";
      const icon = el("span", "ac-icon", "📎");
      const name = el("span", "ac-name", a.name);
      const size = el("span", "ac-size", a.size);
      chip.appendChild(icon); chip.appendChild(name); chip.appendChild(size);
      chip.addEventListener("click", function () {
        E.recordInspection("attach", a.name);
        IP.sfx.play("click");
        const det = chip.nextElementSibling && chip.nextElementSibling.classList.contains("attach-detail");
        if (det) { chip.parentNode.removeChild(det); return; }
        const card = el("div", "attach-detail");
        card.appendChild(el("div", "ad-name", "FILE: " + a.name));
        const r1 = el("div", "ad-row"); r1.appendChild(el("b", null, "Size: ")); r1.appendChild(document.createTextNode(a.size));
        const r2 = el("div", "ad-row"); r2.appendChild(el("b", null, "Type: ")); r2.appendChild(document.createTextNode(a.kind));
        card.appendChild(r1); card.appendChild(r2);
        chip.insertAdjacentElement("afterend", card);
      });
      att.appendChild(chip);
    });

    // status bar reset
    setStatus(null);

    // restore an open header panel for the same email (e.g. back from RULES)
    if (headersOpenFor === em.id) {
      renderHeaderPanel($("header-panel"));
      $("header-panel").hidden = false;
      $("btn-headers").innerHTML = "&#9652; FULL HEADERS";
    } else {
      headersOpenFor = null;
    }
  }

  function renderBlock(container, b) {
    switch (b.t) {
      case "p": {
        const p = el("p", null, null); p.appendChild(txt(b.text)); container.appendChild(p);
        break;
      }
      case "sig": {
        const p = el("p", "sig", null); p.appendChild(txt(b.text)); container.appendChild(p);
        break;
      }
      case "quote": {
        const q = el("div", "quote");
        if (b.meta) q.appendChild(el("span", "q-meta", b.meta));
        q.appendChild(txt(b.text));
        container.appendChild(q);
        break;
      }
      case "link": {
        const p = el("p", null);
        p.appendChild(fakeLink(b.label, b.href));
        container.appendChild(p);
        break;
      }
      case "qr": {
        const wrap = el("div", "qr-block");
        const pre = el("pre", null, IP.QR_ART.join("\n"));
        pre.tabIndex = 0;
        pre.setAttribute("role", "img");
        pre.setAttribute("aria-label", "QR code (decorative)");
        bindHover(pre, b.href);
        wrap.appendChild(pre);
        wrap.appendChild(el("span", "qr-note", b.note || ""));
        const cap = el("p");
        cap.appendChild(fakeLink(b.note || "Use this link instead", b.href));
        wrap.appendChild(cap);
        container.appendChild(wrap);
        break;
      }
    }
  }

  function fakeLink(label, href) {
    const s = el("span", "fake-link", null);
    s.appendChild(txt(label));
    s.tabIndex = 0;
    bindHover(s, href);
    return s;
  }

  function bindHover(node, href) {
    node.addEventListener("mouseenter", function () { setStatus(href); E.recordInspection("link", href); });
    node.addEventListener("focus", function () { setStatus(href); E.recordInspection("link", href); });
    node.addEventListener("mouseleave", function () { /* keep last URL visible, like a browser */ });
  }

  /* ---------- status bar + domain inspector ---------- */

  function setStatus(href) {
    const urlBox = $("sb-url");
    const domBox = $("sb-domain");
    clear(domBox);
    if (!href) {
      urlBox.textContent = "hover a link to inspect its true address";
      urlBox.style.color = "";
      return;
    }
    urlBox.textContent = href;
    urlBox.style.color = "#ffe9a8";
    if (E.unlocked("inspector")) domBox.appendChild(decompose(href));
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return null; }
  }

  /* domain decomposition: right-to-left reading */
  function decompose(url) {
    const host = hostOf(url);
    const wrap = el("span");
    if (!host) { wrap.textContent = "(unparseable address)"; return wrap; }

    const parts = host.split(".");
    let tld = "", reg = "";
    if (parts.length >= 2) { tld = parts.pop(); reg = parts.pop(); }
    else { reg = parts.pop() || host; }
    const sub = parts.join(".");

    const idnRaw = /xn--/.test(host);
    const idnUni = /[^\x00-\x7F]/.test(host);

    wrap.appendChild(document.createTextNode("DOMAIN (read right-to-left): "));
    if (sub) wrap.appendChild(document.createTextNode(sub + "  ▸  "));
    const regEl = el("span", "dm-reg", reg + "." + tld);
    wrap.appendChild(regEl);
    wrap.appendChild(document.createTextNode("  ← owner"));
    if (idnRaw || idnUni) {
      wrap.appendChild(el("span", "dm-warn", "   ⚠ PUNYCODE / NON-ASCII DETECTED — LOOKALIKE"));
    }
    return wrap;
  }

  /* header panel */

  let headersOpenFor = null;   // email id whose header panel is open

  function toggleHeaders() {
    if (!E.email()) return;
    const panel = $("header-panel");
    const opening = panel.hidden;
    if (opening) {
      E.recordInspection("header");
      IP.sfx.play("click");
      renderHeaderPanel(panel);
      headersOpenFor = E.email().id;
    } else {
      headersOpenFor = null;
    }
    panel.hidden = !opening;
    $("btn-headers").innerHTML = (opening ? "&#9652;" : "&#9662;") + " FULL HEADERS";
  }

  function renderHeaderPanel(panel) {
    const em = E.email();
    clear(panel);

    const row = function (key, valueNode, warn) {
      const r = el("div", "hp-row");
      r.appendChild(el("span", "hp-k", key));
      const v = el("span", "hp-v");
      v.appendChild(valueNode);
      r.appendChild(v);
      if (warn) r.appendChild(el("div", "hp-warn", warn));
      panel.appendChild(r);
    };

    // From
    row("DISPLAY NAME", document.createTextNode(em.fromName));
    row("FROM", document.createTextNode(em.fromAddr));

    // Reply-To
    const rtNode = document.createTextNode(em.replyTo || "—");
    row("REPLY-TO", rtNode,
        em.replyTo ? replyToWarn(em.fromAddr, em.replyTo) : null);

    // raw (punycode) form if provided
    if (em.addrRaw) {
      row("RAW FORM", document.createTextNode(em.addrRaw));
    }

    // auth chips (Day 4+)
    if (E.unlocked("auth") && em.auth) {
      const chips = el("span", "auth-chips");
      [["SPF", em.auth.spf], ["DKIM", em.auth.dkim], ["DMARC", em.auth.dmarc]].forEach(function (pair) {
        const c = el("span", "auth-chip auth-" + pair[1], pair[0] + ": " + pair[1].toUpperCase());
        chips.appendChild(c);
      });
      row("AUTHENTICATION", chips);
    }

    // domain inspector (Day 5+): decompose sender + reply-to
    if (E.unlocked("inspector")) {
      const box = el("div", "hp-inspect");
      box.appendChild(el("b", null, "DOMAIN INSPECTOR"));
      const fromHost = hostOf("http://" + em.fromAddr.split("@").pop());
      box.appendChild(document.createTextNode("  FROM → "));
      box.appendChild(decomposeHost(fromHost));
      if (em.replyTo) {
        const rtHost = hostOf("http://" + em.replyTo.split("@").pop());
        box.appendChild(document.createTextNode("   REPLY-TO → "));
        box.appendChild(decomposeHost(rtHost));
      }
      if (em.addrRaw || /[^\x00-\x7F]/.test(em.fromAddr)) {
        box.appendChild(el("div", "dm-warn", "⚠ sender domain contains non-ASCII lookalike characters — raw form above"));
      }
      panel.appendChild(box);
    }
  }

  function decomposeHost(host) {
    const wrap = el("span");
    if (!host) { wrap.textContent = "—"; return wrap; }
    const parts = host.split(".");
    let tld = "", reg = "";
    if (parts.length >= 2) { tld = parts.pop(); reg = parts.pop(); }
    else reg = parts.pop() || host;
    const sub = parts.join(".");
    if (sub) wrap.appendChild(document.createTextNode(sub + " ▸ "));
    wrap.appendChild(el("span", "dm-reg", reg + "." + tld));
    if (/xn--/.test(host) || /[^\x00-\x7F]/.test(host)) {
      wrap.appendChild(el("span", "dm-warn", " ⚠IDN"));
    }
    return wrap;
  }

  function replyToWarn(from, replyTo) {
    const fd = from.split("@").pop().toLowerCase();
    const rd = replyTo.split("@").pop().toLowerCase();
    return rd && fd && rd !== fd ? "⚠ Reply-To domain differs from From domain" : null;
  }

  /* ---------- verdict flow ---------- */

  let deciding = false;

  function onDecide(choice) {
    if (deciding) return;
    const em = E.email();
    if (!em) return;
    deciding = true;
    $("screen-triage").classList.add("locked");

    const outcome = E.decide(choice);
    const r = outcome.result;

    // stamp
    IP.sfx.play("stamp");
    const layer = $("stamp-layer");
    clear(layer);
    const stamp = el("div", "stamp animate" + (choice === "allow" ? " delivered" : ""),
                     choice === "allow" ? "DELIVERED" : "REPORTED");
    layer.appendChild(stamp);

    setTimeout(function () {
      if (r.correct) { IP.sfx.play("ding"); }
      else {
        IP.sfx.play("buzz");
        toast("FLAGGED FOR COACHING — full breakdown at end of shift", true);
      }

      setTimeout(function () {
        deciding = false;
        clear(layer);
        if (outcome.routing === "incident") renderIncident(r);
        else if (outcome.routing === "debrief") renderDebrief();
        else renderTriage();
      }, r.correct ? 550 : 1000);
    }, 700);
  }

  /* ---------- incident ---------- */

  function renderIncident(result) {
    IP.sfx.play("alarm");
    const em = findEmail(result.emailId);
    const scr = $("screen-incident");
    clear(scr);

    const card = el("div", "incident-card");
    card.appendChild(el("div", "inc-kicker", "MERIDIAN BENEFITS GROUP — IT SECURITY"));
    card.appendChild(el("h2", null, "SECURITY INCIDENT REPORT"));
    card.appendChild(el("div", "inc-meta", "SEVERITY: " + (result.weight >= 3 ? "CRITICAL" : "SERIOUS") +
      "   ·   TRUST " + (result.delta < 0 ? "" : "+") + result.delta));

    const body = el("div", "inc-body");
    body.appendChild(el("p", null, null)).appendChild(
      document.createTextNode("You DELIVERED:"));
    const q = el("div", "inc-mail");
    q.appendChild(el("div", null, "From: " + em.fromName + " <" + em.fromAddr + ">"));
    q.appendChild(el("div", null, null)).appendChild(txt("Subject: " + em.subject));
    body.appendChild(q);
    body.appendChild(el("p", null, null)).appendChild(txt(em.incident || ""));
    body.appendChild(el("p", "inc-noblam", "This is what the simulator is for: the attack was real, the damage was not. Read what happened — then read the flags at end of shift."));
    body.appendChild(el("p", "inc-foot", "IF THIS EVER HAPPENS FOR REAL: REPORT IT IMMEDIATELY. NOBODY IS EVER DISCIPLINED FOR REPORTING — SPEED BEATS SHAME."));
    card.appendChild(body);

    const btn = el("button", "big-btn", "ACKNOWLEDGE");
    btn.addEventListener("click", function () {
      const d = E.day();
      if (E.state.emailIndex >= d.emails.length) renderDebrief();
      else renderTriage();
    });
    card.appendChild(btn);
    scr.appendChild(card);
    showScreen("incident");
    syncTopbar();
  }

  function findEmail(id) {
    for (let i = 0; i < IP.DAYS.length; i++) {
      const hit = IP.DAYS[i].emails.filter(function (e) { return e.id === id; })[0];
      if (hit) return hit;
    }
    return null;
  }

  /* ---------- debrief ---------- */

  function renderDebrief() {
    const summary = E.endDay();
    const d = E.day();
    const dayResults = E.state.results.filter(function (r) { return r.day === E.state.dayIndex; });
    const lastDay = E.state.dayIndex === IP.DAYS.length - 1;

    const scr = $("screen-debrief");
    clear(scr);

    const wrap = el("div", "debrief-wrap");
    const head = el("div", "debrief-head");
    head.appendChild(el("h2", null, "SHIFT COMPLETE — DAY " + d.day + ": " + d.title.toUpperCase()));
    const stats = el("div", "db-stats");
    const acc = Math.round(summary.accuracy * 100);
    function stat(label, value, cls) {
      const s = el("div", "db-stat" + (cls ? " " + cls : ""));
      s.appendChild(el("div", "db-stat-v", value));
      s.appendChild(el("div", "db-stat-l", label));
      return s;
    }
    stats.appendChild(stat("accuracy", acc + "%"));
    stats.appendChild(stat("flagged for review", String(summary.citations), summary.citations ? "bad" : "good"));
    stats.appendChild(stat("security trust", String(summary.trustAfter), summary.trustAfter < 40 ? "bad" : ""));
    wrap.appendChild(head);
    wrap.appendChild(stats);

    if (summary.cleanShift) {
      wrap.appendChild(el("div", "stamp-banner ok", "CLEAN SHIFT — COMMENDED (+3 TRUST)"));
    }
    if (summary.probation) {
      wrap.appendChild(el("div", "stamp-banner bad", "TRUST RUNNING LOW — TAKE THE DEBRIEF BELOW SLOWLY"));
    }
    if (summary.coaching) {
      wrap.appendChild(el("div", "stamp-banner bad", "EXTRA COACHING RECOMMENDED — REVIEW THE FLAGS BELOW"));
    }

    const table = el("div", "db-table");
    const hr = el("div", "db-row db-header");
    ["#", "EMAIL", "YOUR CALL", "CORRECT", "Δ TRUST"].forEach(function (h, i) {
      hr.appendChild(el("span", "db-c db-c" + i, h));
    });
    table.appendChild(hr);

    dayResults.forEach(function (r, idx) {
      const row = el("div", "db-row" + (r.correct ? "" : " bad"));
      row.appendChild(el("span", "db-c db-c0", String(idx + 1)));
      const c1 = el("span", "db-c db-c1");
      c1.appendChild(el("div", "db-subj", null)).appendChild(txt(r.subject));
      c1.appendChild(el("div", "db-from", "— " + r.fromName));
      row.appendChild(c1);
      row.appendChild(el("span", "db-c db-c2", r.choice === "allow" ? "DELIVERED" : "REPORTED"));
      row.appendChild(el("span", "db-c db-c3 " + (r.correct ? "ok-t" : "bad-t"),
                         r.correct ? "✔" :
                         (r.errorType === "fn" ? "✗ PHISH MISSED" : "✗ FALSE REPORT")));
      row.appendChild(el("span", "db-c db-c4", (r.delta > 0 ? "+" : "") + r.delta));

      if (!r.correct) {
        const detail = el("div", "db-detail");
        detail.appendChild(el("div", "db-coach", null)).appendChild(txt(r.coachWrong));

        if (r.flags.length) {
          detail.appendChild(el("div", "db-flaghead", "WHAT TO LOOK FOR NEXT TIME:"));
          r.flags.forEach(function (f) {
            const line = el("div", "db-flag");
            line.appendChild(el("span", "db-flag-zone", "[" + (ZONE_LABELS[f.zone] || f.zone) + "]"));
            line.appendChild(el("b", null, null)).appendChild(txt(f.label));
            if (f.proto) line.appendChild(el("span", "db-flag-proto", " · protocol " + f.proto));
            if (!f.examined) line.appendChild(el("span", "db-flag-miss", " · never inspected"));
            line.appendChild(el("div", "db-flag-explain", null)).appendChild(txt(f.explain));
            detail.appendChild(line);
          });
        }
        row.appendChild(detail);
      } else if (r.flags && r.flags.length) {
        const detail = el("div", "db-detail ok-detail");
        detail.appendChild(el("div", "db-coach", null)).appendChild(txt(r.coachRight));
        row.appendChild(detail);
      }
      table.appendChild(row);
    });
    wrap.appendChild(table);

    // footer stats
    const foot = el("div", "debrief-foot");
    const streakLine = el("div", "db-streak", "BEST STREAK: " + E.state.bestStreak + "   ·   " +
      "TOTAL JUDGED: " + E.state.results.length + "/" + totalEmails());
    foot.appendChild(streakLine);

    const btn = el("button", "big-btn ok-btn",
                   lastDay ? "VIEW FINAL REPORT" : "NEXT DAY ▸");
    btn.addEventListener("click", function () {
      if (lastDay) {
        E.finishCampaign();
        renderFinal();
      } else {
        E.nextDay();
        renderMemo();
      }
    });
    foot.appendChild(btn);
    wrap.appendChild(foot);

    scr.appendChild(wrap);
    showScreen("debrief");
    syncTopbar();
    if (summary.cleanShift) IP.sfx.play("jingle");
  }

  function totalEmails() {
    return IP.DAYS.reduce(function (n, d) { return n + d.emails.length; }, 0);
  }

  /* ---------- final report ---------- */

  function fmtDuration(ms) {
    const m = Math.round(ms / 60000);
    if (m < 60) return m + " min";
    return Math.floor(m / 60) + " h " + (m % 60) + " min";
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function renderFinal() {
    const s = E.finalStats();
    const scr = $("screen-final");
    clear(scr);

    const report = el("div", null);
    report.id = "print-report";
    fillReport(report, s);
    scr.appendChild(report);

    const actions = el("div", "final-actions no-print");
    const printBtn = el("button", "big-btn ok-btn", "PRINT / SAVE REPORT (PDF)");
    printBtn.addEventListener("click", function () { window.print(); });
    const againBtn = el("button", "big-btn", "START NEW SHIFT");
    againBtn.addEventListener("click", function () { E.clearSave(); location.reload(); });
    actions.appendChild(printBtn);
    actions.appendChild(againBtn);
    scr.appendChild(actions);

    showScreen("final");
    IP.sfx.play("jingle");
  }

  function fillReport(rep, s) {
    const head = el("div", "pr-head");
    head.appendChild(el("div", "pr-org", "MERIDIAN BENEFITS GROUP — SECURITY AWARENESS PROGRAM"));
    head.appendChild(el("h2", null, "PHISHING RECOGNITION TRAINING — TRAINING RECORD & COACHING SUMMARY"));
    head.appendChild(el("div", "pr-sub", "INBOX, PLEASE · Mail Screening Exercise · COMPLETED " +
      fmtDate(s.completedAt) + " · duration " + fmtDuration(s.completedAt - s.startedAt)));
    rep.appendChild(head);

    const who = el("div", "pr-who");
    who.appendChild(kv("TRAINEE", s.name));
    who.appendChild(kv("DAYS COMPLETED", s.daysCompleted + " of " + IP.DAYS.length));
    who.appendChild(kv("EMAILS JUDGED", s.totalJudged + " (" + s.correct + " correct)"));
    who.appendChild(kv("SECURITY TRUST (FINAL)", String(s.trust) + " / 100"));
    who.appendChild(kv("FLAGGED FOR REVIEW", String(s.citations)));
    who.appendChild(kv("BEST STREAK", String(s.bestStreak)));
    rep.appendChild(who);

    const gradeBox = el("div", "pr-grade");
    gradeBox.appendChild(el("div", "pr-grade-letter", s.grade));
    gradeBox.appendChild(el("div", "pr-grade-meta", "WEIGHTED ACCURACY " + Math.round(s.weightedAcc * 100) + "%" +
      (s.grade === "A" ? " — EXEMPLARY screening" :
       s.grade === "B" ? " — Strong screening" :
       s.grade === "C" ? " — Solid foundation; review the missed flags" :
       s.grade === "D" ? " — Developing; the missed-flag list is your study guide" :
                         " — Early days; every miss above is a lesson learned safely")));
    rep.appendChild(gradeBox);

    // per-day accuracy
    const dayTbl = el("table", "pr-table");
    dayTbl.appendChild(prRow(["DAY", "SCENARIO DATE", "RESULT"], true));
    s.perDay.forEach(function (pd) {
      dayTbl.appendChild(prRow(["Day " + pd.day, pd.date, pd.correct + " / " + pd.total + " correct"]));
    });
    rep.appendChild(el("h3", "pr-h3", "PERFORMANCE BY DAY"));
    rep.appendChild(dayTbl);

    // category catch rates
    rep.appendChild(el("h3", "pr-h3", "PHISH CATCH RATE BY ATTACK TYPE"));
    const catTbl = el("table", "pr-table");
    catTbl.appendChild(prRow(["ATTACK TYPE", "CAUGHT", "RATE"], true));
    Object.keys(s.categories).forEach(function (k) {
      const c = s.categories[k];
      catTbl.appendChild(prRow([
        CATEGORY_LABELS[k] || k,
        c.caught + " / " + c.total,
        Math.round(100 * c.caught / c.total) + "%"
      ]));
    });
    catTbl.appendChild(prRow(["Legitimate mail safely delivered (traps survived)",
                              s.trapsWon + " / " + s.trapsTotal,
                              Math.round(100 * s.trapsWon / Math.max(1, s.trapsTotal)) + "%"]));
    rep.appendChild(catTbl);

    // missed flags
    rep.appendChild(el("h3", "pr-h3", "MISSED RED FLAGS (BY FREQUENCY)"));
    if (!s.missedFlags.length) {
      rep.appendChild(el("p", "pr-none", "None. Every red flag was caught."));
    } else {
      const ul = el("ul", "pr-flags");
      s.missedFlags.forEach(function (f) {
        const li = el("li");
        li.appendChild(el("b", null, f.label + " ×" + f.count));
        li.appendChild(el("span", null, " — " + f.explain));
        ul.appendChild(li);
      });
      rep.appendChild(ul);
    }

    // signatures
    const sig = el("div", "pr-sign");
    sig.appendChild(sigLine("Trainee signature"));
    sig.appendChild(sigLine("Training coordinator"));
    rep.appendChild(sig);

    rep.appendChild(el("div", "pr-foot",
      "This record was generated locally in the trainee's browser. No data was transmitted or stored on any server."));
  }

  function kv(k, v) {
    const d = el("div", "pr-kv");
    d.appendChild(el("span", "pr-k", k));
    d.appendChild(el("span", "pr-v", v));
    return d;
  }
  function prRow(cells, head) {
    const tr = el("tr", head ? "pr-th-row" : null);
    cells.forEach(function (c, i) {
      tr.appendChild(el(head ? "th" : "td", i === 0 ? "pr-td0" : null, c));
    });
    return tr;
  }
  function sigLine(label) {
    const d = el("div", "pr-sigline");
    d.appendChild(el("div", "pr-sig-space"));
    d.appendChild(el("div", "pr-sig-label", label + " / date"));
    return d;
  }

  /* ---------- keyboard ---------- */

  function onKey(e) {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;

    if (e.key === "m" || e.key === "M") { toggleMute(); return; }

    if (E.state.screen !== "triage" || deciding) return;

    if (e.key === "a" || e.key === "A") { onDecide("allow"); }
    else if (e.key === "p" || e.key === "P") { onDecide("report"); }
    else if (e.key === "h" || e.key === "H") { toggleHeaders(); }
  }

  /* ---------- topbar buttons ---------- */

  function toggleMute() {
    const m = IP.sfx.toggle();
    $("btn-mute").textContent = m ? "SOUND OFF" : "SOUND ON";
  }

  function bindTopbar() {
    $("btn-rules").addEventListener("click", function () {
      if (E.state.screen === "triage") renderMemo(true);
    });
    $("btn-mute").addEventListener("click", toggleMute);
    $("btn-crt").addEventListener("click", function () {
      const sl = $("scanlines");
      sl.classList.toggle("off");
      $("btn-crt").classList.toggle("active");
    });
    $("btn-headers").addEventListener("click", toggleHeaders);
    $("btn-allow").addEventListener("click", function () { onDecide("allow"); });
    $("btn-report").addEventListener("click", function () { onDecide("report"); });
  }

  /* ---------- boot ---------- */

  function boot() {
    bindTitle();
    bindTopbar();
    document.addEventListener("keydown", onKey);
    $("btn-mute").textContent = IP.sfx.isMuted() ? "SOUND OFF" : "SOUND ON";
    if (IP.sfx.isMuted()) $("btn-mute").classList.add("muted");
    renderTitle();
  }

  document.addEventListener("DOMContentLoaded", boot);

  return {
    showScreen: showScreen,
    renderTitle: renderTitle,
    renderMemo: renderMemo,
    renderTriage: renderTriage,
    renderDebrief: renderDebrief,
    renderFinal: renderFinal
  };
})();
