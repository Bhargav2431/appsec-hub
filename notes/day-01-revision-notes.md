# Day 1 Revision Notes — HTTP: How the Web Works

**Roadmap phase:** Foundations
**Connects to:** Day 6 (Burp Suite), Day 8 (SQL Injection), Day 11 (Authentication)
**Revision date:** _______________

---

## The One Sentence Summary

> HTTP is a request/response conversation between your browser and a server. Every web vulnerability is a manipulation of that conversation.

---

## 1. HTTP Request — What You Send

Every time you visit a website, your browser sends a request. It has 4 parts:

| Part | What it is | Example |
|------|-----------|---------|
| **Method** | What you want to do | GET, POST, PUT, DELETE |
| **URL** | Where to do it | https://example.com/login |
| **Headers** | Metadata (who you are, what you accept) | User-Agent, Authorization |
| **Body** | Data you're sending (POST only) | username=admin&password=123 |

### Methods in plain English

- **GET** — "Give me something." Data goes in the URL. No body.
- **POST** — "Here's something, process it." Data goes in the body.
- **PUT** — "Replace this thing with what I'm sending."
- **DELETE** — "Remove this thing."

---

## 2. HTTP Response — What the Server Sends Back

| Part | What it is | Example |
|------|-----------|---------|
| **Status code** | Did it work? | 200, 404, 500 |
| **Headers** | Metadata about the response | Content-Type, Set-Cookie |
| **Body** | The actual content | HTML page, JSON data |
| **Cookies** | Data the server wants to store in your browser | session=abc123 |

---

## 3. Status Codes — Cheat Sheet

Memorize these. Interviewers ask constantly.

```
2xx = SUCCESS
  200 OK            — Request worked. Here's your data.
  201 Created       — Resource was created successfully.

3xx = REDIRECT
  301 Moved         — Permanently gone to new URL.
  302 Found         — Temporarily at another URL.

4xx = CLIENT ERROR (your fault)
  400 Bad Request   — Your request was malformed.
  401 Unauthorized  — Who are you? Show ID.
  403 Forbidden     — I know who you are. You're not allowed.
  404 Not Found     — That page doesn't exist.
  429 Too Many      — Slow down. Rate limit hit.

5xx = SERVER ERROR (their fault)
  500 Server Error  — The server broke. Not your fault.
  502 Bad Gateway   — Server's upstream is down.
  503 Unavailable   — Server temporarily offline.
```

### The 401 vs 403 distinction (interview favourite)

- **401** = "I don't know who you are. Log in first."
- **403** = "I know who you are. You don't have permission."

---

## 4. Key Terms

