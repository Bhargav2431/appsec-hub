# Day 3 Revision Notes — Networking Compressed

**Roadmap phase:** Foundations
**Environment:** Mac Terminal
**Connects to:** Day 22 (Recon), Day 27 (AWS VPC), Day 28 (BGP), Day 39 (Cloud Security)
**Revision date:** _______________

---

## The One Sentence Summary

> Networks move data using IP addresses (where to go), ports (which service), and protocols (how to send). Understanding these three is how you find attack surface.

---

## 1. IP Addresses

Every device needs an IP address to communicate. Two versions:

### IPv4 (what you'll see everywhere)
Four numbers, 0–255, separated by dots: `192.168.1.100`

### IPv6 (newer, still rare in practice)
Longer, uses letters too: `2001:0db8:85a3::8a2e:0370:7334`

### IP ranges you must know

| Range | Type | Notes |
|-------|------|-------|
| `10.0.0.0/8` | Private | Large corporate networks |
| `172.16.0.0/12` | Private | Docker uses this range |
| `192.168.0.0/16` | Private | Home/small office networks |
| `127.0.0.1` | Loopback | Your own machine (localhost) |
| `169.254.169.254` | Link-local / AWS Metadata | **SSRF target — AWS credentials here** |
| Everything else | Public | Globally routable on internet |

### The NAT translation chain

```
[Your phone 192.168.1.5] → [Router] → [Public IP 73.x.x.x] → [Internet]
        Private IP           NAT               Public IP
```

Your phone's private IP never leaves your home. The router swaps it for your public IP before sending.

---

## 2. TCP vs UDP

### TCP — Reliable, Ordered, Connected

```
Client          Server
  │── SYN ────────→│    "I want to connect"
  │←── SYN-ACK ───│    "Okay, connecting"
  │── ACK ────────→│    "Connected. Let's talk."
  │                │
  │── Data ───────→│
  │←── ACK ────────│    "Got it. Send more."
```

**Used for:** HTTP, HTTPS, SSH, FTP, databases — anything where every byte must arrive.

**Attacks against TCP:**
- **SYN flood** — send SYN but never complete handshake → server runs out of memory
- **TCP session hijacking** — predict sequence numbers, inject packets

### UDP — Fast, Unreliable, Connectionless

```
Client          Server
  │── Data ───────→│    (no handshake, no confirmation)
  │── Data ───────→│    (packets may arrive out of order)
  │── Data ───────→│    (some packets may be lost)
```

**Used for:** DNS, video streaming, gaming, VoIP — where speed beats reliability.

**Attacks against UDP:**
- **UDP flood / DNS amplification** — DDoS technique using DNS reflection

### Memory hook

```
TCP = Phone call (confirm connection, reliable, slower)
UDP = Shouting in a crowd (fast, some miss it, no confirmation)
```

---

## 3. The Port Directory

Ports are 0–65535. Know these by heart. Every interview asks.

### Web ports

| Port | Service | Security note |
|------|---------|---------------|
| 80 | HTTP | Unencrypted. Should redirect to 443. |
| 443 | HTTPS | Encrypted web. Standard. |
| 8080 | HTTP-alt | Dev servers, proxies. Often less secured. |
| 8443 | HTTPS-alt | Admin panels often here. |

### Remote access ports (high risk if internet-exposed)

| Port | Service | Security note |
|------|---------|---------------|
| 22 | SSH | Brute force target. Key auth only, not password. |
| 23 | Telnet | Cleartext remote access. Should never be open. |
| 3389 | RDP | Windows remote desktop. BlueKeep, brute force. NEVER expose publicly. |
| 445 | SMB | Windows file sharing. WannaCry/EternalBlue target. |

### Database ports (should never be internet-accessible)

| Port | Service | Security note |
|------|---------|---------------|
| 3306 | MySQL | If open to internet: brute force risk. Firewall to app servers only. |
| 5432 | PostgreSQL | Same rule. Default "postgres" user often has no password. |
| 6379 | Redis | Often no auth by default. Thousands of exposed instances worldwide. |
| 27017 | MongoDB | Notorious for exposed, unauthenticated instances. |
| 9200 | Elasticsearch | Massive data breach source. Always add auth. |

### Email ports

| Port | Service | Security note |
|------|---------|---------------|
| 25 | SMTP | Sending email. Check for open relays. |
| 110 | POP3 | Old email retrieval. Cleartext. |
| 143 | IMAP | Modern email retrieval. Use port 993 for TLS. |

### Other important

| Port | Service | Security note |
|------|---------|---------------|
| 21 | FTP | Cleartext credentials. Use SFTP instead. |
| 53 | DNS | UDP+TCP. DNS tunneling for data exfiltration. |

---

## 4. DNS — How Names Become IPs

### The DNS resolution journey

```
1. Browser cache → (hit? done. miss? continue)
2. OS cache + /etc/hosts → (hit? done. miss? continue)
3. Ask recursive resolver (your ISP or 8.8.8.8)
4. Resolver asks root nameservers → "who handles .com?"
5. Resolver asks TLD (.com) servers → "who handles google.com?"
6. Resolver asks google.com nameservers → "what's the IP?"
7. Answer returned + cached with TTL
```

### DNS record types

| Record | What it does | Security use |
|--------|-------------|--------------|
| `A` | name → IPv4 | Most common. Start here for recon. |
| `AAAA` | name → IPv6 | IPv6 address mapping |
| `CNAME` | alias → another name | Can reveal CDN providers, internal hostnames |
| `MX` | mail servers | Email attack surface. DMARC/SPF testing. |
| `TXT` | text info | SPF, DKIM, DMARC records. Google site verification. |
| `NS` | nameservers | Who manages the domain's DNS |
| `PTR` | IP → name (reverse) | Reverse lookup for recon |

