// ============================================================
// APPSEC HUB — DATA REGISTRY
// This file defines every day, phase, and note the app knows about.
// To add new content later: add an entry here + drop the matching
// HTML/MD file in /lessons or /notes. The app does the rest.
// ============================================================

const PHASES = [
  { id: 'foundations', label: 'Foundations', range: [0, 10] },
  { id: 'appsec-core', label: 'AppSec Core', range: [11, 25] },
  { id: 'cloud', label: 'Cloud + Cloud Sec', range: [26, 40] },
  { id: 'ai', label: 'AI-Augmented', range: [41, 50] },
  { id: 'portfolio', label: 'Portfolio', range: [51, 55] },
  { id: 'resume', label: 'Resume + Interviews', range: [56, 60] },
];

// Each day: id matches roadmap day number.
// `lesson` = filename in /lessons (interactive HTML), null if not built yet.
// `tag` = short descriptor shown under the day name.
const DAYS = [
  { day: 0, title: 'Setup & Environment', tag: 'Tools, accounts, GitHub repos — checklist ready', lesson: null, note: 'day-0-verification-checklist.md', phase: 'foundations' },
  { day: 1, title: 'HTTP Fundamentals', tag: 'Requests, responses, curl, Python', lesson: 'day-01-http-interactive.html', phase: 'foundations' },
  { day: 2, title: 'Linux Command Line', tag: 'Navigation, permissions, pipes', lesson: 'day-02-linux-interactive.html', phase: 'foundations' },
  { day: 3, title: 'Networking Compressed', tag: 'IPs, ports, DNS, TLS', lesson: 'day-03-networking-interactive.html', phase: 'foundations' },
  { day: 4, title: 'Python for Security', tag: 'requests, regex, sockets', lesson: 'day-04-python-interactive.html', phase: 'foundations' },
  { day: 5, title: 'Web App Architecture', tag: '3-tier model, sessions — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 6, title: 'OWASP Top 10', tag: 'The AppSec bible — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 7, title: 'Burp Suite Deep Dive', tag: 'Proxy, Repeater, Intruder — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 8, title: 'SQL Injection Mastery', tag: 'Injection theory — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 9, title: 'XSS', tag: 'Reflected, stored, DOM — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 10, title: 'Phase 1 Review', tag: 'Self-test + portfolio check', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'foundations' },
  { day: 11, title: 'Authentication Vulns', tag: 'Brute force, enumeration, MFA — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 12, title: 'IDOR & Access Control', tag: 'Horizontal/vertical escalation — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 13, title: 'CSRF', tag: 'Token defense, SameSite — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 14, title: 'SSRF, XXE, File Upload', tag: 'AWS metadata kill-shot — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 15, title: 'JWT & API Security', tag: 'JWT theory — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 16, title: 'Secure Coding', tag: 'bcrypt, parameterized queries — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 17, title: 'Threat Modeling', tag: 'STRIDE, CVSS, bug reports — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 18, title: 'Juice Shop Project', tag: 'Mid-phase capstone — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 19, title: 'Cryptography for AppSec', tag: 'Safe vs broken algorithms — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 20, title: 'Secure SDLC & DevSecOps', tag: 'SAST/DAST/SCA, CI — notes ready', lesson: null, note: 'days-05-25-revision-notes.md', phase: 'appsec-core' },
  { day: 21, title: 'Advanced PortSwigger Labs', tag: 'SSTI, smuggling, path traversal', lesson: null, phase: 'appsec-core' },
  { day: 22, title: 'Bug Bounty Recon', tag: 'Subfinder, nmap, gobuster', lesson: null, phase: 'appsec-core' },
  { day: 23, title: 'Mobile App Security', tag: 'iOS/Android, MobSF', lesson: null, phase: 'appsec-core' },
  { day: 24, title: "Bug Hunter's Day", tag: 'HackerOne / VulnHub / Juice Shop', lesson: null, phase: 'appsec-core' },
  { day: 25, title: 'Phase 2 Review', tag: 'Portfolio checkpoint', lesson: null, phase: 'appsec-core' },
  { day: 26, title: 'AWS Fundamentals', tag: 'Coming soon', lesson: null, phase: 'cloud' },
  { day: 27, title: 'IAM Deep Dive', tag: 'Coming soon', lesson: null, phase: 'cloud' },
  { day: 28, title: 'VPC & Networking', tag: 'Coming soon', lesson: null, phase: 'cloud' },
  { day: 29, title: 'S3 Security', tag: 'Coming soon', lesson: null, phase: 'cloud' },
  { day: 30, title: 'Cloud Practitioner Exam Prep', tag: 'Coming soon', lesson: null, phase: 'cloud' },
];

// Fill remaining days as placeholders so the list always shows 0-60
for (let d = 31; d <= 60; d++) {
  const phase = PHASES.find(p => d >= p.range[0] && d <= p.range[1]) || PHASES[PHASES.length - 1];
  DAYS.push({ day: d, title: `Day ${d}`, tag: 'Coming soon', lesson: null, phase: phase.id });
}
DAYS.sort((a, b) => a.day - b.day);

// Revision notes registry
const NOTES = [
  { id: 'day-01', title: 'Day 1 — HTTP Fundamentals', desc: 'Status codes, curl cheatsheet, Python requests, self-test', file: 'day-01-revision-notes.md' },
  { id: 'day-02', title: 'Day 2 — Linux Command Line', desc: 'Navigation, permissions, pipes, Bandit tracker', file: 'day-02-revision-notes.md' },
  { id: 'day-03', title: 'Day 3 — Networking', desc: 'IP ranges, TCP/UDP, port directory, DNS, TLS', file: 'day-03-revision-notes.md' },
  { id: 'day-04', title: 'Day 4 — Python for Security', desc: 'requests library, regex patterns, socket module', file: 'day-04-revision-notes.md' },
  { id: 'day-05-25', title: 'Days 5–25 — AppSec Core', desc: 'OWASP Top 10, Burp Suite, SQLi, XSS, CSRF, SSRF, JWT, Crypto, DevSecOps', file: 'days-05-25-revision-notes.md' },
  { id: 'checklist', title: 'Day 0 Verification Checklist', desc: '13-section setup verification before Day 1', file: 'day-0-verification-checklist.md' },
  { id: 'github', title: 'GitHub Push Guide', desc: 'Step-by-step push workflow, troubleshooting', file: 'github-push-guide.md' },
];
