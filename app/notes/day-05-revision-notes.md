# Day 5 Revision Notes — Web Application Architecture

**Roadmap phase:** Foundations
**Connects to:** Day 6 (OWASP Top 10), Day 12 (IDOR), Day 13 (CSRF), Day 16 (Secure Coding)
**Revision date:** _______________

---

## The One Sentence Summary

> Every web app is three tiers stacked on top of each other — frontend, backend, database — and almost every vulnerability is a failure at the boundary between two of them.

---

## 1. The 3-Tier Model — In Depth

### Frontend (Presentation Tier)
- Runs entirely **inside the user's browser**: HTML, CSS, JavaScript
- The user has total control over this layer — they can view source, edit JavaScript in DevTools, disable validation, or bypass your UI entirely with curl or Burp
- **The single most important fact about this tier**: anything enforced *only* here is not enforced at all. Frontend validation is a UX convenience (catch typos early, give instant feedback), never a security boundary.

### Backend (Application/Logic Tier)
- Runs on the **server**: Flask, Django, Spring Boot, Express/Node, Ruby on Rails
- This is where the actual rules live: who's allowed to log in, who's allowed to see what, how a payment gets processed
- **This is where almost every OWASP Top 10 vulnerability physically lives** — because this is the layer that's supposed to re-verify everything the frontend only suggested, and most vulnerabilities are this re-verification step being skipped

### Database (Persistence Tier)
- Where data survives after the server restarts: MySQL, PostgreSQL, MongoDB, etc.
- The backend talks to the database on the application's behalf — the database itself has no concept of "users" in the way your app does, it just executes queries
- **This is the prize at the end of most attacks.** SQL injection exists specifically because the backend sometimes lets untrusted input cross directly into this tier's query language without separating data from command structure.

### Why this model matters for security work specifically
When you're auditing an app, mentally tag every bug you find with which tier (or which tier *boundary*) failed:
- A bug that only affects what's displayed = frontend tier, usually low severity (cosmetic)
- A bug where the server does the wrong thing = backend tier, usually the dangerous ones
- A bug where stored data is wrong, exposed, or extractable = database tier, often catastrophic

---

## 2. Authentication vs. Authorization — The Distinction That Matters Most

This pair of words gets used interchangeably in casual speech, and that confusion is directly responsible for one of the most common vulnerability classes that exists.

| | Authentication | Authorization |
|---|---|---|
| **Question it answers** | "Who are you?" | "What are you allowed to do?" |
| **Mechanism** | Login form, password, MFA code, session cookie | Role checks, ownership checks, permission flags |
| **When it happens** | Once, at login (then maintained via session) | On *every single request* that touches a protected resource |
| **What fails if broken** | Someone gets in as someone they're not (account takeover) | Someone who's legitimately logged in does something they shouldn't (IDOR, privilege escalation) |

### The hotel key card analogy (memorize this)
- **Authentication** = your key card proves you're a guest at this hotel
- **Authorization** = which specific rooms your specific key card actually opens
- Being a guest doesn't get you into the penthouse. Being authenticated doesn't mean you're authorized for every resource.

### Why this distinction predicts a whole vulnerability class
**IDOR (Insecure Direct Object Reference)**, which you'll study formally on Day 12, is *always* an authorization failure layered on top of correct authentication. The user really is logged in as themselves (authentication worked perfectly) — the backend just forgot to check whether the specific resource they're now requesting (`order_id=1043`) actually belongs to them. The lock checked "is this a valid key?" and never asked "is this key holder's room?"

**Practical interview answer**: "Authentication failures mean someone gets in as the wrong person. Authorization failures mean the right person does something they shouldn't be able to do. IDOR is always the second one."

---

## 3. How a Session Actually Works — The Full Sequence

You will reference this exact 7-step sequence constantly from Day 5 through Day 60. Know the actual order of network events, not just the vocabulary.

```
1. Browser → Server:  POST /login {username: admin, password: ●●●●●●●}
2. Server validates credentials, generates a random session ID,
   stores it server-side:  session_store["a8f7d3c9"] = {user: "admin", ...}
3. Server → Browser:  Set-Cookie: session=a8f7d3c9; HttpOnly; Secure; SameSite=Strict
4. Browser stores this cookie. It is now invisibly attached to every
   future request to this exact domain — the user never sees this happen.
5. Browser → Server (any future request):  Cookie: session=a8f7d3c9
6. Server looks up "a8f7d3c9" in its session store → knows this
   request is coming from admin → proceeds accordingly
7. Session ends: either it times out server-side, or the user logs
   out (server deletes the session_store entry, cookie becomes useless)
```

