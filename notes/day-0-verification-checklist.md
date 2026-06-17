# Day 0 Final Verification Checklist

**Goal:** Confirm everything works before you start Day 1 tomorrow.
**Time:** ~30–45 minutes to walk through all checks.
**Rule:** Don't move to Day 1 until every box is checked. Fixing setup mid-Day-1 wastes hours.

---

## How to use this checklist

- Walk through each section in order.
- Run the commands exactly as shown.
- If a check **passes** → move on.
- If a check **fails** → stop and fix that one before continuing.
- At the end, all 9 sections must be green.

---

## Section 1: macOS Core Tools

Open **Mac Terminal** (Cmd+Space → "Terminal") and run each command. Each should print a version number.

### Commands to run

```bash
python3 --version
git --version
docker --version
brew --version
code --version
aws --version
terraform --version
jq --version
curl --version
```

### Expected results

- [ ] `python3 --version` shows **Python 3.11.x or higher**
- [ ] `git --version` shows **git version 2.x**
- [ ] `docker --version` shows **Docker version 20.x or higher**
- [ ] `brew --version` shows **Homebrew 4.x**
- [ ] `code --version` shows **a version number** (3 lines)
- [ ] `aws --version` shows **aws-cli/2.x**
- [ ] `terraform --version` shows **Terraform v1.x**
- [ ] `jq --version` shows **jq-1.x**
- [ ] `curl --version` shows **curl 8.x**

### If any fail

- **"command not found"** → that tool isn't installed. Install it:
  - `python3` → `brew install python3`
  - `docker` → reinstall Docker Desktop, make sure it's running
  - `aws` → `brew install awscli`
  - `terraform` → `brew install hashicorp/tap/terraform`
  - `jq` → `brew install jq`
  - `code` → reinstall VS Code, then in VS Code: Cmd+Shift+P → "Shell Command: Install 'code' command in PATH"

---

## Section 2: GUI Applications

Open each from Spotlight (Cmd+Space) or Applications folder. Confirm each launches without errors.

- [ ] **VS Code** opens (look for the blue icon)
- [ ] **Firefox** opens
- [ ] **Burp Suite Community Edition** opens — accept license → Temporary project → Use Burp defaults → Start Burp → lands on dashboard
- [ ] **Wireshark** opens — accept privileges request if it asks
- [ ] **Postman** opens — you can skip sign-in if it asks
- [ ] **Docker Desktop** opens — whale icon appears in menu bar, "Docker Desktop is running"
- [ ] **Ollama** opens (or is at least installed — runs in background)

### If any fail

- App not in Applications → reinstall via Homebrew Cask or download from official site

---

## Section 3: Docker Actually Working

**Why this matters:** You'll use Docker heavily from Day 8 onward (Juice Shop, vulnerable apps, container security).

### Command to run

```bash
docker run hello-world
```

### Expected output

You should see a message starting with:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

- [ ] "Hello from Docker!" appears

### If it fails

- **"Cannot connect to the Docker daemon"** → Docker Desktop isn't running. Open it from Applications, wait for "Docker Desktop is running."
- **Permission denied** → restart Docker Desktop, restart Terminal

---

## Section 4: Git + GitHub SSH Connection

**Why this matters:** You'll push to GitHub every day for 60 days. This MUST work smoothly.

### Step 4a: Git identity configured

```bash
git config --global user.name
git config --global user.email
```

- [ ] Both commands print your name and email (not blank)

### Step 4b: SSH key exists

```bash
ls -la ~/.ssh/ | grep id_ed25519
```

- [ ] Output shows both `id_ed25519` and `id_ed25519.pub`

### Step 4c: SSH connection to GitHub works

```bash
ssh -T git@github.com
```

- [ ] Output says: **"Hi <your-github-username>! You've successfully authenticated..."**

### If any fail

- Re-read my previous messages on SSH key setup
- Most common issue: SSH key generated but not added to GitHub Settings → SSH and GPG keys

---

## Section 5: Kali Linux VM

Boot your **Kali VM in VMware**.

### Inside Kali Terminal, run:

```bash
uname -a
which burpsuite nmap sqlmap python3 git curl
ip addr show
ping -c 3 google.com
```

### Expected results

