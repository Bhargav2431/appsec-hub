# Day 6 Revision Notes — The OWASP Top 10

**Roadmap phase:** Foundations
**Connects to:** Day 5 (Architecture), Days 8–20 (every individual vulnerability class), Day 17 (Threat Modeling)
**Revision date:** _______________

---

## The One Sentence Summary

> The OWASP Top 10 is the field's own ranking of its most critical risks, built from real breach data — and it is the single most-asked-about reference in every AppSec interview you will ever sit.

---

## 1. What OWASP Actually Is

**OWASP** = Open Worldwide Application Security Project. A nonprofit foundation, not a vendor — which is part of why the Top 10 carries the authority it does; nobody's trying to sell you a product by publishing it. The list is rebuilt periodically (most recently 2021) from a combination of contributed real-world vulnerability data and a practitioner survey, then ranked by a formula weighing how often each category is exploited, how easy it typically is to find, and how severe the resulting impact tends to be.

It is not a list of *bugs*. It's a list of *categories of bugs* — broad enough that a specific vulnerability you find in the wild (say, a particular SQL injection on a particular login form) is always an instance of exactly one of these ten categories, even though the list itself doesn't name that specific bug.

---

## 2. The Full List, In Depth

### A01 — Broken Access Control
**The most frequently reported category in the entire list.** A user accesses, modifies, or deletes something that proper authorization checks should have stopped them from touching.
- **Real example pattern**: `GET /profile?id=42` → change to `?id=43` → see a stranger's data, no error
- **Why it's #1**: it's structurally easy to introduce (one missing ownership check) and structurally easy to find (just change a number in a URL)
- **Fix**: enforce authorization server-side, explicitly, on every request — never infer permission from "the user wouldn't normally guess this ID"

### A02 — Cryptographic Failures
Sensitive data exposed because encryption was weak, missing, or implemented wrong. Covers data in transit (no HTTPS) and at rest (plaintext or weakly-hashed storage).
- **Real example pattern**: a `password_hash` column that actually contains `MD5("password123")` — crackable in seconds with modern hardware
- **Fix**: HTTPS everywhere with HSTS; bcrypt or argon2 specifically for passwords; AES-256 for data at rest; never invent your own cipher

### A03 — Injection
Untrusted data is sent directly into an interpreter — SQL, OS shell, LDAP, NoSQL — and that interpreter cannot distinguish the attacker's payload from the developer's intended command.
- **Real example pattern**: a login field accepting `admin' OR '1'='1` and the WHERE clause becoming permanently true
- **Fix**: parameterized queries, always, as the primary defense; input validation as a secondary layer, never the only one

### A04 — Insecure Design
A flaw in the blueprint itself, present before a single line of code was written. Distinct from a coding mistake — no amount of careful implementation fixes a fundamentally unsafe design.
- **Real example pattern**: a password reset flow relying on "what city were you born in?" — answerable via five minutes on social media
- **Fix**: threat modeling during the design phase, not bolted on after launch; security requirements written into user stories the same way a performance requirement would be

### A05 — Security Misconfiguration
The gap between "the software works" and "the software was actually hardened before deployment." Default credentials never rotated, unnecessary features left enabled, verbose error pages leaking stack traces, missing security headers.
- **Real example pattern**: a production server still answering on `/admin` with the factory-default `admin:admin` login
- **Fix**: harden every configuration explicitly; remove what you don't need; treat "it came with defaults" as a finding, not an excuse

### A06 — Vulnerable & Outdated Components
Running a third-party dependency with a publicly disclosed CVE you simply haven't patched yet. Modern apps are assembled from hundreds of packages, each one running with your app's own privileges.
- **Real example pattern**: still running Log4j 2.14.1 months after Log4Shell (CVE-2021-44228) made global news
- **Fix**: automated dependency scanning (Snyk, Dependabot, OWASP Dependency-Check); subscribe to CVE feeds for your specific stack; patch on a schedule, not "eventually"

### A07 — Identification & Authentication Failures
The login system itself can be broken into. Weak password policies, no rate limiting on attempts, predictable session tokens, missing MFA.
- **Real example pattern**: a login endpoint accepting unlimited attempts per second, no lockout, no CAPTCHA, no delay
- **Fix**: rate limiting and account lockout; MFA wherever the stakes justify it; session tokens from a cryptographically secure random source, never sequential

### A08 — Software & Data Integrity Failures
Trusting an update or a serialized object you can't actually verify. Includes insecure deserialization (a crafted malicious object executes code when unpacked) and unverified auto-updates.
- **Real example pattern**: an app auto-installing updates from a CDN with no signature check — compromise the CDN once, compromise every installation
- **Fix**: verify digital signatures before trusting updates; Subresource Integrity (SRI) for third-party scripts; avoid deserializing untrusted data where possible

