# Day 2 Revision Notes — Linux Command Line Foundation

**Roadmap phase:** Foundations
**Environment:** Kali Linux VM
**Connects to:** Day 20 (DevSecOps), Day 22 (Recon), Day 33 (Container Security)
**Revision date:** _______________

---

## The One Sentence Summary

> Linux is the operating system running every server, security tool, and cloud instance you'll ever work with. The terminal is your interface to all of it.

---

## 1. Navigation — Moving Around the Filesystem

The Linux filesystem is a tree. You are always somewhere in that tree. These commands tell you where you are and let you move.

```bash
pwd              # Print Working Directory — "where am I?"
ls               # list files in current folder
ls -la           # list ALL files including hidden, with full details
cd /etc          # go to /etc folder (absolute path)
cd documents/    # go into documents (relative to where you are)
cd ..            # go up one level (to parent folder)
cd ~             # go to home directory (always safe)
cd -             # go back to previous directory
```

### Memory hooks

- `pwd` = "I'm lost." First thing to type in an unfamiliar shell.
- `ls -la` = X-Ray vision. Hidden files start with `.` (dot) — plain `ls` won't show them.
- `cd ~` = The home button. Always brings you back safely.

### The Linux filesystem tree (key locations)

```
/                    ← root (top of everything)
├── etc/             ← system configuration files (goldmine for security)
├── home/            ← user home folders (/home/kali, /home/bhargav)
│   └── kali/        ← your home directory (same as ~)
├── var/             ← variable data
│   └── log/         ← system logs (auth.log, syslog, etc.)
├── usr/             ← user programs
│   └── bin/         ← executable programs
├── tmp/             ← temporary files (cleared on reboot)
└── root/            ← root user's home (not /home/root)
```

---

## 2. File Operations — Create, Read, Move, Delete

```bash
touch file.txt         # create empty file
mkdir myfolder         # create a folder
mkdir -p a/b/c         # create nested folders at once

cat file.txt           # print entire file contents to screen
less file.txt          # view file page by page (q to quit)
head -20 file.txt      # first 20 lines
tail -20 file.txt      # last 20 lines
tail -f log.txt        # watch file grow in real time (Ctrl+C to stop)

cp file.txt copy.txt   # copy file (original stays)
cp -r folder/ dest/    # copy entire folder
mv file.txt new.txt    # rename a file (same as move)
mv file.txt /tmp/      # move file to /tmp/ folder

rm file.txt            # DELETE permanently (NO trash, NO undo)
rm -r myfolder         # delete folder and all contents
```

### The rm warning

```
rm is permanent. There is no recycle bin. There is no undo.
NEVER run: rm -rf /    ← deletes the entire operating system
ALWAYS double-check before running rm on anything important.
```

### cat vs less vs head vs tail

| Command | Use when |
|---------|----------|
| `cat` | Short files (configs, scripts) |
| `less` | Long files — scroll with arrows, q to quit |
| `head -N` | Want to see the beginning (first N lines) |
| `tail -N` | Want to see the end (last N lines) — most recent log entries |
| `tail -f` | Want to WATCH a file grow live — incident response |

---

## 3. Searching — Find What's Hidden

```bash
# Search INSIDE files for text
grep "password" file.txt           # find lines containing "password"
grep -i "error" file.txt           # case-insensitive search
grep -r "api_key" /var/www/        # search recursively inside a folder
grep -rE "(password|token|secret)" /etc/   # multiple search terms

# Find FILES by name
find / -name "*.conf" 2>/dev/null  # find all .conf files (silence errors)
find /home -name ".env" 2>/dev/null # find .env files (often contain secrets)
find / -perm -o+w -type f 2>/dev/null # find world-writable files

# Count matches
grep -c "Failed" /var/log/auth.log # count failed login lines
```

### 2>/dev/null explained

`2>` redirects error messages (stderr). `/dev/null` is Linux's trash can — anything sent there disappears. So `2>/dev/null` means "throw all error messages away." You use this when scanning the whole filesystem because you'll get hundreds of "Permission denied" errors that clutter your output.

### Security recon with grep

```bash
# Find hardcoded credentials in source code
grep -rE "(password|passwd|api_key|secret|token)" /var/www/ 2>/dev/null

# Find SSH keys
find / -name "id_rsa" 2>/dev/null

# Search command history for sensitive commands
cat ~/.bash_history | grep -i "password"
```