- [ ] `uname -a` shows Linux information (any Linux line)
- [ ] All 6 tools (`burpsuite nmap sqlmap python3 git curl`) return paths (e.g., `/usr/bin/nmap`)
- [ ] `ip addr show` shows Kali's IP address (write it down — you'll need it)

  **Kali's IP: ________________________** (write here)

- [ ] `ping -c 3 google.com` gets replies — Kali has internet

### If any fail

- **Tool missing** → `sudo apt update && sudo apt install -y <toolname>`
- **No internet** → check VMware network settings (set to NAT or Bridged)

---

## Section 6: Windows VM (Target Machine)

Boot your **Windows VM**.

### Step 6a: Get Windows IP

In Windows VM, open **Command Prompt** (Win+R → cmd → Enter):
```
ipconfig
```

- [ ] Note your IPv4 address: **________________________**

### Step 6b: Verify Kali can reach Windows

In Kali Terminal:
```bash
ping -c 3 <windows-ip-from-above>
```

- [ ] Pings reply successfully (4 packets received)

### If ping fails

Most common cause: **Windows Firewall blocks ICMP by default**.

In Windows VM:
1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** (left sidebar)
3. Find rule **"File and Printer Sharing (Echo Request - ICMPv4-In)"** (Private profile)
4. Right-click → **Enable Rule**
5. Try ping from Kali again

If that doesn't work: ensure both VMs are on the same network mode (Bridged or NAT) in VMware settings.

---

## Section 7: All Accounts Active

Open each in your browser and sign in. Confirm you have access.

- [ ] **GitHub** (github.com) — signed in, can see your profile
- [ ] **AWS Console** (aws.amazon.com) — signed in to AWS Management Console
- [ ] **PortSwigger Web Security Academy** (portswigger.net/web-security) — account exists, can view labs
- [ ] **TryHackMe** (tryhackme.com) — signed in, can see dashboard
- [ ] **HackTheBox Academy** (academy.hackthebox.com) — account exists

### Passwords saved somewhere?

Use a password manager (Apple Keychain at minimum, ideally Bitwarden free). You'll create more accounts over the next 60 days. Don't reuse passwords.

- [ ] Passwords saved in a password manager (not in a text file, not in your head)

---

## Section 8: GitHub Repositories Exist

Go to **github.com/<your-username>**. Confirm these 4 repos exist:

- [ ] `60-day-appsec-journey` (public)
- [ ] `python-security-scripts` (public)
- [ ] `appsec-portfolio` (public)
- [ ] `aws-security-labs` (public)

Each should have:
- [ ] A `README.md` file
- [ ] At least one commit

### If repos don't exist

On github.com:
1. Click `+` (top right) → **New repository**
2. Name it exactly as above (lowercase, hyphens)
3. ✅ Check "Add a README file"
4. Visibility: **Public**
5. Click **Create repository**

Repeat for all 4 repos.

### Clone them to your Mac

```bash
mkdir -p ~/Documents/appsec-roadmap
cd ~/Documents/appsec-roadmap

git clone git@github.com:<your-username>/60-day-appsec-journey.git
git clone git@github.com:<your-username>/python-security-scripts.git
git clone git@github.com:<your-username>/appsec-portfolio.git
git clone git@github.com:<your-username>/aws-security-labs.git
```

Verify:
```bash
ls ~/Documents/appsec-roadmap/
```

- [ ] All 4 folders appear

---

## Section 9: AWS Free Tier — Billing Alert Set

**Critical:** Without this, a mistake on Day 26+ could give you a $200 surprise bill.

### Steps to verify

1. Sign into AWS Console
2. Switch region to **US East (N. Virginia)** — top right — *billing alarms only work in this region*
3. Search bar → type **CloudWatch** → open it
4. Left sidebar → **Alarms** → **Billing**
5. Confirm at least one alarm exists

### If no alarms exist

Create one now:
1. CloudWatch → Alarms → Billing → **Create alarm**
2. Select metric: **EstimatedCharges** (Currency: USD)
3. Threshold: **$5** (start small)
4. Notification: **Create new SNS topic** → enter your email
5. Confirm the subscription email AWS sends you

- [ ] Billing alarm exists in CloudWatch (us-east-1)
- [ ] SNS subscription confirmed via email

