/* ============================================================
   INBOX, PLEASE — data.js
   All campaign content. Pure data, no logic.

   Company: Meridian Benefits Group (meridianbenefits.com)
   Player: mail screener for the claims@ shared inbox.

   Email object reference:
     id, time                 — unique key, list time
     fromName                 — display name (spoof surface)
     fromAddr                 — real From address (always visible)
     replyTo                  — revealed by FULL HEADERS panel
     addrRaw                  — optional raw/punycode form for inspector
     auth                     — {spf,dkim,dmarc} shown Day 4+
     subject, body[]          — blocks: p | link | quote | sig | qr
     attachments[]            — {name, size, kind}
     verdict                  — "phish" | "legit"
     category / trapType      — reporting buckets
     weight                   — 1 std · 2 serious · 3 critical
     redFlags[]               — {zone: from|header|body|link|attach|qr,
                                key, label, explain, proto}
     coachRight / coachWrong  — debrief coaching
     incident                 — FN interstitial text (phish w>=2)
     fpNote                   — consequence flavor when a legit is reported
   ============================================================ */

window.IP = window.IP || {};

IP.DAYS = [

/* ══════════════════════ DAY 1 ══════════════════════ */
{
  day: 1,
  date: "Monday, October 6",
  title: "The Basics",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "MANDATORY READ — Mail Screening Protocol v2.1",
    paragraphs: [
      "Following last quarter's incidents, all inbound mail to the claims shared mailbox is now screened by a designated Mail Screener before delivery. As of this morning, that screener is you.",
      "You will judge every message before it reaches the team. Every call is logged so you can watch your own radar sharpen over the week. Misses are expected here — this is a simulator. Each one becomes a coaching note, not a mark against you.",
      "Two tools are authorized for your station: the LINK INSPECTOR (hover any link — its true address appears in the status bar) and the ATTACHMENT INSPECTOR (click an attachment to see its full details)."
    ],
    protocols: [
      { id: "1.1", text: "DELIVER only mail you believe is legitimate." },
      { id: "1.2", text: "REPORT mail that solicits credentials, money, or personal data." },
      { id: "1.3", text: "HOVER every link. The true address shows in the status bar." },
      { id: "1.4", text: "INSPECT attachments before ruling — read the full filename." }
    ],
    unlockNote: "NEW TOOLS AUTHORIZED: LINK INSPECTOR + ATTACHMENT INSPECTOR"
  },
  tools: ["link", "attach"],
  vendors: [],
  emails: [
    {
      id: "d1e01", time: "07:42",
      fromName: "Lucky Draw Winners Dept.",
      fromAddr: "luckydraw@lucky-winners.info",
      replyTo: null, auth: null,
      subject: "CONGRATULATIONS!!! You have WON a FREE iPhone 27 Pro MAX",
      body: [
        { t: "p", text: "DEAR VALUED CUSTOMER!!!" },
        { t: "p", text: "You have been SELECTED from 10,000,000 entries to receive a BRAND NEW iPhone 27 Pro MAX (512GB, Titanium) ABSOLUTELY FREE!!! No purchase necessary!!!" },
        { t: "p", text: "This offer EXPIRES in 24 HOURS. Claim now before the contest closes!!!" },
        { t: "link", label: "CLAIM YOUR PRIZE NOW >>", href: "http://claim.lucky-winners.info/winner?id=88231" },
        { t: "sig", text: "Lucky Draw Winners Dept. — Void where prohibited. Not affiliated with Apple Inc." }
      ],
      attachments: [],
      verdict: "phish", category: "mass-spam", weight: 1,
      redFlags: [
        { zone: "body", key: true, label: "Too good to be true", proto: "1.2",
          explain: "You did not enter any contest. Nobody gives away flagship phones for existing." },
        { zone: "link", key: true, label: "Prize page on a throwaway domain", proto: "1.3",
          explain: "Hover the link: a plain http address on lucky-winners.info — no prize fulfillment happens there." },
        { zone: "body", key: false, label: "All-caps hype + countdown", proto: null,
          explain: "Shouting, exclamation barrage and a 24-hour fuse are pressure markers, not prize markers." }
      ],
      coachRight: "Mass-marketing spam — the easiest catch on the record. If you didn't enter, you didn't win.",
      coachWrong: "A prize you never entered for, hyped in all caps, on a plain-http .info page. Every classic marker was on display.",
      incident: null, fpNote: null
    },
    {
      id: "d1e02", time: "07:58",
      fromName: "Dana Ruiz",
      fromAddr: "d.ruiz@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "Potluck Friday — Dana bringing her famous chili",
      body: [
        { t: "p", text: "Team — potluck Friday to celebrate surviving open enrollment prep. I'm bringing the chili (yes, THE chili). Sign-up sheet is on the fridge by the coffee machine." },
        { t: "p", text: "Ken already claimed pie. Nobody else bring pie. We talked about this." },
        { t: "sig", text: "D. Ruiz — Claims" }
      ],
      attachments: [],
      verdict: "legit", trapType: "boring", weight: 1,
      redFlags: [],
      coachRight: "Plain, boring, internal, from a colleague's real address. Boring is what legitimate mail usually looks like.",
      coachWrong: null,
      incident: null,
      fpNote: "You quarantined Dana's potluck note — real internal address, no links, no attachments. Not every friendly email is a trap."
    },
    {
      id: "d1e03", time: "08:41",
      fromName: "IT Helpdesk",
      fromAddr: "it-helpdesk@meridian-benefits-secure.ru",
      replyTo: null, auth: null,
      subject: "Urgent: your mailbox will be suspended in 24 hours",
      body: [
        { t: "p", text: "Dear User," },
        { t: "p", text: "Our records show your mailbox has exceeded its storage quota and failed validation. Unless you re-validate within 24 hours, your mailbox will be PERMANENTLY SUSPENDED and all pending claims correspondence will be lost." },
        { t: "p", text: "Re-validate immediately to avoid suspension:" },
        { t: "link", label: "Re-validate mailbox", href: "http://mailbox-verify.meridian-benefits-secure.ru/login" },
        { t: "sig", text: "IT Helpdesk — Mail System Administrator" }
      ],
      attachments: [],
      verdict: "phish", category: "credential", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Foreign lookalike domain", proto: "1.2",
          explain: "Meridian IT writes from meridianbenefits.com. 'meridian-benefits-secure.ru' is a stranger wearing IT's name badge." },
        { zone: "body", key: true, label: "Credential harvest", proto: "1.2",
          explain: "Real IT will never send you to a foreign page to 're-validate' a password." },
        { zone: "link", key: false, label: "Plain http link", proto: "1.3",
          explain: "Hover it: no encryption, wrong domain. Corporate systems link to corporate domains." },
        { zone: "body", key: false, label: "Manufactured deadline", proto: null,
          explain: "'24 hours or everything is deleted' — panic is the product being sold here." }
      ],
      coachRight: "IT does not suspend mailboxes through .ru re-validation pages. Threat + deadline + credential form = report.",
      coachWrong: "A suspension threat from a .ru lookalike, pointing at a plain-http login page. This phish survives only on panic.",
      incident: "The 're-validation' page harvested a colleague's mailbox password. IT forced a reset and the claims queue stalled for three hours.",
      fpNote: null
    },
    {
      id: "d1e04", time: "09:05",
      fromName: "Meridian Communications",
      fromAddr: "communications@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "The Weekly Wrap — Oct 6",
      body: [
        { t: "p", text: "Your weekly dose of Meridian: open enrollment dates are live, the third-floor coffee machine is fixed (again), and Ken's parking spot saga enters its fourth week." },
        { t: "p", text: "Read the full Wrap (5 minutes):" },
        { t: "link", label: "Read this week's Wrap", href: "https://intranet.meridianbenefits.com/weekly-wrap?utm_source=internal&utm_medium=email" },
        { t: "sig", text: "The Wrap — Meridian Benefits Group Communications" }
      ],
      attachments: [],
      verdict: "legit", trapType: "tracking", weight: 1,
      redFlags: [],
      coachRight: "Internal sender, internal intranet host. The utm_source parameters are just newsletter analytics — tracking parameters alone are not a phish marker.",
      coachWrong: null,
      incident: null,
      fpNote: "That was the real company newsletter. Tracking parameters (utm_*) measure clicks; they don't make a link malicious."
    },
    {
      id: "d1e05", time: "09:37",
      fromName: "Toner Solutions — Accounts",
      fromAddr: "accounts@toner-solutions-biz.com",
      replyTo: null, auth: null,
      subject: "Past due invoice — remit today",
      body: [
        { t: "p", text: "Our records indicate invoice #447 remains unpaid 30 days past terms. A 2% late charge applies to remittances received after Friday." },
        { t: "p", text: "Statement attached for your records. Please arrange immediate payment." },
        { t: "sig", text: "Accounts Receivable — Toner Solutions" }
      ],
      attachments: [
        { name: "Invoice_447.htm", size: "38 KB", kind: "Web page attachment (.htm)" }
      ],
      verdict: "phish", category: "attachment", weight: 1,
      redFlags: [
        { zone: "attach", key: true, label: "Web-page attachment", proto: "1.4",
          explain: "Inspect it: the 'invoice' is a .htm web page — it can carry scripts. Real invoices arrive as PDFs." },
        { zone: "from", key: false, label: "Unknown 'vendor'", proto: null,
          explain: "No toner contract exists with this company. Unfamiliar vendors demanding money are bait." },
        { zone: "body", key: false, label: "Payment pressure", proto: null,
          explain: "Late fees + deadlines rush you past the question 'do we even buy from them?'" }
      ],
      coachRight: "An unknown vendor, demanding payment, with a web page for an invoice. Invoices do not arrive as .htm files.",
      coachWrong: "You delivered an unknown vendor's 'invoice' with a web-page attachment — a classic malware delivery pattern.",
      incident: null, fpNote: null
    }
  ]
},