### Why the session ID itself being unguessable matters
If session IDs were sequential (`session_1`, `session_2`, `session_3`...) an attacker could simply try adjacent values and potentially hijack another user's active session without ever knowing their password. This is why session IDs must be generated using a cryptographically secure random number generator — not `Math.random()`, not a counter, not a timestamp.

---

## 4. The Three Cookie Flags — Cheat Sheet

A session cookie missing **any one** of these three flags is an automatic finding in a security review. This isn't a judgment call — it's a checklist item.

| Flag | What it actually does | What it specifically blocks |
|------|----------------------|------------------------------|
| `HttpOnly` | JavaScript cannot read this cookie via `document.cookie` | Session theft via XSS — even if an attacker successfully injects a script, that script still can't exfiltrate the cookie |
| `Secure` | Cookie is only ever transmitted over an HTTPS connection | Network-level interception — someone on the same WiFi, a malicious router, a man-in-the-middle |
| `SameSite=Strict` (or `Lax`) | Browser won't attach this cookie to requests that originate from a different site | CSRF — a malicious page on evil.com cannot trigger a request to your bank carrying your real session cookie along with it |

```http
Set-Cookie: session=a8f7d3c9e2; HttpOnly; Secure; SameSite=Strict
```

**`SameSite=Strict` vs `SameSite=Lax`**: Strict blocks the cookie on every cross-site request, including a user clicking a link that navigates them to your site from somewhere else. Lax allows it on top-level navigation (clicking a link) but still blocks it on cross-site form submissions and fetch/XHR requests — which is enough to stop CSRF while being slightly less disruptive to normal use. Most modern frameworks default new cookies to `Lax`.

---

## 5. Self-Test — Don't Look Until You've Tried

1. A user disables JavaScript and submits a form directly with curl, completely bypassing your client-side validation. What does this prove, and what should you have already assumed?
2. A regular logged-in user changes `?id=42` to `?id=43` in the URL and successfully views a stranger's private data. Was this an authentication failure or an authorization failure? Why?
3. Which single cookie flag stops a stolen-via-XSS payload from successfully exfiltrating the session, even after the XSS itself has already executed?
4. Write out, in order, the 7 steps of what happens between a user submitting a login form and that same user's next request being recognized as "logged in."
5. In the 3-tier model, which tier-boundary crossing is SQL injection fundamentally a failure of?

### Answers

1. It proves frontend validation is a UX convenience only, never a security control. You should have already assumed every request could come from a tool that ignores your frontend entirely (curl, Postman, Burp), and built backend validation as if the frontend didn't exist.
2. Authorization failure. The user really is who they say they are (authentication succeeded) — the backend simply failed to verify that resource `id=43` actually belongs to the requesting user before returning it.
3. `HttpOnly`. It doesn't prevent the XSS injection itself, but it stops the injected script from being able to read `document.cookie`, which is the most damaging thing XSS payloads typically try to do.
4. (1) Browser POSTs credentials → (2) Server validates and creates a session record server-side → (3) Server responds with Set-Cookie → (4) Browser stores the cookie → (5) Browser attaches it to every future request automatically → (6) Server looks up the session ID to identify the user → (7) Session eventually expires or is destroyed on logout.
5. The boundary between the backend tier and the database tier — specifically, the moment untrusted input that originated in the frontend tier crosses into the database tier's query language without the backend tier separating "this is data" from "this is part of the command."

---

## Quick Reference Card

```
3-TIER MODEL:    Frontend (browser, untrusted) → Backend (server, enforces rules)
                 → Database (persistence, the prize)

AUTH vs AUTHZ:   Authentication = WHO you are (once, at login)
                 Authorization  = WHAT you can do (every request, every resource)

SESSION FLOW:    Login → server creates session ID → Set-Cookie → browser
                 auto-attaches it → server looks it up → recognizes user

COOKIE FLAGS:    HttpOnly  → blocks JS reading the cookie (anti-XSS-theft)
                 Secure    → HTTPS only (anti-interception)
                 SameSite  → blocks cross-site sending (anti-CSRF)

KEY PRINCIPLE:   Never trust anything enforced only in the frontend.
```
