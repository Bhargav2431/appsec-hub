# Day 7 Revision Notes — Burp Suite Deep Dive

**Roadmap phase:** Foundations
**Connects to:** Day 6 (OWASP Top 10), Day 8 (SQL Injection), Day 12 (IDOR) — used in every single day from here forward
**Revision date:** _______________

---

## The One Sentence Summary

> Burp Suite is a proxy that physically sits between your browser and the target server, which is the only reason it can show you, and let you modify, every byte of traffic in both directions.

---

## 1. The Interception Chain — How This Actually Works

```
Firefox (+ FoxyProxy)  →  Burp Suite (127.0.0.1:8080)  →  Target server
```

This is not Burp "watching" your browser from the side — it's a genuine man-in-the-middle setup that you deliberately configure against your own testing browser. FoxyProxy is a browser extension that switches your proxy settings with one click. When enabled, every single request your browser makes is sent to Burp's listening port first. Burp then decides whether to forward it as-is, hold it for you to inspect and edit (if "Intercept" is on), or just log it and pass it straight through (if "Intercept" is off, which is the more common day-to-day mode — you let traffic flow and review the log afterward).

Nothing reaches the target without going through Burp first. Nothing comes back without going through Burp again on the way to your browser. This is the entire technical basis for everything else Burp can do — it's not asking your browser nicely to share its traffic, it's standing in the wire itself.

### Setting up the chain (what you actually configure)
1. Install FoxyProxy in your dedicated testing Firefox
2. Add a proxy profile pointing at `127.0.0.1:8080` (Burp's default listening address)
3. Toggle FoxyProxy on when testing, off for normal browsing — never mix the two
4. Import Burp's CA certificate into Firefox so HTTPS traffic can be decrypted and inspected too (without this step you'd only see plaintext HTTP, which is increasingly rare in the wild)

---

## 2. Tab-by-Tab Reference

### Proxy / HTTP History — your evidence log
Every request and response that's passed through Burp while the proxy was active, in order, forever (until you clear it). This is where you'll spend time scanning for something interesting, then right-clicking to send it onward. It's a log, not a workspace — you don't edit anything here directly in normal use.

### Repeater — where the actual work happens
**This is the single most-used tab, by a wide margin.** You send one specific request here — usually via right-click "Send to Repeater" from the Proxy history — and then you modify it as many times as you want, resending after each change, reading the response each time. No automation, no wordlists, just you forming a hypothesis ("what if I change this id parameter"), testing it, reading the result, and forming the next hypothesis. An entire day of AppSec testing work is, in large part, hundreds of repetitions of this exact loop.

### Target / Site Map
An automatically-built map of every host and path Burp has seen so far while you browsed. Useful mainly for defining and confirming scope before you start testing in earnest — making sure you know the full footprint of what you're allowed to touch.

### Intruder — automation for repetitive testing
Does mechanically what Repeater does manually, at scale. You mark a position in a request with `§markers§`, attach a payload list (a wordlist), and Burp fires the request once per entry, collecting all the responses for you to review afterward.

**The four attack types** (these get asked about directly in interviews):
| Type | Behavior |
|------|----------|
| **Sniper** | One payload set, cycles through one marked position at a time |
| **Battering Ram** | Same single payload inserted into every marked position simultaneously |
| **Pitchfork** | One payload list per position, all advancing in lockstep |
| **Cluster Bomb** | Every possible combination across all payload lists — most thorough, also slowest |

Community Edition deliberately rate-limits Intruder. It still works for small wordlists; it's just not built for high-speed brute forcing the way the paid Pro edition is.

### Decoder
Encodes and decodes common formats: base64, URL encoding, hex, HTML entities, ASCII. The moment you encounter a value that looks like meaningless noise — a JWT segment, an encoded session token, a suspicious URL parameter — this is the first place you paste it.

### Comparer
A byte-level diff between two requests or two responses. The textbook use case: send a login attempt with a *valid* username next to one with an *invalid* username, and let Comparer show you the exact bytes that differ between the two responses. If anything differs — even something as subtle as response timing or a slightly different error message — you've just confirmed a username enumeration vulnerability before you've tried a single password.

