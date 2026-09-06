/* Browser smoke test: plays the full campaign in headless Chromium via file://
   Run: node test/browser.js
   Screenshots land in test/shots/ */

const path = require("path");
const fs = require("fs");
const PW = require("/home/hayter/benefits-crm-nextjs/node_modules/playwright");

const ROOT = "file://" + path.resolve(__dirname, "..", "index.html");
const SHOTS = path.join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
const check = (cond, msg) => {
  console.log((cond ? "  PASS  " : "  FAIL  ") + msg);
  if (!cond) failures++;
};

(async () => {
  const browser = await PW.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  page.on("console", m => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", e => consoleErrors.push(String(e)));

  await page.goto(ROOT);
  await page.waitForTimeout(300);

  check(await page.locator("#screen-title.active").count() === 1, "title screen shown");
  await page.screenshot({ path: SHOTS + "/01-title.png" });

  // resume button hidden without save
  check(await page.locator("#btn-resume").isHidden(), "resume hidden without save");

  // empty name rejected
  await page.click("#btn-begin");
  await page.waitForTimeout(200);
  check(await page.locator("#screen-title.active").count() === 1, "empty name rejected");

  // begin for real
  await page.fill("#name-input", "J. Alvarez");
  await page.click("#btn-begin");
  await page.waitForTimeout(300);
  check(await page.locator("#screen-intro.active").count() === 1, "intro letter after begin");
  const letter = await page.locator("#screen-intro").textContent();
  check(letter.includes("J. Alvarez"), "letter addressed to player by name");
  check(letter.includes("MAIL SCREENING DIVISION"), "assignment story present");
  await page.screenshot({ path: SHOTS + "/01b-intro.png" });
  await page.click("#screen-intro .big-btn");
  await page.waitForTimeout(300);
  check(await page.locator("#screen-memo.active").count() === 1, "memo screen after intro");
  check((await page.locator(".memo-proto-list li").count()) === 4, "day 1 protocols rendered");
  await page.screenshot({ path: SHOTS + "/02-memo.png" });

  await page.click("#screen-memo .big-btn");
  await page.waitForTimeout(300);
  check(await page.locator("#screen-triage.active").count() === 1, "triage screen after acknowledge");
  check(await page.locator("#msg-list .msg-row").count() === 5, "day 1 queue of 5 rendered");

  /* ---- inspection mechanics on email 1 (prize spam) ---- */
  check((await page.locator("#m-subject").textContent()).includes("CONGRATULATIONS"), "subject renders");
  const link = page.locator(".fake-link").first();
  await link.hover();
  await page.waitForTimeout(150);
  const sb = await page.locator("#sb-url").textContent();
  check(sb.includes("lucky-winners.info"), "status bar shows hovered URL (got: " + sb + ")");
  // day 1: no inspector decomposition yet
  check((await page.locator("#sb-domain").textContent()) === "", "domain inspector locked on day 1");

  // header panel hidden initially; H toggles (but header tool is day 2+... button still exists)
  const headerVisible0 = await page.locator("#header-panel").isVisible();
  check(!headerVisible0, "header panel starts closed");
  await page.click("#btn-headers");
  await page.waitForTimeout(150);
  check(await page.locator("#header-panel").isVisible(), "header panel opens");
  await page.screenshot({ path: SHOTS + "/03-triage.png" });
  await page.click("#btn-headers");

  /* ---- play day 1 correctly, alternating inspection behavior ---- */
  // email 1: report the spam. Wrong-call test first: temporarily do nothing wrong; play correct.
  async function judge(choice) {
    await page.keyboard.press(choice === "allow" ? "a" : "p");
    await page.waitForTimeout(1900); // stamp + feedback timers
  }
  const verdicts = await page.evaluate(() => IP.DAYS.flatMap(d => d.emails.map(e => e.verdict)));

  // report email 1 (phish)
  await judge("report");
  await page.waitForTimeout(200);
  check(await page.locator("#msg-list .msg-row.done").count() === 1, "judged row collapses to stamped record");

  // allow email 2 (legit potluck)
  await judge("allow");
  // email 3: phish w2 — ALLOW it to trigger an incident interstitial
  await judge("allow");
  await page.waitForTimeout(300);
  check(await page.locator("#screen-incident.active").count() === 1, "incident interstitial on serious miss");
  await page.screenshot({ path: SHOTS + "/04-incident.png" });
  await page.click("#screen-incident .big-btn");
  await page.waitForTimeout(300);

  // trust: 70 +2 (report spam) +2 (allow potluck) -12 (allowed w2 phish) = 62
  const trustNow = parseInt(await page.locator("#trust-num").textContent(), 10);
  check(trustNow === 62, "trust math in UI: 70 +2 +2 -12 = 62 (got " + trustNow + ")");

  // email 4: legit newsletter → allow. email 5: phish invoice → report
  await judge("allow");
  await judge("report");
  await page.waitForTimeout(300);
  check(await page.locator("#screen-debrief.active").count() === 1, "debrief after last email of day");
  await page.screenshot({ path: SHOTS + "/05-debrief.png", fullPage: true });

  // day 1: 4/5 correct → 80% → clean shift
  const debText = await page.locator("#screen-debrief").textContent();
  check(debText.includes("CLEAN SHIFT"), "clean-shift banner at 80%");

  /* ---- mid-campaign reload: save/resume (saved mid-debrief) ---- */
  await page.reload();
  await page.waitForTimeout(400);
  check(await page.locator("#btn-resume").isVisible(), "resume offered after reload mid-campaign");
  await page.click("#btn-resume");
  await page.waitForTimeout(300);
  // day 1 finished but NEXT DAY never clicked -> resume lands on day 1 debrief
  check(await page.locator("#screen-debrief.active").count() === 1, "resume lands on day 1 debrief");
  await page.click("#screen-debrief .big-btn");   // NEXT DAY -> day 2 memo
  await page.waitForTimeout(300);
  check(await page.locator("#screen-memo.active").count() === 1, "day 2 memo after NEXT DAY");
  check((await page.locator("#tb-day").textContent()).includes("DAY 2"), "topbar shows DAY 2");

  /* ---- fast-forward all remaining days correctly ---- */
  const dayCount = await page.evaluate(() => IP.DAYS.length);
  for (let d = 1; d < dayCount; d++) { // currently on day index 1 memo
    // acknowledge memo
    await page.click("#screen-memo .big-btn");
    await page.waitForTimeout(250);
    const nEmails = await page.evaluate(() => IP.engine.emails().length);
    for (let i = 0; i < nEmails; i++) {
      const verdict = await page.evaluate(() => IP.engine.email().verdict);
      // exercise one inspection per email: open headers
      const headerBtnVisible = await page.locator("#btn-headers").isVisible();
      if (headerBtnVisible) { await page.click("#btn-headers"); await page.waitForTimeout(60); await page.click("#btn-headers"); }
      await judge(verdict === "phish" ? "report" : "allow");
      // if an incident somehow fired, acknowledge it
      if (await page.locator("#screen-incident.active").count() === 1) {
        await page.click("#screen-incident .big-btn");
        await page.waitForTimeout(200);
      }
    }
    await page.waitForTimeout(300);
    check(await page.locator("#screen-debrief.active").count() === 1, "debrief reached for day " + (d + 1));
    // click through debrief
    await page.click("#screen-debrief .big-btn");
    await page.waitForTimeout(300);
  }

  check(await page.locator("#screen-final.active").count() === 1, "final report reached");
  const grade = await page.locator(".pr-grade-letter").textContent();
  check(grade.trim() === "A", "perfect play grades A (got " + grade + ")");
  await page.screenshot({ path: SHOTS + "/06-final.png", fullPage: true });

  // day-5 inspector spot check happened implicitly; verify report contents
  const rep = await page.locator("#print-report").textContent();
  check(rep.includes("J. Alvarez"), "report carries trainee name");
  check(rep.includes("PHISH CATCH RATE BY ATTACK TYPE"), "category table present");
  check(rep.includes("Trainee signature"), "signature lines present");

  // print media emulation: only the report visible
  await page.emulateMedia({ media: "print" });
  await page.screenshot({ path: SHOTS + "/07-print.png", fullPage: true });
  await page.emulateMedia({ media: "screen" });

  /* ---- RULES overlay + mute + keyboard from a fresh day? quick sanity via new game ---- */
  await page.evaluate(() => { IP.engine.startCampaign("Keyboard Test"); IP.ui.renderMemo(); });
  await page.click("#screen-memo .big-btn");
  await page.waitForTimeout(200);
  await page.click("#btn-rules");
  await page.waitForTimeout(200);
  check(await page.locator("#screen-memo.active").count() === 1, "RULES reopens memo overlay");
  await page.click("#screen-memo .big-btn");
  await page.waitForTimeout(200);
  check(await page.locator("#screen-triage.active").count() === 1, "overlay returns to triage");
  // header inspection state preserved across overlay round-trip
  await page.click("#btn-headers");
  await page.waitForTimeout(100);
  const hdrOpen = await page.locator("#header-panel").isVisible();
  await page.click("#btn-rules"); await page.click("#screen-memo .big-btn");
  await page.waitForTimeout(200);
  check(await page.locator("#header-panel").isVisible() === hdrOpen, "header panel state preserved across RULES overlay");

  // keyboard mute
  await page.keyboard.press("m");
  const muteTxt = await page.locator("#btn-mute").textContent();
  check(muteTxt.includes("OFF"), "M toggles mute (got " + muteTxt + ")");
  await page.keyboard.press("m");

  // day-2 email 5: Reply-To mismatch should be flagged in header panel warn
  await page.evaluate(() => { IP.engine.startCampaign("Hdr Test"); IP.engine.state.dayIndex = 1; IP.engine.state.emailIndex = 4; IP.engine.beginEmail(); IP.ui.renderTriage(); });
  await page.waitForTimeout(200);
  await page.click("#btn-headers");
  await page.waitForTimeout(150);
  const hp = await page.locator("#header-panel").textContent();
  check(hp.includes("Reply-To") && hp.includes("protonmail"), "reply-to visible in headers (d2e05)");
  check(hp.includes("differs from From"), "reply-to mismatch warning shown");
  await page.screenshot({ path: SHOTS + "/08-headers-replyto.png" });

  // day-5: domain inspector decomposition + homoglyph warn
  await page.evaluate(() => { IP.engine.state.dayIndex = 4; IP.engine.state.emailIndex = 1; IP.engine.state.toolsUnlocked = ["link","attach","header","vendor","auth","inspector"]; IP.engine.beginEmail(); IP.ui.renderTriage(); });
  await page.waitForTimeout(200);
  const link5 = page.locator(".fake-link").first();
  await link5.hover();
  await page.waitForTimeout(200);
  const dom = await page.locator("#sb-domain").textContent();
  check(dom.includes("mail-gate.net") && dom.includes("owner"), "domain inspector decomposes subdomain trick (got: " + dom.slice(0, 90) + ")");
  // homoglyph email
  await page.evaluate(() => { IP.engine.state.emailIndex = 2; IP.engine.beginEmail(); IP.ui.renderTriage(); });
  await page.waitForTimeout(150);
  await page.click("#btn-headers");
  await page.waitForTimeout(150);
  const hp5 = await page.locator("#header-panel").textContent();
  check(hp5.includes("non-ASCII lookalike"), "homoglyph warning fires in header inspector");
  await page.screenshot({ path: SHOTS + "/09-homoglyph.png" });

  // attachment inspect: day 4 exe
  await page.evaluate(() => { IP.engine.state.dayIndex = 3; IP.engine.state.emailIndex = 0; IP.engine.beginEmail(); IP.ui.renderTriage(); });
  await page.waitForTimeout(150);
  await page.click(".attach-chip");
  await page.waitForTimeout(150);
  const ad = await page.locator(".attach-detail").textContent();
  check(ad.includes("Enrollment_Form.pdf.exe"), "full filename revealed on inspect (got: " + ad.slice(0, 60) + ")");
  check(ad.includes(".exe"), "double extension visible");

  // auth chips day 4
  await page.click("#btn-headers");
  await page.waitForTimeout(150);
  const auth = await page.locator("#header-panel .auth-chips").textContent();
  check(/SPF:\s*NONE/i.test(auth) && /DKIM:\s*NONE/i.test(auth), "auth chips rendered (got: " + auth + ")");

  console.log("\nconsole errors during run: " + (consoleErrors.length ? "\n  " + consoleErrors.join("\n  ") : "none"));
  check(consoleErrors.length === 0, "zero console errors");

  await browser.close();
  console.log("\n" + (failures === 0 ? "BROWSER SMOKE TEST PASSED ✔" : failures + " CHECK(S) FAILED ✗"));
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error("FATAL", e); process.exit(1); });
