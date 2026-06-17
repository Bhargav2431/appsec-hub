# Day 4 Revision Notes — Python for Security Work

**Roadmap phase:** Foundations
**Environment:** Mac + VS Code
**Connects to:** Day 10 (web recon), Day 22 (recon scripts), Day 42–44 (AI security tools), Day 52 (AWS auditor)
**Revision date:** _______________

---

## The One Sentence Summary

> Python is the language of security automation. requests makes HTTP calls, socket scans ports, re finds patterns, and file I/O scales your tools from 1 target to 1000.

---

## 1. The requests Library — HTTP from Python

### Core methods

```python
import requests

# GET — read data
r = requests.get("https://httpbin.org/get")

# POST — submit data
r = requests.post("https://httpbin.org/post", data={"user":"admin"})

# POST with JSON (for APIs)
r = requests.post(url, json={"user":"admin"})  # NOT data=

# PUT — update data
r = requests.put(url, json={"field": "new_value"})

# DELETE — delete data
r = requests.delete(url)

# HEAD — headers only, no body (faster for checking if URL exists)
r = requests.head(url)
```

### Response object — what you get back

```python
r = requests.get("https://example.com")

r.status_code      # Integer: 200, 404, 500
r.ok               # Boolean: True if 200-299
r.headers          # Dict: response headers
r.text             # String: response body as text
r.json()           # Dict: response body parsed as JSON (throws if not JSON)
r.content          # Bytes: raw binary content
r.url              # String: final URL after redirects
r.history          # List: redirect chain
r.cookies          # Cookies the server sent
r.elapsed          # timedelta: how long the request took
```

### Parameters, headers, timeouts

```python
# Query parameters (?name=bhargav&role=student)
r = requests.get(url, params={"name": "bhargav", "role": "student"})

# Custom headers (User-Agent bypass, auth tokens)
headers = {
    "User-Agent": "MyScanner/1.0",
    "Authorization": "Bearer your-token-here",
    "X-Custom-Header": "value"
}
r = requests.get(url, headers=headers)

# Timeout — ALWAYS set this
r = requests.get(url, timeout=5)      # 5 seconds max
r = requests.get(url, timeout=(3,10)) # 3s connect, 10s read

# Disable SSL verification (TESTING ONLY)
r = requests.get(url, verify=False)

# Follow redirects (default: True)
r = requests.get(url, allow_redirects=False)
```

### Sessions — stay logged in

```python
session = requests.Session()

# All subsequent requests share cookies and headers
session.headers.update({"User-Agent": "MyScanner/1.0"})
session.post(url + "/login", data={"user":"admin","pass":"123"})
session.get(url + "/dashboard")   # cookie automatically sent
session.get(url + "/admin")       # still authenticated
session.close()                   # clean up when done
```

### Exception handling — required for scanners

```python
import requests

try:
    r = requests.get(url, timeout=5)
    r.raise_for_status()  # raises HTTPError for 4xx/5xx
except requests.Timeout:
    print(f"TIMEOUT: {url}")
except requests.ConnectionError:
    print(f"DOWN: {url}")
except requests.HTTPError as e:
    print(f"HTTP {r.status_code}: {url}")
except requests.RequestException as e:
    print(f"ERROR: {e}")
```

---

## 2. String Manipulation for Security

### Essential string methods

```python
s = "  Content-Type: application/json  "

s.strip()           # "Content-Type: application/json" (remove whitespace)
s.lower()           # all lowercase
s.upper()           # ALL UPPERCASE
s.split(": ")       # ["Content-Type", "application/json"] — split on separator
s.split(": ", 1)    # maxsplit=1 — split only at FIRST occurrence
s.startswith("X-")  # True/False
s.endswith(".php")  # True/False
s.replace("http://","https://")  # swap substrings
"password" in s     # True/False — substring check
s.strip().split("\n")  # split log lines
```

### URL manipulation