### A09 — Security Logging & Monitoring Failures
Not a vulnerability that lets an attacker in — a vulnerability that lets them *stay*, undetected, for months. The average real-world breach in recent years went undetected for nearly 200 days.
- **Real example pattern**: attackers with quiet database access for 197 days before anyone noticed the exfiltration
- **Fix**: comprehensive audit logging of security-relevant events; real-time alerting, not log files nobody reads; an incident response plan rehearsed before you actually need it

### A10 — Server-Side Request Forgery (SSRF)
The newest addition to the list, and arguably the most dangerous in cloud environments, because the server itself has network access and credentials the attacker doesn't. The server is tricked into making a request on the attacker's behalf.
- **Real example pattern**: a "fetch this image URL" feature pointed at `http://169.254.169.254/` — the AWS metadata service — returning the instance's IAM credentials
- **Fix**: whitelist allowed destination URLs explicitly; block requests to private IP ranges and the cloud metadata address by default, not as an afterthought

---

## 3. Memorization Tools

### The mnemonic
**"Because Code Is Insecure, Security Vulnerabilities Identify Software Liability Seriously"**

| Word | Category |
|------|----------|
| **B**ecause | **B**roken Access Control (A01) |
| **C**ode | **C**ryptographic Failures (A02) |
| **I**s | **I**njection (A03) |
| **I**nsecure | **I**nsecure Design (A04) |
| **S**ecurity | **S**ecurity Misconfiguration (A05) |
| **V**ulnerabilities | **V**ulnerable Components (A06) |
| **I**dentify | **I**dentification/Auth Failures (A07) |
| **S**oftware | **S**oftware Integrity Failures (A08) |
| **L**iability | Logging Failures (A09) — *the L stands in for "Logging," not literally starting the same letter, this one's a deliberate exception in the sentence* |
| **S**eriously | **S**SRF (A10) |

### The "which tier" cross-reference (ties back to Day 5)
- A01, A03, A07: almost always backend-tier failures
- A02, A06, A08: often a supply-chain or infrastructure-tier issue
- A04: a design-stage failure, before any tier was even built
- A05, A09: operational/deployment failures, not strictly code

---

## 4. Self-Test — Don't Look Until You've Tried

1. A web app lets any logged-in user view `/invoice?id=N` for any N, with no check that the invoice belongs to them. Which rank is this?
2. A company discovers attackers had quiet database access for six months before anyone noticed. Which rank failed them, even though it likely wasn't the original entry point?
3. Which rank specifically covers a server being tricked into requesting an internal cloud metadata endpoint on an attacker's behalf?
4. A password reset flow uses "what city were you born in?" as its only verification. Is this A03 (Injection), A04 (Insecure Design), or A07 (Auth Failures) — and why does the distinction matter?
5. Running a library version with a publicly disclosed CVE you haven't patched falls under which rank?
6. Recite all ten ranks in order, from memory, using the mnemonic.

### Answers

1. A01 — Broken Access Control. This is the textbook IDOR pattern, and IDOR sits squarely under A01, the most frequently reported category in the list.
2. A09 — Logging & Monitoring Failures. A09 usually isn't the way attackers get in; it's the reason they're able to stay once they already are.
3. A10 — SSRF, and specifically the newest addition to the list, added largely because of how dangerous this pattern became once everything moved to the cloud.
4. A04 — Insecure Design. The distinction matters because A03 would imply a coding-level injection bug (it's not), and A07 would imply the authentication mechanism itself was compromised (it's not that either) — the entire *approach* of using a guessable security question was unsafe from the blueprint stage, before any code was written.
5. A06 — Vulnerable & Outdated Components. The Log4Shell incident is the most famous real-world specimen of exactly this category.
6. Broken Access Control · Cryptographic Failures · Injection · Insecure Design · Security Misconfiguration · Vulnerable Components · Identification/Auth Failures · Software Integrity Failures · Logging Failures · SSRF

---

## Quick Reference Card

```
A01  Broken Access Control       — wrong person sees/changes the wrong data
A02  Cryptographic Failures      — weak/missing encryption, MD5 for passwords
A03  Injection                   — untrusted input reaches an interpreter raw
A04  Insecure Design             — the blueprint itself was unsafe
A05  Security Misconfiguration   — defaults never hardened
A06  Vulnerable Components       — known CVE, unpatched dependency
A07  Auth Failures                — the login system itself is breakable
A08  Software/Data Integrity     — unverified updates, insecure deserialization
A09  Logging/Monitoring Failures — breach nobody noticed for months
A10  SSRF                         — server fetches attacker-controlled URLs

MNEMONIC: "Because Code Is Insecure, Security Vulnerabilities
           Identify Software Liability Seriously"
```