/* ══════════════════════ DAY 2 ══════════════════════ */
{
  day: 2,
  date: "Tuesday, October 7",
  title: "Know Your Sender",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "Advisory 2 — Display-name spoofing up 300%",
    paragraphs: [
      "Yesterday's catch was acceptable. Today the attacks get personal: attackers are forging display names — the friendly label in front of the address — to impersonate executives and departments.",
      "A display name is decoration. Anyone can type anything there. The evidence is the address itself, and the Reply-To when one is present.",
      "Your station is authorized an upgrade: the FULL HEADER PANEL (button under the sender, or H) exposes the true From, Reply-To, and — later this week — authentication results."
    ],
    protocols: [
      { id: "2.1", text: "The display name is decoration. Judge the real address — and the REPLY-TO." },
      { id: "2.2", text: "Executives never request gift cards, prepaid codes, or wires by email." },
      { id: "2.3", text: "Lookalike domains — extra words or hyphens around meridianbenefits — are not the company." }
    ],
    unlockNote: "NEW TOOL AUTHORIZED: FULL HEADER PANEL (press H)"
  },
  tools: ["header"],
  vendors: [],
  emails: [
    {
      id: "d2e01", time: "08:12",
      fromName: "Marcus Webb — CEO",
      fromAddr: "m.webb.official.2026@gmail-secure-mail.com",
      replyTo: null, auth: null,
      subject: "Quick favor before the board call",
      body: [
        { t: "p", text: "{{name}} — boarding my flight to Denver for the board meeting and my phone is nearly dead." },
        { t: "p", text: "I need you to pick up 4 x $200 Apple gift cards for the client dinner tonight. Scratch the codes and reply with them here — I'll expense everything on Monday." },
        { t: "p", text: "Can't talk, just email. Going to gate now." },
        { t: "link", label: "View the request", href: "https://giftcards-request.zendesk-verify.ru/case/8812" },
        { t: "sig", text: "Sent from Marcus Webb's iPhone" }
      ],
      attachments: [],
      verdict: "phish", category: "bec", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "CEO on a free-mail domain", proto: "2.1",
          explain: "The display name says CEO. The address says a Gmail lookalike. Marcus Webb writes from meridianbenefits.com." },
        { zone: "body", key: true, label: "Gift-card request", proto: "2.2",
          explain: "No executive funds client dinners through scratch-off codes. Gift cards are untraceable — that's why fraudsters love them." },
        { zone: "body", key: false, label: "Unreachable + rushed", proto: null,
          explain: "'Phone dead, can't talk, about to board' — the scam needs you unable to verify. That need is the tell." },
        { zone: "link", key: false, label: "Foreign 'case' link", proto: "1.3",
          explain: "Hover: a .ru ticketing page has nothing to do with Apple gift cards or Meridian." }
      ],
      coachRight: "Executives never ask staff to buy gift cards by email. Verify money requests out-of-band — by phone, on a number you already have.",
      coachWrong: "The CEO 'signature' was a Gmail lookalike asking for scratched gift-card codes. Business email compromise survives on urgency and name-dropping.",
      incident: "The front desk bought $800 in gift cards and replied the codes. They were redeemed overseas within the hour.",
      fpNote: null
    },
    {
      id: "d2e02", time: "08:30",
      fromName: "Marcus Webb",
      fromAddr: "m.webb@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "Q3 results — all hands Thursday",
      body: [
        { t: "p", text: "Team — Q3 closed ahead of target on the group benefits side. I want the whole claims floor at Thursday's all-hands; enrollment season is our playoffs." },
        { t: "p", text: "Details from Comms tomorrow. Good work last quarter." },
        { t: "sig", text: "Marcus" }
      ],
      attachments: [],
      verdict: "legit", trapType: "exec", weight: 1,
      redFlags: [],
      coachRight: "The real CEO, from his real internal address, saying normal CEO things. This morning's scam doesn't make every executive email a phish.",
      coachWrong: null,
      incident: null,
      fpNote: "You quarantined the CEO's actual all-hands announcement — from his real internal address. He noticed. Pattern-matching on 'important sender' burns trust both ways."
    },
    {
      id: "d2e03", time: "09:04",
      fromName: "Meridian Benefits Portal",
      fromAddr: "no-reply@meridianbenefits-secure.com",
      replyTo: null, auth: null,
      subject: "Action required: benefits portal password expiry",
      body: [
        { t: "p", text: "Your benefits portal password expires in 48 hours. After expiry, access to your benefits, claims history and direct deposit details will be locked." },
        { t: "p", text: "Renew now to avoid interruption:" },
        { t: "link", label: "Renew password now", href: "https://meridianbenefits-secure.com/portal/session-expired?ref=claims" },
        { t: "sig", text: "Meridian Benefits Portal — automated notice" }
      ],
      attachments: [],
      verdict: "phish", category: "lookalike", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Hyphenated lookalike domain", proto: "2.3",
          explain: "meridianbenefits-secure.com is NOT meridianbenefits.com. One hyphen makes it someone else's property." },
        { zone: "link", key: true, label: "Harvest page on the lookalike", proto: "1.3",
          explain: "Hover: the 'renewal' link runs on the same fake domain. Your password would be renewed straight into a thief's log." },
        { zone: "body", key: false, label: "Credential lure", proto: "1.2",
          explain: "Password expiry notices that demand immediate action are the single most-imitated corporate email." }
      ],
      coachRight: "One hyphen is the whole trick. Read domains character by character — the real portal lives on meridianbenefits.com.",
      coachWrong: "The sender and the link both lived on meridianbenefits-secure.com — a hyphen away from the real thing, and a world away in ownership.",
      incident: "Three claimants' portal sessions were captured by the fake renewal page before IT blocked the domain.",
      fpNote: null
    },
    {
      id: "d2e04", time: "09:31",
      fromName: "Zenith Payroll",
      fromAddr: "notifications@zenithpayroll.com",
      replyTo: null, auth: null,
      subject: "October payroll schedule",
      body: [
        { t: "p", text: "Meridian Benefits Group — October payroll will run Thursday, Oct 23 (early, due to the holiday week). Direct deposit advices will post Friday." },
        { t: "p", text: "Full calendar:" },
        { t: "link", label: "Download payroll calendar (PDF)", href: "https://zenithpayroll.com/calendars/meridian-oct-2026.pdf" },
        { t: "sig", text: "Zenith Payroll — Client Services" }
      ],
      attachments: [],
      verdict: "legit", trapType: "vendor-first", weight: 1,
      redFlags: [],
      coachRight: "An outside sender — but the link domain matches the sender exactly, and it asks for nothing. Outside is not the same as malicious.",
      coachWrong: null,
      incident: null,
      fpNote: "Zenith is Meridian's actual payroll processor. Their mail will be back — and tomorrow you'll have an approved-senders card to prove it."
    },
    {
      id: "d2e05", time: "10:15",
      fromName: "Meridian HR",
      fromAddr: "hr@meridianbenefits.com",
      replyTo: "contacts.update@protonmail.com",
      auth: null,
      subject: "Update your emergency contacts",
      body: [
        { t: "p", text: "Annual check: please confirm your emergency contact details are current. Outdated contacts delay benefits processing for you and your dependents." },
        { t: "p", text: "Updates take two minutes:" },
        { t: "link", label: "Update your details", href: "https://meridianbenefits-hr.contact-update.site/form" },
        { t: "sig", text: "Human Resources — Meridian Benefits Group" }
      ],
      attachments: [],
      verdict: "phish", category: "replyto", weight: 2,
      redFlags: [
        { zone: "header", key: true, label: "Reply-To betrays the sender", proto: "2.1",
          explain: "Open the headers: From says HR@meridianbenefits.com, but replies route to a ProtonMail account. Real HR does not need your answers delivered to ProtonMail." },
        { zone: "link", key: true, label: "Unrelated link domain", proto: "1.3",
          explain: "Hover: the form lives on contact-update.site — no Meridian domain anywhere in it." },
        { zone: "from", key: false, label: "Forged internal address", proto: "2.1",
          explain: "The From line was stolen, not earned. The header panel is where stolen addresses fall apart." }
      ],
      coachRight: "The From line can lie; the Reply-To and the link domain can't afford to. One header check unraveled the whole costume.",
      coachWrong: "The From line was a forgery — but the headers showed replies routed to ProtonMail, and the form ran on contact-update.site. Two clicks of inspection, two lies exposed.",
      incident: "The 'update form' captured two employees' personal details, including home addresses and emergency contacts.",
      fpNote: null
    }
  ]
},