```python
from urllib.parse import urlparse, parse_qs, urlencode

url = "https://example.com/search?id=5&role=admin"

parsed = urlparse(url)
parsed.scheme    # 'https'
parsed.netloc    # 'example.com'
parsed.path      # '/search'
parsed.query     # 'id=5&role=admin'

params = parse_qs(parsed.query)
# {'id': ['5'], 'role': ['admin']}

# Build URLs safely
from urllib.parse import urljoin
full = urljoin("https://example.com/api/", "login")
# 'https://example.com/api/login'
```

### f-strings (use these everywhere)

```python
port = 443
service = "https"
status = "OPEN"

# f-string (modern, use this)
print(f"[{status}] Port {port}: {service}")
# [OPEN] Port 443: https

# Padding/alignment
print(f"Port {port:5d}: {service:<10} {status}")
#     Port   443: https      OPEN
```

---

## 3. Regular Expressions (regex)

### Import and basic methods

```python
import re

text = "Email: bhargav@vcu.edu, Server: Apache/2.4.51"

# Search: find FIRST match
match = re.search(r"Apache/[\d.]+", text)
if match:
    print(match.group())  # 'Apache/2.4.51'

# Findall: find ALL matches (returns list)
emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
# ['bhargav@vcu.edu']

# Sub: replace matches
clean = re.sub(r"Apache/[\d.]+", "REDACTED", text)
# 'Email: bhargav@vcu.edu, Server: REDACTED'

# Compile for reuse (faster in loops)
pattern = re.compile(r"AKIA[A-Z0-9]{16}")
found = pattern.findall(source_code)
```

### Security-specific patterns

```python
# AWS Access Key
r"AKIA[A-Z0-9]{16}"

# Email address
r"[\w.+-]+@[\w-]+\.[\w.-]+"

# IPv4 address
r"\b(?:\d{1,3}\.){3}\d{1,3}\b"

# URL
r"https?://[\w.-]+(?:/[\w./?=%&-]*)?"

# US Phone number
r"\d{3}-\d{3}-\d{4}"

# Private IP (for finding internal addresses leaked in responses)
r"(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.(?:\d{1,3}\.)\d{1,3}"

# Generic API key (any long alphanumeric string)
r"['\"]([A-Za-z0-9_-]{20,})['\"]"

# Version numbers
r"\d+\.\d+\.\d+"

# SQL error (information disclosure)
r"(?i)(sql syntax|mysql_fetch|ORA-\d+|sqlite_\w+)"
```

### Regex flags

```python
# Case-insensitive
re.findall(r"password", text, re.IGNORECASE)

# Multiline (^ and $ match each line)
re.findall(r"^password.*", text, re.MULTILINE)

# Combine flags
re.findall(r"error", text, re.IGNORECASE | re.MULTILINE)
```

---

## 4. File Operations

### Reading files — 3 patterns

```python
# Pattern 1: Read all lines at once (small files)
with open("targets.txt") as f:
    targets = f.readlines()     # list of lines with \n
    targets = f.read().splitlines()  # list of lines WITHOUT \n

# Pattern 2: Iterate line by line (large files — memory efficient)
with open("access.log") as f:
    for line in f:
        if "Failed" in line:
            process(line.strip())

# Pattern 3: List comprehension with filter
with open("targets.txt") as f:
    targets = [line.strip() for line in f if line.strip()]
    # Strips whitespace AND skips empty lines in one go
```

### Writing files

```python
# Write (overwrite) — fresh start each run
with open("results.txt", "w") as f:
    f.write("Scan Results\n")
    f.write(f"Target: example.com\n")

# Append — keep adding to file
with open("results.txt", "a") as f:
    f.write(f"[OPEN] Port 80: http\n")

# Write multiple lines at once
lines = ["Line 1\n", "Line 2\n", "Line 3\n"]
with open("output.txt", "w") as f:
    f.writelines(lines)

# Write JSON (structured output)
import json
data = {"target": "example.com", "open_ports": [22, 80, 443]}
with open("results.json", "w") as f:
    json.dump(data, f, indent=2)
```