| Term | Plain English |
|------|--------------|
| **HTTP** | The language browsers and servers use to talk |
| **HTTPS** | HTTP + TLS encryption (the padlock icon) |
| **URL** | The full address (https://example.com/login) |
| **Domain** | example.com |
| **Path** | /login (what comes after the domain) |
| **Query string** | ?user=john&id=5 (data in the URL after ?) |
| **Header** | Metadata in every request/response |
| **Cookie** | Small data the server stores in your browser |
| **Session** | Server's memory of who you are between requests |
| **User-Agent** | Header identifying what browser/tool you're using |

---

## 5. GET vs POST — The Key Difference

| | GET | POST |
|-|-----|------|
| Data goes in | URL (?key=value) | Request body |
| Visible in | Browser bar, logs, history | Hidden from URL |
| Use for | Reading data | Submitting, changing data |
| Can be bookmarked? | Yes | No |
| Cached by browser? | Yes | No |

**Security rule:** Never send passwords, tokens, or sensitive data in a GET request. URLs appear in server logs, browser history, and Referer headers.

---

## 6. Query Strings — How URLs Carry Data

A query string starts with `?` and uses `key=value` pairs separated by `&`:

```
https://example.com/search?username=admin&role=user
                           ↑              ↑
                        starts here   separator
```

**Why this matters for AppSec:**
- Query parameters are user-controllable input
- SQL injection, XSS, and IDOR all start here
- Attackers change `?id=5` to `?id=6` to see another user's data

---

## 7. Headers — What They Reveal

Common request headers attackers look at:

```
User-Agent: curl/8.4.0      ← reveals what tool you're using
Authorization: Bearer abc123 ← your auth token
Cookie: session=xyz          ← your session ID
Content-Type: application/json ← format of body data
```

Common response headers security engineers check:

```
Server: Apache/2.2.15        ← INFORMATION DISCLOSURE
Set-Cookie: session=abc      ← should have HttpOnly; Secure flags
X-Frame-Options: DENY        ← prevents clickjacking
Content-Security-Policy: ... ← prevents XSS
Strict-Transport-Security:   ← forces HTTPS
```

---

## 8. curl Cheat Sheet

Commands you ran in Lab 2:

```bash
# Simple GET
curl https://httpbin.org/get

# GET with parameters
curl "https://httpbin.org/get?name=bhargav&role=student"

# POST with form data
curl -X POST -d "username=admin&password=test123" https://httpbin.org/post

# POST with JSON
curl -X POST -H "Content-Type: application/json" \
     -d '{"username":"admin"}' https://httpbin.org/post

# Show full request AND response (verbose)
curl -v https://httpbin.org/get

# Custom header
curl -H "User-Agent: MyScanner/1.0" https://httpbin.org/get

# Save output to file
curl https://httpbin.org/get -o output.json

# Follow redirects
curl -L https://httpbin.org/redirect/2

# Ignore SSL errors (TESTING ONLY — never production)
curl -k https://self-signed.example.com
```

### Reading curl -v output

```
* Lines    = curl's internal info (DNS, TLS, connection)
> Lines    = YOUR request (what you sent)
< Lines    = SERVER's response (what came back)
```

---

## 9. Python Requests — Cheat Sheet

Commands from Lab 3:

```python
import requests

# GET request
r = requests.get("https://httpbin.org/get")
r.status_code   # integer: 200, 404, 500
r.headers       # dict of response headers
r.text          # response body as string
r.json()        # response body parsed as JSON dict

# GET with parameters
r = requests.get("https://httpbin.org/get",
                 params={"name": "bhargav", "role": "student"})

# POST with form data
r = requests.post("https://httpbin.org/post",
                  data={"username": "admin", "password": "test"})

# POST with JSON
r = requests.post("https://httpbin.org/post",
                  json={"username": "admin"})

# Custom headers
headers = {"User-Agent": "MyScanner/1.0", "Authorization": "Bearer token"}
r = requests.get("https://httpbin.org/get", headers=headers)

# Session (persists cookies between requests — like a browser)
session = requests.Session()
session.post("https://example.com/login", data={"user": "admin", "pass": "123"})
session.get("https://example.com/dashboard")  # cookie sent automatically

# Timeout (ALWAYS set this in real scripts)
r = requests.get("https://httpbin.org/get", timeout=5)
```

---

## 10. How a Login Works — The Full Picture

Understanding this is fundamental to AppSec:

```
1. You fill in username + password
2. Browser sends: POST /login
   Body: username=admin&password=secret
3. Server checks credentials against database
4. If correct, server creates a session ID (random string like "abc123")
5. Server stores: session["abc123"] = "admin user"
6. Server sends: Set-Cookie: session=abc123
7. Your browser stores the cookie
8. Every future request automatically sends: Cookie: session=abc123
9. Server looks up "abc123" to know it's you
```

**Why sessions matter for AppSec:** Stealing the session cookie = stealing the logged-in user's account. This is why cookies need `HttpOnly` (can't be stolen by JavaScript) and `Secure` (only sent over HTTPS) flags.

---

## 11. AppSec Connections — What Day 1 Unlocks

| Day 1 concept | What it enables later |
|--------------|----------------------|
| GET parameters | SQL injection (Day 8), IDOR (Day 12) |
| POST body | Authentication attacks (Day 11), CSRF (Day 13) |
| Headers | JWT manipulation (Day 15), fingerprinting |
| Cookies | Session hijacking, XSS cookie theft (Day 9) |
| Status codes | Enumeration, error-based SQL injection |
| curl -v | Debugging every lab you'll ever do |
| requests.Session | Automated security testing scripts |

---

## 12. Self-Test — Can You Answer These?

Without looking above, answer these:

1. What are the 4 parts of an HTTP request?
2. What's the difference between 401 and 403?
3. Why is putting a password in a GET request dangerous?
4. What does `curl -v` show that plain `curl` doesn't?
5. What's the difference between `requests.get()` and `requests.Session()`?
6. What does the `Set-Cookie` response header do?
7. What status code means "too many requests"?
8. What does the `User-Agent` header reveal?
9. Which HTTP method is idempotent — running it 10 times gives the same result?
10. What's a session? How is it different from a cookie?

**Score:**
- 9–10 correct: Day 1 is solid. Move to Day 2.
- 7–8 correct: Review sections you got wrong, then move on.
- Below 7: Redo the interactive HTML for Day 1 before continuing.

---

## Quick Reference Card (Screenshot this)

```
HTTP VERBS:    GET (read)  POST (create)  PUT (update)  DELETE (remove)
STATUS CODES:  200 ✓  201 created  301 moved  302 temp  400 bad  401 no-id
               403 denied  404 gone  429 slow-down  500 server-broke
HEADERS:       User-Agent  Authorization  Cookie  Content-Type  Set-Cookie
DATA IN:       GET → URL (?key=val)    POST → body (hidden)
CURL FLAGS:    -v verbose  -X method  -d data  -H header  -L follow  -o save
PYTHON:        r.status_code  r.headers  r.text  r.json()  Session()
```