/* ══════════════════════ DAY 3 ══════════════════════ */
{
  day: 3,
  date: "Wednesday, October 8",
  title: "Pressure Tactics",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "Advisory 3 — Urgency scams + the approved senders list",
    paragraphs: [
      "Today's wave is built on pressure: executives 'in meetings', coverage that 'laps', deadlines that 'cannot be extended'. Urgency is a technique, not a credential.",
      "Note well: REAL IT and HR mail is sometimes genuinely urgent. The difference is never the tone — it is where the links live and who sent it. Genuine internal mail links only to *.meridianbenefits.com.",
      "Because vendor spoofing is rising, the APPROVED SENDERS card is now mounted at your station. Third-party mail must match it."
    ],
    protocols: [
      { id: "3.1", text: "Urgency and threats are lures, not proof of legitimacy." },
      { id: "3.2", text: "Genuine IT/HR mail links only to *.meridianbenefits.com." },
      { id: "3.3", text: "Vendor mail must match the APPROVED SENDERS card." },
      { id: "3.4", text: "Wire and bank-detail changes are confirmed by phone — never by email." }
    ],
    unlockNote: "NEW REFERENCE MOUNTED: APPROVED SENDERS CARD (sidebar)"
  },
  tools: ["vendor"],
  vendors: [
    { dom: "zenithpayroll.com", note: "Zenith Payroll — payroll processing" },
    { dom: "benadmin-portal.com", note: "BenAdmin — benefits administration" },
    { dom: "brightpath-wellness.co", note: "BrightPath — wellness program partner" }
  ],
  emails: [
    {
      id: "d3e01", time: "08:05",
      fromName: "Renata Voss",
      fromAddr: "r.voss@meridianbenefits.com",
      replyTo: "rv.cfo.urgent@exchange-secure.net",
      auth: null,
      subject: "Are you at your desk? Need this wire to close today",
      body: [
        { t: "p", text: "Heading into the audit committee and my phone is on silent — do not call." },
        { t: "p", text: "I need the year-end broker settlement wire released before the 11 a.m. cutoff: $48,500. The carrier moved to a new settlement account; new remittance details are at the link. The old account is being decommissioned — anything sent there will bounce." },
        { t: "p", text: "Handle it now, we'll square the paperwork after the committee. I need this closed today." },
        { t: "link", label: "Wire instructions (PDF)", href: "https://secure-wire-transfer.doculink-access.ru/download/instructions.pdf" },
        { t: "sig", text: "R. Voss — sent from my mobile" }
      ],
      attachments: [],
      verdict: "phish", category: "bec", weight: 3,
      redFlags: [
        { zone: "header", key: true, label: "Reply-To routes off-domain", proto: "2.1",
          explain: "Headers: replies go to exchange-secure.net, not meridianbenefits.com. The CFO's address was borrowed for the From line only." },
        { zone: "body", key: true, label: "Bank-detail change", proto: "3.4",
          explain: "'New account, old one decommissioned' is the exact script of payment-diversion fraud. Bank changes are verified by phone. Always." },
        { zone: "body", key: false, label: "Do-not-call + deadline", proto: "3.1",
          explain: "'Don't call me' plus an 11 a.m. cutoff engineers a world where verification is impossible." },
        { zone: "link", key: false, label: "Instructions hosted in .ru", proto: "1.3",
          explain: "Hover: wire 'instructions' on a Russian document service. Meridian's banking does not route through doculink-access.ru." }
      ],
      coachRight: "A wire request that forbids phone verification is fraud announcing itself. Protocol 3.4 exists because of emails like this one.",
      coachWrong: "A $48,500 wire, redirected to 'new' banking details, with instructions hosted in .ru and a Reply-To off-domain — and the phone was 'not allowed'.",
      incident: "$48,500 was wired to a fraudster-controlled account using the 'new remittance details'. The bank recalled only a fraction. Protocol 3.4 exists because of attacks exactly like this one.",
      fpNote: null
    },
    {
      id: "d3e02", time: "08:52",
      fromName: "Meridian IT Security",
      fromAddr: "it-security@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "ACTION REQUIRED: password reset tonight 22:00–02:00",
      body: [
        { t: "p", text: "Tonight's security upgrade forces a one-time reset of all claims-system passwords between 22:00 and 02:00. Sessions will drop — save your work before 22:00." },
        { t: "p", text: "The reset page goes live at the link below tonight. Verify the address bar says portal.meridianbenefits.com before entering anything." },
        { t: "link", label: "Reset page (live from 22:00)", href: "https://portal.meridianbenefits.com/maintenance/reset" },
        { t: "sig", text: "IT Security — this notice was announced at Monday's ops meeting" }
      ],
      attachments: [],
      verdict: "legit", trapType: "urgency", weight: 2,
      redFlags: [],
      coachRight: "Genuine urgency from real IT: internal sender, link on the company's own subdomain — and it teaches you how to verify it. Urgent is not the same as fake.",
      coachWrong: null,
      incident: null,
      fpNote: "That was the real maintenance reset — the one night it mattered. 'Urgency means phishing' is a heuristic, not a law. Check sender and domain first, tone last."
    },
    {
      id: "d3e03", time: "09:20",
      fromName: "Meridian HR",
      fromAddr: "hr@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "Open Enrollment closes Friday — confirm your elections",
      body: [
        { t: "p", text: "Final week to confirm 2027 benefits elections. Changes after Friday require an HR ticket and a qualifying-life-event form." },
        { t: "p", text: "Review or adjust your elections:" },
        { t: "link", label: "Review your elections", href: "https://enroll.meridianbenefits.com/2027" },
        { t: "sig", text: "Human Resources — Meridian Benefits Group" }
      ],
      attachments: [],
      verdict: "legit", trapType: "legit-subdomain", weight: 1,
      redFlags: [],
      coachRight: "HR, from the real internal address, linking to enroll.meridianbenefits.com — the company's own enrollment subdomain. Learn this pattern; you will see it abused on Friday.",
      coachWrong: null,
      incident: null,
      fpNote: "You quarantined the actual open-enrollment notice. HR received forty 'where is the link' tickets in one afternoon."
    },
    {
      id: "d3e04", time: "09:58",
      fromName: "Member Services",
      fromAddr: "member-services@meridian-benefits-enroll.net",
      replyTo: null, auth: null,
      subject: "FINAL NOTICE: your health coverage will LAPSE",
      body: [
        { t: "p", text: "Our system shows your health coverage election is INCOMPLETE." },
        { t: "p", text: "If we do not receive your Social Security number and date of birth within 24 hours, your coverage — including dental and vision — will LAPSE permanently and cannot be restored." },
        { t: "link", label: "Verify coverage information", href: "https://enrollment-verification.coverage-secure.top/confirm" },
        { t: "sig", text: "Member Services — do not reply to this message" }
      ],
      attachments: [],
      verdict: "phish", category: "hr-benefits", weight: 2,
      redFlags: [
        { zone: "body", key: true, label: "SSN requested by email", proto: "1.2",
          explain: "No legitimate process collects Social Security numbers through an email link. Ever. This alone ends the discussion." },
        { zone: "from", key: true, label: "Lookalike 'enrollment' domain", proto: "2.3",
          explain: "meridian-benefits-enroll.net — hyphens and extra words around the real name. The real HR is @meridianbenefits.com." },
        { zone: "body", key: false, label: "Coverage-lapse fear + deadline", proto: "3.1",
          explain: "'LAPSE permanently' weaponizes healthcare anxiety. Real benefits notices do not threaten you." },
        { zone: "link", key: false, label: "Verification page off-domain", proto: "1.3",
          explain: "Hover: coverage-secure.top — a generic top-level domain is not a benefits system." }
      ],
      coachRight: "Fear of losing coverage is the hook; the SSN request is the crime. Health coverage is never confirmed by emailing your Social Security number to a .top domain.",
      coachWrong: "A coverage-lapse threat demanding an SSN through a lookalike .net domain — this phish targets exactly what a benefits company cares about.",
      incident: "A team member entered their SSN into the 'verification' page. Credit lockdowns and one very uncomfortable Legal conversation followed.",
      fpNote: null
    },
    {
      id: "d3e05", time: "10:26",
      fromName: "Dana Ruiz",
      fromAddr: "d.ruiz@meridianbenefits.com",
      replyTo: null, auth: null,
      subject: "Claim #88213 — additional documentation",
      body: [
        { t: "p", text: "need the addendum for claim 88213 asap. the one on file is wroung — wrong carrier id on page 2" },
        { t: "p", text: "send the right one or itll pend again and you know how Vega gets. thx" },
        { t: "sig", text: "- D" }
      ],
      attachments: [],
      verdict: "legit", trapType: "sloppy", weight: 1,
      redFlags: [],
      coachRight: "Typos, no punctuation, all lowercase — from a real colleague on a real internal address asking for a real work thing. Sloppy writing is a hint, never a verdict.",
      coachWrong: null,
      incident: null,
      fpNote: "Dana's typo'd note was real, internal, and about an actual claim. Grammar is not authentication."
    }
  ]
},

