# How to Push Day 1 and Day 2 Work to GitHub

**Time required:** 10 minutes
**Do this:** At the end of every study day, before closing your laptop

---

## What goes where

You have 4 repos. Use the right one each time.

| What you're pushing | Which repo |
|--------------------|------------|
| Day 1 notes, Day 2 notes, revision files | `60-day-appsec-journey` |
| Python scripts (Lab 3 from Day 1) | `python-security-scripts` |
| Security scripts (find_secrets.sh from Day 2) | `python-security-scripts` |
| Big projects (later in roadmap) | `appsec-portfolio` |
| AWS lab work (Days 26–40) | `aws-security-labs` |

---

## Step 1: Open Terminal on your Mac

Not Kali. Not Windows VM. Your Mac Terminal.

```bash
# Spotlight: Cmd+Space → type "Terminal" → Enter
```

---

## Step 2: Create and save your Day 1 notes

```bash
# Go to the journey repo
cd ~/Documents/appsec-roadmap/60-day-appsec-journey

# Open VS Code in this folder
code .
```

In VS Code, create a new file called `day-01-revision-notes.md`. Copy the revision notes content into it (or write your own in your own words — better for memory).

Save with **Cmd+S**.

---

## Step 3: Push Day 1 notes to GitHub

Back in Terminal:

```bash
# Make sure you're in the right repo
cd ~/Documents/appsec-roadmap/60-day-appsec-journey

# Check what's new (should show your new file)
git status

# Stage all changes
git add .

# Commit with a clear message
git commit -m "Day 1: HTTP fundamentals revision notes"

# Push to GitHub
git push
```

Verify: Go to github.com → your `60-day-appsec-journey` repo → you should see `day-01-revision-notes.md` listed.

---

## Step 4: Push Day 1 Python Lab 3 script

```bash
# Switch to scripts repo
cd ~/Documents/appsec-roadmap/python-security-scripts

# If you wrote requests_intro.py during the lab, it should be here already
# If not, create it now in VS Code
code .
```

Create `day-01-lab3-requests.py` with the Python code from Day 1 Lab 3:

```python
"""
Day 1 Lab 3 — Python HTTP Requests
Using the requests library to make GET and POST requests.
Target: httpbin.org (safe testing site)
"""

import requests

# ---- GET request ----
print("=== GET Request ===")
response = requests.get("https://httpbin.org/get")
print(f"Status: {response.status_code}")
print(f"My public IP: {response.json()['origin']}")
print(f"My User-Agent: {response.json()['headers']['User-Agent']}")

# ---- GET with parameters ----
print("\n=== GET with Parameters ===")
response = requests.get(
    "https://httpbin.org/get",
    params={"name": "bhargav", "role": "student"}
)
print(f"Params server saw: {response.json()['args']}")

# ---- POST with form data ----
print("\n=== POST Request ===")
response = requests.post(
    "https://httpbin.org/post",
    data={"username": "admin", "password": "test123"}
)
print(f"Form data server saw: {response.json()['form']}")

# ---- Custom headers ----
print("\n=== Custom Headers ===")
headers = {"User-Agent": "BhargavScanner/1.0"}
response = requests.get("https://httpbin.org/get", headers=headers)
print(f"User-Agent server saw: {response.json()['headers']['User-Agent']}")

# ---- Session (persistent cookies) ----
print("\n=== Session (Persistent Cookies) ===")
session = requests.Session()
session.get("https://httpbin.org/cookies/set/sessionid/abc123")
response = session.get("https://httpbin.org/cookies")
print(f"Cookie persisted: {response.json()}")
```

Save the file. Then push:

```bash
git add .
git commit -m "Day 1: Lab 3 Python requests script"
git push
```

---

## Step 5: Save and push Day 2 notes

```bash
# Back to journey repo for notes
cd ~/Documents/appsec-roadmap/60-day-appsec-journey

# Open VS Code
code .
```

Create `day-02-revision-notes.md`. Add your Day 2 notes.

Save. Then push:

```bash
git add .
git commit -m "Day 2: Linux command line revision notes"
git push
```

---

## Step 6: Push Day 2 security script (find_secrets.sh)

```bash
# Go to scripts repo
cd ~/Documents/appsec-roadmap/python-security-scripts
code .
```

Create `day-02-find-secrets.sh`:

```bash
#!/bin/bash
# Day 2 Lab 2 — Secret Scanner
# Finds potential credentials and sensitive files on a Linux system
# Usage: ./day-02-find-secrets.sh [target_folder]
# Warning: Educational use only. Only run on systems you own.

TARGET=${1:-"$HOME"}

echo "=================================="
echo " Secret Scanner — Day 2 Lab"
echo " Target: $TARGET"
echo "=================================="
echo ""

echo "[*] Searching for credentials in files..."
grep -rE "(password|passwd|api_key|secret|token|AWS_ACCESS)" \
  "$TARGET" 2>/dev/null | head -20

echo ""
echo "[*] Searching for .env files (often contain secrets)..."
find "$TARGET" -name ".env" 2>/dev/null

echo ""
echo "[*] World-writable files (security misconfiguration)..."
find "$TARGET" -perm -o+w -type f 2>/dev/null | head -10

echo ""
echo "[*] SUID files (potential privilege escalation)..."
find "$TARGET" -perm -4000 -type f 2>/dev/null | head -10

echo ""
echo "=================================="
echo " Scan complete"
echo "=================================="
```