### Bonus: also create alarms at $10 and $25

You'll get warned multiple times if costs creep up.

---

## Section 10: Python Libraries for Day 1

Day 1 Lab 3 uses Python's `requests` library. Install it now.

```bash
pip3 install requests
```

If you get "externally-managed-environment" error on macOS, use:
```bash
pip3 install requests --break-system-packages
```

Verify:
```bash
python3 -c "import requests; print(requests.__version__)"
```

- [ ] Prints a version number (no errors)

While you're at it, install other libraries you'll need soon:

```bash
pip3 install flask boto3 anthropic feedparser
```

- [ ] `flask` (for Day 5 web app)
- [ ] `boto3` (for AWS scripting from Day 27)
- [ ] `anthropic` (for AI projects Day 42+)
- [ ] `feedparser` (for Day 44)

Verify all:
```bash
python3 -c "import requests, flask, boto3, anthropic, feedparser; print('All libraries OK')"
```

- [ ] "All libraries OK" prints

---

## Section 11: VS Code Extensions

Open VS Code → Extensions panel (Cmd+Shift+X) → install these:

- [ ] **Python** (by Microsoft)
- [ ] **GitLens** (by GitKraken)
- [ ] **HashiCorp Terraform** (by HashiCorp)
- [ ] **YAML** (by Red Hat)
- [ ] **Prettier** (by Prettier)
- [ ] **GitHub Pull Requests** (by GitHub)

Each takes 10 seconds to install. Total: 1 minute.

---

## Section 12: Critical Non-Technical Items

These are often skipped but matter.

- [ ] **DSO email sent** to VCU about unpaid RADLab internship and OPT validity
- [ ] **Calendar blocked** for next 60 days — 5–6 hours every day reserved for roadmap work
- [ ] **Phone notifications silenced** during study hours (huge productivity killer)
- [ ] **A real notes location** decided (not random files — your `60-day-appsec-journey` repo)

---

## Section 13: First Real Commit Test

Prove the full Git workflow works end-to-end. **This is the workflow you'll repeat 60 times.**

### Run in terminal:

```bash
cd ~/Documents/appsec-roadmap/60-day-appsec-journey

# Create a test note
cat > day-00-setup-complete.md << 'EOF'
# Day 0 — Setup Complete

All tools installed:
- macOS dev environment ready
- Kali VM operational
- Windows VM accessible as target
- AWS Free Tier with billing alarms
- GitHub authenticated via SSH

Ready for Day 1.
EOF

# Git workflow
git add .
git commit -m "Day 0: Setup verification complete"
git push
```

- [ ] No errors
- [ ] Go to github.com → your `60-day-appsec-journey` repo → `day-00-setup-complete.md` is visible
- [ ] Commit message "Day 0: Setup verification complete" shows on the repo page

### If push fails

- "Permission denied (publickey)" → Section 4 broke, SSH key not on GitHub
- "remote: Repository not found" → wrong username in clone URL

---

## Final Pre-Day-1 Sanity Check

After everything above passes, do this final walk-through:

- [ ] You can launch Mac Terminal and Kali Terminal both within 30 seconds
- [ ] You know where your roadmap HTML file is and can open it on Mac and iPhone
- [ ] You know the daily Git workflow: `add → commit -m "Day X: topic" → push`
- [ ] You have 5+ hours blocked tomorrow for Day 1
- [ ] You've identified a quiet location to work without interruptions

---

## When all 13 sections are checked

You are ready for Day 1. Tomorrow morning:

1. Open your roadmap HTML
2. Click **Day 1: How the Web Actually Works**
3. Spend Hour 1: Theory + Lab 1 (browser DevTools)
4. Spend Hour 2-3: Lab 2 (curl) — use my detailed Lab 2 breakdown
5. Spend Hour 3-4: Lab 3 (Python) — use my detailed Lab 3 breakdown
6. Spend Hour 5: Write notes in `day-01-http-basics.md` and push to GitHub
7. Mark Day 1 complete in the HTML roadmap

---

## What to do if something stays broken

Tell me which checkbox fails. Don't try to "work around" a broken setup — every later day depends on what you did on Day 0. Fix it now.

Don't move to Day 1 with broken setup. I'm serious. A roadmap built on a shaky foundation collapses around Day 8.