### File paths

```python
import os
from pathlib import Path

# Current directory
cwd = os.getcwd()

# Combine paths safely
path = os.path.join("results", "scan_output.txt")
# or with pathlib (modern):
path = Path("results") / "scan_output.txt"

# Check if file exists
if os.path.exists("targets.txt"):
    # process it

# Create directory if needed
os.makedirs("results", exist_ok=True)
```

---

## 5. The socket Module — Raw Network Connections

### Port scanner pattern

```python
import socket
from datetime import datetime

def scan_port(target_ip, port, timeout=1):
    """Returns True if port is open, False if closed/filtered."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)  # CRITICAL — never omit this
    result = sock.connect_ex((target_ip, port))
    sock.close()
    return result == 0  # 0 = open, non-zero = closed/filtered

def scan_host(target, ports):
    target_ip = socket.gethostbyname(target)
    open_ports = []
    for port in ports:
        if scan_port(target_ip, port):
            try:
                service = socket.getservbyport(port)
            except OSError:
                service = "unknown"
            open_ports.append((port, service))
    return open_ports

# Usage on legal test target
results = scan_host("scanme.nmap.org", [22, 80, 443, 8080])
for port, service in results:
    print(f"[OPEN] {port}/{service}")
```

### Key socket concepts

| Code | What it means |
|------|--------------|
| `socket.AF_INET` | IPv4 protocol |
| `socket.SOCK_STREAM` | TCP connection |
| `socket.SOCK_DGRAM` | UDP connection |
| `sock.settimeout(N)` | Give up after N seconds |
| `sock.connect_ex()` | Try to connect (returns error code) |
| `sock.connect()` | Try to connect (throws exception on failure) |
| `result == 0` | Port is open |

---

## 6. The Port Scanner from Day 4

Full annotated version:

```python
import socket
import sys
from datetime import datetime

# Get target from user
target = input("Target IP or hostname: ")
target_ip = socket.gethostbyname(target)  # resolve hostname to IP

print(f"Scanning {target} ({target_ip})")
print(f"Started: {datetime.now()}")

# Common security-relevant ports
common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 3389, 5432, 8080]

for port in common_ports:
    # Create fresh socket per port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    # CRITICAL: timeout prevents infinite hang
    sock.settimeout(1)
    
    # 0 = open, non-zero = closed/filtered
    result = sock.connect_ex((target_ip, port))
    
    if result == 0:
        try:
            service = socket.getservbyport(port)  # lookup service name
        except:
            service = "unknown"
        print(f"[OPEN] Port {port}: {service}")
    
    sock.close()  # always close to prevent resource leak

print(f"Finished: {datetime.now()}")
```

**Legal target for testing:** `scanme.nmap.org`

---

## 7. The Web Checker from Day 4

```python
import requests

urls = [
    "https://google.com",
    "https://github.com",
    "https://nonexistent-site-xyz123.com"
]

security_headers = [
    "X-Frame-Options",         # prevents clickjacking
    "Content-Security-Policy", # prevents XSS
    "Strict-Transport-Security", # forces HTTPS
    "X-Content-Type-Options",  # prevents MIME sniffing
]

for url in urls:
    try:
        r = requests.get(url, timeout=5)
        print(f"\n[{r.status_code}] {url}")
        
        # Check security headers
        for header in security_headers:
            if header in r.headers:
                print(f"  ✓ {header}: {r.headers[header][:50]}")
            else:
                print(f"  ✗ MISSING: {header}")
        
        # Check for info disclosure
        if "Server" in r.headers:
            print(f"  ⚠ Server exposed: {r.headers['Server']}")
            
    except requests.Timeout:
        print(f"\nTIMEOUT: {url}")
    except requests.ConnectionError:
        print(f"\nDOWN: {url}")
    except Exception as e:
        print(f"\nERROR: {url} — {e}")
```