/* ══════════════════════ DAY 4 ══════════════════════ */
{
  day: 4,
  date: "Thursday, October 9",
  title: "Malicious Files & Authentication",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "Advisory 4 — Weaponized attachments and spoofed vendors",
    paragraphs: [
      "Malware is back on the menu: executables dressed as documents, macro workbooks, archives. INSPECT every attachment — the full filename is longer than the chip suggests.",
      "Your header panel has been upgraded: it now displays SPF, DKIM and DMARC results. Think of them as proof the mail came from the domain it claims. A vendor mail that FAILS authentication did not come from that vendor — whatever the From line says.",
      "Careful with the lesson, though: authentication proves the sender is who they claim to be. It does not prove the domain is one you should trust. That distinction is tomorrow's problem."
    ],
    protocols: [
      { id: "4.1", text: "Never deliver executables, archives, web pages, or macro files: .exe, .zip, .htm, .xlsm." },
      { id: "4.2", text: "Check SPF / DKIM / DMARC in the headers — failed authentication means spoofed." },
      { id: "4.3", text: "A perfect-looking vendor mail that fails authentication is still a phish." }
    ],
    unlockNote: "HEADER PANEL UPGRADED: SPF / DKIM / DMARC AUTH CHIPS"
  },
  tools: ["auth"],
  vendors: [],
  emails: [
    {
      id: "d4e01", time: "08:21",
      fromName: "Benefits Enrollment Center",
      fromAddr: "enrollment@meridianbenefits-portal.com",
      replyTo: null, auth: { spf: "none", dkim: "none", dmarc: "none" },
      subject: "Re: your benefits enrollment form — please review",
      body: [
        { t: "p", text: "Our records show your 2027 benefits enrollment form is missing page 2 (dependent certification)." },
        { t: "p", text: "Complete your review using the attached form. Open the attachment and follow the prompts — the viewer will guide you." },
        { t: "sig", text: "Benefits Enrollment Center — automated notice" }
      ],
      attachments: [
        { name: "Enrollment_Form.pdf.exe", size: "284 KB", kind: "Application (.exe)" }
      ],
      verdict: "phish", category: "attachment", weight: 2,
      redFlags: [
        { zone: "attach", key: true, label: "Double-extension executable", proto: "4.1",
          explain: "Inspect it: the full name is Enrollment_Form.pdf.EXE — a program wearing a PDF costume. The list chip hides the ending on purpose." },
        { zone: "from", key: false, label: "Lookalike '-portal' domain", proto: "2.3",
          explain: "meridianbenefits-portal.com is not the company's domain. Enrollment does not mail from it." },
        { zone: "body", key: false, label: "'Open the attachment' lure", proto: "1.4",
          explain: "The whole email exists to get the file opened. The 'missing page' story is the packaging." },
        { zone: "header", key: false, label: "No authentication at all", proto: "4.2",
          explain: "SPF none / DKIM none / DMARC none: the sending domain publishes nothing and proves nothing." }
      ],
      coachRight: "A 'form' that is actually a program. Inspect attachments before you trust the label — the .pdf.exe ending was one click away.",
      coachWrong: "The 'enrollment form' was an .exe — a program disguised as a PDF from a lookalike domain. Delivering it handed a colleague malware.",
      incident: "The 'form viewer' was an information stealer. One workstation was reimaged and harvested session cookies forced an all-hands password reset.",
      fpNote: null
    },
    {
      id: "d4e02", time: "08:54",
      fromName: "Zenith Payroll Billing",
      fromAddr: "billing@zenithpayroll.com",
      replyTo: "billing.zenith@outbox-mail.com",
      auth: { spf: "fail", dkim: "none", dmarc: "fail" },
      subject: "Invoice 10-2026 overdue",
      body: [
        { t: "p", text: "Invoice 10-2026 for Meridian Benefits Group remains unpaid 15 days past terms." },
        { t: "p", text: "Open the attached statement to review line items and confirm ACH remittance. Late penalties apply per contract section 8." },
        { t: "sig", text: "Zenith Payroll — Accounts Receivable" }
      ],
      attachments: [
        { name: "Invoice_10-2026.xlsm", size: "96 KB", kind: "Excel macro workbook (.xlsm)" }
      ],
      verdict: "phish", category: "spoof-auth", weight: 2,
      redFlags: [
        { zone: "header", key: true, label: "SPF fail / DKIM none / DMARC fail", proto: "4.2",
          explain: "The address and display name are perfect — and meaningless. Authentication proves this mail never touched Zenith's servers." },
        { zone: "attach", key: true, label: "Macro workbook", proto: "4.1",
          explain: "Inspect: .xlsm means macros enabled — code that runs when opened. Zenith sends PDFs." },
        { zone: "header", key: false, label: "Reply-To off-vendor", proto: "2.1",
          explain: "Replies route to outbox-mail.com. Real Zenith replies stay on zenithpayroll.com." },
        { zone: "body", key: false, label: "Payment-pressure lure", proto: null,
          explain: "Late-penalty language rushes the reader past the attachment inspection." }
      ],
      coachRight: "A flawless costume — right name, right address — undone by three red chips and a macro workbook. When authentication fails, the costume is the crime.",
      coachWrong: "Every surface detail matched Zenith — but SPF failed, DKIM was absent, and the 'invoice' was a macro workbook. The chips were one H-press away.",
      incident: "Opening the macro workbook dropped a credential stealer onto a finance workstation. Two banking sessions were hijacked before EDR flagged it.",
      fpNote: null
    },
    {
      id: "d4e03", time: "09:19",
      fromName: "Zenith Payroll Billing",
      fromAddr: "billing@zenithpayroll.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Invoice 10-2026 attached — ACH details unchanged",
      body: [
        { t: "p", text: "Invoice 10-2026 for Meridian Benefits Group is attached as PDF." },
        { t: "p", text: "Note: ACH remittance details are unchanged. Zenith will never send new banking details by email — changes are confirmed by postal notice and phone." },
        { t: "sig", text: "Zenith Payroll — Accounts Receivable · questions? call the number on your statement" }
      ],
      attachments: [
        { name: "Invoice_10-2026.pdf", size: "118 KB", kind: "PDF document" }
      ],
      verdict: "legit", trapType: "auth-pass", weight: 2,
      redFlags: [],
      coachRight: "The twin of the last mail, but real: authentication all green, a plain PDF, on the approved vendor list — and it explicitly says bank details never change by email.",
      coachWrong: null,
      incident: null,
      fpNote: "You quarantined the REAL Zenith invoice — the one that pays the people who pay you. Authentication was green, the vendor is approved, and the file was a PDF."
    },
    {
      id: "d4e04", time: "10:03",
      fromName: "Voicemail Service",
      fromAddr: "voicemail@mbx-notify.services",
      replyTo: null, auth: { spf: "fail", dkim: "none", dmarc: "fail" },
      subject: "You have 1 new voicemail",
      body: [
        { t: "p", text: "1 new voicemail message (0:42). From: external caller." },
        { t: "p", text: "Messages auto-delete after 24 hours." },
        { t: "link", label: "Play message", href: "https://mbx-notify.services/play?id=VE-99213" },
        { t: "sig", text: "Corporate Voicemail Notification Service" }
      ],
      attachments: [
        { name: "voicemail_message.zip", size: "1.2 MB", kind: "Compressed archive (.zip)" }
      ],
      verdict: "phish", category: "attachment", weight: 1,
      redFlags: [
        { zone: "attach", key: true, label: "Voicemail in a .zip", proto: "4.1",
          explain: "Inspect: voicemails are audio streams, not archives. A .zip 'message' is a delivery vehicle." },
        { zone: "from", key: false, label: "Unknown .services domain", proto: null,
          explain: "mbx-notify.services — Meridian's voicemail integration does not exist, and never did." },
        { zone: "body", key: false, label: "Vague + auto-delete pressure", proto: null,
          explain: "'External caller', no callback number, and a 24-hour fuse. Vagueness plus hurry is a standard combination." },
        { zone: "header", key: false, label: "Authentication failed", proto: "4.2",
          explain: "SPF fail across the board — the sender is not who it claims even on its own terms." }
      ],
      coachRight: "A 'voicemail' delivered as a zip archive from an unknown .services domain. Curiosity is the attack surface here — don't supply it.",
      coachWrong: "You delivered a .zip 'voicemail' from a failed-auth sender. That archive was the payload; the audio was the story.",
      incident: null, fpNote: null
    },
    {
      id: "d4e05", time: "10:41",
      fromName: "Ken Tanaka",
      fromAddr: "k.tanaka@meridianbenefits.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Renewal workbook for Tuesday",
      body: [
        { t: "p", text: "Hey — here's the renewal workbook I mentioned at standup. It's just formulas, no macros." },
        { t: "p", text: "I'll walk through it Tuesday. Shout if the Q4 tab looks wrong." },
        { t: "sig", text: "Ken — Claims" }
      ],
      attachments: [
        { name: "renewals_2027.xlsx", size: "61 KB", kind: "Excel worksheet (.xlsx, no macros)" }
      ],
      verdict: "legit", trapType: "internal-attach", weight: 1,
      redFlags: [],
      coachRight: "A colleague, internal, announced in person, plain .xlsx with no macros, authentication green. Expected attachments from known people are how work actually happens.",
      coachWrong: null,
      incident: null,
      fpNote: "Ken's workbook was exactly what he said at standup — expected, internal, macro-free. Quarantining it just moved Tuesday's meeting to Wednesday."
    }
  ]
},