### dig commands cheat sheet

```bash
dig google.com              # A record (IP address)
dig google.com +short       # Clean IP only output
dig google.com MX +short    # Mail servers
dig google.com TXT          # Text records (SPF/DKIM)
dig google.com NS           # Nameservers
dig -x 8.8.8.8              # Reverse: IP → name
dig @8.8.8.8 google.com     # Query using Google's DNS
dig @1.1.1.1 google.com     # Query using Cloudflare's DNS
```

### Security attacks using DNS

- **DNS spoofing** — attacker poisons cache to redirect traffic
- **DNS tunneling** — data exfiltration encoded in DNS queries (malware C2)
- **Subdomain enumeration** — discover attack surface (Day 22 recon)
- **DNS amplification** — DDoS using DNS reflection

---

## 5. TLS/SSL — How HTTPS Works

### What TLS provides

1. **Encryption** — data scrambled in transit, unreadable to eavesdroppers
2. **Authentication** — certificate proves server identity (not an impersonator)
3. **Integrity** — data can't be modified in transit without detection

### What TLS does NOT provide

- Safety of the website itself (phishing sites have valid TLS certs)
- Protection of data at rest (on the server)
- Any guarantee the business is legitimate

### TLS handshake (simplified)

```
1. Client Hello → (supported cipher suites)
2. Server Hello → (chosen cipher + certificate)
3. Client verifies certificate with CA
4. Key exchange (keys never transmitted directly)
5. Encrypted tunnel established
6. All data encrypted from here
```

### Common TLS security issues

- **Expired certificate** — users see warning, many click through anyway
- **Self-signed certificate** — no CA validation, easy MITM
- **Weak cipher suites** — downgrade attacks (BEAST, POODLE)
- **Certificate transparency** — attackers watch for new certs to find new subdomains

---

## 6. Networking Lab Commands

All run on your Mac Terminal or Kali:

```bash
# YOUR IP ADDRESSES
ip addr show          # Linux
ifconfig              # Mac/older Linux

# TEST CONNECTIVITY
ping -c 4 google.com              # Send 4 packets
ping -c 4 8.8.8.8                 # Ping by IP

# TRACE PACKET PATH
traceroute google.com             # See each hop

# DNS TOOLS
nslookup google.com               # Basic lookup
dig google.com +short             # Better, cleaner
dig google.com MX                 # Mail servers
dig google.com TXT                # Text records

# CHECK IF PORT IS OPEN
nc -zv google.com 80              # Is port 80 open?
nc -zv google.com 443             # Is port 443 open?

# SEE YOUR OPEN CONNECTIONS
ss -tulpn                         # Modern Linux
netstat -tulpn                    # Older systems

# CAPTURE TRAFFIC
sudo tcpdump -i any -nn port 80   # Watch HTTP traffic
sudo tcpdump -i any host 8.8.8.8  # Traffic to/from 8.8.8.8

# READING DNS CONFIG
cat /etc/resolv.conf              # Your DNS servers
```

---

## 7. AppSec Connections

| Networking concept | How it's used in attacks |
|-------------------|-------------------------|
| Port 3306 exposed | Direct database attacks, credential brute force |
| Port 22 open | SSH brute force, weak key attacks |
| Port 3389 open | RDP exploits (BlueKeep, brute force) |
| DNS records (MX) | Email spoofing if no SPF/DKIM/DMARC |
| DNS tunneling | Malware C2 communication, data exfiltration |
| Private IP 169.254.169.254 | SSRF → AWS credential theft (Day 14) |
| Expired/self-signed TLS | MITM interception, user credential theft |
| UDP-based services | Amplification DDoS attacks |

---

## 8. Quick Reference Card

```
IP RANGES:
  10.x.x.x, 172.16-31.x.x, 192.168.x.x = PRIVATE
  127.0.0.1 = LOOPBACK (localhost)
  169.254.169.254 = AWS METADATA (SSRF goldmine)
  Everything else = PUBLIC

PROTOCOLS:
  TCP = reliable, ordered, handshake (HTTP, SSH, DB)
  UDP = fast, unreliable, no handshake (DNS, video, gaming)

CRITICAL PORTS:
  22=SSH  25=SMTP  53=DNS  80=HTTP  110=POP3
  143=IMAP  443=HTTPS  445=SMB  3306=MySQL
  3389=RDP  5432=PostgreSQL  6379=Redis  8080=HTTP-alt

DNS RECORDS:
  A=IPv4  AAAA=IPv6  MX=mail  TXT=security  NS=nameservers

TLS:
  Encrypts + authenticates. Padlock ≠ safe site. Just encrypted.
```

---

## 9. Self-Test

1. What's the difference between a private IP and a public IP?
2. Why should port 3306 never be exposed to the internet?
3. What protocol does `ping` use — TCP or UDP?
4. What DNS record type tells you where a domain's email goes?
5. What does `dig google.com MX +short` return?
6. What's the IP address `169.254.169.254` significant for?
7. What does the TLS certificate actually prove?
8. Name 3 ports that are high-risk if exposed to the internet.
9. What command shows the path packets take to reach google.com?
10. What's a DNS amplification attack and which protocol does it abuse?

**Score:**
- 9–10: Solid networking knowledge. Move to Day 4.
- 7–8: Review weak sections, then continue.
- Below 7: Redo the port directory flashcard exercise first.