---

## 8. Common Python Security Patterns

### The scanning loop pattern

```python
# Standard pattern for multi-target scanners
results = []

with open("targets.txt") as f:
    targets = [l.strip() for l in f if l.strip()]

for target in targets:
    try:
        result = scan(target)
        results.append(result)
        print(f"[OK] {target}: {result['status']}")
    except Exception as e:
        print(f"[ERR] {target}: {e}")
        results.append({"target": target, "error": str(e)})

# Save all results
with open("results.json", "w") as f:
    json.dump(results, f, indent=2)
```

### The security header check pattern

```python
REQUIRED_HEADERS = {
    "X-Frame-Options": "Prevents clickjacking",
    "Content-Security-Policy": "Prevents XSS",
    "Strict-Transport-Security": "Forces HTTPS",
    "X-Content-Type-Options": "Prevents MIME sniffing",
    "Referrer-Policy": "Controls referrer info",
}

def check_headers(url):
    r = requests.get(url, timeout=10)
    missing = []
    for header, purpose in REQUIRED_HEADERS.items():
        if header not in r.headers:
            missing.append(f"{header} ({purpose})")
    return missing
```

---

## 9. AppSec Connections

| Python skill | How you'll use it |
|-------------|------------------|
| `requests.Session()` | Authenticated testing (Day 11 auth attacks, Day 15 JWT) |
| `re.findall()` | Secret scanning in source code, log analysis (Day 20, 36) |
| File I/O + loop | Multi-target scanning (Day 10, 22) |
| `socket` module | Port scanner (Day 22 recon) |
| Custom headers | User-Agent bypass, token injection in tests |
| Exception handling | Resilient scanners that don't crash on one bad target |
| `timeout=N` | Production scanners must be time-bounded |
| JSON output | Structured findings for reporting (Day 17) |

---

## 10. Quick Reference Card

```
REQUESTS:
  get(url, params={}, headers={}, timeout=5)
  post(url, data={} OR json={}, headers={}, timeout=5)
  session = Session(); session.post(login); session.get(auth_page)
  r.status_code  r.headers  r.text  r.json()  r.ok

EXCEPTIONS:
  Timeout → target too slow
  ConnectionError → target down
  HTTPError → 4xx/5xx response (use r.raise_for_status())

REGEX:
  re.search(pattern, text)     → first match object or None
  re.findall(pattern, text)    → list of all matches
  re.sub(pattern, repl, text)  → replace all matches
  re.IGNORECASE flag           → case insensitive

FILE I/O:
  open("f","r") → read    open("f","w") → overwrite
  open("f","a") → append  always use: with open() as f:

SOCKET:
  sock = socket.socket(AF_INET, SOCK_STREAM)
  sock.settimeout(1)  ← NEVER FORGET THIS
  result = sock.connect_ex((ip, port))
  if result == 0: port is OPEN
  sock.close()
```

---

## 11. Self-Test

1. What's the difference between `requests.post(url, data={})` and `requests.post(url, json={})`?
2. Why must you always set `timeout=N` in security scanning scripts?
3. What does `sock.connect_ex()` return when a port is open?
4. What's the difference between `open("f","w")` and `open("f","a")`?
5. Write a regex pattern to find email addresses in a string.
6. What exception catches a connection that times out?
7. Why use `requests.Session()` instead of `requests.get()` for testing authenticated pages?
8. What does `re.findall()` return vs `re.search()`?
9. What's the most efficient way to loop through a 100,000-line log file in Python?
10. Name 3 security headers you should check for on every web scan.

**Score:**
- 9–10: Strong Python security foundation. Move to Day 5.
- 7–8: Review weak sections, then continue.
- Below 7: Rebuild the port scanner from scratch without looking at notes.