---

## 3. The Actual Day-to-Day Workflow

This is what the job looks like, condensed into one repeatable loop:

1. Browse the target normally, with the proxy active, building up the HTTP History
2. Scan the history for something worth a closer look — an interesting parameter, an endpoint that smells like it touches sensitive data, an API call with a numeric ID in it
3. Right-click → **Send to Repeater**
4. Form a hypothesis: "what happens if I change this," "what happens if this parameter contains a quote character," "what happens if I remove this header entirely"
5. Edit the request to test that hypothesis
6. Send, and actually read the response carefully — status code, body content, headers, response time
7. Update your hypothesis based on what you saw, and repeat

Run that loop dozens of times against dozens of endpoints, document anything that looks wrong as you go, and that is most of what an AppSec engineer's working day actually consists of.

---

## 4. Keyboard Shortcuts Worth Memorizing

```
Ctrl+R         Send the current request to Repeater
Ctrl+I         Send the current request to Intruder
Ctrl+U         URL-decode the currently selected text
Ctrl+Shift+U   URL-encode the currently selected text
Ctrl+Z         Undo in the request editor
Ctrl+Space     Trigger autocomplete in the request editor
```

---

## 5. Self-Test — Don't Look Until You've Tried

1. You want to manually test ten different payloads against the same login endpoint, examining each response carefully before trying the next. Which tab is purpose-built for this, and why not Intruder instead?
2. What is the actual technical mechanism that lets Burp see and modify your traffic at all — not "what does it do" but "how is that even possible"?
3. You find a session cookie value that looks like meaningless noise: `eyJ1c2VyIjoiYWRtaW4ifQ`. Which tab do you reach for first, and what specific clue tells you that?
4. Explain the difference between Sniper and Cluster Bomb in Intruder, in one sentence each.
5. You send two near-identical login attempts — one with a username that exists, one that doesn't — and want to find the exact bytes that differ between the two server responses. Which tab is built for this exact task?

### Answers

1. Repeater. Intruder is built for *automated, scaled* testing against a wordlist — it doesn't pause for you to think between each attempt. Repeater is deliberately manual, which is exactly what you want when you need to actually read and reason about each response before deciding what to try next.
2. Burp is a literal network proxy — your browser is configured to send all its traffic to Burp's listening port first, and Burp forwards it onward (after optionally letting you inspect or edit it) rather than your browser talking directly to the target server. The interception is only possible because of this physical position in the traffic path, not because of anything clever about parsing.
3. Decoder — the giveaway is the `eyJ` prefix, which is an extremely common visual signature of base64-encoded JSON (it's literally the base64 encoding of `{"`), a pattern you'll start recognizing instantly once you've decoded enough of them.
4. Sniper cycles one payload set through one marked position at a time, testing positions individually. Cluster Bomb tests every possible combination across multiple payload lists assigned to multiple positions, which is the most thorough option and also the slowest.
5. Comparer — it's specifically built for byte-level diffing between two requests or two responses, which is exactly the use case for confirming a username enumeration vulnerability.

---

## Quick Reference Card

```
THE CHAIN:        Firefox + FoxyProxy → Burp (127.0.0.1:8080) → Target

MOST USED TAB:    Repeater — manual, one request, modify and resend, repeat

PROXY HISTORY:    Your evidence log. Right-click anything → Send to Repeater

INTRUDER TYPES:   Sniper (one position at a time)
                  Battering Ram (same payload, all positions)
                  Pitchfork (one list per position, lockstep)
                  Cluster Bomb (every combination — slowest, most thorough)

DECODER:          base64 / URL / hex / HTML entity — use the instant a value
                  looks like encoded noise (eyJ... is a base64 JSON giveaway)

COMPARER:         Byte-level diff between two requests or responses —
                  the standard tool for confirming username enumeration

THE LOOP:         Browse → spot something → Repeater → hypothesis → edit →
                  send → read response → refine hypothesis → repeat
```