/* ══════════════════════ DAY 5 ══════════════════════ */
{
  day: 5,
  date: "Friday, October 10",
  title: "Look Closer",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "Advisory 5 — Domain tricks: subdomains, punycode, hijacked threads",
    paragraphs: [
      "Today's attacks are aimed at people who check the domain — but read it left-to-right, like a sentence. Domains must be read RIGHT-TO-LEFT: the owner is the last two labels. Everything before that is rented space a stranger typed in.",
      "Your LINK INSPECTOR and HEADER PANEL now include the DOMAIN INSPECTOR: hovered links and header addresses are decomposed into subdomain / REGISTERED DOMAIN / TLD, with raw internationalized (xn--) forms exposed.",
      "One more warning: authentication chips prove who sent the mail, not that the domain deserves your trust. A lookalike domain can pass SPF perfectly. Yesterday's green chips do not clear today's domains."
    ],
    protocols: [
      { id: "5.1", text: "Read domains right-to-left: the owner is the last two labels." },
      { id: "5.2", text: "A real company name buried in the subdomains still belongs to someone else." },
      { id: "5.3", text: "Punycode (xn--) and lookalike characters hide in plain sight — use the inspector." },
      { id: "5.4", text: "Judge every reply on its own sender — real threads get hijacked." }
    ],
    unlockNote: "TOOL UPGRADE: DOMAIN INSPECTOR (status bar + header panel)"
  },
  tools: ["inspector"],
  vendors: [],
  emails: [
    {
      id: "d5e01", time: "08:34",
      fromName: "Dana Ruiz",
      fromAddr: "d.ruiz@meridiangroup-benefits.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Re: Re: Q4 rate confirmation",
      body: [
        { t: "quote", meta: "On Tue, Oct 7 at 3:12 PM, Marcus Webb wrote:", text: "Confirmed — Q4 group rates hold at 4.2%. Thanks for chasing the carrier." },
        { t: "quote", meta: "On Tue, Oct 7 at 3:40 PM, Dana Ruiz wrote:", text: "Rates locked. I'll update the binder Monday." },
        { t: "p", text: "Update — the carrier moved us to a new settlement account effective today. Binder payments must go to the NEW details or they will bounce." },
        { t: "p", text: "Please use these from now on. No need to loop in finance; I've already cleared it with them." },
        { t: "link", label: "Updated banking details", href: "https://meridian-remittance.docu-share.top/banking-update.html" },
        { t: "sig", text: "D. Ruiz — Claims" }
      ],
      attachments: [],
      verdict: "phish", category: "thread-hijack", weight: 3,
      redFlags: [
        { zone: "from", key: true, label: "Real colleague, wrong domain", proto: "5.4",
          explain: "Look closely: meridiangroup-BENEFITS.com is not meridianbenefits.com. The thread is real; this reply is not Dana's." },
        { zone: "body", key: true, label: "Bank-detail change", proto: "3.4",
          explain: "'New settlement account, old one bounces' — payment diversion again, this time wearing a genuine thread as a costume." },
        { zone: "body", key: false, label: "'Don't loop in finance'", proto: "3.4",
          explain: "Explicitly routing around the one team that would catch a bank change. Silence is part of the script." },
        { zone: "link", key: false, label: "'Banking details' hosted off-domain", proto: "1.3",
          explain: "Hover: docu-share.top. Banking details for a Meridian carrier account live nowhere near a .top file host." }
      ],
      coachRight: "A genuine quoted thread — carrying a reply from a domain one word away from real, redirecting payments. Judge each reply by ITS sender, not the thread's history.",
      coachWrong: "The thread was real; the newest reply was not. meridiangroup-benefits.com redirected binder payments to 'new' details on a .top host.",
      incident: "The remittance 'update' redirected a $19,200 binder payment. The genuine thread made everyone trust it — that is exactly what hijackers count on.",
      fpNote: null
    },
    {
      id: "d5e02", time: "08:57",
      fromName: "Meridian Benefits Portal",
      fromAddr: "no-reply@secure.mail.meridianbenefits.com.mail-gate.net",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Verify your identity to keep benefits access",
      body: [
        { t: "p", text: "We detected a new device signing into your benefits account. If this was you, no action is needed." },
        { t: "p", text: "If this was NOT you, confirm your identity within 12 hours or account access will be limited to read-only." },
        { t: "link", label: "Confirm identity", href: "https://secure.mail.meridianbenefits.com.mail-gate.net/session/verify?u=claims" },
        { t: "sig", text: "Meridian Benefits Portal — automated security notice" }
      ],
      attachments: [],
      verdict: "phish", category: "subdomain", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Company name buried in subdomains", proto: "5.2",
          explain: "Read right-to-left with the inspector: registered domain = mail-gate.NET. 'meridianbenefits.com' is just labels a stranger typed to the left of it." },
        { zone: "link", key: true, label: "Verify page on the same trick domain", proto: "5.1",
          explain: "Hover + inspector: the 'verification' page is also owned by mail-gate.net. Your credentials would be verified straight into their log." },
        { zone: "body", key: false, label: "Identity-verify lure", proto: "1.2",
          explain: "'Confirm your identity' by link, on a deadline — the most reliable credential-harvest pattern there is." }
      ],
      coachRight: "The company's name appears three times in that domain and owns zero of it. Right-to-left: mail-gate.net. The inspector makes the costume transparent.",
      coachWrong: "secure.mail.meridianbenefits.com.mail-gate.net — everything before 'mail-gate.net' is decoration. The identity check harvested whatever was typed into it.",
      incident: "The 'identity check' captured two benefits-portal logins, including one with claims-edit rights.",
      fpNote: null
    },
    {
      id: "d5e03", time: "09:44",
      fromName: "Meridian Benefits HR",
      fromAddr: "hr@meridiаnbenefits.com",
      addrRaw: "hr@xn--meridianbenefits-2xe.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Confirm your enrollment before the deadline",
      body: [
        { t: "p", text: "Enrollment records must be re-confirmed ahead of Monday's carrier file submission." },
        { t: "p", text: "Use the secure confirmation link below. The portal will require re-authentication for your protection." },
        { t: "link", label: "Confirm enrollment", href: "https://xn--meridianbenefits-2xe.com/enrollment/confirm" },
        { t: "sig", text: "Human Resources — Meridian Benefits Group" }
      ],
      attachments: [],
      verdict: "phish", category: "homoglyph", weight: 2,
      redFlags: [
        { zone: "link", key: true, label: "Punycode link (xn--)", proto: "5.3",
          explain: "Hover: the raw link starts with xn-- — the marker of an internationalized lookalike domain. No internal system links to xn-- anything." },
        { zone: "from", key: true, label: "Homoglyph sender domain", proto: "5.3",
          explain: "The sender domain contains a lookalike character (Cyrillic 'а' where 'a' should be). The header inspector flags the non-ASCII domain and shows the raw form." },
        { zone: "body", key: false, label: "'Re-authentication' lure", proto: "1.2",
          explain: "'Requires re-authentication' means: type your password here. That request is the entire purpose of the email." }
      ],
      coachRight: "Visually perfect, technically fake — one character in the domain is Cyrillic. The raw xn-- form in the inspector is the tell no disguise survives.",
      coachWrong: "The domain looked letter-perfect because one letter was a Cyrillic lookalike. Hovering revealed xn-- at the start of the raw address. Homoglyphs beat the naked eye; inspection beats homoglyphs.",
      incident: "The xn-- domain harvested four sets of portal credentials. Homoglyph attacks are invisible to a skim — and to spam filters half the time.",
      fpNote: null
    },
    {
      id: "d5e04", time: "10:18",
      fromName: "BenAdmin Portal",
      fromAddr: "notifications@benadmin-portal.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Your statement is ready",
      body: [
        { t: "p", text: "Your October benefits administration statement is available." },
        { t: "p", text: "Statement period: Oct 1 – Oct 31, 2026." },
        { t: "link", label: "View statement", href: "https://portal.benadmin-portal.com/statements/2026-10" },
        { t: "sig", text: "BenAdmin — Benefits Administration Platform" }
      ],
      attachments: [],
      verdict: "legit", trapType: "vendor", weight: 2,
      redFlags: [],
      coachRight: "An odd-looking domain — that is on the APPROVED SENDERS card, with the link living under that same domain. The card exists precisely for this moment.",
      coachWrong: null,
      incident: null,
      fpNote: "BenAdmin is the company's benefits-administration platform — approved sender, matching link domain, green authentication. Not every unfamiliar domain is hostile; check the card."
    },
    {
      id: "d5e05", time: "10:55",
      fromName: "BrightPath Wellness",
      fromAddr: "marketing@brightpath-wellness.co",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Limited open enrollment offer — act now!",
      body: [
        { t: "p", text: "Enrollment season special! Get 6 MONTHS FREE on BrightPath Premium when your team enrolls 10+ members before Monday. Seats are limited — act now!" },
        { t: "p", text: "Offer details:" },
        { t: "link", label: "Claim 6 months free", href: "https://brightpath-wellness.co/enroll?utm_source=email&utm_campaign=oe-blast-fall26&utm_content=hero" },
        { t: "link", label: "See all plans", href: "https://brightpath-wellness.co/plans?utm_source=email&utm_campaign=oe-blast-fall26" },
        { t: "p", text: "You are receiving this as the wellness program contact for Meridian Benefits Group." },
        { t: "link", label: "Unsubscribe", href: "https://u.brightpath-wellness.co/unsubscribe?u=mbg-claims&c=oe26" },
        { t: "sig", text: "BrightPath Wellness — partner of the Meridian wellness program" }
      ],
      attachments: [],
      verdict: "legit", trapType: "marketing", weight: 1,
      redFlags: [],
      coachRight: "It walks and talks like spam — hype, urgency, tracking params everywhere. But the sender is the approved wellness partner, links stay on their domain, and there's a working unsubscribe. Aggressive marketing is still not phishing.",
      coachWrong: null,
      incident: null,
      fpNote: "BrightPath runs the company wellness program — HR signed the contract. You quarantined an approved partner's promo, unsubscribe link and all."
    }
  ]
},

