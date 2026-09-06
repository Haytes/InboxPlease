# INBOX, PLEASE

A "Papers, Please"-style phishing recognition training game. You are the mail
screener for the claims inbox at Meridian Benefits Group: six shifts, 31
emails, every judgment logged. Deliver the legitimate, report the phish.

Zero dependencies, no build step, no network calls, no server. Everything
runs locally in the browser.

## Run it

Open `index.html` in any modern desktop browser (double-click works — no
web server needed). Or host the folder anywhere static.

## Deploy (Vercel)

Fully static — no build step, no config needed. Pick one:

- **Drag & drop:** [vercel.com/new](https://vercel.com/new), drag this folder.
  Tip: drag the folder *contents* minus `test/` (screenshots add weight).
- **CLI:** `npx vercel` from this directory (`.vercelignore` already excludes
  `test/` for you).
- **Git:** push to GitHub, import the repo in Vercel — auto-redeploys on push.

Notes:
- Saves are per-browser (`localStorage`) — every visitor gets their own run.
- After the first deploy you have a fixed URL; optionally make `og:image` in
  `index.html` absolute (`https://your-app.vercel.app/og-image.png`) for
  maximally reliable link previews.

## How to play

- Each email must be judged: **ALLOW** (deliver) or **REPORT PHISHING**.
- **Inspect before you rule:**
  - The sender's real address is always visible under the display name.
  - **FULL HEADERS** (button or `H`) reveals Reply-To and, from Day 4,
    SPF/DKIM/DMARC authentication chips.
  - **Hover any link** (or Tab to it) — the true URL appears in the status
    bar. From Day 5 the Domain Inspector decomposes it right-to-left and
    flags punycode/lookalike characters.
  - **Click attachments** to see the full filename, size, and type.
- Between days, IT Security memos introduce new attack types and protocols.
- Wrong calls are flagged for coaching (trust dips); serious misses walk through
  what would have happened — blame-free. The incident screens always remind
  players that reporting a real mistake quickly is always the right move.
- The campaign ends with a printable training record (name, grade, catch
    rates per attack type, missed red flags) with signature lines for
    compliance filing.

### Keyboard

| Key | Action |
|-----|--------|
| `A` | Allow (deliver) |
| `P` | Report phishing |
| `H` | Toggle full headers |
| `M` | Mute / unmute |

### Scoring

- Security Trust starts at 70 (0–100).
- Missed phish: −6 × severity (1–3). False report: −2 × severity.
- Correct call: +2 (streak of 5+ earns +1 commendations).
- Day accuracy ≥ 80%: +3 clean-shift bonus. Third flagged call in a day: −2.
- Final grade = weighted accuracy: A ≥ 95%, B ≥ 85%, C ≥ 70%, D ≥ 55%.

## Editing the campaign

All content lives in `js/data.js` in the `IP.DAYS` array — one object per
day: the IT memo, the protocol list, tool unlocks, and the day's emails.
Each email is a plain object (`fromName`, `fromAddr`, `replyTo`, `auth`,
`body` blocks, `attachments`, `verdict`, `redFlags`, coaching text). Copy an
existing email as a template and edit. No other file needs to change for
content edits.

## Project layout

```
index.html        screen shells + script load order
css/base.css      palette, topbar, toasts, scanlines
css/client.css    the mail client (list / reading pane / verdict bar)
css/screens.css   title, memo, incident, debrief, final report
css/print.css     one-page printable training record
js/data.js        all campaign content (6 memos, 31 emails)
js/engine.js      state machine + scoring (DOM-free)
js/audio.js       WebAudio-synthesized sound effects
js/ui.js          rendering, events, keyboard
```

## Notes

- Progress auto-saves to `localStorage` where available (wrapped in
  try/catch — the game is fully playable in one sitting without it).
- No data ever leaves the browser; the print report is generated locally.