Push it:

```bash
git add .
git commit -m "Day 2: Lab 2 find-secrets bash script"
git push
```

---

## Step 7: Update your README.md progress tracker

In VS Code, open `60-day-appsec-journey/README.md`. Update it:

```markdown
# 60-Day AppSec Journey

Daily notes from my journey from full-stack developer to
Application Security Engineer.

## Progress

- [x] Day 0: Setup and environment configuration
- [x] Day 1: HTTP fundamentals — requests, responses, curl, Python requests
- [x] Day 2: Linux command line — navigation, files, search, permissions, pipes
- [ ] Day 3: Networking compressed — TCP/IP, DNS, ports
...
```

Push the README:

```bash
cd ~/Documents/appsec-roadmap/60-day-appsec-journey
git add .
git commit -m "Progress: Days 1 and 2 complete"
git push
```

---

## Step 8: Verify everything on GitHub

Open your browser. Go to github.com and check:

### `60-day-appsec-journey` repo should contain:
- [ ] `README.md` (with Days 1–2 checked off)
- [ ] `day-01-revision-notes.md`
- [ ] `day-02-revision-notes.md`

### `python-security-scripts` repo should contain:
- [ ] `README.md`
- [ ] `day-01-lab3-requests.py`
- [ ] `day-02-find-secrets.sh`

### Your contribution graph
Go to github.com/Bhargav2431

Scroll down. You should see green squares on the days you committed. This is your proof of consistency. Every day you push = one green square. By Day 60, you'll have 60+ green squares and hiring managers will notice.

---

## The daily push habit (after today)

Every single evening before you close the laptop:

```bash
# Step 1: Push daily notes
cd ~/Documents/appsec-roadmap/60-day-appsec-journey
git add .
git commit -m "Day X: [what you covered today]"
git push

# Step 2: Push any code from today
cd ~/Documents/appsec-roadmap/python-security-scripts
git add .
git commit -m "Day X: [script name and what it does]"
git push

# Step 3: Mark day complete in roadmap HTML
# Open roadmap.html → click today's day → click "Mark as complete"
```

Total time: 3 minutes per day. Skipping this is how people lose their progress trail.

---

## Troubleshooting common push problems

### "fatal: not a git repository"

You're not inside a repo folder. Fix:
```bash
cd ~/Documents/appsec-roadmap/60-day-appsec-journey
git status   # should now work
```

### "Permission denied (publickey)"

SSH key not working. Fix:
```bash
ssh -T git@github.com   # should say "Hi Bhargav2431!"
# If it fails, re-add the SSH key to github.com/settings/ssh
```

### "nothing to commit, working tree clean"

You didn't save the file, or you're in the wrong repo. Fix:
```bash
pwd                  # check you're in the right folder
git status           # check what Git sees
ls                   # check the file actually exists here
```

### "rejected — remote contains work not in local"

Someone (or GitHub web editor) added something to the remote. Fix:
```bash
git pull             # download the remote changes first
git push             # now push yours
```

### File shows as modified but you don't want to commit it

```bash
git diff filename.md   # see what changed
git checkout filename.md   # undo changes to that file (careful)
```

---

## Commit message rules (employers read these)

Good commit messages, from your roadmap:

```bash
# Too vague — tells nothing
git commit -m "update"
git commit -m "fix stuff"

# Good — specific and informative
git commit -m "Day 1: HTTP revision notes + curl cheatsheet"
git commit -m "Day 2: Linux command reference + find_secrets.sh script"
git commit -m "Day 8: SQLi vulnerable Flask app + exploit documentation"
git commit -m "Day 18: Juice Shop — 15 challenges solved, security report"
```

Format: `Day X: [what the content is about]`

When a recruiter clicks your commit history and sees specific, informative messages for 60 days — that says "this person is disciplined and knows what they're doing."

---

## Folder structure goal (what your Mac should look like by Day 60)

```
~/Documents/appsec-roadmap/
├── 60-day-appsec-journey/
│   ├── README.md              ← progress tracker
│   ├── day-01-revision-notes.md
│   ├── day-02-revision-notes.md
│   ├── day-03-revision-notes.md
│   ... (one per day)
│   └── reflections.md         ← what you learned overall
│
├── python-security-scripts/
│   ├── README.md
│   ├── day-01-lab3-requests.py
│   ├── day-02-find-secrets.sh
│   ├── day-04-port-scanner.py
│   ├── day-10-web-recon.py
│   ... (scripts from each day)
│
├── appsec-portfolio/
│   ├── README.md
│   ├── vulnerable-flask-app/   ← Day 18 project
│   ├── juice-shop-writeup/     ← Day 18 assessment
│   ├── ai-cloudtrail-analyzer/ ← Day 42 project
│   └── aws-security-auditor/   ← Day 52 project
│
└── aws-security-labs/
    ├── README.md
    ├── terraform/              ← Day 34 Terraform code
    ├── iam-policies/           ← Day 27 IAM work
    └── security-findings/      ← Prowler reports
```

Build this structure one day at a time. By Day 60 it should be full.