/* ══════════════════════ DAY 6 ══════════════════════ */
{
  day: 6,
  date: "Monday, October 13",
  title: "Final Audit",
  memo: {
    from: "D. Okafor — Director of IT Security",
    subject: "Final Advisory — Audit day. All protocols in force.",
    paragraphs: [
      "Today the auditors observe the queue. Every technique from the week — and a few combinations — will be present. No new tools. No new protocols. You have everything you need.",
      "Remember the week in order: check the sender's real address, open the headers, hover the links, read domains right-to-left, inspect attachments, trust authentication only as far as it deserves, and verify money and bank changes by phone.",
      "Your final summary is yours to keep — a record of how much sharper your radar is than it was Monday morning. Every miss this week was free. That's what a simulator is for. — D.O."
    ],
    protocols: [
      { id: "6.1", text: "All protocols 1.1 – 5.4 remain in force. No exceptions for urgency, authority, or familiarity." }
    ],
    unlockNote: null
  },
  tools: [],
  vendors: [],
  emails: [
    {
      id: "d6e01", time: "08:02",
      fromName: "Office of the CEO",
      fromAddr: "exec-office@meridianbenefits-group.co",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "{{name}} — per Marcus's request, confidential",
      body: [
        { t: "p", text: "{{name}} — Marcus asked me to have you process the attached confidential agreement before he lands at 2." },
        { t: "p", text: "This is board-sensitive. Please do not discuss it with the team or IT until after the vote — you'll understand when you read it." },
        { t: "link", label: "Confidential MOU — review & sign", href: "https://meridian-benefits-group.co/mou/sign?ref=exec-office" },
        { t: "sig", text: "E. Brandt — Executive Assistant to the CEO" }
      ],
      attachments: [],
      verdict: "phish", category: "spearphish", weight: 3,
      redFlags: [
        { zone: "from", key: true, label: "-group.co is not the company", proto: "2.3",
          explain: "The company is meridianbenefits.com. meridianbenefits-group.co is a different string, a different owner, a different country code." },
        { zone: "body", key: true, label: "Secrecy instruction", proto: "3.4",
          explain: "'Don't discuss with the team or IT' — isolating the target from the people who would spot the trick. Legitimate work survives questions." },
        { zone: "body", key: false, label: "Named + authority-stacked", proto: "2.2",
          explain: "Your name, the CEO's name, a deadline, a landing time. Personalization is free for attackers; it is not proof of identity." },
        { zone: "link", key: false, label: "Signing page on the lookalike", proto: "1.3",
          explain: "Hover: the 'MOU' is signed on the fake domain. No real Meridian signature flow lives there." }
      ],
      coachRight: "Spearphishing: your name, the CEO's authority, a secrecy clause, and a domain ending in .co instead of .com. Every element was chosen to bypass your checklists — and each checklist still caught it.",
      coachWrong: "A named, 'confidential' request from the 'Office of the CEO' — on meridianbenefits-group.co, with instructions to bypass IT. The secrecy was the payload's bodyguard.",
      incident: "The 'confidential MOU' page planted a session-token stealer. An outsider held read access to the claims inbox for 40 minutes before IT killed the session.",
      fpNote: null
    },
    {
      id: "d6e02", time: "08:29",
      fromName: "Microsoft Security",
      fromAddr: "microsoft-security@ms-verify-login.com",
      replyTo: null, auth: { spf: "none", dkim: "none", dmarc: "none" },
      subject: "Unusual sign-in from Russia — secure your account",
      body: [
        { t: "p", text: "Microsoft account security alert." },
        { t: "p", text: "A sign-in attempt from Moscow, RU (IP 46.17.xx.xx) was blocked. If this wasn't you, secure your account immediately — the attempt will repeat." },
        { t: "link", label: "Review recent activity", href: "https://login-msverify.account-protection.info/consent?client=claims" },
        { t: "sig", text: "Microsoft account team · Microsoft Corporation · One Microsoft Way, Redmond" }
      ],
      attachments: [],
      verdict: "phish", category: "credential", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Not microsoft.com", proto: "2.3",
          explain: "Microsoft sends security mail from microsoft.com. 'ms-verify-login.com' is a costume with the brand's clothes on." },
        { zone: "link", key: true, label: "Brand-lookalike link domain", proto: "5.1",
          explain: "Hover + inspector: the registered domain is account-protection.INFO. Microsoft owns microsoft.com — full stop." },
        { zone: "body", key: false, label: "Alarm + repeat threat", proto: "3.1",
          explain: "'It will repeat' manufactures the fear that makes the fake button feel safe." },
        { zone: "header", key: false, label: "No authentication", proto: "4.2",
          explain: "SPF/DKIM/DMARC all absent. The brand forgery ends where the headers begin." }
      ],
      coachRight: "A pixel-perfect brand template on a stranger's domain. The logo is painted; the domain is printed. Trust the print.",
      coachWrong: "The template was flawless and the domain was fake — account-protection.info under an ms-verify-login sender. Brand polish is free; microsoft.com is not.",
      incident: "The 'activity review' page phished two Microsoft 365 passwords. MFA held — this time.",
      fpNote: null
    },
    {
      id: "d6e03", time: "08:47",
      fromName: "D. Okafor, IT Security",
      fromAddr: "d.okafor@meridianbenefits.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Heads up: active phishing campaign this morning",
      body: [
        { t: "p", text: "Three reports already this morning. The current wave impersonates (1) an 'Office of the CEO' MOU-signing request and (2) a Microsoft 'unusual sign-in' alert. Both use lookalike domains; both were in your queue today." },
        { t: "p", text: "We never send document-signing links by email. Report anything similar — you know the drill." },
        { t: "sig", text: "— D.O." }
      ],
      attachments: [],
      verdict: "legit", trapType: "meta", weight: 2,
      redFlags: [],
      coachRight: "A phishing warning that looks like bait — from the real IT director, internal domain, describing attacks you personally screened this morning. Meta, but real.",
      coachWrong: null,
      incident: null,
      fpNote: "You quarantined IT Security's own warning about the morning's attacks. D.O. found the irony delightful and says so at the next all-hands."
    },
    {
      id: "d6e04", time: "09:13",
      fromName: "Dana Ruiz",
      fromAddr: "d.ruiz.claims@outlook-verify.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "stuck in a meeting, need 5 x $200 gift codes NOW",
      body: [
        { t: "p", text: "at the carrier office and their system only takes prepaid app codes for same-day filing fees. corporate card is maxed til tomorrow" },
        { t: "p", text: "need 5 x $200 codes in the next 30 min or the filing lapses. buy them and reply with the codes here — expensing tomorrow, i promise" },
        { t: "sig", text: "- sent from Dana's phone" }
      ],
      attachments: [],
      verdict: "phish", category: "bec", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Colleague on free-mail", proto: "2.1",
          explain: "The real Dana is d.ruiz@meridianbenefits.com. 'd.ruiz.claims@outlook-verify.com' is a stranger who knows her name." },
        { zone: "body", key: true, label: "Prepaid-code request", proto: "2.2",
          explain: "Gift codes are cash that can't be recalled or traced — the defining trait of every BEC lure." },
        { zone: "body", key: false, label: "30-minute fuse", proto: "3.1",
          explain: "Carriers do not collect filing fees in gift codes. The countdown exists to stop you from calling Dana." }
      ],
      coachRight: "A familiar name on a strange domain, asking for untraceable codes on a timer. Call Dana — on her real number — and the story evaporates.",
      coachWrong: "The real Dana was never at any carrier office. The domain was free-mail, the payment was untraceable, and the timer was there to prevent the phone call.",
      incident: "The 'filing fees' were five gift cards, redeemed within minutes of being sent.",
      fpNote: null
    },
    {
      id: "d6e05", time: "09:40",
      fromName: "Gerald Pratt",
      fromAddr: "gerald.pratt23@gmail.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "THIS IS THE THIRD TIME I HAVE EMAILED ABOUT CLAIM 77120",
      body: [
        { t: "p", text: "I have sent the SAME x-ray report THREE TIMES. Your office keeps asking for it. I am 74 years old and this is the WORST insurance experience of my life." },
        { t: "p", text: "Call me TODAY or I am calling the department of insurance. My policy is 88-4471-C and I have been with Meridian since 2011." },
        { t: "sig", text: "G. Pratt — do not send me another form" }
      ],
      attachments: [],
      verdict: "legit", trapType: "tone", weight: 2,
      redFlags: [],
      coachRight: "An all-caps furious client on a gmail address — with a real policy number, a real claim number, a tenure, and a demand for a phone call. Tone is not evidence; substance is.",
      coachWrong: null,
      incident: null,
      fpNote: "Mr. Pratt is a real client — and now a real client who was quarantined. He did call the department of insurance. Loud is not the same as malicious."
    },
    {
      id: "d6e06", time: "10:02",
      fromName: "Benefits Enrollment Desk",
      fromAddr: "enrollment@meridian-benefits-hr.com",
      replyTo: null, auth: { spf: "pass", dkim: "pass", dmarc: "pass" },
      subject: "Scan to confirm your 2027 elections",
      body: [
        { t: "p", text: "Confirm your 2027 elections from your phone — no login needed, no portal password." },
        { t: "p", text: "Point your camera at the code below. Confirmation closes at noon today." },
        { t: "qr", href: "https://meridian-benefits-verify.ru/qr/claims",
          note: "Having trouble? Use this link instead." },
        { t: "sig", text: "Benefits Enrollment Desk — do not reply" }
      ],
      attachments: [],
      verdict: "phish", category: "quishing", weight: 2,
      redFlags: [
        { zone: "from", key: true, label: "Lookalike enrollment domain", proto: "2.3",
          explain: "meridian-benefits-hr.com — hyphenated lookalike again. Real enrollment mail comes from meridianbenefits.com." },
        { zone: "qr", key: true, label: "QR hides its destination", proto: "1.3",
          explain: "A code's destination is invisible until scanned — and phones often open QR links without showing the URL. Inspect it: the status bar reveals where it really points." },
        { zone: "body", key: false, label: "'No login needed'", proto: "1.2",
          explain: "No login means no authentication — for you AND for whoever built the page. Convenience is the bait on this hook." },
        { zone: "link", key: false, label: "Fallback link to a .ru host", proto: "1.3",
          explain: "Hover the backup link: meridian-benefits-verify.ru. Enrollment does not route through Russia." }
      ],
      coachRight: "Quishing: a QR code to dodge exactly the link-hovering habit you spent all week building — with a fallback link that gave the whole game away.",
      coachWrong: "The QR code was a bet that you'd scan before thinking. Inspecting it — or its fallback link — showed a .ru enrollment page behind a lookalike domain.",
      incident: "Four people scanned the code in the hallway. The page silently requested, and stored, portal permissions.",
      fpNote: null
    }
  ]
}
];

/* ---------- static reference (not a game day) ---------- */
IP.VENDORS = [
  { dom: "zenithpayroll.com", note: "Zenith Payroll — payroll processing" },
  { dom: "benadmin-portal.com", note: "BenAdmin — benefits administration" },
  { dom: "brightpath-wellness.co", note: "BrightPath — wellness program partner" }
];

IP.QR_ART = [
  "▄▄▄▄▄▄▄  ▄▄ ▄▄▄▄▄▄▄",
  "█  █ █ ███ █  █ ███",
  "█ ▀▀█ ▀▀ ▀▀▀ █▀▀ █ █",
  "█ ▄▄█ ▄▄ ▄ ▄▄ █▄▄█ ▀▀",
  "████████████████████",
  "  ▄▄  ▄ ▀▀▀▄ ▀ ▄▄",
  "█▀▀▀██▀ ▄▄▄▀▀ ▄▀ █▄▄",
  "█ ▄▄█ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀",
  "▄ ▀▀▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀",
  "█▄▄▄█ ▄▄▄ ▄▄▄ ▄▄▄ █▄",
  "█▀▀▀█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀",
  "█ ▄▄████████████████",
  "▄▄▄▄▄▄▄  ▄  ▄▄▄▄▄▄▄"
];