---

## 4. System Information — Know Your Environment

```bash
whoami           # what user am I? (first command after shell access)
id               # show user ID, group ID, and group memberships
uname -a         # full system info (kernel version, architecture)
hostname         # machine name

df -h            # disk space (human readable)
free -h          # RAM usage (human readable)

ps aux           # all running processes (every user)
ps aux | grep nginx   # is nginx running?
top              # live process viewer (q to quit, k to kill)

env              # show all environment variables
echo $PATH       # show the PATH variable
```

### Security uses

```bash
whoami           # after exploit: am I root?
id               # what groups do I belong to?
ps aux           # what services are running? What's vulnerable?
env              # any credentials stored in environment variables?
```

---

## 5. Permissions — Who Can Do What

Every file in Linux has permissions for three groups:

```
u = user (owner)
g = group
o = others (everyone else)
```

Each group can have three permissions:

```
r = read    (value: 4)
w = write   (value: 2)
x = execute (value: 1)
```

### Reading permission strings

When you run `ls -la`, you see something like:

```
-rwxr-xr--  1 kali kali  1234  file.sh
```

Break it down:
```
-  rwx  r-x  r--
↑   ↑    ↑    ↑
│  owner group others
│
file type (- = file, d = directory, l = link)

owner:  rwx = read(4) + write(2) + execute(1) = 7
group:  r-x = read(4) + execute(1)            = 5
others: r-- = read(4) only                    = 4
```

### Common chmod values (memorize)

```bash
chmod 600 file    # owner read+write only — use for SSH keys, secrets
chmod 644 file    # owner read+write, others read — standard files
chmod 700 script  # owner full control, nobody else
chmod 755 script  # owner full, others read+execute — standard programs
chmod 777 file    # EVERYONE full access — DANGEROUS, never in production
chmod +x script   # add execute permission for everyone
```

### chmod commands

```bash
chmod +x script.sh          # make executable
chmod 755 script.sh         # set specific permissions
chown kali:kali file.txt    # change owner to user "kali", group "kali"
sudo command                # run as root (administrator)
```

### Why permissions matter for AppSec

```
chmod 777 = world-writable
→ Any process (including attacker's) can modify the file
→ If it's a web script, attacker overwrites it with malicious code
→ This is called file inclusion or privilege escalation

Misconfigured SUID bit:
find / -perm -4000 2>/dev/null
→ SUID files run as their OWNER (often root) regardless of who runs them
→ Exploiting a SUID binary = instant root access
→ You'll see this in CTFs constantly
```

---

## 6. Pipes and Redirection — Build Command Chains

```bash
# Pipe: send output of one command into another
ls | grep "txt"                    # list files, filter for txt
cat log.txt | grep "Failed"        # read log, filter failures
cat log.txt | wc -l               # count lines in file

# Redirection: send output to a file
ls > output.txt                    # OVERWRITE file with output
ls >> output.txt                   # APPEND output to file
nmap -sV 192.168.1.1 > scan.txt   # save scan to file

# Error redirection
command 2>/dev/null                # throw errors away
command > out.txt 2>&1            # save both output AND errors to file

# Useful combinations
sort file.txt                      # sort lines alphabetically
sort file.txt | uniq               # sort then remove duplicates
sort file.txt | uniq -c            # sort then count duplicates
```

### The pipe mental model

```
Pipe = assembly line
Each command = one worker
Output of worker A → becomes input of worker B

ls | grep "txt" | wc -l
↓         ↓            ↓
list   filter for    count
files    .txt       remaining
```

### Real security pipeline

```bash
# Find top IPs causing failed SSH logins
grep "Failed" /var/log/auth.log | \
  awk '{print $11}' | \
  sort | \
  uniq -c | \
  sort -rn | \
  head -10

# Explanation:
# grep "Failed"  → filter failed login lines
# awk '{print $11}'  → extract IP field (field 11)
# sort  → sort IPs alphabetically (groups same IPs together)
# uniq -c  → count consecutive duplicates
# sort -rn  → sort by count, highest first
# head -10  → show only top 10
```

---

## 7. Your First Security Script

From Lab 2. This script finds potential secrets on a system:

```bash
#!/bin/bash
# Day 2: Secret Scanner
# Usage: ./find_secrets.sh [target_folder]

TARGET=${1:-"$HOME"}

echo "=== Secret Scanner ==="
echo "Target: $TARGET"
echo ""

echo "[*] Searching for credentials..."
grep -rE "(password|passwd|api_key|secret|token|AWS)" \
  $TARGET 2>/dev/null | head -20

echo ""
echo "[*] Searching for .env files..."
find $TARGET -name ".env" 2>/dev/null

echo ""
echo "[*] World-writable files (security risk)..."
find $TARGET -perm -o+w -type f 2>/dev/null | head -10

echo ""
echo "=== Scan Complete ==="
```

**To use it:**
```bash
chmod +x find_secrets.sh    # make executable
./find_secrets.sh           # scan home directory
./find_secrets.sh /etc      # scan /etc
./find_secrets.sh /var/www  # scan web directory
```

---

## 8. OverTheWire Bandit — Progress Tracker

**Site:** overthewire.org/wargames/bandit/
**Connect:** `ssh bandit0@bandit.labs.overthewire.org -p 2220`
**Start password:** `bandit0`

Track your progress here:

| Level | Command(s) used | Password found |
|-------|----------------|----------------|
| 0 → 1 | cat readme | _____________ |
| 1 → 2 | cat ./-  | _____________ |
| 2 → 3 | cat "spaces in filename" | _____________ |
| 3 → 4 | ls -la, cat .hidden | _____________ |
| 4 → 5 | file ./-file0* | _____________ |
| 5 → 6 | find with -size -readable | _____________ |
| 6 → 7 | find / -user -group -size | _____________ |
| 7 → 8 | grep millionth data.txt | _____________ |
| 8 → 9 | sort | uniq -u | _____________ |
| 9 → 10 | strings | grep === | _____________ |

Fill this in as you complete each level. Aim for Level 10 today, Level 20 by Day 3.

---

## 9. AppSec Connections — What Day 2 Unlocks

| Linux skill | How you'll use it |
|-------------|------------------|
| `ls -la` | First thing you run after getting shell access in a pentest |
| `grep -r` | Foundation of secret scanning (Semgrep, TruffleHog are sophisticated versions) |
| `tail -f` | Watching logs live during incident response |
| `chmod` | Understanding privilege escalation from misconfigured permissions |
| `find` | Reconnaissance on compromised systems |
| Pipes | Security data analysis: filter → sort → count |
| Scripts | Day 20: automated security pipelines, Day 44: AI threat analysis |
| `whoami` | After exploitation: "what level of access do I have?" |

---

## 10. Quick Reference Card (Screenshot this)

```
NAVIGATION:
  pwd         ← where am I?
  ls -la      ← list ALL files (including hidden)
  cd /path    ← go to folder
  cd ..       ← go up
  cd ~        ← go home

FILE OPS:
  cat f       ← show file contents
  tail -f f   ← watch file live
  cp a b      ← copy
  mv a b      ← rename/move
  rm f        ← DELETE (permanent, no undo)

SEARCH:
  grep "x" f        ← find x in file
  grep -r "x" /dir  ← search recursively
  find / -name "*.x" 2>/dev/null

PERMISSIONS:
  chmod +x    ← make executable
  chmod 755   ← standard script
  chmod 600   ← private (SSH keys)
  chmod 777   ← DANGEROUS
  sudo        ← run as root

PIPES:
  cmd1 | cmd2    ← pipe output
  > file         ← overwrite to file
  >> file        ← append to file
  2>/dev/null    ← silence errors
```

---

## 11. Self-Test — Can You Answer These?

1. What command shows ALL files including hidden ones?
2. What does `tail -f log.txt` do? Name one security use case.
3. What's the difference between `>` and `>>` for file output?
4. You ran a Python script and got "Permission denied." One command fixes it. What is it?
5. What does `grep -r "password" /etc/ 2>/dev/null` do?
6. What does `chmod 777 script.sh` do and why is it dangerous?
7. You gained shell access to a server. What's the first command you run?
8. What does `/dev/null` mean?
9. What command counts how many lines in a file contain the word "error"?
10. Explain this pipeline: `ps aux | grep nginx | wc -l`

**Score:**
- 9–10 correct: Day 2 solid. Move to Day 3.
- 7–8 correct: Review weak sections, then move on.
- Below 7: Redo OverTheWire Bandit levels 0–5 before continuing.
